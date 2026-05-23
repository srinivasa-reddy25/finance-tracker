import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CATEGORY_META } from '../constants/categories';
import { colors, radius, spacing } from '../theme';
import type { TTransaction } from '../types/transaction';

type Props = {
  transaction: TTransaction;
  onDelete?: (id: string) => void;
  isLast?: boolean;
};

export default function TransactionCard({
  transaction,
  onDelete,
  isLast,
}: Props) {
  const meta = CATEGORY_META[transaction.category];
  const isIncome = transaction.category === 'salary';
  const date = new Date(transaction.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Icon name={meta.icon} size={20} color={meta.color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta}>
          {transaction.category} · {date}
        </Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.income : colors.expense },
          ]}
        >
          {isIncome ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
        </Text>
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(transaction._id)}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash-can-outline" size={15} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  desc: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.textSub,
    textTransform: 'capitalize',
  },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700' },
  deleteBtn: { marginTop: 6 },
});
