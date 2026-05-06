import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Slot } from 'expo-router';
import { Navbar } from '@/components/shared/navbar/Navbar';
import { useAppTheme } from '@/themes/colors';

export default function AuthLayout() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isWeb ? (
        <View style={styles.webWrapper}>
          <Navbar />
          <View style={styles.webContentArea}>
            <View style={styles.maxContentWidth}>
              <Slot />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.mobileWrapper}>
          <View style={styles.mobileSlot}>
            <Slot />
          </View>
          <Navbar />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  webContentArea: {
    flex: 1,
    padding: 32,
    alignItems: 'center', // Centro para aplicar o maxWidth
  },
  maxContentWidth: {
    flex: 1,
    width: '100%',
    maxWidth: 1200, // Max width apenas no conteúdo principal
  },
  mobileWrapper: {
    flex: 1,
  },
  mobileSlot: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
