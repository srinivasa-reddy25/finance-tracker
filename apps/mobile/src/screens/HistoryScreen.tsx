import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
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
import {
  CATEGORIES,
  CATEGORY_META,
  type TCategory,
} from '../constants/categories';
import { colors, spacing, radius, shadow } from '../theme';
import type { TTransaction } from '../types/transaction';
import ConfirmDialog from '../components/ConfirmDialog';

const ALL = 'all' as const;
type TFilter = TCategory | typeof ALL;

type TDatePreset = 'this_month' | '30d' | '60d' | '90d';

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

const COL_CAT = 44;
const COL_DATE = 64;
const COL_AMOUNT = 62;
const COL_GAP = 20;

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function SwipeableRow({
  item,
  index,
  onDeleteRequest,
}: {
  item: TTransaction;
  index: number;
  onDeleteRequest: (item: TTransaction) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const meta = CATEGORY_META[item.category];
  const isIncome = item.category === 'salary';
  const date = new Date(item.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
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
        <Text style={styles.deleteActionText}>Delete</Text>
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
      <View
        style={[styles.row, index % 2 === 1 && styles.rowAlt, { gap: COL_GAP }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.nameCell} numberOfLines={1}>
            {item.description}
          </Text>
          {item.note ? (
            <Text style={styles.noteCell} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
        </View>

        <View style={{ width: COL_CAT, alignItems: 'center' }}>
          <View style={[styles.catIcon, { backgroundColor: meta.bg }]}>
            <Icon name={meta.icon} size={14} color={meta.color} />
          </View>
        </View>

        <Text style={styles.dateCell}>{date}</Text>

        <Text
          style={[
            styles.amountCell,
            { color: isIncome ? colors.income : colors.expense },
          ]}
        >
          {isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
        </Text>
      </View>
    </Swipeable>
  );
}

export default function HistoryScreen() {
  const { transactions, pagination, loading, fetch, remove } =
    useTransactionStore();
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

  const activeFilterMeta = filter !== ALL ? CATEGORY_META[filter] : null;
  const dateActive = datePreset !== 'this_month';
  const activeDateMeta = DATE_PRESETS.find(p => p.key === datePreset)!;
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
            placeholder="Search..."
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
            {filter === ALL
              ? 'Filter'
              : filter.charAt(0).toUpperCase() + filter.slice(1)}
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

      {/* Date preset sheet */}
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

      <View style={styles.tableWrapper}>
        {/* Table header */}
        <View style={[styles.tableHead, { gap: COL_GAP }]}>
          <Text style={[styles.th, { flex: 1 }]}>Name</Text>
          <Text style={[styles.th, { width: COL_CAT, textAlign: 'center' }]}>
            Cat.
          </Text>
          <Text style={[styles.th, { width: COL_DATE }]}>Date</Text>
          <Text style={[styles.th, { width: COL_AMOUNT, textAlign: 'right' }]}>
            Amount
          </Text>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
        ) : transactions.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="receipt-text-outline" size={36} color={colors.border} />
            <Text style={styles.emptyText}>
              {search ? 'No results found' : 'No transactions'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={item => item._id}
            style={styles.table}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item, index }) => (
              <SwipeableRow
                item={item}
                index={index}
                onDeleteRequest={setDeleteTarget}
              />
            )}
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
      </View>

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

            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              const active = filter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleFilterSelect(cat)}
                  style={[
                    styles.sheetOption,
                    active && styles.sheetOptionActive,
                  ]}
                >
                  <View
                    style={[
                      styles.sheetIcon,
                      { backgroundColor: active ? meta.color : meta.bg },
                    ]}
                  >
                    <Icon
                      name={meta.icon}
                      size={15}
                      color={active ? '#FFF' : meta.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.sheetOptionText,
                        active && { color: meta.color, fontWeight: '700' },
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </View>
                  {active && (
                    <Icon name="check-circle" size={18} color={meta.color} />
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
  headerDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

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

  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    backgroundColor: colors.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tableWrapper: {
    flex: 1,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  table: { flex: 1, backgroundColor: colors.surface },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowAlt: { backgroundColor: '#FAFBFC' },

  nameCell: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  noteCell: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  dateCell: {
    width: COL_DATE,
    fontSize: 12,
    color: colors.textSub,
  },
  amountCell: {
    width: COL_AMOUNT,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },

  catIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteAction: {
    backgroundColor: colors.expense,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    gap: 4,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 64,
    gap: spacing.md,
    backgroundColor: colors.surface,
    flex: 1,
  },
  emptyText: { fontSize: 14, color: colors.textLight },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  sheetOptionText: {
    fontSize: 14,
    color: colors.textMed,
    fontWeight: '500',
  },
  sheetOptionSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
});
