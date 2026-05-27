import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../services/api';
import { colors, radius, spacing } from '../theme';
import { formatAmount } from '../utils/format';
import { MONTHLY_RECAP_MAX_DAY } from '../constants/config';

type Summary = {
  month_label: string;
  total_spent: number;
  tx_count: number;
  pct_change: number | null;
  top_categories: {
    key: string;
    name: string;
    amount: number;
    color: string;
    icon: string;
  }[];
  biggest: { description: string; amount: number; category: string } | null;
};

// Tracks which month was dismissed — resets when app restarts
let dismissedMonth: string | null = null;

export default function MonthlyReportCard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    check_and_load();
  }, []);

  const check_and_load = async () => {
    const today = new Date();
    const day = today.getDate();

    // Only show on 1st–Nth of the month
    if (day > MONTHLY_RECAP_MAX_DAY) return;

    const month_key = today.toISOString().slice(0, 7); // YYYY-MM
    if (dismissedMonth === month_key) return;

    try {
      const res = await api.get('/reports/monthly-summary');
      if (res.data?.data) {
        setSummary(res.data.data);
        setVisible(true);
      }
    } catch {
      // silently skip — card is non-critical
    }
  };

  const dismiss = () => {
    dismissedMonth = new Date().toISOString().slice(0, 7);
    setVisible(false);
  };

  if (!visible || !summary) return null;

  const pct = summary.pct_change;
  const pct_up = pct !== null && pct > 0;
  const pct_down = pct !== null && pct < 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Icon name="calendar-month" size={12} color={colors.primary} />
            <Text style={styles.badgeText}>Monthly Recap</Text>
          </View>
          <Text style={styles.month}>{summary.month_label}</Text>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
        >
          <Icon name="close" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Total spent */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total spent</Text>
        <View style={styles.totalRight}>
          <Text style={styles.totalAmount}>
            {formatAmount(summary.total_spent)}
          </Text>
          {pct !== null && (
            <View
              style={[
                styles.pctBadge,
                pct_up
                  ? styles.pctUp
                  : pct_down
                    ? styles.pctDown
                    : styles.pctFlat,
              ]}
            >
              <Icon
                name={
                  pct_up ? 'trending-up' : pct_down ? 'trending-down' : 'minus'
                }
                size={11}
                color={
                  pct_up
                    ? colors.expense
                    : pct_down
                      ? colors.income
                      : colors.textSub
                }
              />
              <Text
                style={[
                  styles.pctText,
                  pct_up
                    ? styles.pctTextUp
                    : pct_down
                      ? styles.pctTextDown
                      : styles.pctTextFlat,
                ]}
              >
                {Math.abs(pct)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.txCount}>{summary.tx_count} transactions</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Top categories */}
      {summary.top_categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Top categories</Text>
          <View style={styles.catList}>
            {summary.top_categories.map(c => (
              <View key={c.key} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={styles.catName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.catAmount}>{formatAmount(c.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Biggest spend */}
      {summary.biggest && (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Biggest spend</Text>
            <View style={styles.biggestRow}>
              <View style={styles.biggestLeft}>
                <Icon
                  name="arrow-up-circle-outline"
                  size={16}
                  color={colors.expense}
                />
                <Text style={styles.biggestDesc} numberOfLines={1}>
                  {summary.biggest.description}
                </Text>
                <Text style={styles.biggestCat}>
                  {summary.biggest.category}
                </Text>
              </View>
              <Text style={styles.biggestAmount}>
                {formatAmount(summary.biggest.amount)}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  month: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  closeBtn: {
    padding: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textSub,
    fontWeight: '500',
  },
  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.expense,
    letterSpacing: -0.5,
  },
  pctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  pctUp: { backgroundColor: '#FEF2F2' },
  pctDown: { backgroundColor: '#ECFDF5' },
  pctFlat: { backgroundColor: colors.bg },
  pctText: { fontSize: 11, fontWeight: '700' },
  pctTextUp: { color: colors.expense },
  pctTextDown: { color: colors.income },
  pctTextFlat: { color: colors.textSub },
  txCount: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: -6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catList: { gap: 6 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  biggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  biggestLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  biggestDesc: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  biggestCat: {
    fontSize: 11,
    color: colors.textSub,
  },
  biggestAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.expense,
  },
});
