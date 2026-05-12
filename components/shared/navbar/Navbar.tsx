import { usePathname, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
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

  if (isWeb) {
    return (
      <View className="w-[280px] bg-foreground rounded-tr-[32px] rounded-br-[32px] pt-8 pb-6 px-6 h-full border-r border-background z-10">
        {/* Logo */}
        <View className="flex-row items-center mb-6 pl-2">
          <AlmocuIcon color={theme.contrast} size={128} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="h-[1px] bg-background w-full mb-8" />
          {/* Adquiridos Section */}
          <Text className="font-[Jost_700Bold] text-lg text-text mb-6 pl-2 opacity-80">
            Adquiridos
          </Text>
          <View className="mb-6 gap-1">
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

          <View className="h-[1px] bg-background w-full mb-8" />

          {/* Bloqueados Section */}
          <Text className="font-[Jost_700Bold] text-lg text-text mb-6 pl-2 opacity-80">
            Bloqueados
          </Text>
          <View className="mb-6 gap-1">
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
          <View className="h-[1px] bg-background w-full mb-8" />
          <View className="flex-row items-center justify-between">
            <Pressable className="flex-1 flex-row items-center justify-center bg-background py-3 rounded-[16px] mr-4">
              <LogOutIcon color={theme.text} opacity={0.7} size={24} />
              <Text className="font-[Jost_700Bold] text-base text-text ml-3 opacity-80">Sair</Text>
            </Pressable>
            <Pressable className="bg-background w-12 h-12 rounded-[16px] items-center justify-center">
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
    <View className="flex-row items-center w-full px-2 h-[70px] relative rounded-t-[24px]" style={{ backgroundColor: theme.background }}>
      {/* Animated Liquid Indicator */}
      <Animated.View 
        className="absolute top-0 bottom-0 rounded-b-[20px] z-0 shadow-sm elevation-3"
        style={[
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
