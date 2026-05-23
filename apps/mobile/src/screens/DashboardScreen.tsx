import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTransactionStore } from '../stores/transactionStore';
import { useAuthStore } from '../stores/authStore';
import { signOut } from '../services/firebase';
import TransactionCard from '../components/TransactionCard';
import { colors, spacing, radius, shadow } from '../theme';

export default function DashboardScreen() {
  const { transactions, loading, fetch, remove } = useTransactionStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch({ month: currentMonth, limit: 10 });
  }, []);

  const { totalSpent, totalIncome, count } = useMemo(() => {
    const spent = transactions
      .filter(t => t.category !== 'salary')
      .reduce((s, t) => s + t.amount, 0);
    const income = transactions
      .filter(t => t.category === 'salary')
      .reduce((s, t) => s + t.amount, 0);
    return {
      totalSpent: spent,
      totalIncome: income,
      count: transactions.length,
    };
  }, [transactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch({ month: currentMonth, limit: 10 });
    } finally {
      setRefreshing(false);
    }
  };

  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recent = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Spending card */}
        <View style={[styles.card, shadow.strong]}>
          <Text style={styles.cardLabel}>{monthLabel}</Text>
          <Text style={styles.cardAmount}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.cardSub}>total spent</Text>

          {totalIncome > 0 && (
            <View style={styles.cardDivider}>
              <View style={styles.cardStat}>
                <Icon
                  name="arrow-down-circle-outline"
                  size={14}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.cardStatLabel}>Income</Text>
                <Text style={styles.cardStatValue}>
                  ₹{totalIncome.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.cardStat}>
                <Icon
                  name="arrow-up-circle-outline"
                  size={14}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.cardStatLabel}>Saved</Text>
                <Text style={styles.cardStatValue}>
                  ₹
                  {Math.max(0, totalIncome - totalSpent).toLocaleString(
                    'en-IN',
                  )}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <Text style={styles.sectionCount}>{count} this month</Text>
        </View>

        {/* Transaction list */}
        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : recent.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon
                name="receipt-text-outline"
                size={32}
                color={colors.textLight}
              />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Tap Add to record one</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {recent.map((item, index) => (
              <TransactionCard
                key={item._id}
                transaction={item}
                onDelete={remove}
                isLast={index === recent.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
  },
  greeting: { fontSize: 13, color: colors.textSub, marginBottom: 2 },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  card: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  cardAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 2,
  },
  cardSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  cardDivider: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  cardStatValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionCount: { fontSize: 12, color: colors.textSub },

  listCard: {
    marginHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  empty: { alignItems: 'center', paddingTop: 48, paddingBottom: 80 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMed,
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: colors.textLight },
});
