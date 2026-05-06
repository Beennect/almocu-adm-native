import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/themes/colors';

export type OrderStatus = 'Preparando' | 'Pendente' | 'Pronto' | 'Entregue' | 'Cancelado';

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
}

interface OrderCardProps {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  elapsedTime: string;
}

const statusColors: Record<OrderStatus, string> = {
  Preparando: '#3B82F6',
  Pendente: '#D97706',
  Pronto: '#10B981',
  Entregue: '#6B7280',
  Cancelado: '#EF4444',
};

export function OrderCard({
  orderNumber,
  customerName,
  status,
  items,
  total,
  elapsedTime,
}: OrderCardProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme.text, theme.foreground, statusColors[status]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>#{orderNumber}</Text>
          <Text style={styles.customerName}>{customerName}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQuantityName}>
              <Text style={styles.itemQuantity}>{item.quantity} </Text>
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>
              R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.dottedLine} />
          <Text style={styles.totalValue}>
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Tempo corrido</Text>
          <Text style={styles.timeValue}>{elapsedTime}</Text>
        </View>
      </View>

      {/* Actions */}
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

function makeStyles(textColor: string, foreground: string, statusColor: string) {
  return StyleSheet.create({
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      width: '100%',
      // shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    orderNumber: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: textColor,
    },
    customerName: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: textColor,
      marginTop: 2,
    },
    statusBadge: {
      backgroundColor: statusColor,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    statusText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 12,
      color: '#FFFFFF',
    },
    itemsList: {
      marginBottom: 16,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    itemQuantityName: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: textColor,
    },
    itemQuantity: {
      fontFamily: 'Jost_700Bold',
      color: '#FF5F2F',
    },
    itemPrice: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: textColor,
    },
    footerInfo: {
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      paddingTop: 12,
      marginBottom: 16,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    totalLabel: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FF5F2F',
    },
    dottedLine: {
      flex: 1,
      height: 1,
      borderStyle: 'dotted',
      borderWidth: 1,
      borderColor: '#FF5F2F',
      opacity: 0.2,
      marginHorizontal: 12,
      marginTop: 6,
    },
    totalValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: '#FF5F2F',
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    timeLabel: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: textColor,
    },
    timeValue: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: textColor,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    detailsBtn: {
      flex: 1,
      backgroundColor: '#E5E7EB',
      borderRadius: 14,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailsBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: textColor,
    },
    statusBtn: {
      flex: 1,
      backgroundColor: '#FF5F2F',
      borderRadius: 14,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: '#FFFFFF',
    },
  });
}
