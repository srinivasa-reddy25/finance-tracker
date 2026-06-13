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
  DeviceEventEmitter,
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MonthlyReportCard from '../components/MonthlyReportCard';
import EmptyState from '../components/EmptyState';
import type { BottomTabParams } from '../navigation';
import { signOut } from '../services/firebase';
import {
  hasAskedPermission,
  isNotificationGranted,
  registerNotifications,
  requestAndRegister,
} from '../services/notifications';
import { updateWidget } from '../services/widgetBridge';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import {
  useColors,
  TColors,
  catBg,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme';
import type { TTransaction } from '../types/transaction';
import {
  BUDGET_WARNING_THRESHOLD_PCT,
  DASHBOARD_RECENT_LIMIT,
  DESCRIPTION_MAX_LENGTH,
  NOTE_MAX_LENGTH,
  TRANSACTION_MAX_AMOUNT,
} from '../constants/config';

function compactAmount(n: number): string {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n}`;
}

function monthOffset(base: string, delta: number): string {
  const [y, m] = base.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { isDark } = useThemeStore();
  const {
    dashboardTransactions: transactions,
    dashboardLoading: loading,
    fetchDashboard,
    add,
    update,
    remove,
  } = useTransactionStore();
  const { user } = useAuthStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
  } = useCategoryStore();
  const navigation = useNavigation<BottomTabNavigationProp<BottomTabParams>>();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [notifBanner, setNotifBanner] = useState(false);
  const [notifSheet, setNotifSheet] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([
    currentMonth,
  ]);
  const isCurrentMonth = selectedMonth === currentMonth;

  const PILL_H = 44;
  const PILL_W = 100;
  const DROP_W = 200;
  const ROW_H = 52;
  const morphAnim = useRef(new Animated.Value(0)).current;

  const openPicker = () => {
    setPickerOpen(true);
    Animated.spring(morphAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 120,
      friction: 14,
    }).start();
  };

  const closePicker = () => {
    Animated.spring(morphAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 120,
      friction: 14,
    }).start(() => setPickerOpen(false));
  };

  const selectMonth = (m: string) => {
    setSelectedMonth(m);
    closePicker();
  };

  // Add / edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TTransaction | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchDashboard({ month: selectedMonth, limit: DASHBOARD_RECENT_LIMIT });
  }, [selectedMonth]);

  useEffect(() => {
    // Build months from user's join month up to current month
    const joinDate = user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime)
      : new Date();
    const joinMonth = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
    const months: string[] = [];
    let m = currentMonth;
    while (m >= joinMonth) {
      months.push(m);
      m = monthOffset(m, -1);
      if (months.length > 24) break; // safety cap
    }
    setAvailableMonths(months);

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
    const spent = transactions
      .filter(t => !categoryMap.get(t.category)?.is_income)
      .reduce((s, t) => s + t.amount, 0);
    const budget = categories
      .filter(c => !c.is_income && c.budget != null)
      .reduce((s, c) => s + (c.budget ?? 0), 0);
    return {
      totalSpent: spent,
      count: transactions.length,
      totalBudget: budget > 0 ? budget : null,
    };
  }, [transactions, categoryMap, categories]);

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
        fetchDashboard({ month: selectedMonth, limit: DASHBOARD_RECENT_LIMIT }),
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

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'openTransactionModal',
      openModal,
    );
    return () => sub.remove();
  }, [categories.length, expenseCategories]);

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

  // Morph animation derived values
  const morphHeight = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PILL_H, PILL_H + availableMonths.length * ROW_H + 8],
  });
  const morphWidth = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PILL_W, DROP_W],
  });
  const morphRadius = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [radius.full, radius.xl],
  });
  const chevronRot = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const listOpacity = morphAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const budgetPct =
    totalBudget != null ? (totalSpent / totalBudget) * 100 : null;

  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number);
  const monthLabel = new Date(selYear, selMonthNum - 1, 1).toLocaleDateString(
    'en-IN',
    { month: 'long', year: 'numeric' },
  );
  const monthShort = new Date(selYear, selMonthNum - 1, 1)
    .toLocaleDateString('en-IN', { month: 'short' })
    .toUpperCase();
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const heroStatus =
    budgetPct == null
      ? null
      : budgetPct >= 100
        ? 'Over budget'
        : `${Math.round(budgetPct)}% used`;
  const budgetRemaining = totalBudget != null ? totalBudget - totalSpent : null;
  const recent = transactions.slice(0, 3);
  const topCategories = useMemo(() => {
    const spentByCategory = new Map<string, number>();
    for (const transaction of transactions) {
      if (categoryMap.get(transaction.category)?.is_income) continue;
      spentByCategory.set(
        transaction.category,
        (spentByCategory.get(transaction.category) ?? 0) + transaction.amount,
      );
    }
    return Array.from(spentByCategory.entries())
      .map(([key, spent]) => ({
        key,
        spent,
        meta: categoryMap.get(key),
      }))
      .filter(item => item.meta)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 4);
  }, [transactions, categoryMap]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.canvas}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[c.accent]}
            tintColor={c.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Month pill — grows as overlay, pill row stays at top */}
          <View style={styles.monthPillWrapper}>
            <Animated.View
              style={[
                styles.morphContainer,
                {
                  height: morphHeight,
                  width: morphWidth,
                  borderRadius: morphRadius,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.morphPillRow}
                onPress={pickerOpen ? closePicker : openPicker}
                activeOpacity={0.8}
              >
                <Text style={styles.monthPillText} numberOfLines={1}>
                  {pickerOpen
                    ? monthLabel
                    : new Date(selYear, selMonthNum - 1, 1).toLocaleDateString(
                        'en-IN',
                        { month: 'long' },
                      )}
                </Text>
                <Animated.View style={{ transform: [{ rotate: chevronRot }] }}>
                  <Icon name="chevron-down" size={14} color={c.ink2} />
                </Animated.View>
              </TouchableOpacity>
              <Animated.View
                style={[styles.morphList, { opacity: listOpacity }]}
              >
                {pickerOpen &&
                  availableMonths.map(m => {
                    const [y, mo] = m.split('-').map(Number);
                    const label = new Date(y, mo - 1, 1).toLocaleDateString(
                      'en-IN',
                      {
                        month: 'long',
                        year: 'numeric',
                      },
                    );
                    const isCurrent = m === currentMonth;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={styles.morphRow}
                        onPress={() => selectMonth(m)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.morphRowLabel}>{label}</Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Now</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </Animated.View>
            </Animated.View>
          </View>

          {/* Right side: warning tag + avatar */}
          <View style={styles.headerRight}>
            {budgetPct != null &&
              totalBudget != null &&
              budgetPct >= BUDGET_WARNING_THRESHOLD_PCT && (
                <View
                  style={[
                    styles.warningTag,
                    budgetPct >= 100
                      ? styles.warningTagDanger
                      : styles.warningTagAmber,
                  ]}
                >
                  <Icon
                    name={
                      budgetPct >= 100
                        ? 'alert-circle-outline'
                        : 'alert-outline'
                    }
                    size={13}
                    color={budgetPct >= 100 ? c.expense : c.warn}
                  />
                  <Text
                    style={[
                      styles.warningTagText,
                      {
                        color: budgetPct >= 100 ? c.expense : c.warn,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {budgetPct >= 100
                      ? 'Over budget'
                      : `${Math.round(budgetPct)}% used`}
                  </Text>
                </View>
              )}
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.avatarText}>
                {firstName[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification bar — only when push permission denied */}
        {notifBanner && (
          <View style={styles.notifBar}>
            <Icon name="bell-off-outline" size={13} color={c.ink2} />
            <Text style={styles.notifBarText} numberOfLines={1}>
              Notifications off — you'll miss alerts
            </Text>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.notifBarAction}>Enable</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNotifBanner(false)}>
              <Icon name="close" size={12} color={c.ink3} />
            </TouchableOpacity>
          </View>
        )}

        {/* Spending hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>TOTAL SPENT · {monthShort}</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroRupee}>₹</Text>
            <Text style={styles.heroAmount}>
              {animatedSpent.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>{count} transactions</Text>
            {heroStatus != null && (
              <>
                <View style={styles.heroDot} />
                <Text style={styles.heroStat}>{heroStatus}</Text>
              </>
            )}
          </View>
        </View>

        {totalBudget != null && (
          <View style={styles.budgetWrap}>
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  {
                    width: `${Math.min(budgetPct ?? 0, 100)}%`,
                    backgroundColor:
                      budgetPct != null && budgetPct >= 100
                        ? c.expense
                        : c.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetCap}>
              <Text style={styles.budgetCapText}>
                {budgetRemaining != null && budgetRemaining >= 0
                  ? `₹${budgetRemaining.toLocaleString('en-IN')} left`
                  : `Over ₹${Math.abs(budgetRemaining ?? 0).toLocaleString('en-IN')}`}
              </Text>
              <Text style={styles.budgetCapMuted}>
                Budget ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* Monthly recap card — visible 1st–3rd of month */}
        <MonthlyReportCard />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction list */}
        {(loading || catLoading) && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />
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
                color: '#7A746B',
                bg: '#EFEDE7',
              };
              const isIncome =
                categoryMap.get(item.category)?.is_income ?? false;
              const amountColor = isIncome ? c.income : c.expense;
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
                        { backgroundColor: catBg(meta.bg, meta.color, isDark) },
                      ]}
                    >
                      <Icon name={meta.icon} size={16} color={meta.color} />
                    </View>
                    <Text
                      style={[styles.recentAmount, { color: amountColor }]}
                      numberOfLines={1}
                    >
                      {compactAmount(item.amount)}
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

        {topCategories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Where it went</Text>
            </View>
            <View style={styles.categoryBreakdown}>
              {topCategories.map(item => {
                const meta = item.meta!;
                const pct =
                  totalSpent > 0 ? Math.min(item.spent / totalSpent, 1) : 0;
                return (
                  <View key={item.key} style={styles.breakdownRow}>
                    <View
                      style={[
                        styles.breakdownIcon,
                        { backgroundColor: catBg(meta.bg, meta.color, isDark) },
                      ]}
                    >
                      <Icon name={meta.icon} size={16} color={meta.color} />
                    </View>
                    <View style={styles.breakdownInfo}>
                      <View style={styles.breakdownTop}>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {meta.name}
                        </Text>
                        <Text style={styles.breakdownAmount}>
                          ₹{item.spent.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.breakdownTrack}>
                        <View
                          style={[
                            styles.breakdownFill,
                            {
                              width: `${pct * 100}%`,
                              backgroundColor: meta.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

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
                  {editTarget ? 'Edit expense' : 'Add expense'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    setModalOpen(false);
                  }}
                >
                  <Icon name="close" size={20} color={c.ink2} />
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
                  placeholderTextColor={c.line}
                  style={styles.amountInput}
                />
              </View>

              {/* Description */}
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor={c.ink3}
                style={styles.descInput}
                returnKeyType="next"
                maxLength={DESCRIPTION_MAX_LENGTH}
              />

              {/* Note (optional) */}
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={c.ink3}
                style={styles.descInput}
                returnKeyType="done"
                maxLength={NOTE_MAX_LENGTH}
              />

              {/* Categories from store */}
              {catLoading ? (
                <ActivityIndicator
                  color={c.accent}
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
                            backgroundColor: catBg(cat.bg, cat.color, isDark),
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
                                : c.surface2,
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
                            { color: selected ? cat.color : c.ink2 },
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
                      {editTarget ? 'Save changes' : 'Add expense'}
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
              <Icon name="bell-ring-outline" size={32} color={c.accent} />
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
                  <Icon name={item.icon} size={18} color={c.accent} />
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

function makeStyles(c: TColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.canvas },
    notifSheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    notifSheet: {
      backgroundColor: c.canvas,
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
      backgroundColor: c.accent + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    notifSheetTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.ink,
      textAlign: 'center',
      marginBottom: 8,
    },
    notifSheetSub: {
      fontSize: 14,
      color: c.ink2,
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
      color: c.ink,
    },
    notifSheetBtn: {
      width: '100%',
      backgroundColor: c.accent,
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
      color: c.ink2,
    },
    scroll: { paddingBottom: 120 },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.canvas,
      paddingHorizontal: spacing.lg,
      paddingTop: 56,
      paddingBottom: spacing.md,
    },
    monthPillWrapper: {
      height: 44,
      zIndex: 200,
      alignSelf: 'flex-start',
    },
    morphContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      overflow: 'hidden',
      shadowColor: '#1A1714',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5,
    },
    morphPillRow: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 6,
    },
    monthPillText: {
      fontSize: 15,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink,
    },
    morphList: {
      paddingVertical: 8,
    },
    morphRow: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 8,
    },
    morphRowLabel: {
      flex: 1,
      fontSize: 15,
      fontFamily: typography.medium,
      fontWeight: '500',
      color: c.ink,
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
    },
    warningTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingLeft: 12,
      paddingRight: 28, // extra right padding so avatar overlaps it
      height: 44,
      borderTopLeftRadius: radius.full,
      borderBottomLeftRadius: radius.full,
      borderWidth: 1,
      borderRightWidth: 0,
      marginRight: -22, // avatar overlaps this by 22px
    },
    warningTagAmber: {
      backgroundColor: c.warnSoft,
      borderColor: c.warn + '66',
    },
    warningTagDanger: {
      backgroundColor: c.expenseSoft,
      borderColor: c.expense + '66',
    },
    warningTagText: {
      fontSize: 12,
      fontFamily: typography.semibold,
      fontWeight: '600',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: c.canvas,
      fontSize: 16,
      fontFamily: typography.extrabold,
      fontWeight: '800',
    },

    notifBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.warnSoft,
      borderWidth: 1,
      borderColor: c.warn + '50',
      borderRadius: radius.full,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: 14,
      height: 40,
    },
    notifBarText: {
      flex: 1,
      fontSize: 12,
      fontFamily: typography.medium,
      fontWeight: '500',
      color: c.warn,
    },
    notifBarAction: {
      fontSize: 12,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.warn,
    },

    hero: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingBottom: spacing.base,
      paddingHorizontal: spacing.base,
    },
    heroLabel: {
      fontSize: 11,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink3,
      letterSpacing: 1.8,
      marginBottom: spacing.md,
    },
    heroAmountRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    heroRupee: {
      fontSize: 28,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink,
      marginTop: 10,
      marginRight: 2,
    },
    heroAmount: {
      fontSize: 66,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -3.3,
    },
    heroStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    heroStat: {
      fontSize: 13,
      color: c.ink2,
      fontFamily: typography.medium,
      fontWeight: '500',
    },
    heroDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.ink3,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 19,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -0.4,
    },
    seeAll: {
      fontSize: 14,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.accent,
    },

    budgetWrap: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    budgetTrack: {
      height: 10,
      borderRadius: radius.full,
      backgroundColor: c.line,
      overflow: 'hidden',
    },
    budgetFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    budgetCap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    budgetCapText: {
      fontSize: 12,
      fontFamily: typography.semibold,
      fontWeight: '600',
      color: c.ink2,
    },
    budgetCapMuted: {
      fontSize: 12,
      fontFamily: typography.semibold,
      fontWeight: '600',
      color: c.ink3,
    },

    recentRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      gap: 10,
    },
    recentCard: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.lg,
      padding: spacing.md,
      paddingVertical: 12,
      backgroundColor: c.surface,
      gap: 12,
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
      fontSize: 15,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
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
      fontSize: 11,
      color: c.ink2,
      fontFamily: typography.medium,
      fontWeight: '500',
      flex: 1,
    },
    recentDate: {
      fontSize: 10,
      color: c.ink3,
      fontFamily: typography.regular,
    },

    categoryBreakdown: {
      marginHorizontal: spacing.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      gap: spacing.base,
      ...shadow.sm,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    breakdownIcon: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    breakdownInfo: { flex: 1, minWidth: 0 },
    breakdownTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    breakdownName: {
      flex: 1,
      fontSize: 14,
      fontFamily: typography.semibold,
      fontWeight: '600',
      color: c.ink,
    },
    breakdownAmount: {
      fontSize: 14,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink,
    },
    breakdownTrack: {
      height: 8,
      borderRadius: radius.full,
      backgroundColor: c.line,
      overflow: 'hidden',
    },
    breakdownFill: {
      height: '100%',
      borderRadius: radius.full,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
    },
    dialog: {
      backgroundColor: c.surface,
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
    dialogTitle: { fontSize: 18, fontWeight: '800', color: c.ink },

    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface2,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      gap: 6,
    },
    amountCurrency: { fontSize: 28, fontWeight: '700', color: c.expense },
    amountInput: {
      flex: 1,
      fontSize: 36,
      fontWeight: '800',
      color: c.expense,
      padding: 0,
    },

    descInput: {
      backgroundColor: c.surface2,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.base,
      paddingVertical: 12,
      fontSize: 14,
      color: c.ink,
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
      borderColor: c.line,
      backgroundColor: c.surface,
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
      backgroundColor: c.expense,
      borderRadius: radius.lg,
      paddingVertical: 14,
      marginTop: spacing.xs,
    },
    submitText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    monthSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingBottom: 48,
      ...shadow.strong,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      backgroundColor: c.line,
      borderRadius: radius.full,
      alignSelf: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    currentBadge: {
      backgroundColor: c.accentSoft,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    currentBadgeText: {
      fontSize: 11,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.accent,
    },
  });
}
