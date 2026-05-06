import React from "react";
import Animated, { useAnimatedStyle, withSpring, useDerivedValue, withTiming, Easing } from 'react-native-reanimated';
import { Pressable, Text, useWindowDimensions, View, ScrollView } from "react-native";
import { observer } from "mobx-react-lite";
import { useAppTheme } from "../../../themes/colors";
import {
  BagIcon,
  LogoPotIcon,
  DashboardIcon,
  CardapioIcon,
  ClocheIcon,
  LockIcon,
  LogOutIcon,
  MoonIcon,
  HomeIcon,
  SearchIcon,
  UserIcon,
  SettingsIcon
} from "../Icons";
import { NavButton } from "./NavButton";
import { navbarStore } from "./NavbarState";

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

  const isWeb = width >= 768;
  const active = navbarStore.activeTab;
  const setActive = (tab: string) => navbarStore.setActiveTab(tab);

  if (isWeb) {
    return (
      <View 
        className="w-[280px] bg-foreground rounded-r-[32px] pt-8 pb-6 px-6 shadow-sm z-10 flex-shrink-0" 
        style={{ height: '100%', borderRightWidth: 1, borderRightColor: '#E5E7EB' }}
      >
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Logo */}
          <View className="flex-row items-center mb-6 pl-2">
            <LogoPotIcon color={theme.contrast} size={36} />
            <Text className="text-primary font-black text-2xl ml-3">Logo</Text>
          </View>
          
          <View className="h-[1px] bg-gray-200 w-full mb-8" />

          {/* Adquiridos Section */}
          <Text style={{ color: '#4B5563', fontSize: 18, fontWeight: 'bold', marginBottom: 24, paddingLeft: 8 }}>
            Adquiridos
          </Text>
          <View className="mb-6 gap-y-1">
            <NavButton
              isWeb
              active={active === "dashboard"}
              onPress={() => setActive("dashboard")}
              label="Dashboard"
              icon={<DashboardIcon color={active === "dashboard" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "cardapio"}
              onPress={() => setActive("cardapio")}
              label="Cardápio"
              icon={<CardapioIcon color={active === "cardapio" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "pedidos"}
              onPress={() => setActive("pedidos")}
              label="Pedidos"
              icon={<BagIcon color={active === "pedidos" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "ingredientes"}
              onPress={() => setActive("ingredientes")}
              label="Ingredientes"
              icon={<ClocheIcon color={active === "ingredientes" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
          </View>

          <View className="h-[1px] bg-gray-200 w-full mb-8" />

          {/* Bloqueados Section */}
          <Text style={{ color: '#4B5563', fontSize: 18, fontWeight: 'bold', marginBottom: 24, paddingLeft: 8 }}>
            Bloqueados
          </Text>
          <View className="gap-y-1">
            <NavButton
              isWeb
              active={active === "chamadas"}
              onPress={() => setActive("chamadas")}
              label="Chamadas"
              icon={<LockIcon color={active === "chamadas" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "item1"}
              onPress={() => setActive("item1")}
              label="Item"
              icon={<LockIcon color={active === "item1" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "item2"}
              onPress={() => setActive("item2")}
              label="Item"
              icon={<LockIcon color={active === "item2" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
            <NavButton
              isWeb
              active={active === "item3"}
              onPress={() => setActive("item3")}
              label="Item"
              icon={<LockIcon color={active === "item3" ? theme.contrast : "#9CA3AF"} size={22} />}
            />
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="pt-6">
          <View className="h-[1px] bg-gray-200 w-full mb-6" />
          <View className="flex-row items-center justify-between">
            <Pressable className="flex-row items-center justify-center bg-[#E6E6E6] py-3 px-6 rounded-2xl flex-1 mr-4 border border-[#D1D5DB] active:opacity-70">
              <LogOutIcon color="#4B5563" size={24} />
              <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: 16, marginLeft: 12 }}>Sair</Text>
            </Pressable>
            <Pressable className="bg-[#E6E6E6] p-3 rounded-2xl items-center justify-center aspect-square border border-[#D1D5DB] active:opacity-70">
              <MoonIcon color="#4B5563" size={24} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Mobile layout
  const iconSize = 28;
  const inactiveColor = "#3D3D3D";

  const activeIndex = TABS.findIndex(t => t.id === active);
  const tabWidth = (width - 16) / TABS.length; // 16 is px-2 padding

  const position = useDerivedValue(() => {
    return withTiming(activeIndex * tabWidth, { 
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1), // Smooth ease-out
    });
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: position.value + 8,
      width: tabWidth,
    };
  });

  return (
    <View 
      className="flex-row items-center bg-[#EDEDED] w-full px-2 shadow-lg relative"
      style={{ height: 72 }}
    >
      {/* Animated Liquid Indicator (Liquid Bridge Effect) */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            backgroundColor: 'white',
            borderRadius: 20, 
            zIndex: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          animatedStyle
        ]} 
      />

      {TABS.map((tab) => (
        <NavButton 
          key={tab.id}
          active={active === tab.id} 
          onPress={() => setActive(tab.id)} 
          label={tab.label} 
          icon={<tab.icon color={active === tab.id ? theme.contrast : inactiveColor} size={iconSize} />} 
        />
      ))}
    </View>
  );
});
