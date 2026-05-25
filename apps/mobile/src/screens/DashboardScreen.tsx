import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signOut } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { colors, radius, shadow, spacing } from '../theme';

function useCountUp(target: number, resetKey: number, duration = 900) {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    animated.stopAnimation();
    animated.setValue(0);
    prevTarget.current = 0;
    Animated.timing(animated, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    prevTarget.current = target;
  }, [target, resetKey]);

  useEffect(() => {
    const listener = animated.addListener(({ value }) => {
      setDisplay(Math.round(value));
    });
    return () => animated.removeListener(listener);
  }, []);

  return display;
}

export default function DashboardScreen() {
  const { transactions, loading, fetch, add, remove } = useTransactionStore();
  const { user } = useAuthStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
  } = useCategoryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Add modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const amountRef = useRef<TextInput>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch({ month: currentMonth, limit: 10 });
    fetchCats();
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter(c => !c.is_income),
    [categories],
  );

  const { totalSpent, totalIncome, count, totalBudget } = useMemo(() => {
    const spent = transactions
      .filter(t => !categoryMap.get(t.category)?.is_income)
      .reduce((s, t) => s + t.amount, 0);
    const income = transactions
      .filter(t => categoryMap.get(t.category)?.is_income)
      .reduce((s, t) => s + t.amount, 0);
    const budget = categories
      .filter(c => !c.is_income && c.budget != null)
      .reduce((s, c) => s + (c.budget ?? 0), 0);
    return {
      totalSpent: spent,
      totalIncome: income,
      count: transactions.length,
      totalBudget: budget > 0 ? budget : null,
    };
  }, [transactions, categoryMap, categories]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetch({ month: currentMonth, limit: 10 }),
        fetchCats(),
      ]);
      setRefreshCount(c => c + 1);
    } finally {
      setRefreshing(false);
    }
  };

  const openModal = () => {
    if (categories.length === 0) fetchCats();
    setCategory(expenseCategories[0]?.key ?? '');
    setModalOpen(true);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setNote('');
    setCategory(expenseCategories[0]?.key ?? 'food');
  };

  const handleAdd = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a description');
      return;
    }
    setAdding(true);
    try {
      await add({
        amount: parsed,
        description: description.trim(),
        note: note.trim() || undefined,
        category,
        source: 'manual',
      });
      resetForm();
      setModalOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to add transaction. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const animatedSpent = useCountUp(totalSpent, refreshCount);

  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const recent = transactions.slice(0, 3);

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

        {/* Spending hero — no card, just text on page */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total Spent</Text>
          <View style={styles.heroAmountRow}>
            {totalBudget != null && (
              <Text style={[styles.heroBudget, { opacity: 0 }]}>
                / ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
            )}
            <Text style={styles.heroAmount}>
              ₹{animatedSpent.toLocaleString('en-IN')}
            </Text>
            {totalBudget != null && (
              <Text style={styles.heroBudget}>
                / ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
            )}
          </View>
          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>{count} transactions</Text>
            <View style={styles.heroDot} />
            <Text style={styles.heroStat}>{monthLabel}</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
        </View>

        {/* Transaction list */}
        {(loading || catLoading) && !refreshing ? (
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
            <Text style={styles.emptySub}>Tap + to record one</Text>
          </View>
        ) : (
          <View style={styles.recentRow}>
            {recent.map(item => {
              const meta = categoryMap.get(item.category) ?? {
                icon: 'shape-outline',
                color: '#6B7280',
                bg: '#F9FAFB',
              };
              const isIncome =
                categoryMap.get(item.category)?.is_income ?? false;
              const amountColor = isIncome ? colors.income : colors.expense;
              const date = new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <View key={item._id} style={styles.recentCard}>
                  <View style={styles.recentTop}>
                    <View
                      style={[
                        styles.recentIconWrap,
                        { backgroundColor: meta.bg },
                      ]}
                    >
                      <Icon name={meta.icon} size={16} color={meta.color} />
                    </View>
                    <Text
                      style={[styles.recentAmount, { color: amountColor }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {isIncome ? '+' : '-'}₹
                      {item.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.recentFooter}>
                    <Text style={styles.recentDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.recentDate}>{date}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadow.strong]}
        onPress={openModal}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
        onShow={() => setTimeout(() => amountRef.current?.focus(), 150)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.dialog}
              onPress={() => {}}
            >
              {/* Dialog header */}
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Add Expense</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Icon name="close" size={20} color={colors.textSub} />
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <View style={styles.amountRow}>
                <Text style={styles.amountCurrency}>₹</Text>
                <TextInput
                  ref={amountRef}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.border}
                  style={styles.amountInput}
                />
              </View>

              {/* Description */}
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor={colors.textLight}
                style={styles.descInput}
                returnKeyType="next"
              />

              {/* Note (optional) */}
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.textLight}
                style={styles.descInput}
                returnKeyType="done"
              />

              {/* Categories from store */}
              {catLoading ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={{ marginVertical: spacing.lg }}
                />
              ) : (
                <View style={styles.categoryGrid}>
                  {expenseCategories.map(cat => {
                    const selected = category === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => setCategory(cat.key)}
                        style={[
                          styles.catChip,
                          selected && {
                            backgroundColor: cat.bg,
                            borderColor: cat.color,
                          },
                        ]}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.catIconWrap,
                            {
                              backgroundColor: selected
                                ? cat.color
                                : colors.inputBg,
                            },
                          ]}
                        >
                          <Icon
                            name={cat.icon}
                            size={13}
                            color={selected ? '#FFF' : cat.color}
                          />
                        </View>
                        <Text
                          style={[
                            styles.catLabel,
                            { color: selected ? cat.color : colors.textSub },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={handleAdd}
                disabled={adding || catLoading || !category}
                style={[
                  styles.submitBtn,
                  shadow.card,
                  (catLoading || !category) && { opacity: 0.5 },
                ]}
                activeOpacity={0.85}
              >
                {adding ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Icon name="check" size={17} color="#FFF" />
                    <Text style={styles.submitText}>Add Expense</Text>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: 100 },

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

  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  heroAmount: {
    fontSize: 62,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -2,
  },
  heroBudget: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    marginLeft: 6,
    marginBottom: 6,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroStat: {
    fontSize: 12,
    color: colors.textSub,
    fontWeight: '500',
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  recentRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  recentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  recentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  recentIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    flex: 1,
    textAlign: 'right',
  },
  recentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentDesc: {
    fontSize: 9,
    color: colors.textSub,
    fontWeight: '500',
    flex: 1,
  },
  recentDate: {
    fontSize: 9,
    color: colors.textLight,
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

  fab: {
    position: 'absolute',
    bottom: 20,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: colors.text },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  amountCurrency: { fontSize: 28, fontWeight: '700', color: colors.expense },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: colors.expense,
    padding: 0,
  },

  descInput: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catIconWrap: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { fontSize: 12, fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.expense,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginTop: spacing.xs,
  },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
