import { act } from 'react';
import { useRecurringStore } from '../../src/stores/recurringStore';
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

const mockItem = {
  _id: 'rec1',
  user_id: 'u1',
  name: 'Rent',
  amount: 10000,
  category: 'bills',
  frequency: 'monthly' as const,
  is_active: true,
  next_run: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe('recurringStore', () => {
  beforeEach(() => {
    useRecurringStore.setState({ items: [], loading: false, error: null });
    jest.clearAllMocks();
  });

  describe('fetch', () => {
    it('loads recurring items on success', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: { recurring: [mockItem] } },
      });

      await act(async () => {
        await useRecurringStore.getState().fetch();
      });

      expect(useRecurringStore.getState().items).toEqual([mockItem]);
      expect(useRecurringStore.getState().error).toBeNull();
    });

    it('sets error on failure', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Server error'));

      await act(async () => {
        await useRecurringStore.getState().fetch();
      });

      expect(useRecurringStore.getState().error).toBe('Server error');
    });
  });

  describe('toggle', () => {
    it('updates is_active optimistically', async () => {
      useRecurringStore.setState({ items: [mockItem] });
      mockApi.patch.mockResolvedValueOnce({ data: {} });

      await act(async () => {
        await useRecurringStore.getState().toggle('rec1', false);
      });

      expect(useRecurringStore.getState().items[0].is_active).toBe(false);
    });
  });

  describe('remove', () => {
    it('removes item from the list', async () => {
      useRecurringStore.setState({ items: [mockItem] });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      await act(async () => {
        await useRecurringStore.getState().remove('rec1');
      });

      expect(useRecurringStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearError', () => {
    it('clears the error', () => {
      useRecurringStore.setState({ error: 'Something failed' });
      useRecurringStore.getState().clearError();
      expect(useRecurringStore.getState().error).toBeNull();
    });
  });
});
