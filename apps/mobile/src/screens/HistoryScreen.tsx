import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTransactionStore } from '../stores/transactionStore';
import TransactionCard from '../components/TransactionCard';
import { CATEGORIES, type TCategory } from '../constants/categories';

const ALL = 'all' as const;
type TFilter = TCategory | typeof ALL;

export default function HistoryScreen() {
  const { transactions, pagination, loading, fetch, remove } =
    useTransactionStore();
  const [filter, setFilter] = useState<TFilter>(ALL);
  const [page, setPage] = useState(1);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch({
      month: currentMonth,
      page,
      category: filter === ALL ? undefined : filter,
    });
  }, [filter, page]);

  const chips: TFilter[] = [ALL, ...CATEGORIES];

  const handleFilterChange = (f: TFilter) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white px-5 pt-14 pb-4">
        <Text className="text-gray-900 font-bold text-xl">History</Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {new Date().toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Category filter chips */}
      <View className="bg-white border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          {chips.map(chip => (
            <TouchableOpacity
              key={chip}
              onPress={() => handleFilterChange(chip)}
              className={`px-3 py-1.5 rounded-full border ${
                filter === chip
                  ? 'bg-primary border-primary'
                  : 'bg-white border-border'
              }`}
            >
              <Text
                className={`text-xs font-medium capitalize ${
                  filter === chip ? 'text-white' : 'text-gray-500'
                }`}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1 bg-white mt-3">
        {loading ? (
          <ActivityIndicator className="mt-10" color="#2563EB" />
        ) : transactions.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <Text className="text-4xl mb-3">📭</Text>
            <Text className="text-gray-400 text-sm">No transactions</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TransactionCard transaction={item} onDelete={remove} />
            )}
            ListFooterComponent={
              pagination && pagination.total_pages > 1 ? (
                <View className="flex-row justify-center items-center gap-4 py-4">
                  <TouchableOpacity
                    disabled={page === 1}
                    onPress={() => setPage(p => p - 1)}
                    className={`px-4 py-2 rounded-xl ${
                      page === 1 ? 'bg-surface' : 'bg-primary'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        page === 1 ? 'text-gray-300' : 'text-white'
                      }`}
                    >
                      Prev
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-gray-400 text-sm">
                    {page} / {pagination.total_pages}
                  </Text>
                  <TouchableOpacity
                    disabled={page === pagination.total_pages}
                    onPress={() => setPage(p => p + 1)}
                    className={`px-4 py-2 rounded-xl ${
                      page === pagination.total_pages
                        ? 'bg-surface'
                        : 'bg-primary'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        page === pagination.total_pages
                          ? 'text-gray-300'
                          : 'text-white'
                      }`}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}
