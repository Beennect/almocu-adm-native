import { useAppTheme } from '@/themes/colors';
import { usePathname } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function GenericPlaceholder() {
  const pathname = usePathname();
  const theme = useAppTheme();
  
  // Extrair o nome da página da rota (ex: /dashboard -> Dashboard)
  const pageName = pathname.split('/').pop() || 'Página';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <View className="flex-1 justify-center items-center p-5">
      <Text 
        className="font-jost-bold text-2xl mb-2 text-center"
        style={{ color: theme.text }}
      >
        Essa é a página {formattedName}
      </Text>
      <Text 
        className="font-jost text-base text-center"
        style={{ color: theme.text, opacity: 0.6 }}
      >
        Caminho: {pathname}
      </Text>
    </View>
  );
}
