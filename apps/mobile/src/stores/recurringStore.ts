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
  fetch: () => Promise<void>;
  add: (data: TCreateRecurring) => Promise<void>;
  update: (id: string, data: TUpdateRecurring) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string, is_active: boolean) => Promise<void>;
};

export const useRecurringStore = create<TRecurringStore>((set, get) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/recurring');
      set({ items: res.data.data.recurring });
    } catch {
      // keep existing
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
}));
