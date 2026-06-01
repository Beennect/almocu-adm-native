import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { OrderCard } from '../../../components/orders/OrderCard';
import { UserHeader } from '../../../components/shared/UserHeader';
import { dataStore } from '@/stores/DataStore';
import { authStore } from '@/stores/AuthStore';
import Toast from 'react-native-toast-message';
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/Icons';

const ITEMS_PER_PAGE = 6;

type SortMode = 'newest' | 'oldest' | 'status';

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Mais recente ↓',
  oldest: 'Mais antigo ↑',
  status: 'Status ↕',
};

const STATUS_ORDER = ['PENDENTE', 'PREPARANDO', 'CONCLUIDO', 'CANCELADO'];

export default observer(function PedidosScreen() {
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

  const activeRole = authStore.activeRole;

  // Only active orders for active dashboard, with KDS filters if Kitchen staff
  const allOrders = (dataStore.orders || []).filter(order => {
    if (order.status === 'CONCLUIDO' || order.status === 'CANCELADO') return false;
    
    if (activeRole === 'COZINHA') {
      return order.status === 'PENDENTE' || order.status === 'PREPARANDO';
    }
    
    return true;
  });

  // Filter
  const filtered = allOrders.filter(order =>
    order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.slice(-4).toUpperCase().includes(searchTerm.toUpperCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'newest') {
      return new Date(b.createdAt || b.time).getTime() - new Date(a.createdAt || a.time).getTime();
    } else if (sortMode === 'oldest') {
      return new Date(a.createdAt || a.time).getTime() - new Date(b.createdAt || b.time).getTime();
    } else {
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    }
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const cycleSortMode = () => {
    const modes: SortMode[] = ['newest', 'oldest', 'status'];
    const next = modes[(modes.indexOf(sortMode) + 1) % modes.length];
    setSortMode(next);
  };

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader />}

      {/* Header and Switch tab */}
      <View style={styles.headerTabRow}>
        <View style={styles.tabButtons}>
          <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>Ativos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('/(auth)/pedidos/historico' as any)}>
            <Text style={styles.tabBtnText}>Histórico</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Panel for Kitchen */}
      {activeRole === 'COZINHA' && (
        <View style={[styles.emergencyContainer, { backgroundColor: theme.foreground }]}>
          <View style={styles.emergencyTitleRow}>
            <AlertIcon color="#EF4444" size={18} />
            <Text style={styles.emergencyTitle}> Painel de Emergência KDS</Text>
          </View>
          <Text style={styles.emergencySub}>Toque em um prato para alternar a disponibilidade e evitar novos pedidos.</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emergencyScroll}>
            {dataStore.menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.emergencyItemCard,
                  { backgroundColor: theme.background },
                  !item.available && { borderColor: '#EF4444', borderWidth: 1 }
                ]}
                onPress={() => {
                  dataStore.toggleMenuItemAvailability(item.id);
                  Toast.show({ type: 'info', text1: `${item.name} marcado como ${item.available ? 'Disponível' : 'ESGOTADO'}!` });
                }}
              >
                <Text style={styles.emergencyItemName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.available ? '#10B981' : '#EF4444' }} />
                  <Text style={[styles.emergencyItemStatus, { color: item.available ? '#10B981' : '#EF4444' }]}>
                    {item.available ? 'Disponível' : 'ESGOTADO'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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

          {isWeb ? (
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.8} onPress={() => router.push('pedidos/addPedido' as any)}>
              <Text style={styles.createBtnText}>Criar Pedido</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8} onPress={() => router.push('pedidos/addPedido' as any)}>
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
          {paginated.length > 0 ? (
            <>
              {/* Date Divider */}
              <View style={styles.dateDivider}>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('pt-BR')}</Text>
                <View style={styles.dividerLine} />
                <Text style={styles.dateCount}>{sorted.length} pedido{sorted.length !== 1 ? 's' : ''}</Text>
              </View>

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
                {searchTerm ? 'Nenhum pedido encontrado.' : 'Nenhum pedido hoje.'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchTerm ? 'Tente buscar por outro nome ou código.' : 'Crie um novo pedido para começar!'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
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
    webListContainer: {
      flex: 1,
      backgroundColor: 'transparent',
      borderRadius: 32,
    },
    dateDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 12,
    },
    dateText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background,
    },
    dateCount: {
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
    emergencyContainer: {
      borderRadius: 24,
      padding: 16,
      marginBottom: 20,
    },
    emergencyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    emergencyTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: '#EF4444',
    },
    emergencySub: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      color: theme.text,
      opacity: 0.6,
      marginTop: 2,
      marginBottom: 12,
    },
    emergencyScroll: {
      gap: 10,
    },
    emergencyItemCard: {
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minWidth: 120,
    },
    emergencyItemName: {
      fontFamily: 'Jost_700Bold',
      fontSize: 13,
      color: theme.text,
    },
    emergencyItemStatus: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 11,
    },
  });
}
