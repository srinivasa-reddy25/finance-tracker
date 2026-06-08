import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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
import { useCategoryStore } from '../stores/categoryStore';
import { colors, radius, spacing } from '../theme';
import type { TUserCategory } from '../types/user-category';
import ConfirmDialog from '../components/ConfirmDialog';

const { height: SCREEN_H } = Dimensions.get('window');

const PRESET_ICONS = [
  'briefcase-outline',
  'home-outline',
  'dumbbell',
  'school-outline',
  'airplane-outline',
  'gift-outline',
  'coffee-outline',
  'phone-outline',
  'dog-outline',
  'music-note',
  'gamepad-variant-outline',
  'baby-carriage',
  'bank-outline',
  'hammer-wrench',
  'lightning-bolt-outline',
  'water-outline',
  'wifi',
  'leaf-outline',
  'medical-bag',
  'cart-outline',
];

const PRESET_COLORS: { color: string; bg: string }[] = [
  { color: '#7C3AED', bg: '#EDE9FE' },
  { color: '#0E7B53', bg: '#E4F1EA' },
  { color: '#D97706', bg: '#FEF3C7' },
  { color: '#C5392C', bg: '#FEE2E2' },
  { color: '#2F6BE2', bg: '#DBEAFE' },
  { color: '#DB2777', bg: '#FCE7F3' },
  { color: '#0891B2', bg: '#CFFAFE' },
  { color: '#65A30D', bg: '#ECFCCB' },
  { color: '#EA580C', bg: '#FFEDD5' },
  { color: '#7A746B', bg: '#EFEDE7' },
];

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const { categories, loading, fetch, add, update, remove } =
    useCategoryStore();

  // Shared add/edit sheet — null = closed, undefined = add mode, TUserCategory = edit mode
  const [sheetTarget, setSheetTarget] = useState<
    TUserCategory | null | undefined
  >(null);
  const [catName, setCatName] = useState('');
  const [catBudget, setCatBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]!);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]!);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<TextInput>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<TUserCategory | null>(null);
  const [migrationCount, setMigrationCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch();
    } finally {
      setRefreshing(false);
    }
  };

  const isEditMode = sheetTarget != null && sheetTarget !== undefined;
  const isSheetOpen = sheetTarget !== null;
  const expenseCategories = categories.filter(c => !c.is_income);
  const atLimit = categories.length >= 10;

  const openAdd = () => {
    setCatName('');
    setCatBudget('');
    setSelectedIcon(PRESET_ICONS[0]!);
    setSelectedColor(PRESET_COLORS[0]!);
    setSheetTarget(undefined); // undefined = add mode, sheet open
  };

  const openEdit = (cat: TUserCategory) => {
    setCatName(cat.name);
    setCatBudget(cat.budget != null ? String(cat.budget) : '');
    setSelectedIcon(cat.icon);
    const match = PRESET_COLORS.find(p => p.color === cat.color);
    setSelectedColor(match ?? { color: cat.color, bg: cat.bg });
    setSheetTarget(cat);
  };

  const editingLocked =
    isEditMode && !(sheetTarget as TUserCategory).is_deletable;

  const closeSheet = () => setSheetTarget(null);

  const handleSave = async () => {
    if (!catName.trim()) return;
    const parsedBudget = catBudget.trim() !== '' ? parseFloat(catBudget) : null;
    const budget =
      parsedBudget != null && !isNaN(parsedBudget) && parsedBudget >= 0
        ? parsedBudget
        : null;
    setSaving(true);
    try {
      if (isEditMode) {
        const cat = sheetTarget as TUserCategory;
        if (cat.is_deletable) {
          await update(cat._id, {
            name: catName.trim(),
            icon: selectedIcon,
            color: selectedColor.color,
            bg: selectedColor.bg,
            budget,
          });
        } else {
          // locked category — only budget can change
          await update(cat._id, { budget });
        }
      } else {
        const newId = await add({
          name: catName.trim(),
          icon: selectedIcon,
          color: selectedColor.color,
          bg: selectedColor.bg,
        });
        if (budget != null) {
          await update(newId, { budget });
        }
      }
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePress = (cat: TUserCategory) => {
    if (!cat.is_deletable) return;
    setMigrationCount(0);
    setDeleteTarget(cat);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await remove(deleteTarget._id, false);
      if (result.status === 'needs_confirmation') {
        setMigrationCount(result.transaction_count);
        // already showing the dialog — update message and wait for second confirm
        return;
      }
      setDeleteTarget(null);
    } catch {
      // network error
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteWithMigrate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget._id, true);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const renderCategory = ({ item }: { item: TUserCategory }) => {
    const spent = item.spent ?? 0;
    const budget = item.budget ?? null;
    const pct = budget != null && budget > 0 ? Math.min(spent / budget, 1) : 0;
    const overBudget = budget != null && spent > budget;
    const fillColor = overBudget ? colors.expense : item.color;

    return (
      <TouchableOpacity
        style={styles.catRow}
        onPress={() => openEdit(item)}
        activeOpacity={0.85}
      >
        {/* Fills — direct absolute children so overflow:hidden clips them correctly */}
        {budget != null && (
          <>
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: item.color, opacity: 0.08 },
              ]}
            />
            <View
              style={[
                styles.rowFill,
                overBudget
                  ? { right: 0, backgroundColor: fillColor, opacity: 0.22 }
                  : {
                      width: `${pct * 100}%` as `${number}%`,
                      backgroundColor: fillColor,
                      opacity: 0.18,
                    },
              ]}
            />
          </>
        )}

        {/* Flex content — catRow is NOT a flex container so no gap bleeds onto fills */}
        <View style={styles.catRowContent}>
          <View style={[styles.catIcon, { backgroundColor: item.bg }]}>
            <Icon name={item.icon} size={18} color={item.color} />
          </View>

          <View style={styles.catInfo}>
            <Text style={styles.catName}>{item.name}</Text>
            {budget != null ? (
              <Text
                style={[
                  styles.budgetText,
                  overBudget && { color: colors.expense },
                ]}
              >
                ₹{spent.toLocaleString('en-IN')} / ₹
                {budget.toLocaleString('en-IN')}
              </Text>
            ) : spent > 0 ? (
              <Text style={styles.spentText}>
                ₹{spent.toLocaleString('en-IN')} spent
              </Text>
            ) : null}
          </View>

          <View style={styles.rowRight}>
            {!item.is_deletable ? (
              <View style={styles.lockBadge}>
                <Icon name="lock-outline" size={13} color={colors.ink3} />
                <Text style={styles.lockText}>Required</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeletePress(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="trash-can-outline" size={18} color={colors.ink3} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity
          style={[styles.addBtn, atLimit && { opacity: 0.4 }]}
          onPress={atLimit ? undefined : openAdd}
          activeOpacity={atLimit ? 1 : 0.8}
        >
          <Icon name="plus" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>
            {atLimit ? 'Limit reached' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && categories.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 64 }} color={colors.accent} />
      ) : (
        <FlatList
          data={expenseCategories}
          keyExtractor={c => c._id}
          renderItem={renderCategory}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        />
      )}

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete category"
        message={
          migrationCount > 0
            ? `${migrationCount} transaction${migrationCount === 1 ? '' : 's'} in "${deleteTarget?.name}" will be moved to Others. This cannot be undone.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`
        }
        confirmLabel={migrationCount > 0 ? 'Delete & Move' : 'Delete'}
        onCancel={() => {
          setDeleteTarget(null);
          setMigrationCount(0);
        }}
        onConfirm={
          migrationCount > 0
            ? handleConfirmDeleteWithMigrate
            : handleConfirmDelete
        }
      />

      {/* Add / Edit sheet — single shared modal */}
      <Modal
        visible={isSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
        onShow={() => setTimeout(() => nameRef.current?.focus(), 150)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={closeSheet}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.sheet}
              onPress={() => {}}
            >
              <View style={styles.sheetHandle} />

              {/* Header row with live preview icon */}
              <View style={styles.sheetHeader}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: selectedColor.bg },
                  ]}
                >
                  <Icon
                    name={selectedIcon}
                    size={22}
                    color={selectedColor.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>
                    {isEditMode ? 'Edit category' : 'New category'}
                  </Text>
                  <Text
                    style={[styles.previewName, { color: selectedColor.color }]}
                    numberOfLines={1}
                  >
                    {catName.trim() ||
                      (isEditMode
                        ? (sheetTarget as TUserCategory).name
                        : 'Category name')}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Name — locked for non-deletable categories */}
                <Text style={styles.fieldLabel}>Name</Text>
                <View
                  style={[
                    styles.textInput,
                    editingLocked && styles.inputLocked,
                  ]}
                >
                  {editingLocked ? (
                    <View style={styles.lockedRow}>
                      <Text style={styles.lockedValue}>{catName}</Text>
                      <Icon name="lock-outline" size={14} color={colors.ink3} />
                    </View>
                  ) : (
                    <TextInput
                      ref={nameRef}
                      value={catName}
                      onChangeText={setCatName}
                      placeholder="Category name"
                      placeholderTextColor={colors.ink3}
                      style={styles.lockedInner}
                      maxLength={30}
                      returnKeyType="next"
                    />
                  )}
                </View>

                {/* Budget */}
                <Text style={styles.fieldLabel}>
                  Monthly budget <Text style={styles.optional}>(optional)</Text>
                </Text>
                <View style={styles.budgetWrap}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    value={catBudget}
                    onChangeText={setCatBudget}
                    placeholder="e.g. 5000"
                    placeholderTextColor={colors.ink3}
                    keyboardType="numeric"
                    style={styles.budgetInput}
                  />
                  {catBudget.trim() !== '' && (
                    <TouchableOpacity
                      onPress={() => setCatBudget('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="close-circle" size={18} color={colors.ink3} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Icon picker — hidden for locked */}
                {!editingLocked && (
                  <>
                    <Text style={styles.fieldLabel}>Icon</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.iconScroll}
                      contentContainerStyle={styles.iconScrollContent}
                    >
                      {PRESET_ICONS.map(icon => {
                        const active = selectedIcon === icon;
                        return (
                          <TouchableOpacity
                            key={icon}
                            onPress={() => setSelectedIcon(icon)}
                            style={[
                              styles.iconChip,
                              active && {
                                backgroundColor: selectedColor.bg,
                                borderColor: selectedColor.color,
                              },
                            ]}
                          >
                            <Icon
                              name={icon}
                              size={20}
                              color={active ? selectedColor.color : colors.ink2}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Color picker */}
                    <Text style={styles.fieldLabel}>Color</Text>
                    <View style={styles.colorGrid}>
                      {PRESET_COLORS.map((pair, i) => {
                        const active = selectedColor.color === pair.color;
                        return (
                          <TouchableOpacity
                            key={i}
                            onPress={() => setSelectedColor(pair)}
                            style={[
                              styles.colorDot,
                              { backgroundColor: pair.color },
                              active && styles.colorDotActive,
                            ]}
                          >
                            {active && (
                              <Icon name="check" size={14} color="#FFF" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Fixed action buttons */}
              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeSheet}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    (!catName.trim() || saving) && { opacity: 0.4 },
                  ]}
                  onPress={handleSave}
                  disabled={!catName.trim() || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {isEditMode ? 'Save changes' : 'Create'}
                    </Text>
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
  container: { flex: 1, backgroundColor: colors.canvas },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingTop: 56,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  list: { paddingVertical: spacing.sm, paddingBottom: 60 },

  catRow: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  catRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
  },
  rowFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  budgetText: {
    fontSize: 12,
    color: colors.ink2,
    fontWeight: '500',
    marginTop: 2,
  },
  spentText: {
    fontSize: 12,
    color: colors.ink3,
    fontWeight: '500',
    marginTop: 2,
  },
  editHint: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  lockText: { fontSize: 11, fontWeight: '600', color: colors.ink3 },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginLeft: 56 + spacing.base + spacing.md,
  },

  // Sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: SCREEN_H * 0.78,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewName: { fontSize: 16, fontWeight: '700', marginTop: 1 },

  sheetScroll: { flexGrow: 0 },
  sheetScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  optional: {
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
    color: colors.ink3,
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.base,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.base,
  },
  inputLocked: {
    backgroundColor: colors.canvas,
    borderColor: colors.line,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedValue: { fontSize: 15, color: colors.ink2, fontWeight: '500' },
  lockedInner: { fontSize: 15, color: colors.ink },
  budgetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },

  iconScroll: { marginBottom: spacing.base },
  iconScrollContent: { gap: spacing.sm, paddingRight: spacing.sm },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: { borderColor: '#FFF', elevation: 3 },

  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.ink2 },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
