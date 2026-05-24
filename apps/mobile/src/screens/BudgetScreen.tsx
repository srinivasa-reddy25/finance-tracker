import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CATEGORY_META, EXPENSE_CATEGORIES } from '../constants/categories';
import { useBudgetStore } from '../stores/budgetStore';
import { useCategoryStore } from '../stores/categoryStore';
import { colors, radius, shadow, spacing } from '../theme';
import type { TBudget } from '../types/budget';

const AMBER = '#D97706';
const AMBER_BG = '#FEF3C7';
const OVERALL_KEY = '__overall__';

function progressColor(pct: number) {
  if (pct >= 100) return colors.expense;
  if (pct >= 70) return AMBER;
  return colors.income;
}

type TCategoryMeta = {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
};

const OVERALL_META: TCategoryMeta = {
  key: OVERALL_KEY,
  label: 'Overall',
  icon: 'wallet-outline',
  color: colors.primary,
  bg: colors.primaryLight,
};

export default function BudgetScreen() {
  const navigation = useNavigation();
  const { budgets, loading, fetch, upsert, remove } = useBudgetStore();
  const { categories: customCats, fetch: fetchCats } = useCategoryStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<TBudget | null>(null);
  const [selectedCat, setSelectedCat] = useState<TCategoryMeta | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    fetch();
    fetchCats();
  }, []);

  const allCategoryOptions: TCategoryMeta[] = [
    OVERALL_META,
    ...EXPENSE_CATEGORIES.map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      ...CATEGORY_META[key],
    })),
    ...customCats.map(c => ({
      key: c.name.toLowerCase(),
      label: c.name,
      icon: c.icon,
      color: c.color,
      bg: c.bg,
    })),
  ];

  const budgetedKeys = new Set(budgets.map(b => b.category));
  const unbudgetedCats = allCategoryOptions.filter(
    c => !budgetedKeys.has(c.key),
  );

  const overallBudget = budgets.find(b => b.category === OVERALL_KEY) ?? null;
  const categoryBudgets = budgets.filter(b => b.category !== OVERALL_KEY);

  const getCatMeta = (category: string): TCategoryMeta => {
    if (category === OVERALL_KEY) return OVERALL_META;
    return (
      allCategoryOptions.find(c => c.key === category) ?? {
        key: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        icon: 'shape-outline',
        color: colors.textSub,
        bg: colors.inputBg,
      }
    );
  };

  const openAdd = () => {
    setEditBudget(null);
    setSelectedCat(unbudgetedCats[0] ?? null);
    setAmountStr('');
    setSheetOpen(true);
  };

  const openEdit = (b: TBudget) => {
    setEditBudget(b);
    setSelectedCat(getCatMeta(b.category));
    setAmountStr(String(b.amount));
    setSheetOpen(true);
  };

  const handleSave = async () => {
    const amount = parseFloat(amountStr);
    if (!selectedCat || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await upsert(selectedCat.key, amount);
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const totalCatBudgeted = categoryBudgets.reduce((s, b) => s + b.amount, 0);
  const totalCatSpent = categoryBudgets.reduce((s, b) => s + b.spent, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Budgets</Text>
        <View style={styles.headerBadge}>
          <Icon
            name="calendar-month-outline"
            size={13}
            color={colors.primary}
          />
          <Text style={styles.headerBadgeText}>
            {new Date().toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 64 }} color={colors.primary} />
      ) : (
        <FlatList
          data={categoryBudgets}
          keyExtractor={b => b._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Overall budget card */}
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>Overall limit</Text>
              </View>
              {overallBudget ? (
                <BudgetCard
                  budget={overallBudget}
                  meta={OVERALL_META}
                  onPress={() => openEdit(overallBudget)}
                  isOverall
                />
              ) : (
                <TouchableOpacity
                  style={styles.emptyOverallCard}
                  onPress={() => {
                    setEditBudget(null);
                    setSelectedCat(OVERALL_META);
                    setAmountStr('');
                    setSheetOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.emptyOverallIcon}>
                    <Icon
                      name="wallet-plus-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyOverallTitle}>
                      Set overall budget
                    </Text>
                    <Text style={styles.emptyOverallSub}>
                      Cap your total monthly spending
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              )}

              {/* Category budgets header */}
              <View style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                <Text style={styles.sectionLabelText}>By category</Text>
                {unbudgetedCats.length > 0 && (
                  <TouchableOpacity
                    onPress={openAdd}
                    style={styles.sectionAddBtn}
                  >
                    <Icon name="plus" size={13} color={colors.primary} />
                    <Text style={styles.sectionAddBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {categoryBudgets.length === 0 && (
                <TouchableOpacity
                  style={styles.emptyOverallCard}
                  onPress={openAdd}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.emptyOverallIcon,
                      { backgroundColor: colors.inputBg },
                    ]}
                  >
                    <Icon
                      name="tag-plus-outline"
                      size={22}
                      color={colors.textSub}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyOverallTitle}>
                      No category budgets
                    </Text>
                    <Text style={styles.emptyOverallSub}>
                      Set limits per category to track spending
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              )}
            </>
          }
          renderItem={({ item }) => (
            <BudgetCard
              budget={item}
              meta={getCatMeta(item.category)}
              onPress={() => openEdit(item)}
            />
          )}
          ListFooterComponent={
            categoryBudgets.length > 0 && unbudgetedCats.length > 0 ? (
              <TouchableOpacity style={styles.addMoreBtn} onPress={openAdd}>
                <Icon
                  name="plus-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.addMoreText}>Add another category</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* FAB — when there are unbudgeted categories */}
      {!loading && unbudgetedCats.length > 0 && budgets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Icon name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Add / Edit sheet */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
        onShow={() => setTimeout(() => amountRef.current?.focus(), 150)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setSheetOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.sheet}
              onPress={() => {}}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {editBudget ? 'Edit budget' : 'Set budget'}
              </Text>

              {/* Category picker — only when adding */}
              {!editBudget && (
                <>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: spacing.base }}
                    contentContainerStyle={{
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                    }}
                  >
                    {unbudgetedCats.map(cat => {
                      const active = selectedCat?.key === cat.key;
                      return (
                        <TouchableOpacity
                          key={cat.key}
                          onPress={() => setSelectedCat(cat)}
                          style={[
                            styles.catChip,
                            active && {
                              backgroundColor: cat.bg,
                              borderColor: cat.color,
                            },
                          ]}
                        >
                          <Icon
                            name={cat.icon}
                            size={14}
                            color={active ? cat.color : colors.textSub}
                          />
                          <Text
                            style={[
                              styles.catChipText,
                              active && { color: cat.color, fontWeight: '700' },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Category label when editing */}
              {editBudget && selectedCat && (
                <View style={styles.editCatRow}>
                  <View
                    style={[
                      styles.editCatIcon,
                      { backgroundColor: selectedCat.bg },
                    ]}
                  >
                    <Icon
                      name={selectedCat.icon}
                      size={18}
                      color={selectedCat.color}
                    />
                  </View>
                  <Text style={styles.editCatLabel}>{selectedCat.label}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Monthly limit (₹)</Text>
              <View style={styles.amountWrap}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  ref={amountRef}
                  value={amountStr}
                  onChangeText={setAmountStr}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textLight}
                  style={styles.amountInput}
                />
              </View>

              <View style={styles.sheetActions}>
                {editBudget && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={async () => {
                      await remove(editBudget.category);
                      setSheetOpen(false);
                    }}
                  >
                    <Icon
                      name="trash-can-outline"
                      size={16}
                      color={colors.expense}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSheetOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !selectedCat && { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={saving || !selectedCat}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function BudgetCard({
  budget,
  meta,
  onPress,
  isOverall = false,
}: {
  budget: TBudget;
  meta: TCategoryMeta;
  onPress: () => void;
  isOverall?: boolean;
}) {
  const pct = Math.min(budget.percentage, 100);
  const over = budget.percentage > 100;

  return (
    <TouchableOpacity
      style={[styles.card, isOverall && styles.overallCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCat}>{meta.label}</Text>
          <Text style={styles.cardAmounts}>
            <Text
              style={{
                color: progressColor(budget.percentage),
                fontWeight: '700',
              }}
            >
              ₹{budget.spent.toLocaleString('en-IN')}
            </Text>
            <Text style={{ color: colors.textLight }}>
              {' '}
              / ₹{budget.amount.toLocaleString('en-IN')}
            </Text>
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text
            style={[
              styles.cardPct,
              { color: progressColor(budget.percentage) },
            ]}
          >
            {budget.percentage}%
          </Text>
          {over && (
            <Icon name="alert-circle" size={13} color={colors.expense} />
          )}
        </View>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct}%` as `${number}%`,
              backgroundColor: progressColor(budget.percentage),
            },
          ]}
        />
      </View>

      {over && (
        <View style={styles.overBadge}>
          <Icon name="alert-circle-outline" size={12} color={colors.expense} />
          <Text style={styles.overBadgeText}>
            Over by ₹{(budget.spent - budget.amount).toLocaleString('en-IN')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  list: {
    padding: spacing.base,
    paddingBottom: 100,
  },

  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  sectionAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  emptyOverallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  emptyOverallIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOverallTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  emptyOverallSub: {
    fontSize: 12,
    color: colors.textSub,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  overallCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryLight,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardCat: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  cardAmounts: { fontSize: 13, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardPct: { fontSize: 14, fontWeight: '800' },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  overBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  overBadgeText: { fontSize: 11, color: colors.expense, fontWeight: '600' },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
  },
  addMoreText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.strong,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 40,
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
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub,
    textTransform: 'capitalize',
  },
  editCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  editCatIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCatLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rupee: { fontSize: 20, fontWeight: '700', color: colors.textSub },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.expense,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSub },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
