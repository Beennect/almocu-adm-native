import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

interface FormInputProps extends TextInputProps {
  Icon?: React.FC<{ color: string; size: number }>;
}

export function FormInput({ Icon, ...rest }: FormInputProps) {
  const theme = useAppTheme();

  return (
    <View 
      className="flex-row items-center rounded-full h-12 px-4 mb-3 shadow-sm"
      style={{ backgroundColor: theme.foreground }}
    >
      {Icon && <Icon color={theme.text} size={20} />}
      <TextInput
        className="flex-1 ml-2.5 text-sm font-jost text-base"
        style={{ color: theme.text, outlineStyle: 'none' }}
        placeholderTextColor="#AAAAAA"
        {...rest}
      />
    </View>
  );
}
