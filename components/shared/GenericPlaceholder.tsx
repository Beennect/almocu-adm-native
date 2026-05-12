import { useAppTheme } from '@/themes/colors';
import { usePathname } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export function GenericPlaceholder() {
  const pathname = usePathname();
  const theme = useAppTheme();
  
  // Extrair o nome da página da rota (ex: /dashboard -> Dashboard)
  const pageName = pathname.split('/').filter(Boolean).pop() || 'Página';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <View className="flex-1 justify-center items-center px-5">
      <Text className="text-2xl font-[Jost_700Bold] text-center mb-2" style={{ color: theme.text }}>
        Essa é a página {formattedName}
      </Text>
      <Text className="text-base font-[Jost_400Regular] text-center" style={{ color: theme.text, opacity: 0.6 }}>
        Caminho: {pathname}
      </Text>
    </View>
  );
}
