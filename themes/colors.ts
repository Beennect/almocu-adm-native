import { useColorScheme } from "react-native";

export const colors = {
  light: {
    background: '#e6e6e6',
    foreground: '#f6f6f6',
    contrast: '#ff5f2f',
    text: '#303030'
  },
  dark: {
    background: '#303030',
    foreground: '#3d3d3d',
    contrast: '#ff5f2f',
    text: '#ffffff'
  },
  primary: '#FF5F2F',
};

export function useAppTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}
