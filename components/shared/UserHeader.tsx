import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MenuIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';

interface UserHeaderProps {
  userName: string;
}

export function UserHeader({ userName }: UserHeaderProps) {
  const theme = useAppTheme();
  return (
    <View className="flex-row items-center h-[72px] rounded-[20px] px-6 mb-8 bg-foreground shadow-sm elevation-1">
      <Text className="flex-1 font-[Jost_700Bold] text-base text-center ml-9 text-text">
        Olá {userName.toUpperCase()}
      </Text>
      <TouchableOpacity className="w-11 h-11 items-center justify-center" activeOpacity={0.7}>
        <MenuIcon color={theme.text} size={36} opacity={0.8} />
      </TouchableOpacity>
    </View>
  );
}
