import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { OrderCard } from '../../../components/orders/OrderCard';
import { UserHeader } from '../../../components/shared/UserHeader';
import { dataStore } from '@/stores/DataStore';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/Icons';

const ITEMS_PER_PAGE = 6;

type SortMode = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Mais recente ↓',
  oldest: 'Mais antigo ↑',
  highest: 'Maior valor ↓',
  lowest: 'Menor valor ↑',
};

export default observer(function HistoricoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);
  const scrollRef = useRef<ScrollView>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search/sort changes
  useEffect(() => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [searchTerm, sortMode]);

  const allOrders = dataStore.orders || [];
  
  // Filter for CONCLUIDO and CANCELADO status
  const historyOrders = allOrders.filter(
    order => order.status === 'CONCLUIDO' || order.status === 'CANCELADO'
  );

  // Filter based on search keyword
  const filtered = historyOrders.filter(order =>
    order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.slice(-4).toUpperCase().includes(searchTerm.toUpperCase())
  );

  // Sort based on chosen mode
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'newest') {
      return new Date(b.createdAt || b.time).getTime() - new Date(a.createdAt || a.time).getTime();
    } else if (sortMode === 'oldest') {
      return new Date(a.createdAt || a.time).getTime() - new Date(b.createdAt || b.time).getTime();
    } else if (sortMode === 'highest') {
      return b.total - a.total;
    } else {
      return a.total - b.total;
    }
  });

  // Calculate Metrics
  const completedOrders = historyOrders.filter(o => o.status === 'CONCLUIDO');
  const cancelledOrders = historyOrders.filter(o => o.status === 'CANCELADO');

  const faturamentoTotal = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const ticketMedio = completedOrders.length > 0 ? faturamentoTotal / completedOrders.length : 0;
  const taxaCancelamento = historyOrders.length > 0 ? (cancelledOrders.length / historyOrders.length) * 100 : 0;

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const cycleSortMode = () => {
    const modes: SortMode[] = ['newest', 'oldest', 'highest', 'lowest'];
    const next = modes[(modes.indexOf(sortMode) + 1) % modes.length];
    setSortMode(next);
  };

  return (
    <ProtectedRoute abilities="orders:view">
      <View style={styles.container}>
        {!isWeb && <UserHeader />}

        {/* Header and Switch tab */}
        <View style={styles.headerTabRow}>
          <View style={styles.tabButtons}>
            <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(auth)/pedidos')}>
              <Text style={styles.tabBtnText}>Ativos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
              <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>Histórico</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.metricLabel, { color: theme.text }]}>Faturamento</Text>
            <Text style={[styles.metricValue, { color: theme.contrast }]}>
              R$ {faturamentoTotal.toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.metricLabel, { color: theme.text }]}>Ticket Médio</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              R$ {ticketMedio.toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.metricLabel, { color: theme.text }]}>Concluídos</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {completedOrders.length}
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.metricLabel, { color: theme.text }]}>Cancelamentos</Text>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>
              {taxaCancelamento.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Top Bar / Search Row */}
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
            <TouchableOpacity style={styles.orderBtn} activeOpacity={0.7} onPress={cycleSortMode}>
              <Text style={styles.orderBtnText}>{SORT_LABELS[sortMode]}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
            {paginated.length > 0 ? (
              <>
                {/* Grid of Cards */}
                <View style={styles.grid}>
                  {paginated.map((order) => (
                    <View key={order.id} style={styles.gridItem}>
                      <OrderCard
                        id={order.id}
                        orderNumber={order.id.slice(-4).toUpperCase()}
                        customerName={order.clientName}
                        status={order.status}
                        total={order.total}
                        elapsedTime={order.time}
                        items={order.items}
                        createdAt={order.createdAt}
                        updatedAt={order.updatedAt}
                        table={order.table}
                        address={order.address}
                        statusHistory={order.statusHistory || []}
                        additionalInfo={order.additionalInfo}
                      />
                    </View>
                  ))}
                </View>

                {/* Pagination */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                      onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon color={theme.text} size={20} />
                    </TouchableOpacity>

                    <View style={styles.pageIndicator}>
                      <Text style={styles.pageIndicatorText}>{currentPage} / {totalPages}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                      onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRightIcon color={theme.text} size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchTerm ? 'Nenhum pedido histórico encontrado.' : 'Nenhum pedido finalizado.'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchTerm ? 'Tente refinar sua busca por outro termo.' : 'Pedidos concluídos ou cancelados aparecerão aqui.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ProtectedRoute>
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
    metricsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    metricCard: {
      flex: 1,
      minWidth: isWeb ? 150 : '45%',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.background,
    },
    metricLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 12,
      opacity: 0.5,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    metricValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 20,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
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
    orderBtn: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      paddingHorizontal: 20,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.background,
    },
    orderBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
    },
    webListContainer: {
      flex: 1,
      backgroundColor: 'transparent',
      borderRadius: 32,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -10,
    },
    gridItem: {
      width: isWeb ? '50%' : '100%',
      paddingHorizontal: 10,
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
    },
    pageIndicatorText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
  });
}
