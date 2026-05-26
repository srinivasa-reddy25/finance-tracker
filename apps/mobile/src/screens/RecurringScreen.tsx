import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { useCategoryStore } from '../stores/categoryStore';
import { useRecurringStore } from '../stores/recurringStore';
import { colors, radius, spacing } from '../theme';
import type {
  TCreateRecurring,
  TRecurrenceFrequency,
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
  const incomeCats = categories.filter(c => c.is_income);

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
        {incomeCats.length > 0 && (
          <>
            <Text style={styles.subLabel}>Income</Text>
            <View style={styles.catGrid}>
              {incomeCats.map(c => (
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RecurringScreen() {
  const navigation = useNavigation();
  const { items, loading, fetch, add, update, remove, toggle } =
    useRecurringStore();
  const { fetch: fetchCats } = useCategoryStore();

  const [sheet, setSheet] = useState<null | 'add' | TRecurringTransaction>(
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
            const cat_color = '#6B7280';
            return (
              <View
                key={item._id}
                style={[styles.card, !item.is_active && styles.cardInactive]}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardAmount}>
                      {fmt_amount(item.amount)}
                    </Text>
                  </View>
                  <Text style={styles.cardFreq}>{freq_label(item)}</Text>
                  <Text style={styles.cardNext}>
                    Next: {fmt_date(item.next_run)}
                    {item.last_run
                      ? `  ·  Last: ${fmt_date(item.last_run)}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.cardActions}>
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
                  <TouchableOpacity
                    onPress={() => setSheet(item)}
                    style={styles.iconBtn}
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
                  >
                    <Icon
                      name="trash-can-outline"
                      size={18}
                      color={colors.expense}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom sheet */}
      {sheet !== null && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBg}
            onPress={() => setSheet(null)}
          />
          <View style={styles.sheet}>
            <RecurringForm
              initial={sheet === 'add' ? null : sheet}
              onSave={handle_save}
              onClose={() => setSheet(null)}
            />
          </View>
        </View>
      )}
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
    borderRadius: radius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardInactive: { opacity: 0.5 },
  cardLeft: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardAmount: { fontSize: 15, fontWeight: '700', color: colors.expense },
  cardFreq: { fontSize: 13, color: colors.textSub },
  cardNext: { fontSize: 12, color: colors.textLight },
  cardActions: { alignItems: 'center', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
  // form
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
});
