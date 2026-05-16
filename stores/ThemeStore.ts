import { makeAutoObservable } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ThemeStore {
  isDark: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.load();
  }

  async load() {
    try {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved !== null) {
        this.isDark = saved === 'dark';
      }
    } catch {}
  }

  toggle() {
    this.isDark = !this.isDark;
    AsyncStorage.setItem('app_theme', this.isDark ? 'dark' : 'light').catch(() => {});
  }
}

export const themeStore = new ThemeStore();
