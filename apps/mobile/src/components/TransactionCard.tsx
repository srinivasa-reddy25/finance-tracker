import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CATEGORY_META } from '../constants/categories';
import type { TTransaction } from '../types/transaction';

type Props = {
  transaction: TTransaction;
  onDelete?: (id: string) => void;
};

export default function TransactionCard({ transaction, onDelete }: Props) {
  const meta = CATEGORY_META[transaction.category];
  const isIncome = transaction.category === 'salary';
  const date = new Date(transaction.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View className="flex-row items-center bg-white px-4 py-3 border-b border-border">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: meta.color + '20' }}
      >
        <Text className="text-lg">{meta.icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-gray-900 font-medium text-sm" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">
          {transaction.category} · {date}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className="font-semibold text-sm"
          style={{ color: isIncome ? '#16A34A' : '#DC2626' }}
        >
          {isIncome ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
        </Text>
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(transaction._id)}
            className="mt-1"
          >
            <Text className="text-gray-300 text-xs">delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
