import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/themes/colors';
import { MenuIcon } from '../shared/Icons';

interface UserHeaderProps {
  userName: string;
  onMenuPress?: () => void;
}

export function UserHeader({ userName, onMenuPress }: UserHeaderProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme.text);

  return (
    <View style={styles.container}>
      <Text style={styles.userText}>Olá {userName}</Text>
      <TouchableOpacity 
        style={styles.menuBtn} 
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <MenuIcon color="#3D3D3D" size={44} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(textColor: string) {
  return StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 50,
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      marginBottom: 20,
      position: 'relative',
      // shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    userText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: textColor,
      textTransform: 'uppercase',
    },
    menuBtn: {
      position: 'absolute',
      right: 10,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
