import { create } from 'zustand';
import { api } from '../services/api';
import type { TUserCategory } from '../types/user-category';

type TDeleteResult =
  | { status: 'deleted' }
  | { status: 'needs_confirmation'; transaction_count: number };

type TUpdateData = {
  name?: string;
  icon?: string;
  color?: string;
  bg?: string;
  budget?: number | null;
};

type TApiErrorShape = {
  response?: {
    status?: number;
    data?: { data?: { transaction_count?: number } };
  };
};

type TCategoryStore = {
  categories: TUserCategory[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: {
    name: string;
    icon: string;
    color: string;
    bg: string;
  }) => Promise<string>;
  update: (id: string, data: TUpdateData) => Promise<void>;
  remove: (id: string, migrate?: boolean) => Promise<TDeleteResult>;
  clearError: () => void;
};

export const useCategoryStore = create<TCategoryStore>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/categories');
      // Deduplicate by key in case of any DB inconsistency
      const raw: TUserCategory[] = res.data.data.categories;
      const seen = new Set<string>();
      const unique = raw.filter(c => {
        if (seen.has(c.key)) return false;
        seen.add(c.key);
        return true;
      });
      set({ categories: unique });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load categories';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  add: async data => {
    const res = await api.post('/categories', data);
    await get().fetch();
    return res.data.data.category_id as string;
  },

  update: async (id, data) => {
    await api.patch(`/categories/${id}`, data);
    await get().fetch();
  },

  remove: async (id, migrate = false) => {
    try {
      await api.delete(`/categories/${id}${migrate ? '?migrate=true' : ''}`);
      set(state => ({
        categories: state.categories.filter(c => c._id !== id),
      }));
      return { status: 'deleted' };
    } catch (err: unknown) {
      const apiErr = err as TApiErrorShape;
      const status = apiErr?.response?.status;
      const count = apiErr?.response?.data?.data?.transaction_count;
      if (status === 409 && count !== undefined) {
        return { status: 'needs_confirmation', transaction_count: count };
      }
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
