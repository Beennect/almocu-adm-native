import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../themes/colors';

export interface CommonCardProps {
  name: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  isOpen: boolean;
  imageUrl?: string;
  freeDeliveryBadgePosition?: 'inline' | 'right'; 
}

export function CommonCard({
  name,
  rating,
  deliveryTime,
  deliveryFee,
  isOpen,
  imageUrl,
  freeDeliveryBadgePosition = 'right',
}: CommonCardProps) {
  const isFree = deliveryFee === 0;

  return (
    <View className="bg-white rounded-2xl p-3 flex-row items-center shadow-sm elevation-sm mb-3">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl mr-4" />
      ) : (
        <View className="w-16 h-16 rounded-xl bg-light-fg mr-4" />
      )}

      <View className="flex-1 justify-center gap-1.5">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className={`px-2 py-0.5 rounded-full ${isOpen ? 'bg-primary' : 'bg-light-fg'}`}>
              <Text className={`text-[10px] font-bold ${isOpen ? 'text-white' : 'text-dark-fg'}`}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </Text>
            </View>
            {isFree && freeDeliveryBadgePosition === 'inline' && (
              <Text className="text-xs text-primary font-bold">Grátis!</Text>
            )}
          </View>
          
          {isFree && freeDeliveryBadgePosition === 'right' && (
            <Text className="text-xs text-primary font-bold">Grátis!</Text>
          )}
        </View>

        <Text className="text-sm font-bold text-dark-fg" numberOfLines={1}>{name}</Text>
        
        <View className="flex-row items-center">
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text className="text-xs text-primary ml-0.5 font-bold">{rating.toFixed(1)}</Text>
          <Text className="text-xs text-gray-400 mx-1"> | </Text>
          <Text className="text-xs text-gray-500">{deliveryTime}</Text>
          {!isFree && (
            <>
              <Text className="text-xs text-gray-400 mx-1"> | </Text>
              <Text className="text-xs text-gray-500">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
