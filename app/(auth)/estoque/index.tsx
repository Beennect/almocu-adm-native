import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, TrashIcon, TruckIcon } from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';
import { UserHeader } from '@/components/shared/UserHeader';
import { dataStore } from '@/stores/DataStore';
import { withLoading } from '@/utils/toast';
import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

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

const IngredientCard = observer(({ item, onRemove, onEdit, theme, styles }: any) => {
  const [amount, setAmount] = useState('1');

  const handleUpdate = async (delta: number) => {
    const val = parseFloat(amount.replace(',', '.'));
    await withLoading(
      () => dataStore.updateIngredientStock(item.id, !isNaN(val) && val > 0 ? delta * val : delta),
      { loading: 'Ajustando estoque...', success: 'Estoque ajustado!', error: 'Erro ao ajustar estoque' }
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.stock} {item.unit}</Text>
        {item.supplierName ? (
          <View style={styles.supplierRow}>
            <TruckIcon color={theme.text} opacity={0.4} size={11} />
            <Text style={styles.supplierName} numberOfLines={1}>{item.supplierName}</Text>
          </View>
        ) : null}
        <View style={styles.badgePlaceholder}>
          {item.stock <= 3 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Estoque Baixo</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <View style={styles.qtyControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdate(-1)}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.qtyInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor={theme.text + '40'}
          />

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdate(1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onEdit}>
            <View style={{ opacity: 0.6 }}>
              <EditIcon color={theme.text} size={18} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove}>
            <TrashIcon color={theme.contrast} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

type FilterMode = 'todos' | 'alfabetica' | 'estoque_baixo' | 'apenas_kg' | 'apenas_litros' | 'apenas_unidades' | 'recentes' | 'antigos';

const FILTER_LABELS: Record<FilterMode, string> = {
  todos: 'Todos',
  alfabetica: 'A-Z ↓',
  estoque_baixo: 'Estoque Baixo ↓',
  apenas_kg: 'Apenas Kg',
  apenas_litros: 'Apenas Litros',
  apenas_unidades: 'Apenas Unidades',
  recentes: 'Mais Recentes ↓',
  antigos: 'Mais Antigos ↑',
};

const getGridColumns = (width: number) => {
  if (width >= 1440) return 3;
  if (width >= 1024) return 2;
  return 1;
};

export default observer(function EstoqueScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const gridColumns = getGridColumns(width);
  const styles = makeStyles(theme, isWeb, gridColumns);
  const router = useRouter();

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    dataStore.refreshSuppliers();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isWeb ? 12 : 6;

  // Filter and Sort logic
  const processIngredients = () => {
    let list = [...dataStore.ingredients];

    // Search
    if (searchTerm) {
      list = list.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by unit
    if (filterMode === 'apenas_kg') list = list.filter(i => i.unit === 'Kg');
    if (filterMode === 'apenas_litros') list = list.filter(i => i.unit === 'Litros');
    if (filterMode === 'apenas_unidades') list = list.filter(i => i.unit === 'Unidades');

    // Sort or specific filters
    if (filterMode === 'alfabetica') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterMode === 'estoque_baixo') {
      list = list.filter(i => i.stock <= 3);
      list.sort((a, b) => a.stock - b.stock);
    } else if (filterMode === 'recentes') {
      list.reverse(); // Assuming original order is chronological
    } else if (filterMode === 'antigos') {
      // already sorted by oldest if added at end
    }

    return list;
  };

  const processedIngredients = processIngredients();
  const totalPages = Math.ceil(processedIngredients.length / itemsPerPage);
  const paginatedIngredients = processedIngredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const scrollRef = useRef<ScrollView>(null);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [searchTerm, filterMode]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const removeIngredient = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await withLoading(
        async () => {
          await dataStore.removeIngredient(confirmDeleteId);
          setConfirmDeleteId(null);
        },
        { loading: 'Removendo ingrediente...', success: 'Ingrediente removido', error: 'Erro ao remover ingrediente' }
      );
    }
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
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterBtnText}>{FILTER_LABELS[filterMode]}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.plusBtn}
            activeOpacity={0.8}
            onPress={() => router.push('estoque/addItem')}
          >
            <Text style={styles.plusBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionText}>Estoque Atual</Text>
          <View style={styles.dividerLine} />
          <Text style={styles.sectionCount}>{processedIngredients.length} item{processedIngredients.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.grid}>
          {paginatedIngredients.length > 0 ? (
            paginatedIngredients.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <IngredientCard
                  item={item}
                  onRemove={() => removeIngredient(item.id)}
                  onEdit={() => router.push({ pathname: 'estoque/addItem', params: { id: item.id } })}
                  theme={theme}
                  styles={styles}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchTerm || filterMode !== 'todos' ? 'Nenhum ingrediente encontrado.' : 'Estoque vazio.'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchTerm || filterMode !== 'todos' ? 'Tente ajustar os filtros ou a busca.' : 'Adicione ingredientes para começar!'}
              </Text>
            </View>
          )}
        </View>

        {/* Pagination inside Scroll for Mobile */}
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
          // find key from label
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
        title="Excluir Ingrediente"
        message="Tem certeza que deseja excluir este ingrediente do estoque?"
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
    topBarActions: {
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
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    sectionText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.foreground,
      opacity: 0.3,
    },
    sectionCount: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.4,
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
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
      minHeight: 110,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    cardSubtitle: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
    },
    badgePlaceholder: {
      height: 20,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginTop: 6,
    },
    lowStockBadge: {
      backgroundColor: '#FF525220',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    lowStockText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 10,
      color: '#FF5252',
      textTransform: 'uppercase',
    },
    supplierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    supplierName: {
      fontFamily: 'Jost_400Regular',
      fontSize: 11,
      color: theme.text,
      opacity: 0.5,
      flex: 1,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    qtyControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 2,
      borderWidth: 1,
      borderColor: theme.text + '10',
    },
    qtyInput: {
      width: 40,
      height: 32,
      textAlign: 'center',
      color: theme.text,
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      padding: 0,
    },
    qtyBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
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
