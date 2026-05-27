import { act } from 'react';
import { useCategoryStore } from '../../src/stores/categoryStore';
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

const mockCategory = {
  _id: 'cat1',
  key: 'food',
  name: 'Food',
  icon: 'food-fork-drink',
  color: '#F97316',
  bg: '#FFF7ED',
  is_deletable: true,
  is_income: false,
  sort_order: 0,
};

describe('categoryStore', () => {
  beforeEach(() => {
    useCategoryStore.setState({ categories: [], loading: false, error: null });
    jest.clearAllMocks();
  });

  describe('fetch', () => {
    it('loads categories on success', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: { categories: [mockCategory] } },
      });

      await act(async () => {
        await useCategoryStore.getState().fetch();
      });

      expect(useCategoryStore.getState().categories).toEqual([mockCategory]);
      expect(useCategoryStore.getState().error).toBeNull();
    });

    it('deduplicates categories by key', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: {
            categories: [mockCategory, { ...mockCategory, _id: 'cat2' }],
          },
        },
      });

      await act(async () => {
        await useCategoryStore.getState().fetch();
      });

      expect(useCategoryStore.getState().categories).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await useCategoryStore.getState().fetch();
      });

      expect(useCategoryStore.getState().error).toBe('Network error');
    });
  });

  describe('remove', () => {
    it('returns deleted status on success', async () => {
      useCategoryStore.setState({ categories: [mockCategory] });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      let result: Awaited<
        ReturnType<typeof useCategoryStore.getState.prototype.remove>
      >;
      await act(async () => {
        result = await useCategoryStore.getState().remove('cat1');
      });

      expect(result!).toEqual({ status: 'deleted' });
      expect(useCategoryStore.getState().categories).toHaveLength(0);
    });

    it('returns needs_confirmation on 409', async () => {
      const err = {
        response: {
          status: 409,
          data: { data: { transaction_count: 5 } },
        },
      };
      mockApi.delete.mockRejectedValueOnce(err);

      let result: Awaited<
        ReturnType<typeof useCategoryStore.getState.prototype.remove>
      >;
      await act(async () => {
        result = await useCategoryStore.getState().remove('cat1');
      });

      expect(result!).toEqual({
        status: 'needs_confirmation',
        transaction_count: 5,
      });
    });

    it('rethrows on unexpected errors', async () => {
      mockApi.delete.mockRejectedValueOnce(new Error('Unexpected'));

      await expect(
        act(async () => {
          await useCategoryStore.getState().remove('cat1');
        }),
      ).rejects.toThrow('Unexpected');
    });
  });

  describe('clearError', () => {
    it('clears the error field', () => {
      useCategoryStore.setState({ error: 'Some error' });
      useCategoryStore.getState().clearError();
      expect(useCategoryStore.getState().error).toBeNull();
    });
  });
});
