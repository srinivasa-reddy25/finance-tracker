import { create } from 'zustand';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

type TAuthStore = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<TAuthStore>(set => ({
  user: null,
  loading: true,
  setUser: user => set({ user }),
  setLoading: loading => set({ loading }),
}));
