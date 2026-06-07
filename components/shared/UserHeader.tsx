import { observer } from 'mobx-react-lite';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MenuIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';

export const UserHeader = observer(() => {
  const theme = useAppTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.foreground }]}>
      <Text style={[styles.userName, { color: theme.text }]}>Olá {authStore.firstName.toUpperCase()}</Text>
      <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
        <MenuIcon color={theme.text} size={36} opacity={0.8} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    borderRadius: 20,
    paddingHorizontal: 24,
    marginBottom: 32,
    // shadow sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  userName: {
    flex: 1,
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    textAlign: 'center',
    marginLeft: 36, // Compensação para centralizar com o ícone na direita
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
