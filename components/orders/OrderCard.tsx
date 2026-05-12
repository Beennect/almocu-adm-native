import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type OrderStatus = 'Pendente' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';

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
  total: number;
  elapsedTime: string;
  items: OrderItem[];
}

export function OrderCard({ orderNumber, customerName, status, total, elapsedTime, items }: OrderCardProps) {
  const theme = useAppTheme();

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

  return (
    <View 
      className="rounded-3xl p-5 mb-5"
      style={{ backgroundColor: theme.foreground }}
    >
      {/* Header Row */}
      <View className="flex-row justify-between items-start mb-5">
        <View>
          <Text 
            className="font-jost-bold text-lg"
            style={{ color: theme.text }}
          >
            #{orderNumber}
          </Text>
          <Text 
            className="font-jost text-base"
            style={{ color: theme.text, opacity: 0.8 }}
          >
            {customerName}
          </Text>
        </View>
        <View 
          className="px-4 py-1.5 rounded-full"
          style={{ backgroundColor: getStatusColor() }}
        >
          <Text className="font-jost-semibold text-sm text-white">
            {status}
          </Text>
        </View>
      </View>

      {/* Items List */}
      <View className="mb-3">
        {items.map((item) => (
          <View key={item.id} className="flex-row items-center mb-2">
            <Text 
              className="font-jost-bold text-base w-5"
              style={{ color: theme.contrast }}
            >
              {item.quantity}
            </Text>
            <Text 
              className="flex-1 font-jost text-base ml-1"
              style={{ color: theme.text, opacity: 0.9 }}
            >
              {item.name}
            </Text>
            <Text 
              className="font-jost-semibold text-base"
              style={{ color: theme.text }}
            >
              R$ {item.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        ))}
      </View>

      <View 
        className="h-px mb-4" 
        style={{ 
          backgroundColor: theme.background, 
          opacity: 0.5 
        }} 
      />

      {/* Total and Time */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-1">
          <Text 
            className="font-jost-bold text-base"
            style={{ color: theme.contrast }}
          >
            Total
          </Text>
          <View 
            className="flex-1 h-px mx-2.5"
            style={{ 
              borderStyle: 'dotted',
              borderWidth: 1,
              borderColor: theme.contrast,
              opacity: 0.3,
              marginTop: 2
            }}
          />
          <Text 
            className="font-jost-bold text-lg"
            style={{ color: theme.contrast }}
          >
            R$ {total.toFixed(2).replace('.', ',')}
          </Text>
        </View>
        
        <View className="flex-row justify-between items-center">
          <Text 
            className="font-jost text-sm"
            style={{ color: theme.text, opacity: 0.7 }}
          >
            Tempo corrido
          </Text>
          <Text 
            className="font-jost text-sm"
            style={{ color: theme.text, opacity: 0.7 }}
          >
            {elapsedTime}
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity 
          className="flex-1 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: theme.background }}
          activeOpacity={0.7}
        >
          <Text 
            className="font-jost-bold text-base"
            style={{ color: theme.text }}
          >
            Detalhes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: theme.contrast }}
          activeOpacity={0.7}
        >
          <Text className="font-jost-bold text-base text-white">
            Status
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
