import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { colors, radius, spacing, shadow, typography } from '../theme';
import { formatAmount } from '../utils/format';
import { ANALYTICS_LINE_CHART_DAYS } from '../constants/config';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - spacing.base * 2 - 32;

// Brand-aligned palette — greens + warm earthy tones
const BRAND_PALETTE = [
  '#0E7B53', // accent
  '#1A9966',
  '#0B5C3E',
  '#2EB87A',
  '#6BBF99',
  '#A8D8C2',
  '#5C7A6B',
  '#3D6B55',
];

// Pie chart layout constants
const PIE_R = 110;
const INNER_R = 72;
const FOCUS_EXTRA = 8;
const CONN_HORIZ = 22;
const PIE_LABEL_PAD = 72;
const PIE_SVG_H = (PIE_R + FOCUS_EXTRA + PIE_LABEL_PAD) * 2;
const LABEL_MIN_GAP = 20; // min vertical px between labels on same side
const PIE_CX = CHART_W / 2;
const PIE_CY = PIE_LABEL_PAD + PIE_R + FOCUS_EXTRA;

// SVG donut helpers — angles in degrees from TOP (12 o'clock), clockwise
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
  gap = 2,
): string {
  const sa = startDeg + gap;
  const ea = endDeg - gap;
  if (ea - sa < 0.5) return '';
  const largeArc = ea - sa > 180 ? 1 : 0;
  const o1 = polar(cx, cy, outerR, sa);
  const o2 = polar(cx, cy, outerR, ea);
  const i1 = polar(cx, cy, innerR, ea);
  const i2 = polar(cx, cy, innerR, sa);
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x} ${i2.y} Z`;
}

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
  const { user } = useAuthStore();
  const [data, setData] = useState<TAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fetchData = async (y: number, m: number) => {
    setLoading(true);
    setSelectedPie(null);
    try {
      const month = `${y}-${String(m).padStart(2, '0')}`;
      const res = await api.get('/analytics', { params: { month, tz } });
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSelectedPie(null);
    try {
      const month = `${year}-${String(mon).padStart(2, '0')}`;
      const res = await api.get('/analytics', { params: { month, tz } });
      setData(res.data.data);
    } finally {
      setRefreshing(false);
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
      { value: totalSpent, color: over ? colors.expense : colors.accent },
      { value: remaining, color: '#E8E3D9' },
    ];
  }, [totalSpent, totalBudget]);

  // Area line chart — last N days only
  const daysInMonth = new Date(year, mon, 0).getDate();
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const firstDay = Math.max(1, lastDay - (ANALYTICS_LINE_CHART_DAYS - 1));
  const lineData = useMemo(() => {
    const map = new Map((data?.daily ?? []).map(d => [d.day, d.amount]));
    return Array.from({ length: lastDay - firstDay + 1 }, (_, i) => {
      const day = firstDay + i;
      return {
        value: map.get(day) ?? 0,
        label: String(day),
        dataPointText: '',
      };
    });
  }, [data, firstDay, lastDay]);

  const hasAnySpend = lineData.some(d => d.value > 0);
  const maxDaily = Math.max(...lineData.map(d => d.value), 1);

  const monShort = new Date(year, mon - 1, 1).toLocaleString('en-IN', {
    month: 'short',
  });
  const barData = useMemo(() => {
    const map = new Map((data?.daily ?? []).map(d => [d.day, d.amount]));
    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      const value = map.get(day) ?? 0;
      return {
        value,
        label: `${monShort} ${day}`,
        frontColor: value > 0 ? colors.accent : 'transparent',
      };
    });
  }, [data, lastDay, monShort]);

  // Pie chart — category breakdown
  const categoryRows = useMemo(() => {
    const rows = (data?.current_by_category ?? [])
      .map(c => ({ ...c, meta: categoryMap.get(c.category) }))
      .filter(c => c.meta && !c.meta.is_income && c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return rows;
  }, [data, categoryMap]);

  // Custom SVG donut — all slice geometry computed here
  const sliceConfigs = useMemo(() => {
    if (!categoryRows.length) return [];
    const total = categoryRows.reduce((s, r) => s + r.amount, 0);
    if (total === 0) return [];
    const GAP = 2;
    let deg = 0;
    const raw = categoryRows.map((row, i) => {
      const angleDeg = (row.amount / total) * 360;
      const startDeg = deg;
      const endDeg = deg + angleDeg;
      deg = endDeg;
      const midDeg = startDeg + angleDeg / 2;
      const isFocused = selectedPie === i;
      const outerR = PIE_R + (isFocused ? FOCUS_EXTRA : 0);
      const path = donutArc(
        PIE_CX,
        PIE_CY,
        outerR,
        INNER_R,
        startDeg,
        endDeg,
        GAP,
      );
      const cs = polar(PIE_CX, PIE_CY, outerR + 8, midDeg);
      const ce = polar(PIE_CX, PIE_CY, outerR + 30, midDeg);
      const isLeft = ce.x < PIE_CX;
      const ct = { x: ce.x + (isLeft ? -CONN_HORIZ : CONN_HORIZ), y: ce.y };
      const pct = Math.round((row.amount / total) * 100);
      return {
        path,
        color: BRAND_PALETTE[i % BRAND_PALETTE.length],
        cs,
        ce,
        ct,
        isLeft,
        name: row.meta!.name,
        amountStr: formatAmount(row.amount),
        pct,
        meta: row.meta!,
        amount: row.amount,
        labelY: ce.y, // will be adjusted below
      };
    });

    // Collision avoidance — spread labels that are too close on the same side
    const spread = (indices: number[]) => {
      // sort by raw y
      const sorted = [...indices].sort((a, b) => raw[a].ce.y - raw[b].ce.y);
      // forward pass: push down
      for (let k = 1; k < sorted.length; k++) {
        const prev = raw[sorted[k - 1]].labelY;
        if (raw[sorted[k]].labelY - prev < LABEL_MIN_GAP) {
          raw[sorted[k]].labelY = prev + LABEL_MIN_GAP;
        }
      }
      // backward pass: pull up (keeps cluster centred)
      for (let k = sorted.length - 2; k >= 0; k--) {
        const next = raw[sorted[k + 1]].labelY;
        if (next - raw[sorted[k]].labelY < LABEL_MIN_GAP) {
          raw[sorted[k]].labelY = next - LABEL_MIN_GAP;
        }
      }
    };

    const leftIdx = raw.map((_, i) => i).filter(i => raw[i].isLeft);
    const rightIdx = raw.map((_, i) => i).filter(i => !raw[i].isLeft);
    spread(leftIdx);
    spread(rightIdx);

    return raw;
  }, [categoryRows, selectedPie]);

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
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
            color={isJoinMonth ? colors.line : colors.ink2}
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
            color={isCurrentMonth ? colors.line : colors.ink2}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 80 }}
          color={colors.accent}
          size="large"
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {/* ── Monthly Snapshot ──────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.snapshotTitle}>MONTHLY SNAPSHOT</Text>
            <View style={styles.donutWrap}>
              {/* Custom SVG ring with rounded caps on the spent arc */}
              {(() => {
                const RING_SIZE = 160;
                const STROKE = 22;
                const cx = RING_SIZE / 2;
                const cy = RING_SIZE / 2;
                const r = cx - STROKE / 2 - 2;
                const circumference = 2 * Math.PI * r;
                const spentPct = totalBudget > 0 ? Math.min(pct ?? 0, 1) : 0;
                const dashOffset = circumference * (1 - spentPct);
                const arcColor = over ? colors.expense : colors.accent;
                return (
                  <View style={{ width: RING_SIZE, height: RING_SIZE }}>
                    <Svg width={RING_SIZE} height={RING_SIZE}>
                      {/* Background track */}
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        stroke="#E8E3D9"
                        strokeWidth={STROKE}
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Spent arc — rounded caps, starts from top */}
                      {spentPct > 0 && (
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          stroke={arcColor}
                          strokeWidth={STROKE}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          rotation={-90}
                          originX={cx}
                          originY={cy}
                        />
                      )}
                    </Svg>
                    {/* Center label */}
                    <View style={[StyleSheet.absoluteFill, styles.donutCenter]}>
                      <Text style={styles.donutPct}>
                        {totalBudget > 0
                          ? `${Math.round((pct ?? 0) * 100)}%`
                          : '—'}
                      </Text>
                      <Text style={styles.donutSub}>used</Text>
                    </View>
                  </View>
                );
              })()}
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
                              : colors.accent,
                          },
                        ]}
                      />
                      <Text style={styles.legendLabel}>Spent</Text>
                      <Text style={styles.legendAmt}>
                        ₹{totalSpent.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: '#E8E3D9' },
                        ]}
                      />
                      <Text style={styles.legendLabel}>Budget</Text>
                      <Text style={styles.legendAmt}>
                        ₹{totalBudget.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor: over
                              ? colors.expense
                              : colors.accent,
                          },
                        ]}
                      />
                      <Text style={styles.legendLabel}>Left</Text>
                      <Text
                        style={[
                          styles.legendAmt,
                          {
                            color: over ? colors.expense : colors.accent,
                            fontFamily: typography.bold,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        ₹
                        {Math.max(totalBudget - totalSpent, 0).toLocaleString(
                          'en-IN',
                        )}
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

          {/* ── Daily Spending (Bar Chart) ────────────── */}
          <View style={styles.card}>
            <View style={styles.dailyHeader}>
              <Text style={styles.snapshotTitle}>DAILY SPENDING</Text>
              <Text style={styles.dailyPeak}>
                Peak{' '}
                {maxDaily >= 1000
                  ? `₹${(maxDaily / 1000).toFixed(1)}k`
                  : `₹${maxDaily}`}
              </Text>
            </View>
            {!hasAnySpend ? (
              <Text style={styles.emptyHint}>No transactions this month</Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                <BarChart
                  data={barData}
                  width={CHART_W - 8}
                  height={150}
                  barWidth={Math.max(
                    20,
                    Math.min(
                      44,
                      Math.floor((CHART_W - 40) / barData.length) - 8,
                    ),
                  )}
                  spacing={Math.max(
                    6,
                    Math.floor((CHART_W - 40) / barData.length) -
                      Math.max(
                        20,
                        Math.min(
                          44,
                          Math.floor((CHART_W - 40) / barData.length) - 8,
                        ),
                      ),
                  )}
                  initialSpacing={4}
                  barBorderTopLeftRadius={4}
                  barBorderTopRightRadius={4}
                  frontColor={colors.accent}
                  noOfSections={3}
                  maxValue={Math.ceil(maxDaily * 1.3)}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  hideRules
                  hideYAxisText
                  xAxisLabelTextStyle={styles.axisLabel}
                  isAnimated
                  animationDuration={600}
                />
              </View>
            )}
          </View>

          {/* ── Category Pie ──────────────────────────── */}
          {categoryRows.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>By Category</Text>
              <View style={styles.pieContainer}>
                {/* Fully custom SVG donut — slices + caps + connectors + labels */}
                <Svg width={CHART_W} height={PIE_SVG_H}>
                  {/* Slices */}
                  {sliceConfigs.map((s, i) => (
                    <G
                      key={i}
                      onPress={() =>
                        setSelectedPie(prev => (prev === i ? null : i))
                      }
                    >
                      <Path d={s.path} fill={s.color} />
                    </G>
                  ))}
                  {/* Connector lines + labels (drawn on top) */}
                  {sliceConfigs.map((s, i) => {
                    const lx = s.ct.x;
                    const ly = s.labelY;
                    return (
                      <G key={`lbl-${i}`}>
                        {/* Radial segment: slice edge → elbow */}
                        <Line
                          x1={s.cs.x}
                          y1={s.cs.y}
                          x2={s.ce.x}
                          y2={s.ce.y}
                          stroke={s.color}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                        {/* Diagonal/horizontal segment: elbow → label anchor */}
                        <Line
                          x1={s.ce.x}
                          y1={s.ce.y}
                          x2={lx}
                          y2={ly}
                          stroke={s.color}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                        <SvgText
                          x={lx + (s.isLeft ? -4 : 4)}
                          y={ly - 2}
                          fontSize={10}
                          fontWeight="600"
                          fill={colors.ink}
                          textAnchor={s.isLeft ? 'end' : 'start'}
                        >
                          {s.name}
                        </SvgText>
                        <SvgText
                          x={lx + (s.isLeft ? -4 : 4)}
                          y={ly + 11}
                          fontSize={9}
                          fontWeight="500"
                          fill={s.color}
                          textAnchor={s.isLeft ? 'end' : 'start'}
                        >
                          {s.amountStr}
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
                {/* Center tooltip — absolute overlay over the donut hole */}
                <View style={styles.pieCenterOverlay}>
                  {selectedPie === null || !sliceConfigs[selectedPie] ? (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterHint}>Tap a{'\n'}slice</Text>
                    </View>
                  ) : (
                    <View style={styles.pieCenter}>
                      <View
                        style={[
                          styles.pieCenterIcon,
                          {
                            backgroundColor: sliceConfigs[selectedPie]!.meta.bg,
                          },
                        ]}
                      >
                        <Icon
                          name={sliceConfigs[selectedPie]!.meta.icon}
                          size={16}
                          color={sliceConfigs[selectedPie]!.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.pieCenterName,
                          { color: sliceConfigs[selectedPie]!.color },
                        ]}
                        numberOfLines={1}
                      >
                        {sliceConfigs[selectedPie]!.meta.name}
                      </Text>
                      <Text style={styles.pieCenterAmt}>
                        {sliceConfigs[selectedPie]!.amountStr}
                      </Text>
                      <Text style={styles.pieCenterPct}>
                        {sliceConfigs[selectedPie]!.pct}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ── VS Last Month ─────────────────────────── */}
          {comparisonRows.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>vs Last Month</Text>
              {comparisonRows.map((row, i) => {
                const diff = row.amount - row.prev;
                const diffPct =
                  row.prev > 0
                    ? Math.round(Math.abs(diff / row.prev) * 100)
                    : null;
                const isUp = diff > 0;
                const isDown = diff < 0;
                const brandColor = BRAND_PALETTE[i % BRAND_PALETTE.length];
                return (
                  <View key={row.category} style={styles.compRow}>
                    <View
                      style={[
                        styles.compIcon,
                        { backgroundColor: colors.accentSoft },
                      ]}
                    >
                      <Icon
                        name={row.meta!.icon}
                        size={16}
                        color={brandColor}
                      />
                    </View>
                    <View style={styles.compInfo}>
                      <Text style={styles.compName}>{row.meta!.name}</Text>
                      <Text style={styles.compPrev}>
                        Last: {row.prev > 0 ? formatAmount(row.prev) : '—'}
                      </Text>
                    </View>
                    <View style={styles.compRight}>
                      <Text style={styles.compCurrent}>
                        {formatAmount(row.amount)}
                      </Text>
                      {diffPct != null && (
                        <View
                          style={[
                            styles.diffBadge,
                            {
                              backgroundColor: isUp
                                ? colors.expenseSoft
                                : colors.incomeSoft,
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
  container: { flex: 1, backgroundColor: colors.canvas },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.extrabold,
    fontWeight: '800',
    color: colors.ink,
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
    backgroundColor: colors.surface2,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 160,
    textAlign: 'center',
  },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: typography.bold,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },
  snapshotTitle: {
    fontSize: 11,
    fontFamily: typography.bold,
    fontWeight: '700',
    color: colors.ink3,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
  },

  // Donut
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  donutCenter: { alignItems: 'center', justifyContent: 'center' },
  donutPct: {
    fontSize: 24,
    fontFamily: typography.extrabold,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  donutSub: { fontSize: 12, color: colors.ink2, marginTop: 1 },
  donutLegend: { flex: 1, gap: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.ink2,
    fontFamily: typography.medium,
    fontWeight: '500',
  },
  legendAmt: {
    fontSize: 14,
    color: colors.ink,
    fontFamily: typography.medium,
    fontWeight: '500',
  },
  pctPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pctText: { fontSize: 13, fontWeight: '700' },
  noBudgetHint: { fontSize: 12, color: colors.ink3, lineHeight: 18 },

  // Daily area chart
  axisLabel: { fontSize: 9, color: colors.ink3 },
  emptyHint: {
    fontSize: 13,
    color: colors.ink3,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dailyPeak: {
    fontSize: 12,
    color: colors.ink2,
    fontFamily: typography.medium,
    fontWeight: '500',
  },
  dailyHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  dailyHintText: { fontSize: 11, color: colors.ink2, fontWeight: '500' },
  chartTooltip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  chartTooltipAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  chartTooltipDay: {
    fontSize: 10,
    color: colors.ink2,
    fontWeight: '500',
  },

  // Pie chart
  pieContainer: {
    width: '100%',
    height: PIE_SVG_H,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  pieCenterOverlay: {
    position: 'absolute',
    left: PIE_CX - INNER_R,
    top: PIE_CY - INNER_R,
    width: INNER_R * 2,
    height: INNER_R * 2,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 144,
    gap: 2,
  },
  pieCenterHint: {
    fontSize: 12,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 17,
  },
  pieCenterIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pieCenterName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 100,
  },
  pieCenterAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  pieCenterPct: { fontSize: 11, color: colors.ink2, fontWeight: '600' },

  // Comparison
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
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
  compName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  compPrev: { fontSize: 11, color: colors.ink2, marginTop: 1 },
  compRight: { alignItems: 'flex-end', gap: 4 },
  compCurrent: { fontSize: 15, fontWeight: '700', color: colors.ink },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  diffText: { fontSize: 11, fontWeight: '700' },
  diffSame: { fontSize: 11, color: colors.ink3 },
});
