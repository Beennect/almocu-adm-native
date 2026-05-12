import { EditIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

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
    <View 
      className="flex-row rounded-3xl p-3 mb-4 items-center"
      style={{ backgroundColor: theme.foreground }}
    >
      {/* Left: Image Placeholder */}
      <View className="mr-4">
        {image ? (
          <Image 
            source={{ uri: image }} 
            className="w-20 h-20 rounded-2xl"
            style={{ backgroundColor: theme.background }}
          />
        ) : (
          <View 
            className="w-20 h-20 rounded-2xl"
            style={{ backgroundColor: theme.background }}
          />
        )}
      </View>

      {/* Middle: Content */}
      <View className="flex-1 pr-2">
        <Text 
          className="font-jost-bold text-base mb-1"
          style={{ color: theme.text }}
        >
          {name}
        </Text>
        <Text 
          className="font-jost text-sm mb-2 leading-[18px]"
          numberOfLines={2}
          style={{ color: theme.text, opacity: 0.6 }}
        >
          {description}
        </Text>
        <Text 
          className="font-jost-bold text-base"
          style={{ color: theme.text }}
        >
          R$ {price.toFixed(2).replace('.', ',')}
        </Text>
      </View>

      {/* Vertical Divider */}
      <View 
        className="w-px h-[60%] ml-3"
        style={{ 
          borderLeftWidth: 1, 
          borderColor: theme.background,
          borderStyle: 'dashed'
        }}
      />

      {/* Right: Edit Action */}
      <TouchableOpacity className="w-11 h-11 items-center justify-center" activeOpacity={0.7}>
        <EditIcon color={theme.text} opacity={0.7} size={24} />
      </TouchableOpacity>
    </View>
  );
}
