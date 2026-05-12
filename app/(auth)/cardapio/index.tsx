import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { MenuCard, MenuItem } from '../../../components/menu/MenuCard';
import { UserHeader } from '../../../components/shared/UserHeader';

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
    <View className={`flex-1 ${isWeb ? 'pt-0' : 'pt-5'}`}>
      {/* User Header Component - Apenas Mobile */}
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      {/* Top Bar / Search Row */}
      <View className="flex-row items-center justify-between mb-6 gap-4">
        <View className="flex-1 flex-row items-center bg-foreground rounded-[20px] px-4 h-14">
          <TextInput
            className="flex-1 font-[Jost_400Regular] text-base text-text outline-none"
            placeholder="Nome do prato"
            placeholderTextColor={theme.text + '80'}
          />
        </View>
        <View className="flex-row items-center gap-3">
          {isWeb ? (
            <TouchableOpacity
              className="bg-contrast rounded-[20px] px-8 h-14 items-center justify-center"
              activeOpacity={0.8}
              onPress={() => router.push('cardapio/addItem')}
            >
              <Text className="font-[Jost_700Bold] text-base text-white">Novo Item</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-contrast rounded-[20px] w-14 h-14 items-center justify-center"
              activeOpacity={0.8}
              onPress={() => router.push('cardapio/addItem')}
            >
              <Text className="font-[Jost_700Bold] text-2xl text-white mt-[-2px]">+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className={isWeb ? "flex-1" : "flex-1"}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Section Divider */}
          <View className="flex-row items-center mb-5">
            <Text className="font-[Jost_600SemiBold] text-sm text-text opacity-60 mr-3">Pratos Principais</Text>
            <View className="flex-1 h-[1px] bg-background" />
          </View>

          {/* Grid of Cards */}
          <View className="flex-row flex-wrap mx-[-10px]">
            {MOCK_ITEMS.map((item) => (
              <View key={item.id} className={`${isWeb ? 'w-1/2' : 'w-full'} px-[10px]`}>
                <MenuCard {...item} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
