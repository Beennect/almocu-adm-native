import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { authStore } from '../../stores/AuthStore';
import { permissionStore, Ability } from '@/stores/PermissionStore';
import { observer } from 'mobx-react-lite';
import Toast from 'react-native-toast-message';
import { Navbar } from '@/components/shared/navbar/Navbar';
import { useAppTheme } from '@/themes/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RouteGuard {
  match: RegExp;
  abilities: Ability[];
  requireAll?: boolean;
}

/**
 * Guards baseados em rota (Camada 1 do RBAC).
 * Como o grupo (auth) é uma route group do Expo Router, o `pathname` retornado
 * NÃO contém o prefixo "(auth)". Ex.: a tela `app/(auth)/pedidos/index.tsx`
 * produz `pathname === '/pedidos'`. Por isso os regex abaixo casam por sufixo
 * (`/pedidos/...`) sem o prefixo do grupo.
 *
 * Atenção: a primeira regra mais específica deve vir antes da genérica
 * (ex.: `/pedidos/addPedido` antes de `/pedidos`) para que `addPedido`
 * não seja capturada pelo guarda de listagem.
 */
const ROUTE_GUARDS: RouteGuard[] = [
  { match: /\/pedidos\/addPedido(?:\/|$|\?)/, abilities: ['orders:create', 'orders:edit-items'], requireAll: false },
  { match: /\/pedidos\/historico(?:\/|$|\?)/, abilities: ['orders:view'] },
  { match: /\/pedidos(?:\/|$|\?)/, abilities: ['orders:view'] },
  { match: /\/cardapio\/addItem(?:\/|$|\?)/, abilities: ['menu:create', 'menu:edit'], requireAll: false },
  { match: /\/cardapio(?:\/|$|\?)/, abilities: ['menu:view'] },
  { match: /\/estoque\/addItem(?:\/|$|\?)/, abilities: ['stock:create', 'stock:edit'], requireAll: false },
  { match: /\/estoque(?:\/|$|\?)/, abilities: ['stock:view'] },
  { match: /\/fornecedores\/addItem(?:\/|$|\?)/, abilities: ['suppliers:manage'] },
  { match: /\/fornecedores(?:\/|$|\?)/, abilities: ['suppliers:view'] },
  { match: /\/funcionarios(?:\/|$|\?)/, abilities: ['staff:view'] },
];

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
      pathname !== '/config'
    ) {
      router.replace('/(auth)/config');
    }
  }, [authStore.isInitialized, authStore.isAuthenticated, hasRestaurant, pathname, router]);

  // Camada 1: valida o pathname contra ROUTE_GUARDS e redireciona
  // para o dashboard se a role ativa não tiver a ability exigida.
  useEffect(() => {
    if (!authStore.isAuthenticated || !hasRestaurant) return;
    for (const guard of ROUTE_GUARDS) {
      if (guard.match.test(pathname)) {
        const hasAccess = guard.requireAll
          ? permissionStore.canAll(...guard.abilities)
          : permissionStore.canAny(...guard.abilities);
        if (!hasAccess) {
          Toast.show({ type: 'error', text1: 'Acesso negado' });
          router.replace('/(auth)/dashboard');
          return;
        }
      }
    }
  }, [pathname, authStore.isAuthenticated, hasRestaurant, router]);

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
  if (!hasRestaurant && pathname !== '/config') return null;

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
