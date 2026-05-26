import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../services/api';
import { useCategoryStore } from '../stores/categoryStore';
import { useRecurringStore } from '../stores/recurringStore';
import { colors, radius, spacing } from '../theme';
import type {
  TCreateRecurring,
  TRecurrenceFrequency,
  TRecurringRun,
  TRecurringTransaction,
} from '../types/recurring';
import { DAY_NAMES, MONTH_NAMES } from '../types/recurring';

// ─── helpers ──────────────────────────────────────────────────────────────────

function freq_label(item: TRecurringTransaction): string {
  switch (item.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekly':
      return `Every ${DAY_NAMES[item.day_of_week ?? 0]}`;
    case 'monthly':
      return `Every month on the ${item.day_of_month ?? 1}${ordinal(item.day_of_month ?? 1)}`;
    case 'yearly':
      return `Every ${MONTH_NAMES[(item.month_of_year ?? 1) - 1]} ${item.day_of_month ?? 1}`;
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

  const expenseCats = categories.filter(c => !c.is_income);

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
          placeholderTextColor={colors.textLight}
        />

        {/* Amount */}
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textLight}
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
              placeholderTextColor={colors.textLight}
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
              {expenseCats.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[
                    styles.catChip,
                    { borderColor: c.color },
                    category === c.key && { backgroundColor: c.bg },
                  ]}
                  onPress={() => setCategory(c.key)}
                >
                  <Icon name={c.icon} size={14} color={c.color} />
                  <Text
                    style={[
                      styles.catChipText,
                      { color: category === c.key ? c.color : colors.textSub },
                    ]}
                  >
                    {c.name}
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
          placeholderTextColor={colors.textLight}
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
          <Icon name="close" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.runsList}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : runs.length === 0 ? (
          <View style={styles.runsEmpty}>
            <Icon name="history" size={40} color={colors.border} />
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
                  color={run.status === 'success' ? '#16A34A' : '#DC2626'}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recurring</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setSheet('add')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Icon name="repeat" size={48} color={colors.border} />
          <Text style={styles.emptyText}>No recurring transactions yet</Text>
          <Text style={styles.emptySub}>Tap + to add your first one</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {items.map(item => {
            const cat = categories.find(c => c.key === item.category);
            return (
              <View
                key={item._id}
                style={[styles.card, !item.is_active && styles.cardInactive]}
              >
                {/* Top row: name + amount */}
                <View style={styles.cardTop}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardAmount}>
                    {fmt_amount(item.amount)}
                  </Text>
                </View>

                {/* Category + frequency + next run */}
                <View style={styles.cardMeta}>
                  <View style={styles.cardMetaLeft}>
                    {cat && (
                      <>
                        <Icon name={cat.icon} size={13} color={cat.color} />
                        <Text
                          style={[styles.cardCatName, { color: cat.color }]}
                        >
                          {cat.name}
                        </Text>
                        <Text style={styles.cardMetaDot}>·</Text>
                      </>
                    )}
                    <Text style={styles.cardFreq}>{freq_label(item)}</Text>
                  </View>
                  <Text style={styles.cardNext}>
                    Next: {fmt_date(item.next_run)}
                  </Text>
                </View>
                {item.last_run ? (
                  <Text style={styles.cardLastRun}>
                    Last run: {fmt_date(item.last_run)}
                  </Text>
                ) : null}

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Footer: toggle + action icons */}
                <View style={styles.cardFooter}>
                  <View style={styles.toggleRow}>
                    <Switch
                      value={item.is_active}
                      onValueChange={v => toggle(item._id, v)}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + '60',
                      }}
                      thumbColor={
                        item.is_active ? colors.primary : colors.textLight
                      }
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <Text style={styles.toggleLabel}>
                      {item.is_active ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                  <View style={styles.cardIcons}>
                    <TouchableOpacity
                      onPress={() => setHistoryItem(item)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Icon name="history" size={18} color={colors.textSub} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSheet(item)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Icon
                        name="pencil-outline"
                        size={18}
                        color={colors.textSub}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handle_delete(item)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Icon
                        name="trash-can-outline"
                        size={18}
                        color={colors.expense}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingTop: 56,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSub,
    marginTop: spacing.sm,
  },
  emptySub: { fontSize: 13, color: colors.textLight },
  list: { padding: spacing.base, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardInactive: { opacity: 0.45 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.expense,
    letterSpacing: -0.3,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  cardCatName: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardMetaDot: {
    fontSize: 12,
    color: colors.border,
  },
  cardFreq: {
    fontSize: 13,
    color: colors.textSub,
    fontWeight: '500',
  },
  cardNext: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
    flexShrink: 0,
  },
  cardLastRun: {
    fontSize: 11,
    color: colors.textLight,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSub,
  },
  cardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: { padding: 6 },
  // form
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  formScroll: { padding: spacing.xl, paddingBottom: 40 },
  formHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub,
    marginBottom: spacing.xs,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSub },
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
    backgroundColor: colors.surface,
  },
  catChipText: { fontSize: 12, fontWeight: '500' },
  saveBtn: {
    backgroundColor: colors.primary,
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
    color: colors.text,
  },
  runsSub: {
    fontSize: 13,
    color: colors.textSub,
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
    color: colors.textSub,
  },
  runsEmptySub: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
    fontWeight: '500',
  },
  runError: {
    fontSize: 11,
    color: colors.expense,
    marginTop: 2,
  },
  runAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});
