import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/themes/colors';

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

const statusColors: Record<OrderStatus, string> = {
  'Pendente': 'bg-[#F59E0B]',
  'Preparando': 'bg-[#3B82F6]',
  'Pronto': 'bg-[#10B981]',
  'Entregue': 'bg-[#6B7280]',
  'Cancelado': 'bg-[#EF4444]',
};

export function OrderCard({ orderNumber, customerName, status, total, elapsedTime, items }: OrderCardProps) {
  const theme = useAppTheme();

  return (
    <View className="bg-foreground rounded-[24px] p-5 mb-5">
      {/* Header Row */}
      <View className="flex-row justify-between items-start mb-5">
        <View>
          <Text className="font-[Jost_700Bold] text-lg text-text">#{orderNumber}</Text>
          <Text className="font-[Jost_400Regular] text-base text-text opacity-80">{customerName}</Text>
        </View>
        <View className={`px-4 py-1.5 rounded-full ${statusColors[status] || 'bg-[#3B82F6]'}`}>
          <Text className="font-[Jost_600SemiBold] text-sm text-white">{status}</Text>
        </View>
      </View>

      {/* Items List */}
      <View className="mb-3">
        {items.map((item) => (
          <View key={item.id} className="flex-row items-center mb-2">
            <Text className="font-[Jost_700Bold] text-[15px] text-contrast w-5">{item.quantity}</Text>
            <Text className="flex-1 font-[Jost_400Regular] text-[15px] text-text opacity-90">{item.name}</Text>
            <Text className="font-[Jost_600SemiBold] text-[15px] text-text">R$ {item.price.toFixed(2).replace('.', ',')}</Text>
          </View>
        ))}
      </View>

      <View className="h-[1px] bg-background mb-4 opacity-50" />

      {/* Total and Time */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-[Jost_700Bold] text-base text-contrast">Total</Text>
          <View 
            className="flex-1 h-[1px] mx-2.5 mt-2 opacity-30" 
            style={{ 
              borderStyle: 'dotted', 
              borderWidth: 1, 
              borderColor: theme.contrast 
            }} 
          />
          <Text className="font-[Jost_700Bold] text-lg text-contrast">R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>
        
        <View className="flex-row justify-between items-center">
          <Text className="font-[Jost_400Regular] text-sm text-text opacity-70">Tempo corrido</Text>
          <Text className="font-[Jost_400Regular] text-sm text-text opacity-70">{elapsedTime}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 bg-background h-14 rounded-[18px] items-center justify-center" activeOpacity={0.7}>
          <Text className="font-[Jost_700Bold] text-base text-text">Detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-contrast h-14 rounded-[18px] items-center justify-center" activeOpacity={0.7}>
          <Text className="font-[Jost_700Bold] text-base text-white">Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
