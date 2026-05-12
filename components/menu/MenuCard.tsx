import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { EditIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export function MenuCard({ name, description, price, image }: MenuItem) {
  const theme = useAppTheme();

  return (
    <View className="flex-row bg-foreground rounded-[24px] p-3 mb-4 items-center">
      {/* Left: Image Placeholder */}
      <View className="mr-4">
        {image ? (
          <Image source={{ uri: image }} className="w-20 h-20 rounded-xl bg-background" />
        ) : (
          <View className="w-20 h-20 rounded-xl bg-background" />
        )}
      </View>

      {/* Middle: Content */}
      <View className="flex-1 pr-2">
        <Text className="font-[Jost_700Bold] text-base text-text mb-1">{name}</Text>
        <Text className="font-[Jost_400Regular] text-[13px] text-text opacity-60 mb-2 leading-[18px]" numberOfLines={2}>
          {description}
        </Text>
        <Text className="font-[Jost_700Bold] text-base text-text">R$ {price.toFixed(2).replace('.', ',')}</Text>
      </View>

      {/* Vertical Divider */}
      <View 
        className="w-[1px] h-3/5 mx-3" 
        style={{ borderLeftWidth: 1, borderColor: theme.background, borderStyle: 'dashed' }} 
      />

      {/* Right: Edit Action */}
      <TouchableOpacity className="w-11 h-11 items-center justify-center" activeOpacity={0.7}>
        <EditIcon color={theme.text} opacity={0.7} size={24} />
      </TouchableOpacity>
    </View>
  );
}
