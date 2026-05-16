import { usePathname, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ConfirmModal } from "../ConfirmModal";
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useAppTheme } from "../../../themes/colors";
import {
    AlmocuIcon,
    BagIcon,
    CardapioIcon,
    ClocheIcon,
    DashboardIcon,
    LockIcon,
    LogOutIcon,
    MoonIcon,
    SettingsIcon,
    SunIcon,
    FileTextIcon,
    ShieldCheckIcon,
    PinIcon,
    FoodStoreIcon
} from "../Icons";
import { themeStore } from "../../../stores/ThemeStore";
import { authStore } from "../../../stores/AuthStore";
import { dataStore } from "../../../stores/DataStore";
import { NavButton } from "./NavButton";

const ICON_COMPONENTS: Record<string, React.FC<any>> = {
  DashboardIcon,
  CardapioIcon,
  BagIcon, // pedidos
  ClocheIcon, // ingredientes
  FileTextIcon, // financeiro
  ShieldCheckIcon, // fidelidade
  PinIcon, // mesas
  FoodStoreIcon, // delivery
  SettingsIcon,
};

export const Navbar = observer(function Navbar() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isWeb = width >= 768;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const allModules = dataStore.modules || [];
  const activeRole = authStore.activeRole;
  const hasRestaurant = !!authStore.user?.restaurantId;
  
  // Active acquired modules filtered by role permissions
  const activeModules = allModules.filter(m => {
    if (!hasRestaurant || activeRole === 'INDEFINIDO') return false;
    
    if (activeRole === 'GARCOM') {
      return m.id === 'cardapio' || m.id === 'pedidos';
    }
    
    if (activeRole === 'COZINHA') {
      return m.id === 'pedidos' || m.id === 'ingredientes' || m.id === 'cardapio';
    }
    
    return m.acquired && m.showInNavbar;
  });

  const blockedModules = activeRole === 'GERENTE' 
    ? allModules.filter(m => !m.acquired) 
    : [];

  // Logic to determine active tab from pathname
  let active = 'config';
  for (const m of allModules) {
    if (pathname.includes(m.id)) {
      active = m.id;
      break;
    }
  }
  if (pathname.includes('/config')) {
    active = 'config';
  }

  const setActive = (tab: string) => {
    if (tab === 'config') {
      router.push('/(auth)/config' as any);
    } else {
      router.push(`/(auth)/${tab}` as any);
    }
  };

  const handleLogout = () => {
    authStore.logout();
    router.replace('/login');
  };

  const styles = makeStyles(theme, isWeb);

  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <AlmocuIcon color={theme.contrast} size={128} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.divider } />
          
          {/* Adquiridos Section */}
          <Text style={styles.sectionTitle}>Adquiridos</Text>
          <View style={styles.navGroup}>
            {activeModules.map(module => {
              const IconComp = ICON_COMPONENTS[module.icon] || DashboardIcon;
              const isActiveTab = active === module.id;
              return (
                <NavButton
                  key={module.id}
                  isWeb
                  active={isActiveTab}
                  onPress={() => setActive(module.id)}
                  label={module.name}
                  icon={
                    <IconComp 
                      color={isActiveTab ? theme.contrast : theme.text} 
                      opacity={isActiveTab ? 1 : 0.4} 
                      size={22} 
                    />
                  }
                />
              );
            })}
          </View>

          {blockedModules.length > 0 && (
            <>
              <View style={styles.divider} />
              {/* Bloqueados Section */}
              <Text style={styles.sectionTitle}>Bloqueados</Text>
              <View style={styles.navGroup}>
                {blockedModules.map((module) => {
                  const IconComp = ICON_COMPONENTS[module.icon] || DashboardIcon;
                  return (
                    <NavButton
                      key={module.id}
                      isWeb
                      active={false}
                      onPress={() => router.push(`/(auth)/modulos/${module.id}` as any)}
                      label={module.name}
                      icon={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <IconComp color={theme.text} opacity={0.3} size={22} />
                          <LockIcon color={theme.contrast} opacity={0.7} size={12} />
                        </View>
                      }
                    />
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View>
          <View style={styles.divider} />
          <View style={styles.footerButtons}>
            <Pressable style={styles.footerBtn} onPress={() => setShowLogoutConfirm(true)}>
              <LogOutIcon color={theme.text} opacity={0.7} size={22} />
              <Text style={styles.footerBtnText}>Sair</Text>
            </Pressable>
            <Pressable
              style={[styles.footerBtn, active === 'config' && { backgroundColor: theme.contrast + '22' }]}
              onPress={() => setActive('config')}
            >
              <SettingsIcon color={active === 'config' ? theme.contrast : theme.text} opacity={active === 'config' ? 1 : 0.7} size={22} />
              <Text style={[styles.footerBtnText, active === 'config' && { color: theme.contrast, opacity: 1 }]}>Config</Text>
            </Pressable>
            <Pressable style={styles.footerBtn} onPress={() => themeStore.toggle()}>
              {themeStore.isDark
                ? <SunIcon color={theme.text} opacity={0.7} size={22} />
                : <MoonIcon color={theme.text} opacity={0.7} size={22} />
              }
              <Text style={styles.footerBtnText}>{themeStore.isDark ? 'Claro' : 'Escuro'}</Text>
            </Pressable>
          </View>
        </View>

        <ConfirmModal
          visible={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          title="Sair da Conta"
          message="Tem certeza que deseja encerrar sua sessão?"
          confirmText="Sair"
        />
      </View>
    );
  }

  // Mobile navigation tabs definition
  const mobileTabs = [
    ...activeModules.map(m => ({
      id: m.id,
      label: m.name,
      icon: ICON_COMPONENTS[m.icon] || DashboardIcon,
    })),
    { id: 'config', label: 'Ajustes', icon: SettingsIcon },
  ];

  const iconSize = 24;
  const activeIndex = mobileTabs.findIndex(t => t.id === active);
  
  // Safeguard index fallback
  const safeActiveIndex = activeIndex === -1 ? mobileTabs.length - 1 : activeIndex;
  const tabWidth = (width - 16) / mobileTabs.length; 

  const position = useDerivedValue(() => {
    return withTiming(safeActiveIndex * tabWidth, { 
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: position.value + 8,
      width: tabWidth,
    };
  });

  return (
    <View style={[styles.mobileContainer, { backgroundColor: theme.background }]}>
      {/* Animated Liquid Indicator */}
      <Animated.View 
        style={[
          styles.mobileIndicator,
          { backgroundColor: theme.foreground },
          animatedStyle
        ]} 
      />

      {mobileTabs.map((tab) => (
        <NavButton 
          key={tab.id}
          active={active === tab.id} 
          onPress={() => setActive(tab.id)} 
          label={tab.label} 
          icon={<tab.icon color={active === tab.id ? theme.contrast : theme.text} opacity={active === tab.id ? 1 : 0.5} size={iconSize} />} 
        />
      ))}
    </View>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    webContainer: {
      width: 280,
      backgroundColor: theme.foreground,
      borderTopRightRadius: 32,
      borderBottomRightRadius: 32,
      paddingTop: 32,
      paddingBottom: 24,
      paddingHorizontal: 24,
      height: '100%',
      borderRightWidth: 1,
      borderColor: theme.background,
      zIndex: 10,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingLeft: 8,
    },
    logoText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: theme.contrast,
      marginLeft: 12,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background,
      width: '100%',
      marginBottom: 32,
    },
    sectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
      marginBottom: 24,
      paddingLeft: 8,
      opacity: 0.8,
    },
    navGroup: {
      marginBottom: 24,
      gap: 4,
    },
    footerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    footerBtn: {
      flex: 1,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      borderRadius: 16,
      gap: 4,
    },
    footerBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 11,
      color: theme.text,
      opacity: 0.7,
    },
    logoutBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      paddingVertical: 12,
      borderRadius: 16,
      marginRight: 16,
    },
    logoutText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
      opacity: 0.8,
    },
    themeBtn: {
      backgroundColor: theme.background,
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mobileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 8,
      height: 70,
      position: 'relative',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    mobileIndicator: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      borderBottomLeftRadius: 20, 
      borderBottomRightRadius: 20, 
      zIndex: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });
}
