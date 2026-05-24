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
  ScrollView,
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

const COL_CAT = 44;
const COL_DATE = 64;
const COL_AMOUNT = 62;
const COL_GAP = 20;

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
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TTransaction | null>(null);

  // Date range
  const [fromMonth, setFromMonth] = useState<string | null>(null);
  const [toMonth, setToMonth] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [monthPickerTarget, setMonthPickerTarget] = useState<'from' | 'to'>(
    'from',
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasDateRange = fromMonth !== null || toMonth !== null;

  // Convert YYYY-MM to from/to ISO date strings
  const monthToFrom = (m: string) => `${m}-01`;
  const monthToTo = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    const last = new Date(y!, mo!, 0).getDate();
    return `${m}-${String(last).padStart(2, '0')}`;
  };

  const buildParams = useCallback(
    (p = 1) => ({
      page: p,
      category: filter === ALL ? undefined : filter,
      search: search.trim() || undefined,
      ...(hasDateRange
        ? {
            from: fromMonth ? monthToFrom(fromMonth) : undefined,
            to: toMonth ? monthToTo(toMonth) : undefined,
          }
        : { month: currentMonth }),
    }),
    [filter, search, fromMonth, toMonth, hasDateRange, currentMonth],
  );

  useEffect(() => {
    fetch(buildParams(page));
  }, [filter, page, fromMonth, toMonth]);

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

  const filtered = transactions;

  const handleFilterSelect = useCallback((f: TFilter) => {
    setFilter(f);
    setPage(1);
    setFilterOpen(false);
  }, []);

  const clearDateRange = useCallback(() => {
    setFromMonth(null);
    setToMonth(null);
    setPage(1);
  }, []);

  const openMonthPicker = (target: 'from' | 'to') => {
    setMonthPickerTarget(target);
    setMonthPickerOpen(true);
  };

  // Build last 24 months list
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  const formatMonth = (m: string) =>
    new Date(m + '-01').toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch(buildParams(1));
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  }, [filter, search, fromMonth, toMonth]);

  const handleDelete = useCallback(
    (item: TTransaction) => {
      remove(item._id);
    },
    [remove],
  );

  const activeFilterMeta = filter !== ALL ? CATEGORY_META[filter] : null;

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

      {/* Search + Filter */}
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

      {/* Date range row */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[styles.dateBtn, fromMonth && styles.dateBtnActive]}
          onPress={() => openMonthPicker('from')}
        >
          <Icon
            name="calendar-start"
            size={13}
            color={fromMonth ? colors.primary : colors.textSub}
          />
          <Text
            style={[styles.dateBtnText, fromMonth && { color: colors.primary }]}
          >
            {fromMonth ? formatMonth(fromMonth) : 'From'}
          </Text>
        </TouchableOpacity>

        <Icon name="arrow-right" size={14} color={colors.border} />

        <TouchableOpacity
          style={[styles.dateBtn, toMonth && styles.dateBtnActive]}
          onPress={() => openMonthPicker('to')}
        >
          <Icon
            name="calendar-end"
            size={13}
            color={toMonth ? colors.primary : colors.textSub}
          />
          <Text
            style={[styles.dateBtnText, toMonth && { color: colors.primary }]}
          >
            {toMonth ? formatMonth(toMonth) : 'To'}
          </Text>
        </TouchableOpacity>

        {hasDateRange && (
          <TouchableOpacity onPress={clearDateRange} style={styles.dateClear}>
            <Icon name="close-circle" size={16} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Month picker modal */}
      <Modal
        visible={monthPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.monthOverlay}
          activeOpacity={1}
          onPress={() => setMonthPickerOpen(false)}
        >
          <View style={styles.monthSheet}>
            <Text style={styles.monthSheetTitle}>
              {monthPickerTarget === 'from' ? 'From month' : 'To month'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {monthOptions.map(m => {
                const isSelected =
                  monthPickerTarget === 'from'
                    ? fromMonth === m
                    : toMonth === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.monthOption,
                      isSelected && styles.monthOptionActive,
                    ]}
                    onPress={() => {
                      if (monthPickerTarget === 'from') setFromMonth(m);
                      else setToMonth(m);
                      setPage(1);
                      setMonthPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        isSelected && {
                          color: colors.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {formatMonth(m)}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="receipt-text-outline" size={36} color={colors.border} />
            <Text style={styles.emptyText}>
              {search ? 'No results found' : 'No transactions'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
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

      {/* Filter bottom sheet */}
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
              {filter === ALL && (
                <Icon name="check" size={16} color={colors.primary} />
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
                  <Text
                    style={[
                      styles.sheetOptionText,
                      active && { color: meta.color, fontWeight: '700' },
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                  {active && <Icon name="check" size={16} color={meta.color} />}
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

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSub,
  },
  dateClear: {
    padding: 4,
  },
  monthOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  monthSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: 360,
  },
  monthSheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  monthOptionActive: { backgroundColor: colors.primaryLight },
  monthOptionText: { fontSize: 15, color: colors.textMed, fontWeight: '500' },

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
    paddingVertical: 8,
  },
  sheetOptionActive: { backgroundColor: colors.inputBg },
  sheetIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMed,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
