import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing } from '../theme';
import { BUDGET_WARNING_THRESHOLD_PCT } from '../constants/config';

type Props = {
  totalSpent: number;
  totalBudget: number;
  budgetPct: number;
};

/**
 * Badge shown in the dashboard header when budget usage hits the warning threshold.
 * Renders nothing below the threshold.
 */
export default function BudgetWarning({
  totalSpent,
  totalBudget,
  budgetPct,
}: Props) {
  if (budgetPct < BUDGET_WARNING_THRESHOLD_PCT) return null;

  const isExceeded = budgetPct >= 100;

  return (
    <View style={[styles.badge, isExceeded ? styles.danger : styles.warning]}>
      <Icon
        name={isExceeded ? 'alert-circle-outline' : 'alert-outline'}
        size={12}
        color={isExceeded ? colors.expense : '#F59E0B'}
      />
      <Text
        style={[
          styles.text,
          isExceeded ? styles.dangerText : styles.warningText,
        ]}
      >
        {isExceeded
          ? `Budget exceeded by ₹${Math.round(totalSpent - totalBudget).toLocaleString('en-IN')}`
          : `${Math.round(budgetPct)}% of budget used`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  danger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  warningText: {
    color: '#F59E0B',
  },
  dangerText: {
    color: colors.expense,
  },
});
