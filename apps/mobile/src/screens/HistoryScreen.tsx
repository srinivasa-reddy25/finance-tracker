import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTransactionStore } from '../stores/transactionStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionModalStore } from '../stores/transactionModalStore';
import { colors, spacing, radius, shadow } from '../theme';
import type { TTransaction } from '../types/transaction';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

const ALL = 'all' as const;
type TFilter = string | typeof ALL;

type TCategoryMeta = {
  icon: string;
  color: string;
  bg: string;
  name: string;
  is_income: boolean;
};

type TDatePreset = 'this_month' | '30d' | '60d' | '90d';

type TSection = { title: string; data: TTransaction[]; total: number };

const DATE_PRESETS: {
  key: TDatePreset;
  label: string;
  sublabel: string;
  icon: string;
}[] = [
  {
    key: 'this_month',
    label: 'This month',
    sublabel: 'Current calendar month',
    icon: 'calendar-today',
  },
  {
    key: '30d',
    label: 'Last 30 days',
    sublabel: 'Rolling 30-day window',
    icon: 'calendar-clock',
  },
  {
    key: '60d',
    label: 'Last 60 days',
    sublabel: 'Rolling 60-day window',
    icon: 'calendar-clock',
  },
  {
    key: '90d',
    label: 'Last 90 days',
    sublabel: 'Rolling 90-day window',
    icon: 'calendar-clock',
  },
];

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function groupByDate(
  transactions: TTransaction[],
  catMap: Map<string, TCategoryMeta>,
): TSection[] {
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const groups = new Map<string, TTransaction[]>();

  for (const tx of transactions) {
    const key = new Date(tx.date).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  return Array.from(groups.entries()).map(([key, data]) => {
    let title: string;
    if (key === todayStr) title = 'Today';
    else if (key === yesterdayStr) title = 'Yesterday';
    else
      title = new Date(key).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    const total = data.reduce((s, t) => {
      const m = catMap.get(t.category);
      return m?.is_income ? s : s + t.amount;
    }, 0);

    return { title, data, total };
  });
}

function SwipeableRow({
  item,
  onDeleteRequest,
  categoryMap,
  isLast,
}: {
  item: TTransaction;
  onDeleteRequest: (item: TTransaction) => void;
  categoryMap: Map<string, TCategoryMeta>;
  isLast: boolean;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const meta = categoryMap.get(item.category) ?? {
    icon: 'shape-outline',
    color: '#7A746B',
    bg: '#F3F4F6',
    name: item.category,
    is_income: false,
  };
  const isIncome = meta.is_income;

  const time = new Date(item.date).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeRef.current?.close();
          onDeleteRequest(item);
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon name="trash-can-outline" size={22} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={[styles.txRow, !isLast && styles.txRowBorder]}
        onPress={() => useTransactionModalStore.getState().openEdit(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.txIconCircle, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.txMeta} numberOfLines={1}>
            {meta.name}
            {'  ·  '}
            {time}
          </Text>
          {item.note ? (
            <Text style={styles.txNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.txAmount,
            { color: isIncome ? colors.income : colors.ink },
          ]}
        >
          {isIncome ? '+' : ''}₹{item.amount.toLocaleString('en-IN')}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function HistoryScreen() {
  const {
    transactions,
    pagination,
    loading,
    loadingMore,
    fetch,
    fetchMore,
    remove,
  } = useTransactionStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
  } = useCategoryStore();
  const [filter, setFilter] = useState<TFilter>(ALL);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<TDatePreset>('this_month');
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TTransaction | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryMap = useMemo(
    () =>
      new Map<string, TCategoryMeta>(
        categories.map(c => [
          c.key,
          {
            icon: c.icon,
            color: c.color,
            bg: c.bg,
            name: c.name,
            is_income: c.is_income,
          },
        ]),
      ),
    [categories],
  );

  const sections = useMemo(
    () => groupByDate(transactions, categoryMap),
    [transactions, categoryMap],
  );

  const getDateParams = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    switch (datePreset) {
      case '30d':
        return { from: daysAgoStr(30), to: today };
      case '60d':
        return { from: daysAgoStr(60), to: today };
      case '90d':
        return { from: daysAgoStr(90), to: today };
      default:
        return { month: currentMonth };
    }
  }, [datePreset, currentMonth]);

  const buildParams = useCallback(
    () => ({
      page: 1,
      category: filter === ALL ? undefined : filter,
      search: search.trim() || undefined,
      ...getDateParams(),
    }),
    [filter, search, getDateParams],
  );

  useEffect(() => {
    fetchCats();
  }, []);

  useEffect(() => {
    fetch(buildParams());
  }, [filter, datePreset]);

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(buildParams());
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const handleFilterSelect = useCallback((f: TFilter) => {
    setFilter(f);
    setFilterOpen(false);
  }, []);

  const handlePresetSelect = useCallback((preset: TDatePreset) => {
    setDatePreset(preset);
    setDateSheetOpen(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch(buildParams());
    } finally {
      setRefreshing(false);
    }
  }, [filter, search, datePreset]);

  const handleDelete = useCallback(
    (item: TTransaction) => {
      remove(item._id);
    },
    [remove],
  );

  const activeFilterMeta =
    filter !== ALL ? (categoryMap.get(filter) ?? null) : null;
  const dateActive = datePreset !== 'this_month';
  const dateBtnLabel =
    datePreset === 'this_month'
      ? new Date().toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric',
        })
      : datePreset === '30d'
        ? '30 days'
        : datePreset === '60d'
          ? '60 days'
          : '90 days';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.monthPill}>
          <Text style={styles.monthPillText}>
            {new Date().toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Icon name="magnify" size={15} color={colors.ink3} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor={colors.ink3}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={14} color={colors.ink3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips row */}
      <View style={styles.chipRow}>
        <TouchableOpacity
          onPress={() => setDateSheetOpen(true)}
          style={[
            styles.filterChip,
            dateActive && {
              backgroundColor: colors.accentSoft,
              borderColor: colors.accent,
            },
          ]}
        >
          <Icon
            name="calendar-range"
            size={13}
            color={dateActive ? colors.accent : colors.ink2}
          />
          <Text
            style={[
              styles.filterChipText,
              dateActive && { color: colors.accent },
            ]}
          >
            {dateBtnLabel}
          </Text>
          {dateActive && (
            <TouchableOpacity
              onPress={() => handlePresetSelect('this_month')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={12} color={colors.accent} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterOpen(true)}
          style={[
            styles.filterChip,
            filter !== ALL && {
              backgroundColor: activeFilterMeta!.bg,
              borderColor: activeFilterMeta!.color,
            },
          ]}
        >
          <Icon
            name={filter !== ALL ? activeFilterMeta!.icon : 'tune-variant'}
            size={13}
            color={filter !== ALL ? activeFilterMeta!.color : colors.ink2}
          />
          <Text
            style={[
              styles.filterChipText,
              filter !== ALL && { color: activeFilterMeta!.color },
            ]}
          >
            {filter === ALL ? 'Filter' : (activeFilterMeta?.name ?? filter)}
          </Text>
          {filter !== ALL && (
            <TouchableOpacity
              onPress={() => handleFilterSelect(ALL)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={12} color={activeFilterMeta!.color} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {(loading || catLoading) && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 64 }} color={colors.accent} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title={search ? 'No results found' : 'No transactions'}
          subtitle={
            search ? 'Try a different search' : 'Add one from the home screen'
          }
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item._id}
          stickySectionHeadersEnabled={false}
          onEndReached={() => fetchMore(buildParams())}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.total > 0 && (
                <Text style={styles.sectionTotal}>
                  −₹{section.total.toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View
              style={[
                styles.sectionCard,
                index === 0 && styles.sectionCardFirst,
                index === section.data.length - 1 && styles.sectionCardLast,
              ]}
            >
              <SwipeableRow
                item={item}
                onDeleteRequest={setDeleteTarget}
                categoryMap={categoryMap}
                isLast={index === section.data.length - 1}
              />
            </View>
          )}
          SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.footerSpinner}
                color={colors.accent}
              />
            ) : null
          }
        />
      )}

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete transaction"
        message={`Remove "${deleteTarget?.description}"? This can't be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
      />

      {/* Date preset bottom sheet */}
      <Modal
        visible={dateSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDateSheetOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDateSheetOpen(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Date range</Text>
            {DATE_PRESETS.map(preset => {
              const active = datePreset === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  onPress={() => handlePresetSelect(preset.key)}
                  style={[
                    styles.sheetOption,
                    active && styles.sheetOptionActive,
                  ]}
                >
                  <View
                    style={[
                      styles.sheetIcon,
                      {
                        backgroundColor: active
                          ? colors.accent
                          : colors.accentSoft,
                      },
                    ]}
                  >
                    <Icon
                      name={preset.icon}
                      size={15}
                      color={active ? '#FFF' : colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.sheetOptionText,
                        active && { color: colors.accent, fontWeight: '700' },
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text style={styles.sheetOptionSub}>{preset.sublabel}</Text>
                  </View>
                  {active && (
                    <Icon name="check-circle" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category filter bottom sheet */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setFilterOpen(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter by category</Text>

            <TouchableOpacity
              onPress={() => handleFilterSelect(ALL)}
              style={[
                styles.sheetOption,
                filter === ALL && styles.sheetOptionActive,
              ]}
            >
              <View
                style={[
                  styles.sheetIcon,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Icon
                  name="view-grid-outline"
                  size={15}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sheetOptionText,
                    filter === ALL && {
                      color: colors.accent,
                      fontWeight: '700',
                    },
                  ]}
                >
                  All categories
                </Text>
              </View>
              {filter === ALL && (
                <Icon name="check-circle" size={18} color={colors.accent} />
              )}
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            {categories.map(cat => {
              const active = filter === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => handleFilterSelect(cat.key)}
                  style={[
                    styles.sheetOption,
                    active && styles.sheetOptionActive,
                  ]}
                >
                  <View
                    style={[
                      styles.sheetIcon,
                      { backgroundColor: active ? cat.color : cat.bg },
                    ]}
                  >
                    <Icon
                      name={cat.icon}
                      size={15}
                      color={active ? '#FFF' : cat.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.sheetOptionText,
                        active && { color: cat.color, fontWeight: '700' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </View>
                  {active && (
                    <Icon name="check-circle" size={18} color={cat.color} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },

  header: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.03 * 30,
  },
  monthPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  monthPillText: { fontSize: 13, fontWeight: '700', color: colors.accent },

  searchRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: colors.canvas,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.ink, padding: 0 },

  chipRow: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    backgroundColor: colors.canvas,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },

  listContent: { paddingBottom: 100, paddingTop: 4 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.expense,
  },
  sectionGap: { height: 4 },

  sectionCard: {
    marginHorizontal: 14,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  sectionCardFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sectionCardLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  txRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  txRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },

  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  txInfo: { flex: 1 },
  txDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  txMeta: { fontSize: 12.5, color: colors.ink2 },
  txNote: { fontSize: 11, color: colors.ink3, marginTop: 1 },

  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingTop: 2,
    color: colors.ink,
  },

  deleteAction: {
    backgroundColor: colors.expense,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },

  footerSpinner: { paddingVertical: spacing.xl },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 90,
    ...shadow.strong,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.line,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 6,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  sheetOptionActive: { backgroundColor: colors.surface2 },
  sheetIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: { fontSize: 14, color: colors.ink2, fontWeight: '500' },
  sheetOptionSub: { fontSize: 11, color: colors.ink3, marginTop: 1 },
});
