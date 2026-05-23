import { create } from 'zustand';
import { api } from '../services/api';
import type {
  TTransaction,
  TCreateTransaction,
  TPagination,
} from '../types/transaction';

type TTransactionStore = {
  transactions: TTransaction[];
  pagination: TPagination | null;
  loading: boolean;
  fetch: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    month?: string;
    search?: string;
  }) => Promise<void>;
  add: (data: TCreateTransaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
};

export const useTransactionStore = create<TTransactionStore>((set, get) => ({
  transactions: [],
  pagination: null,
  loading: false,

  fetch: async params => {
    set({ loading: true });
    try {
      const res = await api.get('/transactions', { params });
      set({
        transactions: res.data.data.transactions,
        pagination: res.data.data.pagination,
      });
    } catch {
      // network unavailable — keep existing data, don't crash
    } finally {
      set({ loading: false });
    }
  },

  add: async data => {
    await api.post('/transactions', data);
    get().fetch();
  },

  remove: async id => {
    await api.delete(`/transactions/${id}`);
    set(state => ({
      transactions: state.transactions.filter(t => t._id !== id),
    }));
  },

  reset: () => set({ transactions: [], pagination: null }),
}));
