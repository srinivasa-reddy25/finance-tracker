import { create } from 'zustand';
import { api } from '../services/api';
import type { TUserCategory } from '../types/user-category';

type TCategoryStore = {
  categories: TUserCategory[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (data: {
    name: string;
    icon: string;
    color: string;
    bg: string;
  }) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useCategoryStore = create<TCategoryStore>((set, get) => ({
  categories: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/categories');
      set({ categories: res.data.data.categories });
    } catch {
      // keep existing data on network error
    } finally {
      set({ loading: false });
    }
  },

  add: async data => {
    await api.post('/categories', data);
    await get().fetch();
  },

  remove: async id => {
    await api.delete(`/categories/${id}`);
    set(state => ({
      categories: state.categories.filter(c => c._id !== id),
    }));
  },
}));
