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
import { colors, spacing, radius, shadow } from '../theme';
import type { TTransaction } from '../types/transaction';
import ConfirmDialog from '../components/ConfirmDialog';

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

type TSection = { title: string; data: TTransaction[] };

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

function groupByDate(transactions: TTransaction[]): TSection[] {
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
    return { title, data };
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
    color: '#6B7280',
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
      <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
        {/* Circle icon */}
        <View style={[styles.txIconCircle, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={20} color={meta.color} />
        </View>

        {/* Info */}
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

        {/* Amount */}
        <Text
          style={[
            styles.txAmount,
            { color: isIncome ? colors.income : colors.text },
          ]}
        >
          {isIncome ? '+' : ''}₹{item.amount.toLocaleString('en-IN')}
        </Text>
      </View>
    </Swipeable>
  );
}

export default function HistoryScreen() {
  const { transactions, pagination, loading, fetch, remove } =
    useTransactionStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
  } = useCategoryStore();
  const [filter, setFilter] = useState<TFilter>(ALL);
  const [page, setPage] = useState(1);
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

  const sections = useMemo(() => groupByDate(transactions), [transactions]);

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
    (p = 1) => ({
      page: p,
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
    fetch(buildParams(page));
  }, [filter, page, datePreset]);

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetch(buildParams(1));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const handleFilterSelect = useCallback((f: TFilter) => {
    setFilter(f);
    setPage(1);
    setFilterOpen(false);
  }, []);

  const handlePresetSelect = useCallback((preset: TDatePreset) => {
    setDatePreset(preset);
    setPage(1);
    setDateSheetOpen(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch(buildParams(1));
      setPage(1);
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
      ? 'Month'
      : datePreset === '30d'
        ? '30d'
        : datePreset === '60d'
          ? '60d'
          : '90d';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.headerDateBadge}>
          <Icon
            name="calendar-month-outline"
            size={13}
            color={colors.primary}
          />
          <Text style={styles.headerDateText}>
            {new Date().toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {/* Search + Date + Filter toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Icon name="magnify" size={15} color={colors.textLight} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={14} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Date preset button */}
        <TouchableOpacity
          onPress={() => setDateSheetOpen(true)}
          style={[
            styles.filterBtn,
            dateActive && {
              backgroundColor: colors.primaryLight,
              borderColor: colors.primary,
            },
          ]}
        >
          <Icon
            name="calendar-range"
            size={14}
            color={dateActive ? colors.primary : colors.textSub}
          />
          <Text
            style={[
              styles.filterBtnText,
              dateActive && { color: colors.primary },
            ]}
          >
            {dateBtnLabel}
          </Text>
          {dateActive && (
            <TouchableOpacity
              onPress={() => handlePresetSelect('this_month')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={13} color={colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Category filter button */}
        <TouchableOpacity
          onPress={() => setFilterOpen(true)}
          style={[
            styles.filterBtn,
            filter !== ALL && {
              backgroundColor: activeFilterMeta!.bg,
              borderColor: activeFilterMeta!.color,
            },
          ]}
        >
          <Icon
            name={filter !== ALL ? activeFilterMeta!.icon : 'tune-variant'}
            size={14}
            color={filter !== ALL ? activeFilterMeta!.color : colors.textSub}
          />
          <Text
            style={[
              styles.filterBtnText,
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
              <Icon name="close" size={13} color={activeFilterMeta!.color} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {(loading || catLoading) && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 64 }} color={colors.primary} />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon
              name="receipt-text-outline"
              size={32}
              color={colors.textLight}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? 'No results found' : 'No transactions'}
          </Text>
          <Text style={styles.emptySub}>
            {search ? 'Try a different search' : 'Add one from the home screen'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item._id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <SwipeableRow
              item={item}
              onDeleteRequest={setDeleteTarget}
              categoryMap={categoryMap}
              isLast={index === section.data.length - 1}
            />
          )}
          SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            pagination && pagination.total_pages > 1 && !search ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={page === 1}
                  onPress={() => setPage(p => p - 1)}
                  style={[styles.pageBtn, page === 1 && styles.pageBtnOff]}
                >
                  <Icon
                    name="chevron-left"
                    size={16}
                    color={page === 1 ? colors.border : colors.primary}
                  />
                  <Text
                    style={[
                      styles.pageBtnTxt,
                      { color: page === 1 ? colors.border : colors.primary },
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>
                <Text style={styles.pageNum}>
                  {page} / {pagination.total_pages}
                </Text>
                <TouchableOpacity
                  disabled={page === pagination.total_pages}
                  onPress={() => setPage(p => p + 1)}
                  style={[
                    styles.pageBtn,
                    page === pagination.total_pages && styles.pageBtnOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageBtnTxt,
                      {
                        color:
                          page === pagination.total_pages
                            ? colors.border
                            : colors.primary,
                      },
                    ]}
                  >
                    Next
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={16}
                    color={
                      page === pagination.total_pages
                        ? colors.border
                        : colors.primary
                    }
                  />
                </TouchableOpacity>
              </View>
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
                          ? colors.primary
                          : colors.primaryLight,
                      },
                    ]}
                  >
                    <Icon
                      name={preset.icon}
                      size={15}
                      color={active ? '#FFF' : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.sheetOptionText,
                        active && { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text style={styles.sheetOptionSub}>{preset.sublabel}</Text>
                  </View>
                  {active && (
                    <Icon
                      name="check-circle"
                      size={18}
                      color={colors.primary}
                    />
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
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Icon
                  name="view-grid-outline"
                  size={15}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sheetOptionText,
                    filter === ALL && {
                      color: colors.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  All categories
                </Text>
              </View>
              {filter === ALL && (
                <Icon name="check-circle" size={18} color={colors.primary} />
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
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  headerDateText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, padding: 0 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSub },

  listContent: { paddingBottom: 100 },

  sectionHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionGap: { height: 4 },

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
    borderBottomColor: colors.border,
  },

  txIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  txInfo: { flex: 1 },
  txDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  txMeta: { fontSize: 12, color: colors.textSub },
  txNote: { fontSize: 11, color: colors.textLight, marginTop: 1 },

  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingTop: 2,
  },

  deleteAction: {
    backgroundColor: colors.expense,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },

  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.textMed },
  emptySub: { fontSize: 13, color: colors.textLight },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  pageBtnOff: { backgroundColor: colors.inputBg },
  pageBtnTxt: { fontSize: 13, fontWeight: '600' },
  pageNum: { fontSize: 13, color: colors.textSub },

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
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  sheetOptionActive: { backgroundColor: colors.inputBg },
  sheetIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: { fontSize: 14, color: colors.textMed, fontWeight: '500' },
  sheetOptionSub: { fontSize: 11, color: colors.textLight, marginTop: 1 },
});
