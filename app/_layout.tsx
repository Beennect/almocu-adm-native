import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Khand_700Bold } from "@expo-google-fonts/khand";
import {
  Jost_400Regular,
  Jost_600SemiBold,
  Jost_700Bold,
} from "@expo-google-fonts/jost";
import { useWindowDimensions, View } from "react-native";
import "./global.css";
import { Navbar } from "@/components/shared/navbar/Navbar";
import { useAppTheme } from "@/themes/colors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Khand_700Bold,
    Jost_400Regular,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const theme = useAppTheme();

  const pathname = usePathname();

  const active = pathname.includes('login') || pathname.includes('register') ? 'auth' : 'app';


  if (!fontsLoaded) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView 
          className="flex-1 bg-background" edges={["top"]}
          style={{ backgroundColor: theme.background }}
        >
          {isWeb ? (
            <View className="flex-1 flex-row">
              {active === 'app' && <Navbar />}
              <View className="flex-1 p-8 items-center">
                <View className="flex-1 w-full max-w-[1200px]">
                  <AppStacks />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-1 px-4 pt-4">
                <AppStacks />
              </View>
              {active === 'app' && <Navbar />}
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function AppStacks() {
  return (
  <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="pedidos" />
      <Stack.Screen name="addPedido" />
      <Stack.Screen name="cardapio" />
      <Stack.Screen name="addItem" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="config" />
      <Stack.Screen name="ingredientes" />
    </Stack>
    <StatusBar style="auto" />
  </>
  )
}
    
    
//className="bg-foreground flex-1 rounded-t-3xl p-6 shadow-sm mt-4"