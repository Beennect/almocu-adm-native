import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { UserHeader } from '../../../components/shared/UserHeader';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { SelectModal } from '@/components/shared/SelectModal';
import { observer } from 'mobx-react-lite';
import { dataStore } from '@/stores/DataStore';
import { apiStockService } from '@/services/api-stock-service';
import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/Icons';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';

export default observer(function InativosEstoqueScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  const [inactiveItems, setInactiveItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInactive = async (p: number) => {
    setLoading(true);
    try {
      const result = await apiStockService.getInactiveStock(p, 50);
      setInactiveItems(result.items || result.data || []);
      setTotalPages(result.pages || result.totalPages || 1);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar itens inativos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactive(page);
  }, [page]);

  useRealtimeChannel('stock:changed', () => {
    fetchInactive(page);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('todos');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

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

  const filteredItems = () => {
    let list = [...inactiveItems];
    if (searchTerm) {
      list = list.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterMode === 'alfabetica') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterMode === 'recentes') {
      list.reverse();
    }
    return list;
  };

  const displayItems = filteredItems();

  const handleReactivate = async () => {
    if (!reactivateId) return;
    await withLoading(
      async () => {
        await dataStore.reactivateIngredient(reactivateId);
        setReactivateId(null);
        fetchInactive(page);
      },
      { loading: 'Reativando item...', success: 'Item reativado com sucesso!', error: 'Erro ao reativar item' },
    );
  };

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader />}

      <View style={styles.headerTabRow}>
        <View style={styles.tabButtons}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('estoque' as any)}>
            <Text style={styles.tabBtnText}>Ativos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>Inativos</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            <Text style={styles.filterBtnText}>{FILTER_LABELS[filterMode as FilterMode]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : displayItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum item inativo</Text>
            <Text style={styles.emptySubtext}>Itens desativados do estoque aparecerão aqui.</Text>
          </View>
        ) : (
          displayItems.map((item: any) => (
            <View key={item._id || item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <Text style={styles.cardSubtitle}>
                  {item.quantity} {item.unit} {item.previousProductRelations?.length > 0 ? `• ${item.previousProductRelations.length} produto(s) relacionado(s)` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.reactivateBtn}
                onPress={() => setReactivateId(item._id || item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactivateBtnText}>Reativar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeftIcon color={theme.text} size={20} />
            </TouchableOpacity>
            <Text style={styles.pageText}>{page} / {totalPages}</Text>
            <TouchableOpacity
              style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRightIcon color={theme.text} size={20} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!reactivateId}
        onClose={() => setReactivateId(null)}
        onConfirm={handleReactivate}
        title="Reativar Item"
        message="Tem certeza que deseja reativar este item no estoque? As relações com produtos do cardápio serão restauradas automaticamente."
        confirmText="Reativar"
      />

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
    </View>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    headerTabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    tabButtons: {
      flexDirection: 'row',
      backgroundColor: theme.foreground,
      borderRadius: 16,
      padding: 4,
    },
    tabBtn: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 12,
    },
    tabBtnActive: {
      backgroundColor: theme.background,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    tabBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
    },
    tabBtnTextActive: {
      opacity: 1,
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
    loadingText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      opacity: 0.5,
      textAlign: 'center',
      paddingVertical: 40,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      minHeight: 100,
      opacity: 0.8,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    cardCategory: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 11,
      color: theme.contrast,
      textTransform: 'uppercase' as any,
      marginTop: 2,
    },
    cardSubtitle: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginTop: 4,
    },
    reactivateBtn: {
      backgroundColor: theme.contrast,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    reactivateBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: '#FFFFFF',
    },
    emptyContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isWeb ? 80 : 60,
    },
    emptyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: isWeb ? 20 : 18,
      color: theme.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontFamily: 'Jost_400Regular',
      fontSize: isWeb ? 15 : 14,
      color: theme.text,
      textAlign: 'center',
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 12,
    },
    pageBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageBtnDisabled: {
      opacity: 0.3,
    },
    pageText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
  });
}
