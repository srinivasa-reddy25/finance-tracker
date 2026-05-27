import { create } from 'zustand';
import { api } from '../services/api';
import type {
  TTransaction,
  TCreateTransaction,
  TPagination,
} from '../types/transaction';

type TFetchParams = {
  page?: number;
  limit?: number;
  category?: string;
  month?: string;
  search?: string;
  from?: string;
  to?: string;
};

type TTransactionStore = {
  transactions: TTransaction[];
  pagination: TPagination | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  fetch: (params?: TFetchParams) => Promise<void>;
  fetchMore: (params?: TFetchParams) => Promise<void>;
  add: (data: TCreateTransaction) => Promise<void>;
  update: (id: string, data: Partial<TCreateTransaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
};

export const useTransactionStore = create<TTransactionStore>((set, get) => ({
  transactions: [],
  pagination: null,
  loading: false,
  loadingMore: false,
  error: null,

  fetch: async params => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/transactions', { params });
      set({
        transactions: res.data.data.transactions,
        pagination: res.data.data.pagination,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load transactions';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMore: async params => {
    const { pagination, loadingMore } = get();
    if (loadingMore) return;
    if (!pagination || pagination.page >= pagination.total_pages) return;
    set({ loadingMore: true });
    try {
      const res = await api.get('/transactions', {
        params: { ...params, page: pagination.page + 1 },
      });
      set(state => ({
        transactions: [...state.transactions, ...res.data.data.transactions],
        pagination: res.data.data.pagination,
      }));
    } catch {
      // Silently ignore load-more failures — user can scroll up and back to retry
    } finally {
      set({ loadingMore: false });
    }
  },

  add: async data => {
    await api.post('/transactions', data);
    await get().fetch();
  },

  update: async (id, data) => {
    await api.patch(`/transactions/${id}`, data);
    set(state => ({
      transactions: state.transactions.map(t =>
        t._id === id ? { ...t, ...data } : t,
      ),
    }));
  },

  remove: async id => {
    await api.delete(`/transactions/${id}`);
    set(state => ({
      transactions: state.transactions.filter(t => t._id !== id),
    }));
  },

  reset: () => set({ transactions: [], pagination: null, error: null }),

  clearError: () => set({ error: null }),
}));
