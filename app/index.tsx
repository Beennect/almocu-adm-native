import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Navbar } from "../components/shared/navbar/Navbar";

export default observer(function Home() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {isWeb && <Navbar />}

      <View className="flex-1">
        {/* Test Container for merger effect */}
        <View className="bg-foreground flex-1 rounded-t-3xl p-6 shadow-sm mt-4">
          <Text className="text-primary text-xl font-bold">
            Conteúdo Principal
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
      </View>

      {!isWeb && (
        <View className="bg-background">
          <Navbar />
          <View className="h-10 bg-background" />
        </View>
      )}
    </SafeAreaView>
  );
});