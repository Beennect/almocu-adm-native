import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { authStore } from '@/stores/AuthStore';
import { useAppTheme } from '@/themes/colors';

function restoreSessionPartition() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const session = window.sessionStorage.getItem('active_session');
  if (!session) return;

  const prefix = `session_${session}_`;
  const original = window.localStorage;
  const partKeys = new Set(['user', 'isAuthenticated']);

  const partitioned = {
    getItem(key: string) {
      return partKeys.has(key) ? original.getItem(prefix + key) : original.getItem(key);
    },
    setItem(key: string, value: string) {
      if (partKeys.has(key)) original.setItem(prefix + key, value);
      else original.setItem(key, value);
    },
    removeItem(key: string) {
      if (partKeys.has(key)) original.removeItem(prefix + key);
      else original.removeItem(key);
    },
    clear() {
      original.removeItem(prefix + 'user');
      original.removeItem(prefix + 'isAuthenticated');
    },
    key(index: number) {
      return original.key(index);
    },
    get length() {
      return original.length;
    },
  };

  try {
    Object.defineProperty(window, 'localStorage', {
      value: partitioned,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    console.error('[oauth-callback] Failed to restore session partition', e);
  }
}

const OauthCallback = observer(function OauthCallback() {
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const handled = useRef(false);
  const [state, setState] = useState<'processing' | 'ready'>('processing');

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = Array.isArray(params.token) ? params.token[0] : params.token;
    const error = Array.isArray(params.error) ? params.error[0] : params.error;

    if (error) {
      Toast.show({ type: 'error', text1: 'Erro no login social', text2: error });
      setState('ready');
      return;
    }

    if (!token) {
      Toast.show({ type: 'error', text1: 'Token não recebido do provedor' });
      setState('ready');
      return;
    }

    restoreSessionPartition();

    authStore
      .loginWithToken(token)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Login realizado com sucesso!' });
        router.replace('/(auth)/dashboard');
      })
      .catch((err) => {
        console.error('[oauth-callback] loginWithToken failed', err);
        Toast.show({
          type: 'error',
          text1: 'Sessão inválida ou expirada',
          text2: 'Tente novamente.',
        });
        router.replace('/login');
      });
  }, [params.token, params.error, router]);

  if (state === 'ready' && !authStore.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (authStore.isAuthenticated) {
    return <Redirect href="/(auth)/dashboard" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.contrast} />
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default OauthCallback;
