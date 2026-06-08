import React, { useMemo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toggle from '../components/Toggle';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../services/api';
import { useCategoryStore } from '../stores/categoryStore';
import { useThemeStore } from '../stores/themeStore';
import { useRecurringStore } from '../stores/recurringStore';
import {
  useColors,
  TColors,
  catBg,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme';
import type {
  TCreateRecurring,
  TRecurrenceFrequency,
  TRecurringRun,
  TRecurringTransaction,
} from '../types/recurring';
import { DAY_NAMES, MONTH_NAMES } from '../types/recurring';

// ─── helpers ──────────────────────────────────────────────────────────────────

function freq_label(item: TRecurringTransaction): string {
  const day = item.day_of_month ?? 1;
  switch (item.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return `Every week · ${DAY_NAMES[item.day_of_week ?? 0]}`;
    case 'monthly':
      return `Every month · ${day}${ordinal(day)}`;
    case 'yearly':
      return `Every year · ${MONTH_NAMES[(item.month_of_year ?? 1) - 1]} ${day}`;
  }
}

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function fmt_date(s: string): string {
  return new Date(s).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmt_amount(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

// ─── Form sheet ───────────────────────────────────────────────────────────────

type FormProps = {
  initial?: TRecurringTransaction | null;
  onSave: (data: TCreateRecurring) => Promise<void>;
  onClose: () => void;
};

function RecurringForm({ initial, onSave, onClose }: FormProps) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { isDark } = useThemeStore();
  const { categories } = useCategoryStore();

  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(
    initial?.amount ? String(initial.amount) : '',
  );
  const [category, setCategory] = useState(initial?.category ?? '');
  const [frequency, setFrequency] = useState<TRecurrenceFrequency>(
    initial?.frequency ?? 'monthly',
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    String(initial?.day_of_month ?? 1),
  );
  const [dayOfWeek, setDayOfWeek] = useState(initial?.day_of_week ?? 1);
  const [monthOfYear, setMonthOfYear] = useState(initial?.month_of_year ?? 1);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [saving, setSaving] = useState(false);

  const expenseCats = categories.filter(cat => !cat.is_income);

  const handle_save = async () => {
    if (!name.trim()) return Alert.alert('Missing', 'Enter a name');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return Alert.alert('Missing', 'Enter a valid amount');
    if (!category) return Alert.alert('Missing', 'Pick a category');

    const dom = parseInt(dayOfMonth, 10);
    if (
      (frequency === 'monthly' || frequency === 'yearly') &&
      (isNaN(dom) || dom < 1 || dom > 31)
    ) {
      return Alert.alert('Invalid', 'Day must be between 1 and 31');
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        amount: amt,
        category,
        frequency,
        day_of_month:
          frequency === 'monthly' || frequency === 'yearly' ? dom : undefined,
        day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
        month_of_year: frequency === 'yearly' ? monthOfYear : undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const freq_options: TRecurrenceFrequency[] = [
    'daily',
    'weekly',
    'monthly',
    'yearly',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formScroll}
      >
        <View style={styles.formHandle} />
        <Text style={styles.formTitle}>
          {initial ? 'Edit Recurring' : 'New Recurring'}
        </Text>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Netflix, Rent, Salary"
          placeholderTextColor={c.ink3}
        />

        {/* Amount */}
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={c.ink3}
        />

        {/* Frequency */}
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.chipRow}>
          {freq_options.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, frequency === f && styles.chipActive]}
              onPress={() => setFrequency(f)}
            >
              <Text
                style={[
                  styles.chipText,
                  frequency === f && styles.chipTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Frequency detail */}
        {frequency === 'weekly' && (
          <>
            <Text style={styles.label}>Day of week</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.chipRow}>
                {DAY_NAMES.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, dayOfWeek === i && styles.chipActive]}
                    onPress={() => setDayOfWeek(i)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        dayOfWeek === i && styles.chipTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {(frequency === 'monthly' || frequency === 'yearly') && (
          <>
            <Text style={styles.label}>Day of month</Text>
            <TextInput
              style={styles.input}
              value={dayOfMonth}
              onChangeText={setDayOfMonth}
              keyboardType="numeric"
              placeholder="1–31"
              placeholderTextColor={c.ink3}
            />
          </>
        )}

        {frequency === 'yearly' && (
          <>
            <Text style={styles.label}>Month</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.chipRow}>
                {MONTH_NAMES.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.chip,
                      monthOfYear === i + 1 && styles.chipActive,
                    ]}
                    onPress={() => setMonthOfYear(i + 1)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        monthOfYear === i + 1 && styles.chipTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        {expenseCats.length > 0 && (
          <>
            <Text style={styles.subLabel}>Expenses</Text>
            <View style={styles.catGrid}>
              {expenseCats.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catChip,
                    { borderColor: cat.color },
                    category === cat.key && {
                      backgroundColor: catBg(cat.bg, cat.color, isDark),
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Icon name={cat.icon} size={14} color={cat.color} />
                  <Text
                    style={[
                      styles.catChipText,
                      { color: category === cat.key ? cat.color : c.ink2 },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Note */}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Family plan"
          placeholderTextColor={c.ink3}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handle_save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Run history modal ────────────────────────────────────────────────────────

function fmt_datetime(s: string): string {
  return new Date(s).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type RunHistoryProps = {
  item: TRecurringTransaction;
  onClose: () => void;
};

function RunHistoryModal({ item, onClose }: RunHistoryProps) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [runs, setRuns] = useState<TRecurringRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/recurring/${item._id}/runs`)
      .then(res => setRuns(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item._id]);

  return (
    <View style={styles.sheet}>
      <View style={styles.formHandle} />
      <View style={styles.runsHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.runsTitle}>Run History</Text>
          <Text style={styles.runsSub} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={20} color={c.ink3} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.runsList}
      >
        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 32 }} />
        ) : runs.length === 0 ? (
          <View style={styles.runsEmpty}>
            <Icon name="history" size={40} color={c.line} />
            <Text style={styles.runsEmptyText}>No runs yet</Text>
            <Text style={styles.runsEmptySub}>
              Runs will appear here after the cron fires
            </Text>
          </View>
        ) : (
          runs.map(run => (
            <View key={run._id} style={styles.runRow}>
              <View
                style={[
                  styles.runStatus,
                  run.status === 'success'
                    ? styles.runSuccess
                    : styles.runFailed,
                ]}
              >
                <Icon
                  name={run.status === 'success' ? 'check' : 'close'}
                  size={12}
                  color={run.status === 'success' ? '#0E7B53' : '#C5392C'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.runDate}>{fmt_datetime(run.fired_at)}</Text>
                {run.status === 'failed' && run.error ? (
                  <Text style={styles.runError} numberOfLines={2}>
                    {run.error}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.runAmount}>{fmt_amount(run.amount)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RecurringScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { isDark } = useThemeStore();
  const navigation = useNavigation();
  const { items, loading, fetch, add, update, remove, toggle } =
    useRecurringStore();
  const { categories, fetch: fetchCats } = useCategoryStore();

  const [sheet, setSheet] = useState<null | 'add' | TRecurringTransaction>(
    null,
  );
  const [historyItem, setHistoryItem] = useState<TRecurringTransaction | null>(
    null,
  );

  useEffect(() => {
    fetch();
    fetchCats();
  }, []);

  const handle_delete = (item: TRecurringTransaction) => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove(item._id),
      },
    ]);
  };

  const handle_save = async (data: TCreateRecurring) => {
    if (sheet && sheet !== 'add') {
      await update(sheet._id, data);
    } else {
      await add(data);
    }
  };

  const activeItems = items.filter(i => i.is_active);
  const committedTotal = activeItems.reduce((s, i) => s + i.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.canvas}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recurring</Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIcon}>
                <Icon name="repeat" size={22} color={c.accent} />
              </View>
              <View>
                <Text style={styles.summarySubLabel}>Committed monthly</Text>
                <Text style={styles.summaryAmount}>
                  ₹{committedTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryCount}>{activeItems.length}</Text>
              <Text style={styles.summaryCountLabel}>active</Text>
            </View>
          </View>

          {/* Items list */}
          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="repeat" size={48} color={c.line} />
              <Text style={styles.emptyText}>
                No recurring transactions yet
              </Text>
              <Text style={styles.emptySub}>Tap "Add recurring" below</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {items.map((item, idx) => {
                const cat = categories.find(c => c.key === item.category);
                const inactive = !item.is_active;
                return (
                  <React.Fragment key={item._id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.itemRow}
                      onPress={() => setSheet(item)}
                      onLongPress={() => handle_delete(item)}
                      activeOpacity={0.7}
                    >
                      {/* Icon + name + amount — dimmed when inactive */}
                      <View
                        style={[
                          styles.itemIcon,
                          {
                            backgroundColor: catBg(
                              cat?.bg ?? c.accentSoft,
                              cat?.color ?? c.accent,
                              isDark,
                            ),
                          },
                          inactive && styles.itemInactive,
                        ]}
                      >
                        <Icon
                          name={cat?.icon ?? 'repeat'}
                          size={20}
                          color={cat?.color ?? c.accent}
                        />
                      </View>

                      <View
                        style={[
                          styles.itemInfo,
                          inactive && styles.itemInactive,
                        ]}
                      >
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemFreq}>{freq_label(item)}</Text>
                      </View>

                      <View style={styles.itemRight}>
                        <Text
                          style={[
                            styles.itemAmount,
                            inactive && styles.itemInactive,
                          ]}
                        >
                          ₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                        <Toggle
                          value={item.is_active}
                          onValueChange={v => toggle(item._id, v)}
                        />
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Add recurring button */}
          <TouchableOpacity
            style={styles.addCard}
            onPress={() => setSheet('add')}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={18} color={c.ink2} />
            <Text style={styles.addCardText}>Add recurring</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Form modal */}
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <TouchableOpacity
          style={styles.overlayBg}
          activeOpacity={1}
          onPress={() => setSheet(null)}
        />
        <View style={styles.sheet}>
          <RecurringForm
            initial={sheet === 'add' ? null : (sheet as any)}
            onSave={handle_save}
            onClose={() => setSheet(null)}
          />
        </View>
      </Modal>

      {/* Run history modal */}
      <Modal
        visible={historyItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryItem(null)}
      >
        <TouchableOpacity
          style={styles.overlayBg}
          activeOpacity={1}
          onPress={() => setHistoryItem(null)}
        />
        {historyItem && (
          <RunHistoryModal
            item={historyItem}
            onClose={() => setHistoryItem(null)}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: TColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.canvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingTop: 56,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -0.4,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    scroll: { padding: spacing.base, gap: spacing.md, paddingBottom: 120 },

    // Summary card
    summaryCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.line,
      padding: spacing.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...shadow.sm,
    },
    summaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summarySubLabel: {
      fontSize: 12,
      fontFamily: typography.medium,
      color: c.ink2,
      marginBottom: 2,
    },
    summaryAmount: {
      fontSize: 24,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -0.5,
    },
    summaryRight: { alignItems: 'flex-end' },
    summaryCount: {
      fontSize: 32,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -1,
    },
    summaryCountLabel: {
      fontSize: 12,
      fontFamily: typography.medium,
      color: c.ink2,
    },

    // Items list
    listCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.line,
      overflow: 'hidden',
      ...shadow.sm,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.line },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: 14,
      gap: spacing.md,
    },
    itemInactive: { opacity: 0.45 },
    itemIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemInfo: { flex: 1 },
    itemName: {
      fontSize: 15,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink,
      marginBottom: 3,
    },
    itemFreq: {
      fontSize: 13,
      fontFamily: typography.regular,
      color: c.ink2,
    },
    itemRight: { alignItems: 'flex-end', gap: 4 },
    itemAmount: {
      fontSize: 15,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink,
      letterSpacing: -0.3,
    },

    // Add button
    addCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.line,
      borderStyle: 'dashed',
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...shadow.sm,
    },
    addCardText: {
      fontSize: 15,
      fontFamily: typography.medium,
      fontWeight: '500',
      color: c.ink2,
    },

    emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
    emptyText: { fontSize: 16, fontWeight: '600', color: c.ink2 },
    emptySub: { fontSize: 13, color: c.ink3 },
    // form
    overlayBg: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '90%',
    },
    formScroll: { padding: spacing.xl, paddingBottom: 40 },
    formHandle: {
      width: 36,
      height: 4,
      backgroundColor: c.line,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.ink,
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.ink2,
      marginBottom: spacing.xs,
    },
    subLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: c.ink3,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.surface2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: 15,
      color: c.ink,
      marginBottom: spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 13, fontWeight: '500', color: c.ink2 },
    chipTextActive: { color: '#fff' },
    catGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      backgroundColor: c.surface,
    },
    catChipText: { fontSize: 12, fontWeight: '500' },
    saveBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    // run history
    runsHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    runsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.ink,
    },
    runsSub: {
      fontSize: 13,
      color: c.ink2,
      marginTop: 2,
    },
    runsList: {
      paddingHorizontal: spacing.xl,
      paddingBottom: 40,
      gap: spacing.sm,
    },
    runsEmpty: {
      alignItems: 'center',
      paddingTop: 48,
      gap: 8,
    },
    runsEmptyText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.ink2,
    },
    runsEmptySub: {
      fontSize: 13,
      color: c.ink3,
      textAlign: 'center',
    },
    runRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    runStatus: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    runSuccess: { backgroundColor: '#DCFCE7' },
    runFailed: { backgroundColor: '#FEE2E2' },
    runDate: {
      fontSize: 13,
      color: c.ink,
      fontWeight: '500',
    },
    runError: {
      fontSize: 11,
      color: c.expense,
      marginTop: 2,
    },
    runAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: c.ink,
    },
  });
}
