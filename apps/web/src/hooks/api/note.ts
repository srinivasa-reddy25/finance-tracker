import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { TApiResponse, TTransaction } from '@tejadev/shared'
import { api } from '@/lib/api'

type TTransactionWithId = TTransaction & { _id: string }

type TGetAllResponse = {
  transactions: TTransactionWithId[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

// --- api calls ---

const getAllTransactions = (params?: {
  page?: number
  limit?: number
  category?: string
  month?: string
}): Promise<TApiResponse<TGetAllResponse>> => {
  return api.get('/transactions', { params })
}

const createTransaction = (
  body: Omit<TTransaction, 'user_id' | 'createdAt' | 'updatedAt'>
): Promise<TApiResponse<{ transaction_id: string }>> => {
  return api.post('/transactions', body)
}

const deleteTransactionById = (id: string): Promise<TApiResponse<void>> => {
  return api.delete(`/transactions/${id}`)
}

// --- hooks ---

export const useGetAllTransactions = (params?: {
  page?: number
  limit?: number
  category?: string
  month?: string
}) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => getAllTransactions(params)
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      body: Omit<TTransaction, 'user_id' | 'createdAt' | 'updatedAt'>
    ) => createTransaction(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransactionById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })
}
