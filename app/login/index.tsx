import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { SacIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import { AlmocuIcon } from '@/components/shared/Icons';

export default function Login() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { contrast } = theme;
  const isWebLayout = width >= 768;
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => setIsLogin(!isLogin);

  if (isWebLayout) {
    return (
      <View className="flex-1 bg-background overflow-hidden">
        {/* Blobs */}
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          className="absolute w-[1000px] h-[860px] rounded-[500px] opacity-[0.15] top-[-480px] right-[-500px]"
        />
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="absolute w-[1000px] h-[860px] rounded-[500px] opacity-[0.15] bottom-[-480px] left-[-500px]"
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-8 pt-6 pb-2 z-10">
          <View className="flex-row items-center">
            <AlmocuIcon color={contrast} size={128} />
          </View>
          <TouchableOpacity className="bg-contrast rounded-full px-7 py-3" activeOpacity={0.8}>
            <Text className="font-[Jost_700Bold] text-white text-[15px]">Cliente</Text>
          </TouchableOpacity>
        </View>

        {/* Card centralizado */}
        <View className="flex-1 items-center justify-center z-10 px-5">
          <View className="bg-foreground rounded-[30px] border border-background py-10 px-9 w-full max-w-[440px] shadow-2xl elevation-5">
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
          <Text className="font-[Jost_700Bold] text-contrast text-sm">SAC</Text>
        </View>
      </View>
    );
  }

  // ── Mobile ──────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background px-6 pt-5">
      <View className="flex-1">
        <View className="flex-row items-center mb-[60px]">
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
