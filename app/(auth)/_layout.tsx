import { Navbar } from '@/components/shared/navbar/Navbar';
import { useAppTheme } from '@/themes/colors';
import { Slot } from 'expo-router';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';

export default function AuthLayout() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();

  return (
    <View 
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      {isWeb ? (
        <View className="flex-1 flex-row">
          <Navbar />
          <View className="flex-1 p-8 items-center">
            <View className="flex-1 w-full max-w-[1200px]">
              <Slot />
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-1 px-4 pt-4">
            <Slot />
          </View>
          <Navbar />
        </View>
      )}
    </View>
  );
}
