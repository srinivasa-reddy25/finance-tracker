import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTransactionStore } from '../stores/transactionStore';
import { useAuthStore } from '../stores/authStore';
import { signOut } from '../services/firebase';
import TransactionCard from '../components/TransactionCard';

export default function DashboardScreen() {
  const { transactions, loading, fetch, remove } = useTransactionStore();
  const { user } = useAuthStore();

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch({ month: currentMonth, limit: 5 });
  }, []);

  const { income, expense, balance } = useMemo(() => {
    const inc = transactions
      .filter(t => t.category === 'salary')
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter(t => t.category !== 'salary')
      .reduce((s, t) => s + t.amount, 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions]);

  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-5">
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-gray-400 text-sm">Welcome back</Text>
            <Text className="text-gray-900 font-semibold text-base">
              {user?.displayName?.split(' ')[0] ?? 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            className="bg-surface px-3 py-2 rounded-xl"
          >
            <Text className="text-gray-400 text-sm">Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View className="bg-primary rounded-2xl p-5">
          <Text className="text-white/70 text-xs mb-1">{monthLabel}</Text>
          <Text className="text-white text-3xl font-bold mb-4">
            ₹{balance.toLocaleString('en-IN')}
          </Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-white/70 text-xs mb-0.5">Income</Text>
              <Text className="text-white font-semibold">
                ₹{income.toLocaleString('en-IN')}
              </Text>
            </View>
            <View>
              <Text className="text-white/70 text-xs mb-0.5">Expenses</Text>
              <Text className="text-white font-semibold">
                ₹{expense.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="flex-1 bg-white mt-3">
        <Text className="px-5 py-4 text-gray-900 font-semibold text-sm">
          Recent Transactions
        </Text>

        {loading ? (
          <ActivityIndicator className="mt-10" color="#2563EB" />
        ) : transactions.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <Text className="text-4xl mb-3">📭</Text>
            <Text className="text-gray-400 text-sm">No transactions yet</Text>
            <Text className="text-gray-300 text-xs mt-1">Tap + to add one</Text>
          </View>
        ) : (
          <FlatList
            data={transactions.slice(0, 5)}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TransactionCard transaction={item} onDelete={remove} />
            )}
          />
        )}
      </View>
    </View>
  );
}
