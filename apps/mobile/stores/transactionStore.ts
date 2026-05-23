import { create } from 'zustand'

import type { TCategory, TTransactionSource } from '../constants/categories'
import { api } from '../services/api'

export type TTransaction = {
  _id: string
  user_id: string
  amount: number
  description: string
  category: TCategory
  note?: string
  date: string
  source: TTransactionSource
  createdAt: string
}

type TPagination = {
  total: number
  page: number
  limit: number
  total_pages: number
}

type TTransactionStore = {
  transactions: TTransaction[]
  pagination: TPagination | null
  loading: boolean
  fetch: (params?: {
    page?: number
    category?: string
    month?: string
  }) => Promise<void>
  add: (
    data: Omit<TTransaction, '_id' | 'user_id' | 'createdAt'>
  ) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTransactionStore = create<TTransactionStore>((set, get) => ({
  transactions: [],
  pagination: null,
  loading: false,

  fetch: async (params) => {
    set({ loading: true })
    try {
      const res = await api.get('/transactions', { params })
      set({
        transactions: res.data.data.transactions,
        pagination: res.data.data.pagination
      })
    } finally {
      set({ loading: false })
    }
  },

  add: async (data) => {
    await api.post('/transactions', data)
    get().fetch()
  },

  remove: async (id) => {
    await api.delete(`/transactions/${id}`)
    set((state) => ({
      transactions: state.transactions.filter((t) => t._id !== id)
    }))
  }
}))
