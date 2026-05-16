import { Redirect } from "expo-router";
import { authStore } from "../stores/AuthStore";
import { observer } from "mobx-react-lite";

const Index = observer(() => {
  if (!authStore.isInitialized) return null;

  if (authStore.isAuthenticated) {
    return <Redirect href="/(auth)/dashboard" />;
  }

  return <Redirect href="/login" />;
});

export default Index;
