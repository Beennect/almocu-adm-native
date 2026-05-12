import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { OrderCard, OrderStatus } from '../../components/orders/OrderCard';
import { UserHeader } from '../../components/shared/UserHeader';

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
    <View 
      className="flex-1"
      style={{ paddingTop: isWeb ? 0 : 20 }}
    >
      {/* User Header Component - Apenas Mobile */}
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      {/* Top Bar / Search Row */}
      <View className="flex-row items-center justify-between gap-4 mb-5">
        <View 
          className="flex-1 flex-row items-center rounded-full h-14 px-4"
          style={{ backgroundColor: theme.foreground }}
        >
          <TextInput
            className="flex-1 font-jost text-base"
            style={{ color: theme.text, outlineStyle: 'none' }}
            placeholder="Nome"
            placeholderTextColor={theme.text + '80'}
          />
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            className="rounded-full px-6 h-14 items-center justify-center border"
            style={{ 
              backgroundColor: theme.foreground,
              borderColor: theme.background
            }} 
            activeOpacity={0.7}
          >
            <Text className="font-jost-bold text-base" style={{ color: theme.text }}>Ordem ↓</Text>
          </TouchableOpacity>

          {isWeb ? (
            <TouchableOpacity 
              className="rounded-full px-8 h-14 items-center justify-center"
              style={{ backgroundColor: theme.contrast }}
              activeOpacity={0.8} 
              onPress={() => router.push('pedidos/addPedido')}
            >
              <Text className="font-jost-bold text-base text-white">Criar Pedido</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="rounded-full w-14 h-14 items-center justify-center"
              style={{ backgroundColor: theme.contrast }}
              activeOpacity={0.8} 
              onPress={() => router.push('pedidos/addPedido')}
            >
              <Text className="font-jost-bold text-2xl text-white" style={{ marginTop: -2 }}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className={isWeb ? 'flex-1 bg-transparent rounded-3xl' : 'flex-1'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Date Divider */}
          <View className="flex-row items-center mb-6">
            <Text 
              className="font-jost-semibold text-sm mr-3"
              style={{ color: theme.text, opacity: 0.6 }}
            >
              05/03/2026
            </Text>
            <View 
              className="flex-1 h-px"
              style={{ backgroundColor: theme.background }}
            />
          </View>

          {/* Grid of Cards */}
          <View className="flex-row flex-wrap mx-2.5">
            {MOCK_ORDERS.map((order) => (
              <View 
                key={order.id} 
                className={isWeb ? 'w-1/2 px-2.5' : 'w-full px-2.5'}
              >
                <OrderCard {...order} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
