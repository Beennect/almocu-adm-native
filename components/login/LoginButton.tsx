import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface LoginButtonProps extends TouchableOpacityProps {
  title: string;
}

export const LoginButton = ({ title, ...props }: LoginButtonProps) => {
  return (
    <TouchableOpacity
      className="bg-contrast py-4 px-8 rounded-3xl items-center justify-center shadow-sm active:opacity-80"
      {...props}
    >
      <Text className="text-white font-bold text-lg uppercase tracking-wider">
        {title}
      </Text>
    </TouchableOpacity>
  );
};
