import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface NavButtonProps {
  active?: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  isWeb?: boolean;
}

export function NavButton({ active, onPress, icon, label, isWeb = false }: NavButtonProps) {
  const theme = useAppTheme();

  if (isWeb) {
    return (
      <Pressable 
        onPress={onPress} 
        className="flex-row items-center py-3 my-1"
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <View className="w-8 items-center justify-center">
          {icon}
        </View>
        <Text 
          className={`font-[Jost_600SemiBold] text-base ml-3 ${
            active ? 'text-contrast opacity-100' : 'text-text opacity-60'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  // Mobile layout
  return (
    <Pressable 
      onPress={onPress}
      className="flex-1 h-full items-center justify-center z-10"
    >
      {icon}
    </Pressable>
  );
}
