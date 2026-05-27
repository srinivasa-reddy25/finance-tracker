import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeModules,
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

import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MonthlyReportCard from '../components/MonthlyReportCard';
import EmptyState from '../components/EmptyState';
import BudgetWarning from '../components/BudgetWarning';
import { signOut } from '../services/firebase';
import {
  hasAskedPermission,
  isNotificationGranted,
  registerNotifications,
  requestAndRegister,
} from '../services/notifications';
import { updateWidget } from '../services/widgetBridge';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { colors, radius, shadow, spacing } from '../theme';
import type { TTransaction } from '../types/transaction';
import {
  BUDGET_WARNING_THRESHOLD_PCT,
  DASHBOARD_RECENT_LIMIT,
  DESCRIPTION_MAX_LENGTH,
  NOTE_MAX_LENGTH,
  TRANSACTION_MAX_AMOUNT,
} from '../constants/config';

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
  const { transactions, loading, fetch, add, update, remove } =
    useTransactionStore();
  const { user } = useAuthStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
  } = useCategoryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [notifBanner, setNotifBanner] = useState(false);
  const [notifSheet, setNotifSheet] = useState(false);

  // Add / edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TTransaction | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const amountRef = useRef<TextInput>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch({ month: currentMonth, limit: DASHBOARD_RECENT_LIMIT });
    fetchCats();

    const checkNotif = async () => {
      const granted = await isNotificationGranted();
      if (granted) {
        setNotifBanner(false);
        registerNotifications().catch(() => {});
        return;
      }
      const asked = await hasAskedPermission();
      if (!asked) {
        setNotifSheet(true);
      } else {
        setNotifBanner(true);
      }
    };

    checkNotif();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkNotif();
    });

    return () => sub.remove();
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter(c => !c.is_income),
    [categories],
  );

  const { totalSpent, count, totalBudget } = useMemo(() => {
    const spent = transactions.reduce((s, t) => s + t.amount, 0);
    const budget = categories
      .filter(c => !c.is_income && c.budget != null)
      .reduce((s, c) => s + (c.budget ?? 0), 0);
    return {
      totalSpent: spent,
      count: transactions.length,
      totalBudget: budget > 0 ? budget : null,
    };
  }, [transactions, categories]);

  // Keep Android widget in sync
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySpent = transactions
      .filter(t => {
        const d = new Date(t.date);
        return (
          !categoryMap.get(t.category)?.is_income &&
          d.toISOString().slice(0, 10) === todayStr
        );
      })
      .reduce((s, t) => s + t.amount, 0);
    updateWidget({
      todaySpent,
      monthlySpent: totalSpent,
      budget: totalBudget ?? 0,
    });
  }, [totalSpent, totalBudget, transactions, categoryMap]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetch({ month: currentMonth, limit: DASHBOARD_RECENT_LIMIT }),
        fetchCats(),
      ]);
      setRefreshCount(c => c + 1);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Quick Add widget tap — opens modal with pre-selected category
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      NativeModules.WidgetModule?.getPendingCategory?.()?.then(
        (cat: string | null) => {
          if (!cat) return;
          if (categories.length === 0) fetchCats();
          setCategory(cat);
          setModalOpen(true);
        },
      );
    }, [categories.length, fetchCats]),
  );

  const openModal = () => {
    if (categories.length === 0) fetchCats();
    setEditTarget(null);
    setCategory(expenseCategories[0]?.key ?? '');
    setModalOpen(true);
  };

  const openEdit = (item: TTransaction) => {
    setEditTarget(item);
    setAmount(String(item.amount));
    setDescription(item.description);
    setNote(item.note ?? '');
    setCategory(item.category);
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditTarget(null);
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
    if (parsed > TRANSACTION_MAX_AMOUNT) {
      Alert.alert(
        'Amount too large',
        `Maximum allowed amount is ₹${TRANSACTION_MAX_AMOUNT.toLocaleString('en-IN')}`,
      );
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

  const handleUpdate = async () => {
    if (!editTarget) return;
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0');
      return;
    }
    if (parsed > TRANSACTION_MAX_AMOUNT) {
      Alert.alert(
        'Amount too large',
        `Maximum allowed amount is ₹${TRANSACTION_MAX_AMOUNT.toLocaleString('en-IN')}`,
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a description');
      return;
    }
    setAdding(true);
    try {
      await update(editTarget._id, {
        amount: parsed,
        description: description.trim(),
        note: note.trim() || undefined,
        category,
      });
      resetForm();
      setModalOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to update transaction. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const animatedSpent = useCountUp(totalSpent, refreshCount);

  const budgetPct =
    totalBudget != null ? (totalSpent / totalBudget) * 100 : null;
  const spentColor =
    budgetPct == null
      ? colors.primary
      : budgetPct >= 100
        ? colors.expense
        : budgetPct >= BUDGET_WARNING_THRESHOLD_PCT
          ? '#F59E0B'
          : colors.primary;

  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
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
          <View style={styles.nameRow}>
            <Text style={styles.name}>{firstName}</Text>
            {budgetPct != null && totalBudget != null && (
              <BudgetWarning
                totalSpent={totalSpent}
                totalBudget={totalBudget}
                budgetPct={budgetPct}
              />
            )}
          </View>
          <TouchableOpacity onPress={signOut} style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {notifBanner && (
          <View style={styles.notifBanner}>
            <Icon name="bell-off-outline" size={14} color="#92400E" />
            <Text style={styles.notifBannerText}>
              Notifications off — you'll miss budget alerts
            </Text>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.notifBannerAction}>Enable</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNotifBanner(false)}>
              <Icon name="close" size={14} color="#92400E" />
            </TouchableOpacity>
          </View>
        )}

        {/* Spending hero — no card, just text on page */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total Spent</Text>
          <View style={styles.heroAmountRow}>
            {totalBudget != null && (
              <Text style={[styles.heroBudget, { opacity: 0 }]}>
                / ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
            )}
            <Text style={[styles.heroAmount, { color: spentColor }]}>
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

        {/* Monthly recap card — visible 1st–3rd of month */}
        <MonthlyReportCard />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
        </View>

        {/* Transaction list */}
        {(loading || catLoading) && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            subtitle="Tap + to record one"
          />
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
                <TouchableOpacity
                  key={item._id}
                  style={styles.recentCard}
                  onPress={() => openEdit(item)}
                  activeOpacity={0.75}
                >
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
                </TouchableOpacity>
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
                <Text style={styles.dialogTitle}>
                  {editTarget ? 'Edit Expense' : 'Add Expense'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    setModalOpen(false);
                  }}
                >
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
                maxLength={DESCRIPTION_MAX_LENGTH}
              />

              {/* Note (optional) */}
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.textLight}
                style={styles.descInput}
                returnKeyType="done"
                maxLength={NOTE_MAX_LENGTH}
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
                onPress={editTarget ? handleUpdate : handleAdd}
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
                    <Text style={styles.submitText}>
                      {editTarget ? 'Save Changes' : 'Add Expense'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notification permission sheet */}
      <Modal
        visible={notifSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifSheet(false)}
      >
        <View style={styles.notifSheetOverlay}>
          <View style={styles.notifSheet}>
            <View style={styles.notifSheetIcon}>
              <Icon name="bell-ring-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.notifSheetTitle}>
              Stay on top of your finances
            </Text>
            <Text style={styles.notifSheetSub}>
              Get notified when it matters most
            </Text>
            <View style={styles.notifSheetItems}>
              {[
                {
                  icon: 'alert-circle-outline',
                  text: 'Budget alerts at 80% and 100%',
                },
                { icon: 'repeat', text: 'Recurring transactions auto-fired' },
                {
                  icon: 'file-chart-outline',
                  text: 'Monthly spending report ready',
                },
              ].map(item => (
                <View key={item.icon} style={styles.notifSheetItem}>
                  <Icon name={item.icon} size={18} color={colors.primary} />
                  <Text style={styles.notifSheetItemText}>{item.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.notifSheetBtn}
              onPress={async () => {
                setNotifSheet(false);
                const granted = await requestAndRegister();
                if (!granted) setNotifBanner(true);
              }}
            >
              <Text style={styles.notifSheetBtnText}>Allow Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notifSheetSkip}
              onPress={async () => {
                setNotifSheet(false);
                const { default: AsyncStorage } =
                  await import('@react-native-async-storage/async-storage');
                await AsyncStorage.setItem('notif_permission_asked', 'true');
              }}
            >
              <Text style={styles.notifSheetSkipText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  notifSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  notifSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  notifSheetIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  notifSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  notifSheetSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  notifSheetItems: {
    width: '100%',
    gap: 14,
    marginBottom: spacing.xl,
  },
  notifSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifSheetItemText: {
    fontSize: 14,
    color: colors.text,
  },
  notifSheetBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  notifSheetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  notifSheetSkip: {
    paddingVertical: 8,
  },
  notifSheetSkipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notifBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  notifBannerAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
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
