import { create } from 'zustand';
import type { TTransaction } from '../types/transaction';

type TTransactionModalStore = {
  open: boolean;
  editTarget: TTransaction | null;
  openAdd: () => void;
  openEdit: (tx: TTransaction) => void;
  close: () => void;
};

export const useTransactionModalStore = create<TTransactionModalStore>(set => ({
  open: false,
  editTarget: null,
  openAdd: () => set({ open: true, editTarget: null }),
  openEdit: tx => set({ open: true, editTarget: tx }),
  close: () => set({ open: false, editTarget: null }),
}));
