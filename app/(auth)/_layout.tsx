import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { authStore } from '../../stores/AuthStore';
import { observer } from 'mobx-react-lite';
import Toast from 'react-native-toast-message';
import { Navbar } from '@/components/shared/navbar/Navbar';
import { useAppTheme } from '@/themes/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
export default observer(function AuthLayout() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const hasRestaurant = !!authStore.user?.restaurantId;
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!authStore.isInitialized) return;

    if (!authStore.isAuthenticated && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    if (
      authStore.isAuthenticated &&
      !hasRestaurant &&
      pathname !== '/config' &&
      pathname !== '/criar-restaurante'
    ) {
      router.replace('/(auth)/config');
    }
  }, [authStore.isInitialized, authStore.isAuthenticated, hasRestaurant, pathname, router]);

  useEffect(() => {
    if (!hasRestaurant && authStore.isAuthenticated && !toastShownRef.current) {
      Toast.show({
        type: 'info',
        text1: 'Selecione um workspace para continuar',
      });
      toastShownRef.current = true;
    }
    if (hasRestaurant) {
      toastShownRef.current = false;
    }
  }, [hasRestaurant]);

  if (!authStore.isInitialized) return null;
  if (!authStore.isAuthenticated && pathname !== '/login') return null;
  if (!hasRestaurant && pathname !== '/config' && pathname !== '/criar-restaurante') return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
    </SafeAreaView>
  );
});

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
