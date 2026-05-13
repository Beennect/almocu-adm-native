import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navbar, LogoutModal } from '@/components/shared/navbar/Navbar';
import { useAppTheme } from '@/themes/colors';
import { Slot } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <ProtectedRoute>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {isWeb ? (
          <View style={styles.webWrapper}>
            <Navbar onLogoutPress={() => setShowLogoutConfirm(true)} />
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
            <Navbar onLogoutPress={() => setShowLogoutConfirm(true)} />
          </View>
        )}
        {showLogoutConfirm && (
          <LogoutModal 
            visible={showLogoutConfirm} 
            onCancel={() => setShowLogoutConfirm(false)} 
          />
        )}
      </SafeAreaView>
    </ProtectedRoute>
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
