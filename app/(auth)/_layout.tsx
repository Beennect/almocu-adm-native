import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { authStore } from '../../stores/AuthStore';
import { uiStore } from '../../stores/UiStore';
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

  useEffect(() => {
    if (!pathname.includes('/dashboard')) {
      uiStore.setSidebarCollapsed(false);
    }
  }, [pathname]);

  if (!authStore.isInitialized) return null;
  if (!authStore.isAuthenticated && pathname !== '/login') return null;
  if (!hasRestaurant && pathname !== '/config' && pathname !== '/criar-restaurante') return null;

  const isFullscreen = isWeb && uiStore.sidebarCollapsed;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {isWeb ? (
        <View style={styles.webWrapper}>
          {isFullscreen && uiStore.sidebarOverlay && (
            <Pressable style={styles.backdrop} onPress={() => uiStore.hideSidebarOverlay()}>
              <View style={[styles.backdropInner, { backgroundColor: theme.background + '99' }]} />
            </Pressable>
          )}

          {isFullscreen ? (
            uiStore.sidebarOverlay && (
              <View style={styles.navbarOverlay}>
                <Navbar overlay />
              </View>
            )
          ) : (
            <Navbar />
          )}

          <View style={[styles.webContentArea, isFullscreen && styles.webContentFullscreen]}>
            <View style={[styles.maxContentWidth, isFullscreen && styles.maxContentFullscreen]}>
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
    position: 'relative',
  },
  webContentArea: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
  },
  webContentFullscreen: {
    padding: 0,
  },
  maxContentWidth: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
  },
  maxContentFullscreen: {
    maxWidth: '100%',
  },
  navbarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    elevation: 90,
  },
  backdropInner: {
    flex: 1,
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
