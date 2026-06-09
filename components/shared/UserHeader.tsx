import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MenuIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { socketManager } from '@/services/realtime/socket-manager';

export const UserHeader = observer(() => {
  const theme = useAppTheme();
  const [wsConnected, setWsConnected] = useState(socketManager.connected);

  useEffect(() => {
    return socketManager.onConnectionChange(setWsConnected);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.foreground }]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: wsConnected ? '#4CAF50' : '#ef4444' }]} />
        <Text style={[styles.userName, { color: theme.text }]}>Olá {authStore.firstName.toUpperCase()}</Text>
      </View>
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
  statusRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  userName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
