import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface FormInputProps extends TextInputProps {
  Icon?: React.FC<{ color: string; size: number }>;
  className?: string;
}

export function FormInput({ Icon, className, style, ...rest }: FormInputProps) {
  const theme = useAppTheme();

  return (
    <View 
      className={`flex-row items-center bg-foreground rounded-full h-12 px-4 mb-3 shadow-sm elevation-2 ${className || ''}`}
      style={style}
    >
      {Icon && <Icon color={theme.text} size={20} />}
      <TextInput
        className="flex-1 font-[Jost_400Regular] text-sm text-text ml-2.5 outline-none"
        placeholderTextColor="#AAAAAA"
        {...rest}
      />
    </View>
  );
}
