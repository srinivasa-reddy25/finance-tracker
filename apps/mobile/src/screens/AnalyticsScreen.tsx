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
import { BarChart, PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../services/api';
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

export default function AnalyticsScreen() {
  const { categories, fetch: fetchCats } = useCategoryStore();
  const [data, setData] = useState<TAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [mon, setMon] = useState(now.getMonth() + 1);

  const isCurrentMonth =
    year === now.getFullYear() && mon === now.getMonth() + 1;

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories],
  );

  const fetchData = async (y: number, m: number) => {
    setLoading(true);
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

  // Totals
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

  // Donut data
  const donutData = useMemo(() => {
    const remaining = Math.max((totalBudget || totalSpent) - totalSpent, 0);
    const over = totalBudget > 0 && totalSpent > totalBudget;
    return [
      {
        value: totalSpent,
        color: over ? colors.expense : colors.primary,
      },
      {
        value: remaining,
        color: colors.border,
      },
    ];
  }, [totalSpent, totalBudget]);

  // Daily bar chart — fill in 0s for days with no spending
  const daysInMonth = new Date(year, mon, 0).getDate();
  const dailyBars = useMemo(() => {
    const map = new Map((data?.daily ?? []).map(d => [d.day, d.amount]));
    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: map.get(i + 1) ?? 0,
      label: (i + 1) % 5 === 1 ? String(i + 1) : '',
      frontColor: (map.get(i + 1) ?? 0) > 0 ? colors.primary : colors.border,
      topLabelComponent: undefined,
    }));
  }, [data, daysInMonth]);

  // Category breakdown sorted by amount
  const categoryRows = useMemo(() => {
    const rows = (data?.current_by_category ?? [])
      .map(c => {
        const meta = categoryMap.get(c.category);
        return { ...c, meta };
      })
      .filter(c => c.meta && !c.meta.is_income && c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const max = rows[0]?.amount ?? 1;
    return rows.map(r => ({ ...r, pct: r.amount / max }));
  }, [data, categoryMap]);

  // Month comparison
  const comparisonRows = useMemo(() => {
    const prevMap = new Map(
      (data?.prev_by_category ?? []).map(c => [c.category, c.amount]),
    );
    return (data?.current_by_category ?? [])
      .map(c => {
        const meta = categoryMap.get(c.category);
        const prev = prevMap.get(c.category) ?? 0;
        return { category: c.category, current: c.amount, prev, meta };
      })
      .filter(c => c.meta && !c.meta.is_income && (c.current > 0 || c.prev > 0))
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);
  }, [data, categoryMap]);

  const maxComparison = useMemo(
    () => Math.max(...comparisonRows.flatMap(r => [r.current, r.prev]), 1),
    [comparisonRows],
  );

  const pct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : null;
  const over = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Month Picker */}
      <View style={styles.monthPicker}>
        <TouchableOpacity onPress={goPrev} style={styles.monthBtn}>
          <Icon name="chevron-left" size={20} color={colors.textSub} />
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
          {/* ── Spending Ring ───────────────────────────── */}
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
                      ₹
                      {Math.round(totalSpent / 1000) >= 1
                        ? `${(totalSpent / 1000).toFixed(1)}k`
                        : totalSpent.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.donutSub}>
                      {totalBudget > 0 ? 'spent' : 'this month'}
                    </Text>
                  </View>
                )}
              />
              <View style={styles.donutLegend}>
                {totalBudget > 0 && (
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
                )}
                {totalBudget === 0 && (
                  <Text style={styles.noBudgetHint}>
                    Set category budgets{'\n'}to track progress
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ── Daily Spending ───────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Spending</Text>
            {dailyBars.every(b => b.value === 0) ? (
              <Text style={styles.emptyHint}>No transactions this month</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={dailyBars}
                  barWidth={7}
                  spacing={5}
                  roundedTop
                  hideRules
                  hideYAxisText
                  xAxisColor={colors.border}
                  xAxisThickness={1}
                  yAxisThickness={0}
                  noOfSections={3}
                  barBorderRadius={4}
                  labelWidth={12}
                  xAxisLabelTextStyle={styles.barLabel}
                  height={120}
                  width={Math.max(CHART_W, daysInMonth * 12)}
                  isAnimated
                  animationDuration={600}
                />
              </ScrollView>
            )}
          </View>

          {/* ── Category Breakdown ───────────────────────── */}
          {categoryRows.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>By Category</Text>
              {categoryRows.map(row => (
                <View key={row.category} style={styles.catRow}>
                  <View style={styles.catRowHeader}>
                    <View style={styles.catRowLeft}>
                      <View
                        style={[
                          styles.catDot,
                          { backgroundColor: row.meta!.bg },
                        ]}
                      >
                        <Icon
                          name={row.meta!.icon}
                          size={12}
                          color={row.meta!.color}
                        />
                      </View>
                      <Text style={styles.catName}>{row.meta!.name}</Text>
                    </View>
                    <Text style={styles.catAmount}>
                      ₹{row.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${row.pct * 100}%` as `${number}%`,
                          backgroundColor: row.meta!.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Month Comparison ─────────────────────────── */}
          {comparisonRows.length > 0 && (
            <View style={styles.card}>
              <View style={styles.compHeader}>
                <Text style={styles.cardTitle}>vs Last Month</Text>
                <View style={styles.compLegend}>
                  <View style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text style={styles.legendLabel}>This</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <Text style={styles.legendLabel}>Last</Text>
                  </View>
                </View>
              </View>

              {comparisonRows.map(row => {
                const currPct = row.current / maxComparison;
                const prevPct = row.prev / maxComparison;
                const diff = row.current - row.prev;
                return (
                  <View key={row.category} style={styles.compRow}>
                    <View style={styles.compRowLeft}>
                      <View
                        style={[
                          styles.catDot,
                          { backgroundColor: row.meta!.bg },
                        ]}
                      >
                        <Icon
                          name={row.meta!.icon}
                          size={12}
                          color={row.meta!.color}
                        />
                      </View>
                      <Text style={styles.catName} numberOfLines={1}>
                        {row.meta!.name}
                      </Text>
                    </View>
                    <View style={styles.compBars}>
                      <View style={styles.compBarRow}>
                        <View style={styles.compBarBg}>
                          <View
                            style={[
                              styles.compBarFill,
                              {
                                width: `${currPct * 100}%` as `${number}%`,
                                backgroundColor: colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.compAmt}>
                          ₹{(row.current / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View style={styles.compBarRow}>
                        <View style={styles.compBarBg}>
                          <View
                            style={[
                              styles.compBarFill,
                              {
                                width: `${prevPct * 100}%` as `${number}%`,
                                backgroundColor: colors.border,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.compAmt}>
                          ₹{(row.prev / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>
                    {row.prev > 0 && (
                      <Text
                        style={[
                          styles.diffBadge,
                          {
                            color: diff > 0 ? colors.expense : colors.income,
                          },
                        ]}
                      >
                        {diff > 0 ? '+' : ''}
                        {Math.round((diff / row.prev) * 100)}%
                      </Text>
                    )}
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
  noBudgetHint: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
  },

  // Daily bar
  barLabel: { fontSize: 9, color: colors.textLight },
  emptyHint: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // Category breakdown
  catRow: { marginBottom: spacing.md },
  catRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: 13, fontWeight: '600', color: colors.text },
  catAmount: { fontSize: 13, fontWeight: '700', color: colors.text },
  barBg: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: radius.full },

  // Comparison
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  compLegend: { flexDirection: 'row', gap: spacing.md },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  compRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  compBars: { flex: 1, gap: 4 },
  compBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  compBarFill: { height: 6, borderRadius: radius.full },
  compAmt: {
    fontSize: 10,
    color: colors.textSub,
    width: 36,
    textAlign: 'right',
  },
  diffBadge: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
});
