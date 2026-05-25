import { create } from 'zustand';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

type TAuthStore = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  overallBudget: number | null;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setLoading: (loading: boolean) => void;
  setOverallBudget: (budget: number | null) => void;
};

export const useAuthStore = create<TAuthStore>(set => ({
  user: null,
  loading: true,
  overallBudget: null,
  setUser: user => set({ user }),
  setLoading: loading => set({ loading }),
  setOverallBudget: budget => set({ overallBudget: budget }),
}));
