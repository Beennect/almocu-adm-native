import { usePathname, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
    SettingsIcon
} from "../Icons";
import { NavButton } from "./NavButton";

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'cardapio', label: 'Cardápio', icon: CardapioIcon },
  { id: 'pedidos', label: 'Pedidos', icon: BagIcon },
  { id: 'ingredientes', label: 'Ingredientes', icon: ClocheIcon },
  { id: 'config', label: 'Config', icon: SettingsIcon },
];

export const Navbar = observer(function Navbar() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isWeb = width >= 768;
  
  // Logic to determine active tab from pathname
  const active = pathname.includes('cardapio') ? 'cardapio' : 
                 pathname.includes('pedidos') ? 'pedidos' : 
                 pathname.includes('dashboard') ? 'dashboard' : 
                 pathname.includes('ingredientes') ? 'ingredientes' : 
                 pathname.includes('config') ? 'config' : 'pedidos';

  const setActive = (tab: string) => {
    router.push(`/(auth)/${tab}` as any);
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
          <Text style={styles.sectionTitle}>
            Adquiridos
          </Text>
          <View style={styles.navGroup}>
            <NavButton
              isWeb
              active={active === "dashboard"}
              onPress={() => setActive("dashboard")}
              label="Dashboard"
              icon={<DashboardIcon color={active === "dashboard" ? theme.contrast : theme.text} opacity={active === "dashboard" ? 1 : 0.4} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "cardapio"}
              onPress={() => setActive("cardapio")}
              label="Cardápio"
              icon={<CardapioIcon color={active === "cardapio" ? theme.contrast : theme.text} opacity={active === "cardapio" ? 1 : 0.4} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "pedidos"}
              onPress={() => setActive("pedidos")}
              label="Pedidos"
              icon={<BagIcon color={active === "pedidos" ? theme.contrast : theme.text} opacity={active === "pedidos" ? 1 : 0.4} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "ingredientes"}
              onPress={() => setActive("ingredientes")}
              label="Ingredientes"
              icon={<ClocheIcon color={active === "ingredientes" ? theme.contrast : theme.text} opacity={active === "ingredientes" ? 1 : 0.4} size={22} />}
            />
          </View>

          <View style={styles.divider} />

          {/* Bloqueados Section */}
          <Text style={styles.sectionTitle}>
            Bloqueados
          </Text>
          <View style={styles.navGroup}>
            {[1, 2, 3, 4].map((i) => (
              <NavButton
                key={i}
                isWeb
                active={false}
                onPress={() => {}}
                label="Bloqueado"
                icon={<LockIcon color={theme.text} opacity={0.3} size={22} />}
              />
            ))}
          </View>
        </ScrollView>

        
        {/* Bottom Actions */}
        <View>
          <View style={styles.divider} />
          <View style={styles.footerButtons}>
            <Pressable style={styles.logoutBtn}>
              <LogOutIcon color={theme.text} opacity={0.7} size={24} />
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
            <Pressable style={styles.themeBtn}>
              <MoonIcon color={theme.text} opacity={0.7} size={24} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Mobile layout
  const iconSize = 28;
  const activeIndex = TABS.findIndex(t => t.id === active);
  const tabWidth = (width - 16) / TABS.length; // 16 is px-2 padding

  const position = useDerivedValue(() => {
    return withTiming(activeIndex * tabWidth, { 
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

      {TABS.map((tab) => (
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
      justifyContent: 'space-between',
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
