import type { TCategory, TTransactionSource } from '../constants/categories';

export type TTransaction = {
  _id: string;
  user_id: string;
  amount: number;
  description: string;
  category: TCategory;
  note?: string;
  date: string;
  source: TTransactionSource;
  createdAt: string;
};

export type TCreateTransaction = {
  amount: number;
  description: string;
  category: TCategory;
  note?: string;
  date?: string;
  source: TTransactionSource;
};

export type TPagination = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};
