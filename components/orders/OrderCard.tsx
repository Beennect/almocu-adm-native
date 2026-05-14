import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/themes/colors';

export type OrderStatus = 'Pendente' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
}

interface OrderCardProps {
  id?: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  elapsedTime: string;
  items: OrderItem[];
}

export function OrderCard({ id, orderNumber, customerName, status, total, elapsedTime, items }: OrderCardProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme, status);

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>#{orderNumber}</Text>
          <Text style={styles.customerName}>{customerName}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsList}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Total and Time */}
      <View style={styles.footerInfo}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.dottedLine} />
          <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>
        
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Tempo corrido</Text>
          <Text style={styles.timeValue}>{elapsedTime}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.7}>
          <Text style={styles.detailsBtnText}>Detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusBtn} activeOpacity={0.7}>
          <Text style={styles.statusBtnText}>Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme: any, status: OrderStatus) {
  const getStatusColor = () => {
    switch (status) {
      case 'Pendente': return '#F59E0B';
      case 'Preparando': return '#3B82F6';
      case 'Pronto': return '#10B981';
      case 'Entregue': return '#6B7280';
      case 'Cancelado': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  return StyleSheet.create({
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    orderNumber: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
    },
    customerName: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      opacity: 0.8,
    },
    statusBadge: {
      backgroundColor: getStatusColor(),
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 100,
    },
    statusText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: '#FFFFFF',
    },
    itemsList: {
      marginBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    itemQty: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.contrast,
      width: 20,
    },
    itemName: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 15,
      color: theme.text,
      opacity: 0.9,
    },
    itemPrice: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      color: theme.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background,
      marginBottom: 16,
      opacity: 0.5,
    },
    footerInfo: {
      marginBottom: 24,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    totalLabel: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.contrast,
    },
    dottedLine: {
      flex: 1,
      height: 1,
      borderStyle: 'dotted',
      borderWidth: 1,
      borderColor: theme.contrast,
      opacity: 0.3,
      marginHorizontal: 10,
      marginTop: 8,
    },
    totalValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.contrast,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeLabel: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
    },
    timeValue: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    detailsBtn: {
      flex: 1,
      backgroundColor: theme.background,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailsBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    statusBtn: {
      flex: 1,
      backgroundColor: theme.contrast,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
  });
}
