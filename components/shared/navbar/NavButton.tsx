import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface NavButtonProps {
  active?: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  isWeb?: boolean;
}

export function NavButton({ active, onPress, icon, label, isWeb = false }: NavButtonProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme, !!active);

  if (isWeb) {
    return (
      <Pressable 
        onPress={onPress} 
        style={styles.webBtn}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.webLabel}>
          {label}
        </Text>
      </Pressable>
    );
  }

  // Mobile layout
  return (
    <Pressable 
      onPress={onPress}
      style={styles.mobileBtn}
    >
      {icon}
    </Pressable>
  );
}

function makeStyles(theme: any, active: boolean) {
  return StyleSheet.create({
    webBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      marginVertical: 4,
    },
    iconContainer: {
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    webLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      marginLeft: 12,
      color: active ? theme.contrast : theme.text,
      opacity: active ? 1 : 0.6,
    },
    mobileBtn: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
  });
}
