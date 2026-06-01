import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View, Platform, Modal } from 'react-native';
import { MenuCard } from '../../../components/menu/MenuCard';
import { UserHeader } from '../../../components/shared/UserHeader';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { observer } from 'mobx-react-lite';
import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';

const Pagination = ({ currentPage, totalPages, onPrev, onNext, theme, styles }: any) => (
  <View style={styles.paginationContainer}>
    <TouchableOpacity
      style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
      onPress={onPrev}
      disabled={currentPage === 1}
    >
      <ChevronLeftIcon color={theme.text} size={20} />
    </TouchableOpacity>

    <View style={styles.pageIndicator}>
      <Text style={styles.pageIndicatorText}>{currentPage} / {totalPages}</Text>
    </View>

    <TouchableOpacity
      style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
      onPress={onNext}
      disabled={currentPage === totalPages}
    >
      <ChevronRightIcon color={theme.text} size={20} />
    </TouchableOpacity>
  </View>
);

type FilterMode = 'todos' | 'alfabetica' | 'preco_menor' | 'preco_maior' | 'recentes' | 'antigos';

const FILTER_LABELS: Record<FilterMode, string> = {
  todos: 'Todos',
  alfabetica: 'A-Z ↓',
  preco_menor: 'Menor Preço ↓',
  preco_maior: 'Maior Preço ↑',
  recentes: 'Mais Recentes ↓',
  antigos: 'Mais Antigos ↑',
};

const getGridColumns = (width: number) => {
  if (width >= 1440) return 3;
  if (width >= 1024) return 2;
  return 1;
};

export default observer(function CardapioScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const gridColumns = getGridColumns(width);
  const styles = makeStyles(theme, isWeb, gridColumns);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  // Reset page on search or filter
  useEffect(() => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [searchTerm, filterMode]);

  // Processing logic
  const getProcessedItems = () => {
    let list = [...(dataStore.menuItems || [])];

    // Search
    if (searchTerm) {
      list = list.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort
    if (filterMode === 'alfabetica') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterMode === 'preco_menor') {
      list.sort((a, b) => a.price - b.price);
    } else if (filterMode === 'preco_maior') {
      list.sort((a, b) => b.price - a.price);
    } else if (filterMode === 'recentes') {
      list.reverse();
    }

    return list;
  };

  const processedItems = getProcessedItems();

  // Pagination Logic (Grouping by category within pages)
  const pages: { category: string, items: typeof processedItems }[][] = [];
  const groupedItems: Record<string, typeof processedItems> = {};

  processedItems.forEach(item => {
    const cat = item.category || 'Outros';
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  let currentPageData: { category: string, items: typeof processedItems }[] = [];
  let currentProductCount = 0;
  const ITEMS_PER_PAGE = gridColumns * 3;

  Object.entries(groupedItems).forEach(([category, catItems]) => {
    let remainingItems = [...catItems];

    while (remainingItems.length > 0) {
      if (currentPageData.length >= 3 || currentProductCount >= ITEMS_PER_PAGE) {
        pages.push(currentPageData);
        currentPageData = [];
        currentProductCount = 0;
      }

      const availableSlots = ITEMS_PER_PAGE - currentProductCount;
      const itemsToTake = remainingItems.slice(0, availableSlots);

      currentPageData.push({
        category,
        items: itemsToTake
      });

      currentProductCount += itemsToTake.length;
      remainingItems = remainingItems.slice(availableSlots);
    }
  });

  if (currentPageData.length > 0) {
    pages.push(currentPageData);
  }

  const totalPages = pages.length || 1;
  const paginatedData = pages[currentPage - 1] || [];

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await withLoading(
        async () => {
          await dataStore.removeItem(confirmDeleteId);
          setConfirmDeleteId(null);
        },
        { loading: 'Removendo item...', success: 'Item removido do cardápio', error: 'Erro ao remover item' }
      );
    }
  };

  const handleEdit = (id: string) => {
    router.push({
      pathname: 'cardapio/addItem' as any,
      params: { id }
    });
  };

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader />}

      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={theme.text + '80'}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterBtnText}>{FILTER_LABELS[filterMode]}</Text>
          </TouchableOpacity>

          {isWeb ? (
            <TouchableOpacity
              style={styles.createBtn}
              activeOpacity={0.8}
              onPress={() => router.push('cardapio/addItem' as any)}
            >
              <Text style={styles.createBtnText}>Novo Item</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.plusBtn}
              activeOpacity={0.8}
              onPress={() => router.push('cardapio/addItem' as any)}
            >
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
          {paginatedData.length > 0 ? (
            paginatedData.map((section, index) => (
              <View key={`${section.category}-${index}`} style={styles.categorySection}>
                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionText}>{section.category}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.grid}>
                  {section.items.map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      <MenuCard
                        {...item}
                        image={item.image ?? undefined}
                        onEdit={() => handleEdit(item.id)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchTerm || filterMode !== 'todos' ? 'Nenhum item encontrado.' : 'Nenhum item no cardápio.'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchTerm || filterMode !== 'todos' ? 'Tente ajustar os filtros ou a busca.' : 'Toque em "Novo Item" para adicionar seu primeiro produto!'}
              </Text>
            </View>
          )}

          {!isWeb && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
              onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              theme={theme}
              styles={styles}
            />
          )}
        </ScrollView>
      </View>

      {/* Fixed Pagination for Web */}
      {isWeb && totalPages > 1 && (
        <View style={styles.fixedPagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            theme={theme}
            styles={styles}
          />
        </View>
      )}

      <SelectModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSelect={(val: any) => {
          const key = (Object.keys(FILTER_LABELS) as FilterMode[]).find(k => FILTER_LABELS[k] === val);
          if (key) setFilterMode(key);
          setFilterModalVisible(false);
        }}
        options={Object.values(FILTER_LABELS)}
        title="Filtrar Por"
      />

      <ConfirmModal
        visible={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item do cardápio?"
        confirmText="Excluir"
      />
    </View>
  );
});

function makeStyles(theme: any, isWeb: boolean, gridColumns: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      borderRadius: 20,
      paddingHorizontal: 16,
      height: 56,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      outlineStyle: 'none',
    } as any,
    actionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    filterBtn: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      paddingHorizontal: 16,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      borderWidth: 1,
      borderColor: theme.background,
    },
    filterBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
    },
    createBtn: {
      backgroundColor: theme.contrast,
      borderRadius: 20,
      paddingHorizontal: 32,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    plusBtn: {
      backgroundColor: theme.contrast,
      borderRadius: 20,
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: '#FFFFFF',
      marginTop: -2,
    },
    categorySection: {
      marginBottom: 32,
    },
    webListContainer: {
      flex: 1,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    sectionText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      marginRight: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -10,
    },
    gridItem: {
      width: `${100 / gridColumns}%`,
      paddingHorizontal: 10,
      marginBottom: 16,
    },
    emptyContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      opacity: 0.5,
    },
    emptyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      textAlign: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 16,
    },
    fixedPagination: {
      position: 'absolute',
      bottom: 24,
      left: 0,
      right: 0,
      alignItems: 'center',
      pointerEvents: 'box-none',
    },
    pageBtn: {
      backgroundColor: theme.foreground,
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.text + '10',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    pageBtnDisabled: {
      opacity: 0.3,
    },
    pageIndicator: {
      backgroundColor: theme.foreground,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.text + '10',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    pageIndicatorText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
  });
}
