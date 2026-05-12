import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AlmocuIcon, SacIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { background, foreground, contrast, text } = theme;
  const isWebLayout = width >= 768;
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);

  if (isWebLayout) {
    return (
      <View 
        className="flex-1 overflow-hidden"
        style={{ 
          minHeight: Platform.OS === 'web' ? '100vh' : '100%',
          backgroundColor: background
        }}
      >
        {/* Blobs */}
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          className="absolute w-96 h-96 rounded-full opacity-15"
          style={{ top: -480, right: -500 }}
        />
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="absolute w-96 h-96 rounded-full opacity-15"
          style={{ bottom: -480, left: -500 }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-8 pt-6 pb-2 z-10">
          <View className="flex-row items-center">
            <AlmocuIcon color={contrast} size={128} />
          </View>
          <TouchableOpacity 
            className="rounded-full px-7 py-3"
            style={{ backgroundColor: contrast }}
            activeOpacity={0.8}
          >
            <Text className="font-jost-bold text-base text-white">
              Cliente
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card centralizado */}
        <View className="flex-1 items-center justify-center z-10 px-5">
          <View 
            className="rounded-3xl border p-10 w-full max-w-sm shadow-lg"
            style={{ 
              backgroundColor: foreground,
              borderColor: background,
              borderWidth: 1
            }}
          >
            {isLogin ? (
              <LoginForm onToggleForm={toggleForm} />
            ) : (
              <SignUpForm onToggleForm={toggleForm} />
            )}
          </View>
        </View>

        {/* Rodapé SAC */}
        <View className="flex-row items-center justify-end px-8 pb-6 gap-1.5 z-10">
          <SacIcon color={contrast} size={22} />
          <Text className="font-jost-bold text-sm" style={{ color: contrast }}>
            SAC
          </Text>
        </View>
      </View>
    );
  }

  // ── Mobile ──────────────────────────────────────────────
  return (
    <SafeAreaView 
      className="flex-1 px-6 pt-5"
      style={{ backgroundColor: background }}
    >
      <View className="flex-1">
        <View className="flex-row items-center mb-10">
          <AlmocuIcon color={contrast} size={128} />
        </View>

        <View className="flex-1 justify-center pb-20">
          {isLogin ? (
            <LoginForm onToggleForm={toggleForm} />
          ) : (
            <SignUpForm onToggleForm={toggleForm} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
