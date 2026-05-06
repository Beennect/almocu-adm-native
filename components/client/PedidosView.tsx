import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/themes/colors';
import { OrderCard, OrderStatus } from './OrderCard';
import { SearchIcon, MenuIcon } from '../shared/Icons';
import { UserHeader } from './UserHeader';
import { navbarStore } from '../shared/navbar/NavbarState';

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
  {
    id: '3',
    orderNumber: '7362',
    customerName: 'Raquel Lais',
    status: 'Pendente' as OrderStatus,
    total: 140.00,
    elapsedTime: '00:10:41',
    items: [
      { id: 'i1', quantity: 1, name: 'Canoa de Sushi', price: 120.00 },
      { id: 'i2', quantity: 2, name: 'Suco Natural', price: 20.00 },
    ]
  },
  {
    id: '4',
    orderNumber: '7362',
    customerName: 'Raquel Lais',
    status: 'Pronto' as OrderStatus,
    total: 140.00,
    elapsedTime: '00:10:41',
    items: [
      { id: 'i1', quantity: 1, name: 'Canoa de Sushi', price: 120.00 },
      { id: 'i2', quantity: 2, name: 'Suco Natural', price: 20.00 },
    ]
  },
  {
    id: '5',
    orderNumber: '7362',
    customerName: 'Raquel Lais',
    status: 'Entregue' as OrderStatus,
    total: 140.00,
    elapsedTime: '00:10:41',
    items: [
      { id: 'i1', quantity: 1, name: 'Canoa de Sushi', price: 120.00 },
      { id: 'i2', quantity: 2, name: 'Suco Natural', price: 20.00 },
    ]
  },
  {
    id: '6',
    orderNumber: '7362',
    customerName: 'Raquel Lais',
    status: 'Cancelado' as OrderStatus,
    total: 140.00,
    elapsedTime: '00:10:41',
    items: [
      { id: 'i1', quantity: 1, name: 'Canoa de Sushi', price: 120.00 },
      { id: 'i2', quantity: 2, name: 'Suco Natural', price: 20.00 },
    ]
  },
];

export function PedidosView() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const styles = makeStyles(theme.text, theme.foreground, theme.contrast, isWeb);

  return (
    <View style={styles.container}>
      {!isWeb && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ color: '#3B82F6', fontFamily: 'Jost_700Bold', fontSize: 14 }}>PEDIDOS</Text>
        </View>
      )}
      {/* User Header Component - Apenas Mobile */}
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      {/* Top Bar / Search Row */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome"
            placeholderTextColor="#6B7280"
          />
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.orderBtn} activeOpacity={0.7}>
            <Text style={styles.orderBtnText}>Ordem ↓</Text>
          </TouchableOpacity>
          
          {isWeb ? (
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.8} onPress={() => navbarStore.setActiveTab('add_pedido')}>
              <Text style={styles.createBtnText}>Criar Pedido</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8} onPress={() => navbarStore.setActiveTab('add_pedido')}>
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

function makeStyles(textColor: string, foreground: string, contrast: string, isWeb: boolean) {
  const isWebPlatform = Platform.OS === 'web';

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      gap: 16,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EEEEEE',
      borderRadius: 20,
      paddingHorizontal: 20,
      height: 56,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: textColor,
      outlineStyle: 'none',
    } as any,
    actionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    orderBtn: {
      backgroundColor: '#EEEEEE',
      borderRadius: 20,
      paddingHorizontal: 24,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    orderBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: textColor,
    },
    createBtn: {
      backgroundColor: '#FF5F2F',
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
      backgroundColor: '#FF5F2F',
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
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 15,
      elevation: 2,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    dateDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    dateText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: '#6B7280',
      marginRight: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#E5E7EB',
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
