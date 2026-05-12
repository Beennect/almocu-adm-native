import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { MenuCard, MenuItem } from '../../components/menu/MenuCard';
import { UserHeader } from '../../components/shared/UserHeader';

const MOCK_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Canoa Sushi Grande',
    description: '30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...',
    price: 140.00,
  },
  {
    id: '2',
    name: 'Temaki Salmão Especial',
    description: 'Salmão fresco em cubos, cebolinha, cream cheese e arroz envoltos em alga crocante.',
    price: 32.90,
  },
  {
    id: '3',
    name: 'Uramaki Philadelphia',
    description: '8 unidades de uramaki com salmão e cream cheese, coberto com gergelim.',
    price: 28.00,
  }
];

export default function CardapioScreen() {
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
      <View className="flex-row items-center justify-between gap-4 mb-6">
        <View 
          className="flex-1 flex-row items-center rounded-full h-14 px-4"
          style={{ backgroundColor: theme.foreground }}
        >
          <TextInput
            className="flex-1 font-jost text-base"
            style={{ color: theme.text, outlineStyle: 'none' }}
            placeholder="Nome do prato"
            placeholderTextColor={theme.text + '80'}
          />
        </View>
        <View className="flex-row items-center gap-3">
          {isWeb ? (
            <TouchableOpacity 
              className="bg-blue-600 rounded-full px-8 h-14 items-center justify-center"
              style={{ backgroundColor: theme.contrast }}
              activeOpacity={0.8}
              onPress={() => router.push('cardapio/addItem')}
            >
              <Text className="font-jost-bold text-base text-white">Novo Item</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="rounded-full w-14 h-14 items-center justify-center"
              style={{ backgroundColor: theme.contrast }}
              activeOpacity={0.8}
              onPress={() => router.push('cardapio/addItem')}
            >
              <Text className="font-jost-bold text-2xl text-white" style={{ marginTop: -2 }}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className={isWeb ? 'flex-1' : 'flex-1'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Section Divider */}
          <View className="flex-row items-center mb-5">
            <Text 
              className="font-jost-semibold text-sm mr-3"
              style={{ color: theme.text, opacity: 0.6 }}
            >
              Pratos Principais
            </Text>
            <View 
              className="flex-1 h-px"
              style={{ backgroundColor: theme.background }}
            />
          </View>

          {/* Grid of Cards */}
          <View className="flex-row flex-wrap mx-2.5">
            {MOCK_ITEMS.map((item) => (
              <View 
                key={item.id} 
                className={isWeb ? 'w-1/2 px-2.5' : 'w-full px-2.5'}
              >
                <MenuCard {...item} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
