import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../themes/colors';
import * as Icons from '../shared/Icons';

interface LoginInputProps extends TextInputProps {
  iconName: 'mail' | 'pas';
}

const ICON_MAP = {
  mail: Icons.EmailIcon,
  pas: Icons.KeyIcon,
};

export const LoginInput = ({ iconName, secureTextEntry, ...props }: LoginInputProps) => {
  const theme = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  
  const IconComponent = ICON_MAP[iconName];
  const isPassword = iconName === 'pas' || secureTextEntry;

  return (
    <View className="flex-row items-center bg-foreground px-5 py-4 rounded-3xl mb-4">
      {IconComponent && <IconComponent size={20} color={theme.text} />}
      <TextInput
        placeholderTextColor={theme.text}
        className="flex-1 ml-3 text-primary text-base"
        secureTextEntry={isPassword && !showPassword}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <Icons.EyeOffIcon size={20} color={theme.text} />
          ) : (
            <Icons.EyeIcon size={20} color={theme.text} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};


