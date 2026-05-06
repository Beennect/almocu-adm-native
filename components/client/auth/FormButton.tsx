import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, TouchableOpacityProps } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '@/themes/colors';

interface FormButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'social';
  socialIcon?: 'facebook-f' | 'google';
}

export function FormButton({ title, variant = 'primary', socialIcon, style, ...rest }: FormButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';

  const styles = makeStyles(theme.contrast, theme.text, theme.foreground);

  return (
    <TouchableOpacity
      style={[styles.base, isPrimary ? styles.primary : styles.social, style]}
      activeOpacity={0.8}
      {...rest}
    >
      {!isPrimary && socialIcon && (
        <View style={[styles.iconWrap, !title && { marginRight: 0 }]}>
          <FontAwesome5 name={socialIcon} size={16} color={theme.text} />
        </View>
      )}
      {title && (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSocial]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(contrast: string, textColor: string, foreground: string) {
  return StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: 50,
      marginBottom: 12,
      paddingHorizontal: 16,
      // shadow iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      // shadow Android
      elevation: 2,
    },
    primary: {
      backgroundColor: contrast,
    },
    social: {
      backgroundColor: foreground,
    },
    iconWrap: {
      marginRight: 12,
      width: 20,
      alignItems: 'center',
    },
    label: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
    },
    labelPrimary: {
      fontFamily: 'Jost_700Bold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    labelSocial: {
      color: textColor,
    },
  });
}
