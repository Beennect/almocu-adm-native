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

const SOCIAL_COLORS: Record<string, string> = {
  'facebook-f': '#1877F2',
  'google': '#DB4437',
};

export function FormButton({ title, variant = 'primary', socialIcon, style, className, ...rest }: FormButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';

  const socialBg = socialIcon ? SOCIAL_COLORS[socialIcon] : undefined;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center h-12 rounded-full mb-3 px-4 shadow-sm elevation-2 ${
        isPrimary ? 'bg-contrast' : ''
      } ${className || ''}`}
      style={[
        style,
        !isPrimary && {
          backgroundColor: socialBg,
        }
      ]}
      activeOpacity={0.8}
      {...rest}
    >
      {!isPrimary && socialIcon && (
        <View style={title ? { marginRight: 12, width: 20, alignItems: 'center' } : {}}>
          <FontAwesome5 name={socialIcon} size={16} color="#FFFFFF" />
        </View>
      )}
      {title && (
        <Text
          className={`text-sm ${
            isPrimary
              ? 'font-[Jost_700Bold] text-white uppercase tracking-[0.5px]'
              : 'font-[Jost_600SemiBold] text-white'
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
