import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View, RefreshControl } from 'react-native';
import { OrderCard, OrderStatus } from '../../../components/orders/OrderCard';
import { UserHeader } from '../../../components/shared/UserHeader';
import { orderService, Order } from '../../../services/api-order-service';

export default function PedidosScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchName, setSearchName] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getOrders();
      const mappedOrders = data.map(orderService.mapOrderFromBackend);
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = searchName
    ? orders.filter(order => 
        order.customerName?.toLowerCase().includes(searchName.toLowerCase())
      )
    : orders;

  const groupedOrders = filteredOrders.reduce((groups: Record<string, Order[]>, order) => {
    const date = order.createdAt 
      ? new Date(order.createdAt).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
    return groups;
  }, {});

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.contrast} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome"
            placeholderTextColor={theme.text + '80'}
            value={searchName}
            onChangeText={setSearchName}
          />
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.orderBtn} activeOpacity={0.7}>
            <Text style={styles.orderBtnText}>Ordem ↓</Text>
          </TouchableOpacity>

          {isWeb ? (
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.8} onPress={() => router.push('/(auth)/pedidos/addPedido')}>
              <Text style={styles.createBtnText}>Criar Pedido</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8} onPress={() => router.push('/(auth)/pedidos/addPedido')}>
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <View key={date}>
              <View style={styles.dateDivider}>
                <Text style={styles.dateText}>{date}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.grid}>
                {dateOrders.map((order) => (
                  <View key={order.id} style={styles.gridItem}>
                    <OrderCard
                      id={order.id}
                      orderNumber={order.orderNumber || '0000'}
                      customerName={order.customerName || 'Cliente'}
                      status={orderService.mapStatusToFrontend(order.status) as OrderStatus}
                      total={order.total || order.totalValue}
                      elapsedTime={order.elapsedTime || '00:00:00'}
                      items={order.items.map((item, idx) => ({
                        id: item.productId || idx.toString(),
                        quantity: item.quantity,
                        name: item.name || 'Item',
                        price: item.price || 0,
                      }))}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          {filteredOrders.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
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
      paddingHorizontal: 24,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.background,
    },
    orderBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
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
    },
    dateText: {
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
      width: isWeb ? '50%' : '100%',
      paddingHorizontal: 10,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      opacity: 0.6,
    },
  });
}
