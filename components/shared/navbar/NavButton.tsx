import { useAppTheme } from '@/themes/colors';
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
  const theme = useAppTheme();

  if (isWeb) {
    return (
      <Pressable onPress={onPress} className="flex-row items-center py-3 my-1" activeOpacity={0.7}>
        <View className="w-8 items-center justify-center">{icon}</View>
        <Text
          className="text-base font-[Jost_600SemiBold] ml-3"
          style={{ color: active ? theme.contrast : theme.text, opacity: active ? 1 : 0.6 }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="flex-1 h-full items-center justify-center z-10">
      {icon}
    </Pressable>
  );
}
