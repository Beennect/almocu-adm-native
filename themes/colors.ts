import { autorun } from 'mobx';
import { useEffect, useState } from 'react';
import { themeStore } from '@/stores/ThemeStore';

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
  const [isDark, setIsDark] = useState(themeStore.isDark);

  useEffect(() => {
    // autorun re-runs whenever themeStore.isDark changes, triggering re-render
    const dispose = autorun(() => {
      setIsDark(themeStore.isDark);
    });
    return dispose;
  }, []);

  return isDark ? colors.dark : colors.light;
}
