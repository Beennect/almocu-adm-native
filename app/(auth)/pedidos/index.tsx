import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { OrderCard, OrderStatus } from '../../../components/orders/OrderCard';
import { UserHeader } from '../../../components/shared/UserHeader';

const MOCK_ORDERS = [
  {
    id: '1',
    orderNumber: '7362',
    customerName: 'Raquel Lais',
    status: 'Preparando' as OrderStatus,
    total: 140.00,
    elapsedTime: '00:10:41',
    items: [
      { id: 'i1', quantity: 1, name: 'Canoa de Sushi', price: 120.00 },
      { id: 'i2', quantity: 2, name: 'Suco Natural', price: 20.00 },
    ]
  },
  {
    id: '2',
    orderNumber: '7362',
    customerName: 'Raquel Lais',
    status: 'Preparando' as OrderStatus,
    total: 140.00,
    elapsedTime: '00:10:41',
    items: [
      { id: 'i1', quantity: 1, name: 'Canoa de Sushi', price: 120.00 },
      { id: 'i2', quantity: 2, name: 'Suco Natural', price: 20.00 },
    ]
  },
];

export default function PedidosScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  return (
    <View style={styles.container}>
      {/* User Header Component - Apenas Mobile */}
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      {/* Top Bar / Search Row */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome"
            placeholderTextColor={theme.text + '80'}
          />
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.orderBtn} activeOpacity={0.7}>
            <Text style={styles.orderBtnText}>Ordem ↓</Text>
          </TouchableOpacity>

          {isWeb ? (
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.8} onPress={() => router.push('pedidos/addPedido')}>
              <Text style={styles.createBtnText}>Criar Pedido</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8} onPress={() => router.push('pedidos/addPedido')}>
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <Text style={styles.dateText}>05/03/2026</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Grid of Cards */}
          <View style={styles.grid}>
            {MOCK_ORDERS.map((order) => (
              <View key={order.id} style={styles.gridItem}>
                <OrderCard {...order} />
              </View>
            ))}
          </View>
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
  });
}
