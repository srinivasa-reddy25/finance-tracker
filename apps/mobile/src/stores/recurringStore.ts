import { create } from 'zustand';
import { api } from '../services/api';
import type {
  TCreateRecurring,
  TRecurringTransaction,
} from '../types/recurring';

type TUpdateRecurring = Partial<TCreateRecurring> & { is_active?: boolean };

type TRecurringStore = {
  items: TRecurringTransaction[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: TCreateRecurring) => Promise<void>;
  update: (id: string, data: TUpdateRecurring) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string, is_active: boolean) => Promise<void>;
  clearError: () => void;
};

export const useRecurringStore = create<TRecurringStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/recurring');
      set({ items: res.data.data.recurring });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load recurring transactions';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  add: async data => {
    await api.post('/recurring', data);
    await get().fetch();
  },

  update: async (id, data) => {
    await api.patch(`/recurring/${id}`, data);
    await get().fetch();
  },

  remove: async id => {
    await api.delete(`/recurring/${id}`);
    set(s => ({ items: s.items.filter(i => i._id !== id) }));
  },

  toggle: async (id, is_active) => {
    await api.patch(`/recurring/${id}`, { is_active });
    set(s => ({
      items: s.items.map(i => (i._id === id ? { ...i, is_active } : i)),
    }));
  },

  clearError: () => set({ error: null }),
}));
