import { act } from 'react';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { api } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('transactionStore', () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [],
      pagination: null,
      loading: false,
      loadingMore: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('fetch', () => {
    it('loads transactions on success', async () => {
      const mockTransactions = [
        {
          _id: '1',
          amount: 100,
          description: 'Food',
          category: 'food',
          date: new Date().toISOString(),
          source: 'manual',
          user_id: 'u1',
          createdAt: new Date().toISOString(),
        },
      ];
      const mockPagination = { total: 1, page: 1, limit: 10, total_pages: 1 };

      mockApi.get.mockResolvedValueOnce({
        data: {
          data: { transactions: mockTransactions, pagination: mockPagination },
        },
      });

      await act(async () => {
        await useTransactionStore.getState().fetch();
      });

      const state = useTransactionStore.getState();
      expect(state.transactions).toEqual(mockTransactions);
      expect(state.pagination).toEqual(mockPagination);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on failure', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await useTransactionStore.getState().fetch();
      });

      const state = useTransactionStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });

    it('keeps existing transactions when fetch fails', async () => {
      const existing = [
        {
          _id: '1',
          amount: 100,
          description: 'Existing',
          category: 'food',
          date: new Date().toISOString(),
          source: 'manual',
          user_id: 'u1',
          createdAt: new Date().toISOString(),
        },
      ];
      useTransactionStore.setState({ transactions: existing });

      mockApi.get.mockRejectedValueOnce(new Error('Offline'));

      await act(async () => {
        await useTransactionStore.getState().fetch();
      });

      expect(useTransactionStore.getState().transactions).toEqual(existing);
    });
  });

  describe('add', () => {
    it('calls API and refreshes transactions', async () => {
      mockApi.post.mockResolvedValueOnce({ data: {} });
      mockApi.get.mockResolvedValueOnce({
        data: { data: { transactions: [], pagination: null } },
      });

      await act(async () => {
        await useTransactionStore.getState().add({
          amount: 150,
          description: 'Test',
          category: 'food',
          source: 'manual',
        });
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/transactions',
        expect.objectContaining({ amount: 150 }),
      );
    });

    it('throws on API failure so caller can handle it', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Server error'));

      await expect(
        act(async () => {
          await useTransactionStore.getState().add({
            amount: 150,
            description: 'Test',
            category: 'food',
            source: 'manual',
          });
        }),
      ).rejects.toThrow('Server error');
    });
  });

  describe('update', () => {
    it('patches optimistically', async () => {
      useTransactionStore.setState({
        transactions: [
          {
            _id: 'tx1',
            amount: 100,
            description: 'Old',
            category: 'food',
            date: new Date().toISOString(),
            source: 'manual',
            user_id: 'u1',
            createdAt: new Date().toISOString(),
          },
        ],
      });
      mockApi.patch.mockResolvedValueOnce({ data: {} });

      await act(async () => {
        await useTransactionStore
          .getState()
          .update('tx1', { description: 'New' });
      });

      expect(useTransactionStore.getState().transactions[0].description).toBe(
        'New',
      );
    });
  });

  describe('remove', () => {
    it('removes the transaction optimistically', async () => {
      useTransactionStore.setState({
        transactions: [
          {
            _id: 'tx1',
            amount: 100,
            description: 'Test',
            category: 'food',
            date: new Date().toISOString(),
            source: 'manual',
            user_id: 'u1',
            createdAt: new Date().toISOString(),
          },
        ],
      });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      await act(async () => {
        await useTransactionStore.getState().remove('tx1');
      });

      expect(useTransactionStore.getState().transactions).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('clears transactions, pagination, and error', () => {
      useTransactionStore.setState({
        transactions: [{ _id: '1' } as never],
        pagination: { total: 1, page: 1, limit: 10, total_pages: 1 },
        error: 'Some error',
      });

      useTransactionStore.getState().reset();

      const state = useTransactionStore.getState();
      expect(state.transactions).toEqual([]);
      expect(state.pagination).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error field', () => {
      useTransactionStore.setState({ error: 'Something went wrong' });
      useTransactionStore.getState().clearError();
      expect(useTransactionStore.getState().error).toBeNull();
    });
  });
});
