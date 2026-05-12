import React from 'react';
import { TouchableOpacity, Text, View, TouchableOpacityProps } from 'react-native';
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

  const getContainerStyle = () => {
    if (isPrimary) {
      return { backgroundColor: theme.contrast };
    }
    return { backgroundColor: theme.foreground };
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center h-12 rounded-full mb-3 px-4 shadow-sm"
      style={[getContainerStyle(), style]}
      activeOpacity={0.8}
      {...rest}
    >
      {!isPrimary && socialIcon && (
        <View className={[!title ? '' : 'mr-3', 'w-5 items-center'].join(' ')}>
          <FontAwesome5 name={socialIcon} size={16} color={theme.text} />
        </View>
      )}
      {title && (
        <Text 
          className={`text-sm font-jost-bold tracking-wide ${
            isPrimary 
              ? 'text-white uppercase' 
              : 'text-base'
          }`}
          style={{ color: isPrimary ? '#FFFFFF' : theme.text }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
