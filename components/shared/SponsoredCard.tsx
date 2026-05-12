import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../themes/colors';

export interface SponsoredCardProps {
  name: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  isOpen: boolean;
  imageUrl?: string;
}

export function SponsoredCard({
  name,
  rating,
  deliveryTime,
  deliveryFee,
  isOpen,
  imageUrl,
}: SponsoredCardProps) {
  return (
    <View className="bg-white rounded-2xl p-3 w-[170px] shadow-sm elevation-sm">
      <View className="relative mb-3">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full aspect-square rounded-xl" />
        ) : (
          <View className="w-full aspect-square rounded-xl bg-light-fg" />
        )}
        <View className={`absolute -top-2 -right-2 px-2 py-1 rounded-full ${isOpen ? 'bg-primary' : 'bg-light-fg'}`}>
          <Text className={`text-[10px] font-bold ${isOpen ? 'text-white' : 'text-dark-fg'}`}>
            {isOpen ? 'Aberto' : 'Fechado'}
          </Text>
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-bold text-dark-fg" numberOfLines={1}>{name}</Text>
        <View className="flex-row items-center">
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text className="text-xs text-primary ml-0.5 font-bold">{rating.toFixed(1)}</Text>
          <Text className="text-xs text-gray-400 mx-0.5"> | </Text>
          <Text className="text-xs text-gray-500">{deliveryTime}</Text>
          <Text className="text-xs text-gray-400 mx-0.5"> | </Text>
          {deliveryFee === 0 ? (
            <Text className="text-xs text-primary font-bold">Grátis!</Text>
          ) : (
            <Text className="text-xs text-gray-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
