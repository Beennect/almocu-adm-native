import React from 'react';
import { TouchableOpacity, Text, View, TouchableOpacityProps } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '@/themes/colors';

interface FormButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'social';
  socialIcon?: 'facebook-f' | 'google';
  className?: string;
}

export function FormButton({ title, variant = 'primary', socialIcon, style, className, ...rest }: FormButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center h-12 rounded-full mb-3 px-4 shadow-sm elevation-2 ${
        isPrimary ? 'bg-contrast' : 'bg-foreground'
      } ${className || ''}`}
      style={style}
      activeOpacity={0.8}
      {...rest}
    >
      {!isPrimary && socialIcon && (
        <View className={`mr-3 w-5 items-center ${!title ? 'mr-0' : ''}`}>
          <FontAwesome5 name={socialIcon} size={16} color={theme.text} />
        </View>
      )}
      {title && (
        <Text 
          className={`text-sm ${
            isPrimary 
              ? 'font-[Jost_700Bold] text-white uppercase tracking-[0.5px]' 
              : 'font-[Jost_600SemiBold] text-text'
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
