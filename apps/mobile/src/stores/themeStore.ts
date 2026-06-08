import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TThemeStore = {
  isDark: boolean;
  toggle: () => void;
};

export const useThemeStore = create<TThemeStore>()(
  persist(
    set => ({
      isDark: false,
      toggle: () => set(s => ({ isDark: !s.isDark })),
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
