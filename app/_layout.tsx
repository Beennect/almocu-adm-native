import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  let session = params.get('session');
  
  if (session) {
    window.sessionStorage.setItem('active_session', session);
  } else {
    session = window.sessionStorage.getItem('active_session');
  }
  
  if (session) {
    const prefix = `session_${session}_`;
    const originalLocalStorage = window.localStorage;
    
    const partitionedLocalStorage = {
      getItem(key: string) {
        if (key === 'user' || key === 'isAuthenticated') {
          return originalLocalStorage.getItem(prefix + key);
        }
        return originalLocalStorage.getItem(key);
      },
      setItem(key: string, value: string) {
        if (key === 'user' || key === 'isAuthenticated') {
          originalLocalStorage.setItem(prefix + key, value);
        } else {
          originalLocalStorage.setItem(key, value);
        }
      },
      removeItem(key: string) {
        if (key === 'user' || key === 'isAuthenticated') {
          originalLocalStorage.removeItem(prefix + key);
        } else {
          originalLocalStorage.removeItem(key);
        }
      },
      clear() {
        originalLocalStorage.removeItem(prefix + 'user');
        originalLocalStorage.removeItem(prefix + 'isAuthenticated');
      },
      key(index: number) {
        return originalLocalStorage.key(index);
      },
      get length() {
        return originalLocalStorage.length;
      }
    };
    
    try {
      Object.defineProperty(window, 'localStorage', {
        value: partitionedLocalStorage,
        writable: true,
        configurable: true
      });
      console.log(`[Almocu Multi-Session] Active session: ${session}`);
    } catch (e) {
      console.error("[Almocu Multi-Session] Failed to override localStorage", e);
    }
  }
}

import {
  Jost_400Regular,
  Jost_600SemiBold,
  Jost_700Bold,
} from "@expo-google-fonts/jost";
import { Khand_700Bold, useFonts } from "@expo-google-fonts/khand";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import { Toast } from "@/components/shared/Toast";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Khand_700Bold,
    Jost_400Regular,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(auth)" />
        </Stack>
        <Toast />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
