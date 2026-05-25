import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { colors, radius, spacing } from '../theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - spacing.base * 2 - 32;

type TDailyPoint = { day: number; amount: number };
type TCatAmount = { category: string; amount: number };
type TAnalyticsData = {
  daily: TDailyPoint[];
  current_by_category: TCatAmount[];
  prev_by_category: TCatAmount[];
};

function monthLabel(year: number, mon: number) {
  return new Date(year, mon - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function prevMonth(year: number, mon: number): [number, number] {
  if (mon === 1) return [year - 1, 12];
  return [year, mon - 1];
}

function fmtK(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

export default function AnalyticsScreen() {
  const { categories, fetch: fetchCats } = useCategoryStore();
  const { user } = useAuthStore();
  const [data, setData] = useState<TAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPie, setSelectedPie] = useState<number | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [mon, setMon] = useState(now.getMonth() + 1);

  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime)
    : null;
  const joinYear = joinDate?.getFullYear() ?? 2000;
  const joinMon = joinDate ? joinDate.getMonth() + 1 : 1;

  const isCurrentMonth =
    year === now.getFullYear() && mon === now.getMonth() + 1;
  const isJoinMonth = year === joinYear && mon === joinMon;

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories],
  );

  const fetchData = async (y: number, m: number) => {
    setLoading(true);
    setSelectedPie(null);
    try {
      const month = `${y}-${String(m).padStart(2, '0')}`;
      const res = await api.get('/analytics', { params: { month } });
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
    fetchData(year, mon);
  }, []);

  const goNext = () => {
    if (isCurrentMonth) return;
    const [ny, nm] = mon === 12 ? [year + 1, 1] : [year, mon + 1];
    setYear(ny);
    setMon(nm);
    fetchData(ny, nm);
  };

  const goPrev = () => {
    const [ny, nm] = prevMonth(year, mon);
    setYear(ny);
    setMon(nm);
    fetchData(ny, nm);
  };

  const totalSpent = useMemo(
    () => (data?.current_by_category ?? []).reduce((s, c) => s + c.amount, 0),
    [data],
  );

  const totalBudget = useMemo(
    () =>
      categories
        .filter(c => !c.is_income && c.budget != null)
        .reduce((s, c) => s + (c.budget ?? 0), 0),
    [categories],
  );

  // Donut ring data
  const donutData = useMemo(() => {
    const remaining = Math.max((totalBudget || totalSpent) - totalSpent, 0);
    const over = totalBudget > 0 && totalSpent > totalBudget;
    return [
      { value: totalSpent, color: over ? colors.expense : colors.primary },
      { value: remaining, color: colors.border },
    ];
  }, [totalSpent, totalBudget]);

  // Area line chart data (all days of month)
  const daysInMonth = new Date(year, mon, 0).getDate();
  const lineData = useMemo(() => {
    const map = new Map((data?.daily ?? []).map(d => [d.day, d.amount]));
    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: map.get(i + 1) ?? 0,
      label: (i + 1) % 7 === 1 ? String(i + 1) : '',
      dataPointText: '',
    }));
  }, [data, daysInMonth]);

  const hasAnySpend = lineData.some(d => d.value > 0);
  const maxDaily = Math.max(...lineData.map(d => d.value), 1);

  // Pie chart — category breakdown
  const categoryRows = useMemo(() => {
    const rows = (data?.current_by_category ?? [])
      .map(c => ({ ...c, meta: categoryMap.get(c.category) }))
      .filter(c => c.meta && !c.meta.is_income && c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return rows;
  }, [data, categoryMap]);

  const pieData = useMemo(
    () =>
      categoryRows.map((r, i) => ({
        value: r.amount,
        color: r.meta!.color,
        focused: selectedPie === i,
      })),
    [categoryRows, selectedPie],
  );

  // Comparison rows
  const comparisonRows = useMemo(() => {
    const prevMap = new Map(
      (data?.prev_by_category ?? []).map(c => [c.category, c.amount]),
    );
    return (data?.current_by_category ?? [])
      .map(c => ({
        ...c,
        meta: categoryMap.get(c.category),
        prev: prevMap.get(c.category) ?? 0,
      }))
      .filter(c => c.meta && !c.meta.is_income && (c.amount > 0 || c.prev > 0))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [data, categoryMap]);

  const pct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : null;
  const over = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Month Picker */}
      <View style={styles.monthPicker}>
        <TouchableOpacity
          onPress={goPrev}
          style={styles.monthBtn}
          disabled={isJoinMonth}
        >
          <Icon
            name="chevron-left"
            size={20}
            color={isJoinMonth ? colors.border : colors.textSub}
          />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel(year, mon)}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={styles.monthBtn}
          disabled={isCurrentMonth}
        >
          <Icon
            name="chevron-right"
            size={20}
            color={isCurrentMonth ? colors.border : colors.textSub}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 80 }}
          color={colors.primary}
          size="large"
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Spending Ring ─────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Snapshot</Text>
            <View style={styles.donutWrap}>
              <PieChart
                donut
                data={donutData}
                radius={90}
                innerRadius={66}
                strokeWidth={0}
                centerLabelComponent={() => (
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutAmount}>
                      {totalSpent >= 1000
                        ? `₹${(totalSpent / 1000).toFixed(1)}k`
                        : `₹${totalSpent}`}
                    </Text>
                    <Text style={styles.donutSub}>
                      {totalBudget > 0 ? 'spent' : 'this month'}
                    </Text>
                  </View>
                )}
              />
              <View style={styles.donutLegend}>
                {totalBudget > 0 ? (
                  <>
                    <View style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor: over
                              ? colors.expense
                              : colors.primary,
                          },
                        ]}
                      />
                      <Text style={styles.legendLabel}>
                        Spent · ₹{totalSpent.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <Text style={styles.legendLabel}>
                        Budget · ₹{totalBudget.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.pctPill}>
                      <Text
                        style={[
                          styles.pctText,
                          { color: over ? colors.expense : colors.primary },
                        ]}
                      >
                        {over
                          ? `${Math.round(((totalSpent - totalBudget) / totalBudget) * 100)}% over`
                          : `${Math.round((pct ?? 0) * 100)}% used`}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.noBudgetHint}>
                    Set category budgets{'\n'}to track progress
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ── Daily Spending (Area Chart) ───────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Spending</Text>
            {!hasAnySpend ? (
              <Text style={styles.emptyHint}>No transactions this month</Text>
            ) : (
              <View style={{ marginTop: 4 }}>
                <LineChart
                  areaChart
                  curved
                  data={lineData}
                  width={CHART_W}
                  height={130}
                  color={colors.primary}
                  thickness={2}
                  startFillColor={colors.primary}
                  endFillColor={colors.primaryLight}
                  startOpacity={0.25}
                  endOpacity={0.02}
                  dataPointsColor={colors.primary}
                  dataPointsRadius={3}
                  hideDataPoints={false}
                  xAxisColor={colors.border}
                  xAxisThickness={1}
                  yAxisThickness={0}
                  hideRules
                  hideYAxisText
                  xAxisLabelTextStyle={styles.axisLabel}
                  noOfSections={3}
                  maxValue={maxDaily * 1.2}
                  isAnimated
                  animationDuration={700}
                  onPress={(item: { value: number }, index: number) => {
                    // no-op — data point tap
                  }}
                />
                {/* Max spend label */}
                <View style={styles.dailyHint}>
                  <Text style={styles.dailyHintText}>
                    Peak: {fmtK(maxDaily)}
                  </Text>
                  <Text style={styles.dailyHintText}>
                    Total: {fmtK(totalSpent)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Category Pie ──────────────────────────── */}
          {categoryRows.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>By Category</Text>
              <View style={styles.pieWrap}>
                <PieChart
                  data={pieData}
                  radius={100}
                  strokeWidth={2}
                  strokeColor={colors.surface}
                  focusOnPress
                  onPress={(_item: unknown, index: number) =>
                    setSelectedPie(prev => (prev === index ? null : index))
                  }
                  isAnimated
                />
              </View>

              {/* Legend */}
              <View style={styles.pieLegend}>
                {categoryRows.map((row, i) => {
                  const pctVal =
                    totalSpent > 0
                      ? Math.round((row.amount / totalSpent) * 100)
                      : 0;
                  const active = selectedPie === i;
                  return (
                    <TouchableOpacity
                      key={row.category}
                      style={[
                        styles.legendItem,
                        active && styles.legendItemActive,
                      ]}
                      onPress={() =>
                        setSelectedPie(prev => (prev === i ? null : i))
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.legendLeft}>
                        <View
                          style={[
                            styles.legendSwatch,
                            { backgroundColor: row.meta!.color },
                          ]}
                        />
                        <View
                          style={[
                            styles.legendIcon,
                            { backgroundColor: row.meta!.bg },
                          ]}
                        >
                          <Icon
                            name={row.meta!.icon}
                            size={12}
                            color={row.meta!.color}
                          />
                        </View>
                        <Text style={styles.legendName} numberOfLines={1}>
                          {row.meta!.name}
                        </Text>
                      </View>
                      <View style={styles.legendRight}>
                        <Text
                          style={[styles.legendPct, { color: row.meta!.color }]}
                        >
                          {pctVal}%
                        </Text>
                        <Text style={styles.legendAmt}>
                          ₹{row.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── VS Last Month ─────────────────────────── */}
          {comparisonRows.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>vs Last Month</Text>
              {comparisonRows.map(row => {
                const diff = row.amount - row.prev;
                const diffPct =
                  row.prev > 0
                    ? Math.round(Math.abs(diff / row.prev) * 100)
                    : null;
                const isUp = diff > 0;
                const isDown = diff < 0;
                return (
                  <View key={row.category} style={styles.compRow}>
                    <View
                      style={[
                        styles.compIcon,
                        { backgroundColor: row.meta!.bg },
                      ]}
                    >
                      <Icon
                        name={row.meta!.icon}
                        size={16}
                        color={row.meta!.color}
                      />
                    </View>
                    <View style={styles.compInfo}>
                      <Text style={styles.compName}>{row.meta!.name}</Text>
                      <Text style={styles.compPrev}>
                        Last: {row.prev > 0 ? fmtK(row.prev) : '—'}
                      </Text>
                    </View>
                    <View style={styles.compRight}>
                      <Text style={styles.compCurrent}>{fmtK(row.amount)}</Text>
                      {diffPct != null && (
                        <View
                          style={[
                            styles.diffBadge,
                            {
                              backgroundColor: isUp
                                ? colors.expenseLight
                                : colors.incomeLight,
                            },
                          ]}
                        >
                          <Icon
                            name={isUp ? 'trending-up' : 'trending-down'}
                            size={10}
                            color={isUp ? colors.expense : colors.income}
                          />
                          <Text
                            style={[
                              styles.diffText,
                              { color: isUp ? colors.expense : colors.income },
                            ]}
                          >
                            {diffPct}%
                          </Text>
                        </View>
                      )}
                      {!isUp && !isDown && (
                        <Text style={styles.diffSame}>No change</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
    paddingHorizontal: spacing.base,
    paddingTop: 56,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },

  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    minWidth: 160,
    textAlign: 'center',
  },

  scroll: { paddingHorizontal: spacing.base, paddingBottom: 100 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },

  // Donut
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  donutCenter: { alignItems: 'center' },
  donutAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  donutSub: { fontSize: 11, color: colors.textSub, marginTop: 2 },
  donutLegend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 13, color: colors.textMed, fontWeight: '500' },
  pctPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.inputBg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pctText: { fontSize: 13, fontWeight: '700' },
  noBudgetHint: { fontSize: 12, color: colors.textLight, lineHeight: 18 },

  // Daily area chart
  axisLabel: { fontSize: 9, color: colors.textLight },
  emptyHint: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  dailyHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  dailyHintText: { fontSize: 11, color: colors.textSub, fontWeight: '500' },

  // Pie chart
  pieWrap: { alignItems: 'center', marginBottom: spacing.base },
  pieLegend: { gap: 6 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  legendItemActive: { backgroundColor: colors.inputBg },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  legendSwatch: { width: 10, height: 10, borderRadius: 5 },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendName: { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1 },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendPct: { fontSize: 13, fontWeight: '700', width: 36, textAlign: 'right' },
  legendAmt: {
    fontSize: 12,
    color: colors.textSub,
    width: 72,
    textAlign: 'right',
  },

  // Comparison
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  compIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  compInfo: { flex: 1 },
  compName: { fontSize: 14, fontWeight: '600', color: colors.text },
  compPrev: { fontSize: 11, color: colors.textSub, marginTop: 1 },
  compRight: { alignItems: 'flex-end', gap: 4 },
  compCurrent: { fontSize: 15, fontWeight: '700', color: colors.text },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  diffText: { fontSize: 11, fontWeight: '700' },
  diffSame: { fontSize: 11, color: colors.textLight },
});
