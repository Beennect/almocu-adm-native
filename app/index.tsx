import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../themes/colors";
import { Navbar } from "../components/shared/navbar/Navbar";
import { navbarStore } from "../components/shared/navbar/NavbarState";
import { PedidosView } from "../components/client/PedidosView";
import { CardapioView } from "../components/client/CardapioView";
import { AddPedidoView } from "../components/client/AddPedidoView";

export default observer(function Home() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { background, foreground } = theme;
  const isWeb = width >= 768;
  const router = useRouter();
  const activeTab = navbarStore.activeTab;

  return (
    <SafeAreaView className={`flex-1 bg-background ${isWeb ? 'flex-row' : 'flex-col'}`} edges={["top"]}>
      {isWeb && <Navbar />}

      <View className="flex-1">
        {/* Main Content Container */}
        <View 
          className="flex-1 overflow-hidden" 
          style={{ 
            backgroundColor: isWeb && (activeTab === 'pedidos' || activeTab === 'cardapio' || activeTab === 'add_pedido') 
              ? 'transparent' 
              : (isWeb || (activeTab !== 'pedidos' && activeTab !== 'cardapio' && activeTab !== 'add_pedido') ? foreground : background),
            marginTop: isWeb ? 16 : 0, 
            marginLeft: isWeb ? 16 : 0,
            marginRight: isWeb ? 16 : 0,
            marginBottom: isWeb ? 16 : 0,
            borderRadius: isWeb && (activeTab === 'pedidos' || activeTab === 'cardapio' || activeTab === 'add_pedido') ? 0 : (isWeb ? 32 : 0),
            padding: isWeb ? (activeTab === 'pedidos' || activeTab === 'cardapio' || activeTab === 'add_pedido' ? 0 : 32) : 16,
          }}
        >
          {activeTab === "pedidos" ? (
            <PedidosView />
          ) : activeTab === "cardapio" ? (
            <CardapioView />
          ) : activeTab === "add_pedido" ? (
            <AddPedidoView />
          ) : (
            <View>
              <Text className="text-primary text-xl font-bold">
                Conteúdo Principal ({activeTab})
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="bg-contrast mt-8 px-8 py-3 rounded-2xl shadow-sm self-start"
              >
                <Text className="text-white font-bold text-base">
                  Ir para Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {!isWeb && (
        <View className="bg-background">
          <Navbar />
        </View>
      )}
    </SafeAreaView>
  );
});
