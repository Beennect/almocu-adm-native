import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';
import { permissionStore } from '@/stores/PermissionStore';
import { uiStore } from '@/stores/UiStore';
import { PowerBIIframe } from '@/components/powerbi/PowerBIIframe';
import { POWERBI_DASHBOARD_URL } from '@/config/powerbi';
import { MenuIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';

export default observer(function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();

  useEffect(() => {
    if (!permissionStore.can('dashboard:view')) {
      router.replace('/(auth)');
    }
  }, []);

  useEffect(() => {
    uiStore.setSidebarCollapsed(true);
    return () => {
      uiStore.setSidebarCollapsed(false);
    };
  }, []);

  return (
    <View style={styles.container}>
      <PowerBIIframe uri={POWERBI_DASHBOARD_URL} />
      {isWeb && (
        <Pressable
          style={[styles.floatingBtn, { backgroundColor: theme.foreground }]}
          onPress={() => uiStore.toggleSidebar()}
        >
          <MenuIcon color={theme.text} size={24} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
