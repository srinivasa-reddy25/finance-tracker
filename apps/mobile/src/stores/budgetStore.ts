import { create } from 'zustand';
import { api } from '../services/api';
import type { TBudget } from '../types/budget';

type TBudgetStore = {
  budgets: TBudget[];
  loading: boolean;
  fetch: () => Promise<void>;
  upsert: (category: string, amount: number) => Promise<void>;
  remove: (category: string) => Promise<void>;
};

export const useBudgetStore = create<TBudgetStore>((set, get) => ({
  budgets: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/budgets');
      set({ budgets: res.data.data.budgets });
    } catch {
      // keep existing data on network error
    } finally {
      set({ loading: false });
    }
  },

  upsert: async (category, amount) => {
    await api.put(`/budgets/${category}`, { amount });
    await get().fetch();
  },

  remove: async category => {
    await api.delete(`/budgets/${category}`);
    set(state => ({
      budgets: state.budgets.filter(b => b.category !== category),
    }));
  },
}));
