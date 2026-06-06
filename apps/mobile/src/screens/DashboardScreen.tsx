import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  AppState,
  Easing,
  Linking,
  Modal,
  NativeModules,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MonthlyReportCard from '../components/MonthlyReportCard';
import EmptyState from '../components/EmptyState';
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
import { useTransactionModalStore } from '../stores/transactionModalStore';
import { colors, radius, shadow, spacing } from '../theme';
import {
  BUDGET_WARNING_THRESHOLD_PCT,
  DASHBOARD_RECENT_LIMIT,
} from '../constants/config';
import type { BottomTabParams } from '../navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useCountUp(target: number, resetKey: number, duration = 900) {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    animated.stopAnimation();
    animated.setValue(0);
    Animated.timing(animated, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
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
  const { transactions, loading, fetch } = useTransactionStore();
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
    const spent = transactions.reduce((s, t) => {
      const cat = categoryMap.get(t.category);
      return cat?.is_income ? s : s + t.amount;
    }, 0);
    const budget = categories
      .filter(c => !c.is_income && c.budget != null)
      .reduce((s, c) => s + (c.budget ?? 0), 0);
    return {
      totalSpent: spent,
      count: transactions.length,
      totalBudget: budget > 0 ? budget : null,
    };
  }, [transactions, categories, categoryMap]);

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
          useTransactionModalStore.getState().openAdd();
        },
      );
    }, [categories.length, fetchCats]),
  );

  const animatedSpent = useCountUp(totalSpent, refreshCount);

  const budgetPct =
    totalBudget != null ? (totalSpent / totalBudget) * 100 : null;
  const barColor =
    budgetPct == null
      ? colors.accent
      : budgetPct >= 100
        ? colors.expense
        : budgetPct >= BUDGET_WARNING_THRESHOLD_PCT
          ? colors.warn
          : colors.accent;

  const pctMetaColor =
    budgetPct == null
      ? colors.ink2
      : budgetPct >= 100
        ? colors.expense
        : budgetPct >= BUDGET_WARNING_THRESHOLD_PCT
          ? colors.warn
          : colors.ink2;

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const monthShort = now.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
  const firstName = user?.displayName?.split(' ')[0] ?? 'You';
  const avatarLetter =
    (user?.displayName ?? firstName)[0]?.toUpperCase() ?? 'U';

  const recent = transactions.slice(0, 3);

  // Top 4 categories by amount spent
  const topCategories = useMemo(() => {
    const catAmounts = new Map<string, number>();
    transactions.forEach(t => {
      const cat = categoryMap.get(t.category);
      if (!cat?.is_income) {
        catAmounts.set(
          t.category,
          (catAmounts.get(t.category) ?? 0) + t.amount,
        );
      }
    });
    return Array.from(catAmounts.entries())
      .map(([key, amount]) => ({ key, amount, meta: categoryMap.get(key) }))
      .filter(r => r.meta && !r.meta.is_income)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [transactions, categoryMap]);

  const hasSpend = topCategories.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Status bar pad */}
        <View style={{ height: 54 }} />

        {/* Notification banner */}
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

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>{monthShort}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarBtnText}>{avatarLetter}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero section */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>
            {'TOTAL SPENT · ' + monthShort.toUpperCase()}
          </Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>₹</Text>
            <Text style={styles.heroAmount}>
              {animatedSpent.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaText}>{count} transactions</Text>
            {budgetPct != null && (
              <>
                <View style={styles.heroDot} />
                <Text style={[styles.heroMetaText, { color: pctMetaColor }]}>
                  {Math.round(budgetPct)}% used
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Budget bar */}
        {totalBudget != null && (
          <View style={styles.budgetBarSection}>
            <View style={styles.budgetTrack}>
              <View
                style={[
                  styles.budgetFill,
                  {
                    width: `${Math.min(budgetPct ?? 0, 100)}%` as `${number}%`,
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetCap}>
              <Text
                style={[
                  styles.budgetCapLeft,
                  budgetPct != null &&
                    budgetPct >= 100 && { color: colors.expense },
                ]}
              >
                {budgetPct != null && budgetPct >= 100
                  ? `Over by ₹${(totalSpent - totalBudget).toLocaleString('en-IN')}`
                  : `Spent ₹${totalSpent.toLocaleString('en-IN')}`}
              </Text>
              <Text style={styles.budgetCapRight}>
                Budget ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* Monthly report card */}
        <MonthlyReportCard />

        {/* Recent section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {(loading || catLoading) && !refreshing ? null : recent.length === 0 ? (
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
              const amountColor = isIncome ? colors.income : colors.expense;
              const date = new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.recentCard}
                  onPress={() =>
                    useTransactionModalStore.getState().openEdit(item)
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.recentIconBubble,
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
                    {isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.recentDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.recentDate}>{date}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Where it went section */}
        {hasSpend && (
          <>
            <Text style={styles.whereTitle}>Where it went</Text>
            <View style={styles.whereCard}>
              {topCategories.map(({ key, amount, meta }) => {
                if (!meta) return null;
                const maxAmt = topCategories[0]?.amount ?? 1;
                const pct = Math.min((amount / maxAmt) * 100, 100);
                return (
                  <View key={key} style={styles.catBarRow}>
                    <View style={styles.catBarTop}>
                      <View
                        style={[
                          styles.catBarIcon,
                          { backgroundColor: meta.bg },
                        ]}
                      >
                        <Icon name={meta.icon} size={14} color={meta.color} />
                      </View>
                      <Text style={styles.catBarName} numberOfLines={1}>
                        {meta.name}
                      </Text>
                      <Text style={styles.catBarAmt}>
                        ₹{amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View
                        style={[
                          styles.catBarFill,
                          {
                            width: `${pct}%` as `${number}%`,
                            backgroundColor: meta.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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
              <Icon name="bell-ring-outline" size={32} color={colors.accent} />
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
                  <Icon name={item.icon} size={18} color={colors.accent} />
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
  container: { flex: 1, backgroundColor: colors.canvas },
  scroll: {},

  // Notification banner
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
  notifBannerText: { flex: 1, fontSize: 12, color: '#92400E' },
  notifBannerAction: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  // Header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 6,
  },
  monthPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  monthPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtnText: { color: colors.canvas, fontSize: 17, fontWeight: '700' },

  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 4,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.ink3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  heroCurrency: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink2,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 66,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -3,
    lineHeight: 72,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
  },
  heroMetaText: { fontSize: 13, color: colors.ink2 },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.line2,
  },

  // Budget bar
  budgetBarSection: {
    marginHorizontal: 22,
    marginTop: 18,
  },
  budgetTrack: {
    height: 10,
    backgroundColor: colors.line,
    borderRadius: 99,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 99,
  },
  budgetCap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetCapLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
  },
  budgetCapRight: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink3,
  },

  // Recent section
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  seeAll: { fontSize: 13, color: colors.ink3 },

  recentRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
  },
  recentCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  recentIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  recentDesc: { fontSize: 11, color: colors.ink2, fontWeight: '500' },
  recentDate: { fontSize: 10, color: colors.ink3 },

  // Where it went
  whereTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 12,
  },
  whereCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 18,
    gap: 14,
  },
  catBarRow: { gap: 6 },
  catBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catBarIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catBarName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  catBarAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  catBarTrack: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: 99,
    overflow: 'hidden',
    marginLeft: 38,
  },
  catBarFill: {
    height: '100%',
    borderRadius: 99,
  },

  // Notif sheet
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
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  notifSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  notifSheetSub: {
    fontSize: 14,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  notifSheetItems: { width: '100%', gap: 14, marginBottom: spacing.xl },
  notifSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifSheetItemText: { fontSize: 14, color: colors.ink },
  notifSheetBtn: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  notifSheetBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  notifSheetSkip: { paddingVertical: 8 },
  notifSheetSkipText: { fontSize: 14, color: colors.ink2 },
});
