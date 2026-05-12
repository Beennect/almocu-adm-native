import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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

  return (
    <View className={`flex-1 ${isWeb ? 'pt-0' : 'pt-5'}`}>
      {/* User Header Component - Apenas Mobile */}
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      {/* Top Bar / Search Row */}
      <View className="flex-row items-center justify-between mb-5 gap-4">
        <View className="flex-1 flex-row items-center bg-foreground rounded-[20px] px-4 h-14">
          <TextInput
            className="flex-1 font-[Jost_400Regular] text-base text-text outline-none"
            placeholder="Nome"
            placeholderTextColor={theme.text + '80'}
          />
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="bg-foreground rounded-[20px] px-6 h-14 items-center justify-center border border-background" activeOpacity={0.7}>
            <Text className="font-[Jost_700Bold] text-base text-text">Ordem ↓</Text>
          </TouchableOpacity>

          {isWeb ? (
            <TouchableOpacity className="bg-contrast rounded-[20px] px-8 h-14 items-center justify-center" activeOpacity={0.8} onPress={() => router.push('pedidos/addPedido')}>
              <Text className="font-[Jost_700Bold] text-base text-white">Criar Pedido</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="bg-contrast rounded-[20px] w-14 h-14 items-center justify-center" activeOpacity={0.8} onPress={() => router.push('pedidos/addPedido')}>
              <Text className="font-[Jost_700Bold] text-2xl text-white mt-[-2px]">+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className={isWeb ? "flex-1 bg-transparent rounded-[32px]" : "flex-1"}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Date Divider */}
          <View className="flex-row items-center mb-6">
            <Text className="font-[Jost_600SemiBold] text-sm text-text opacity-60 mr-3">05/03/2026</Text>
            <View className="flex-1 h-[1px] bg-background" />
          </View>

          {/* Grid of Cards */}
          <View className="flex-row flex-wrap mx-[-10px]">
            {MOCK_ORDERS.map((order) => (
              <View key={order.id} className={`${isWeb ? 'w-1/2' : 'w-full'} px-[10px]`}>
                <OrderCard {...order} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
