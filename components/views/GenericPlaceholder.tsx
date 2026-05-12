import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { useAppTheme } from '@/themes/colors';

export function GenericPlaceholder() {
  const pathname = usePathname();
  const theme = useAppTheme();
  
  // Extrair o nome da página da rota (ex: /dashboard -> Dashboard)
  const pageName = pathname.split('/').filter(Boolean).pop() || 'Página';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Essa é a página {formattedName}</Text>
      <Text style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}>Caminho: {pathname}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});
