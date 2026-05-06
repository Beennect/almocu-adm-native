import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface NavButtonProps {
  active?: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  isWeb?: boolean;
}

export function NavButton({ active, onPress, icon, label, isWeb = false }: NavButtonProps) {
  if (isWeb) {
    return (
      <Pressable 
        onPress={onPress} 
        className="flex-row items-center py-3 my-1"
      >
        <View className="w-8 items-center justify-center">
          {icon}
        </View>
        <Text className={`ml-3 font-semibold text-base ${active ? 'text-primary' : 'text-gray-500'}`}>
          {label}
        </Text>
      </Pressable>
    );
  }

  // Mobile layout
  return (
    <Pressable 
      onPress={onPress}
      className="flex-1 py-4 items-center justify-center z-10"
    >
      {icon}
    </Pressable>
  );
}
