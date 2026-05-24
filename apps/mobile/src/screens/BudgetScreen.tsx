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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CATEGORY_META, EXPENSE_CATEGORIES } from '../constants/categories';
import { useBudgetStore } from '../stores/budgetStore';
import { useCategoryStore } from '../stores/categoryStore';
import { colors, radius, shadow, spacing } from '../theme';
import type { TBudget } from '../types/budget';

const AMBER = '#D97706';
const AMBER_BG = '#FEF3C7';

function progressColor(pct: number) {
  if (pct >= 100) return colors.expense;
  if (pct >= 70) return AMBER;
  return colors.income;
}
function progressBg(pct: number) {
  if (pct >= 100) return colors.expenseLight;
  if (pct >= 70) return AMBER_BG;
  return colors.incomeLight;
}

type TCategoryMeta = {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
};

export default function BudgetScreen() {
  const { budgets, loading, fetch, upsert, remove } = useBudgetStore();
  const { categories: customCats, fetch: fetchCats } = useCategoryStore();

  // sheet state
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

  // All categories available for budgeting (expense defaults + custom)
  const allCategories: TCategoryMeta[] = [
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

  // Categories that don't have a budget yet
  const budgetedKeys = new Set(budgets.map(b => b.category));
  const unbudgetedCats = allCategories.filter(c => !budgetedKeys.has(c.key));

  const openAdd = () => {
    setEditBudget(null);
    setSelectedCat(unbudgetedCats[0] ?? null);
    setAmountStr('');
    setSheetOpen(true);
  };

  const openEdit = (b: TBudget) => {
    setEditBudget(b);
    const meta = allCategories.find(c => c.key === b.category);
    setSelectedCat(meta ?? null);
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

  const handleDelete = async (b: TBudget) => {
    await remove(b.category);
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct =
    totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const getCatMeta = (category: string): TCategoryMeta => {
    const found = allCategories.find(c => c.key === category);
    return (
      found ?? {
        key: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        icon: 'shape-outline',
        color: colors.textSub,
        bg: colors.inputBg,
      }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
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

      {/* Summary card */}
      {budgets.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total spent</Text>
            <Text style={styles.summaryLabel}>of budgeted</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.summaryAmount,
                { color: progressColor(overallPct) },
              ]}
            >
              ₹{totalSpent.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summaryTotal}>
              ₹{totalBudgeted.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.overallBarBg}>
            <View
              style={[
                styles.overallBarFill,
                {
                  width: `${Math.min(overallPct, 100)}%` as `${number}%`,
                  backgroundColor: progressColor(overallPct),
                },
              ]}
            />
          </View>
          <Text style={styles.summaryPct}>{overallPct}% used</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 64 }} color={colors.primary} />
      ) : budgets.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="piggy-bank-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No budgets set</Text>
          <Text style={styles.emptySubtitle}>
            Set monthly spending limits per category to stay on track.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
            <Icon name="plus" size={16} color="#FFF" />
            <Text style={styles.emptyBtnText}>Add your first budget</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={b => b._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = getCatMeta(item.category);
            const pct = Math.min(item.percentage, 100);
            const over = item.percentage > 100;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => openEdit(item)}
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
                          color: progressColor(item.percentage),
                          fontWeight: '700',
                        }}
                      >
                        ₹{item.spent.toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ color: colors.textLight }}>
                        {' '}
                        / ₹{item.amount.toLocaleString('en-IN')}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text
                      style={[
                        styles.cardPct,
                        { color: progressColor(item.percentage) },
                      ]}
                    >
                      {item.percentage}%
                    </Text>
                    {over && (
                      <Icon
                        name="alert-circle"
                        size={13}
                        color={colors.expense}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${pct}%` as `${number}%`,
                        backgroundColor: progressColor(item.percentage),
                      },
                    ]}
                  />
                </View>

                {over && (
                  <View style={styles.overBadge}>
                    <Icon
                      name="alert-circle-outline"
                      size={12}
                      color={colors.expense}
                    />
                    <Text style={styles.overBadgeText}>
                      Over by ₹
                      {(item.spent - item.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            unbudgetedCats.length > 0 ? (
              <TouchableOpacity style={styles.addMoreBtn} onPress={openAdd}>
                <Icon
                  name="plus-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.addMoreText}>
                  Add budget for another category
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* FAB — only when budgets exist */}
      {budgets.length > 0 && unbudgetedCats.length > 0 && (
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

              {/* Category picker (only when adding new) */}
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

              {/* If editing, show category label */}
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

              {/* Amount input */}
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
                      await handleDelete(editBudget);
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
                  style={[styles.cancelBtn, editBudget && { flex: 1 }]}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
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

  summaryCard: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSub,
  },
  overallBarBg: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    marginBottom: 6,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  summaryPct: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
  },

  list: {
    padding: spacing.base,
    gap: spacing.sm,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
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
  cardAmounts: {
    fontSize: 13,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cardPct: {
    fontSize: 14,
    fontWeight: '800',
  },
  barBg: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  overBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  overBadgeText: {
    fontSize: 11,
    color: colors.expense,
    fontWeight: '600',
  },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  emptyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },

  fab: {
    position: 'absolute',
    bottom: 90,
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
  rupee: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textSub,
  },
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
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSub,
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
