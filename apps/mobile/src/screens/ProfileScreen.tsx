import React, { useEffect, useRef, useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { signOut } from '../services/firebase';
import { colors, radius, shadow, spacing } from '../theme';
import type { TUserCategory } from '../types/user-category';

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
  { color: '#059669', bg: '#D1FAE5' },
  { color: '#D97706', bg: '#FEF3C7' },
  { color: '#DC2626', bg: '#FEE2E2' },
  { color: '#2563EB', bg: '#DBEAFE' },
  { color: '#DB2777', bg: '#FCE7F3' },
  { color: '#0891B2', bg: '#CFFAFE' },
  { color: '#65A30D', bg: '#ECFCCB' },
  { color: '#EA580C', bg: '#FFEDD5' },
  { color: '#6B7280', bg: '#F3F4F6' },
];

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { transactions, pagination } = useTransactionStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
    add: addCat,
    remove: removeCat,
  } = useCategoryStore();

  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [catName, setCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]!);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]!);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchCats();
  }, []);

  const firstName = user?.displayName?.split(' ')[0] ?? 'User';
  const fullName = user?.displayName ?? 'User';
  const email = user?.email ?? '';

  const joinedDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const totalTx = pagination?.total ?? transactions.length;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const openCatSheet = () => {
    setAddMode(false);
    setCatName('');
    setSelectedIcon(PRESET_ICONS[0]!);
    setSelectedColor(PRESET_COLORS[0]!);
    setCatSheetOpen(true);
  };

  const handleAddCat = async () => {
    if (!catName.trim()) return;
    setSaving(true);
    try {
      await addCat({
        name: catName.trim(),
        icon: selectedIcon,
        color: selectedColor.color,
        bg: selectedColor.bg,
      });
      setAddMode(false);
      setCatName('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = (cat: TUserCategory) => {
    Alert.alert(
      'Delete category',
      `Remove "${cat.name}"? Existing transactions with this category will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeCat(cat._id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Hero block */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName[0]!.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{joinedDate}</Text>
            <Text style={styles.statLabel}>Member since</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{totalTx}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Icon name="account-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Full name</Text>
                <Text style={styles.rowValue}>{fullName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Icon name="email-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Email address</Text>
                <Text style={styles.rowValue}>{email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customization section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customization</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={openCatSheet}
              activeOpacity={0.7}
            >
              <View style={styles.rowIconWrap}>
                <Icon
                  name="tag-multiple-outline"
                  size={17}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Custom categories</Text>
                <Text style={styles.rowValue}>
                  {categories.length > 0
                    ? `${categories.length} custom ${categories.length === 1 ? 'category' : 'categories'}`
                    : 'Add your own categories'}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Icon name="currency-inr" size={17} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Currency</Text>
                <Text style={styles.rowValue}>Indian Rupee (₹ INR)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Icon
                  name="information-outline"
                  size={17}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>App version</Text>
                <Text style={styles.rowValue}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.75}
        >
          <Icon name="logout" size={16} color={colors.expense} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom categories sheet */}
      <Modal
        visible={catSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCatSheetOpen(false)}
        onShow={() => {
          if (addMode) setTimeout(() => nameRef.current?.focus(), 150);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setCatSheetOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.sheet}
              onPress={() => {}}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Custom categories</Text>
                {!addMode && (
                  <TouchableOpacity
                    style={styles.sheetAddBtn}
                    onPress={() => {
                      setAddMode(true);
                      setTimeout(() => nameRef.current?.focus(), 150);
                    }}
                  >
                    <Icon name="plus" size={16} color={colors.primary} />
                    <Text style={styles.sheetAddBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Add form */}
              {addMode && (
                <View style={styles.addForm}>
                  {/* Name input */}
                  <TextInput
                    ref={nameRef}
                    value={catName}
                    onChangeText={setCatName}
                    placeholder="Category name (e.g. Gym, Rent)"
                    placeholderTextColor={colors.textLight}
                    style={styles.nameInput}
                    maxLength={30}
                  />

                  {/* Icon picker */}
                  <Text style={styles.pickerLabel}>Icon</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: spacing.base }}
                    contentContainerStyle={{
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                    }}
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
                            color={
                              active ? selectedColor.color : colors.textSub
                            }
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Color picker */}
                  <Text style={styles.pickerLabel}>Color</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: spacing.lg }}
                    contentContainerStyle={{
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                    }}
                  >
                    {PRESET_COLORS.map((pair, i) => {
                      const active = selectedColor.color === pair.color;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedColor(pair)}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: pair.bg,
                              borderColor: pair.color,
                            },
                            active && styles.colorDotActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.colorDotInner,
                              { backgroundColor: pair.color },
                            ]}
                          />
                          {active && (
                            <Icon
                              name="check"
                              size={14}
                              color="#FFF"
                              style={StyleSheet.absoluteFillObject as object}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.addFormActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setAddMode(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        (!catName.trim() || saving) && { opacity: 0.4 },
                      ]}
                      onPress={handleAddCat}
                      disabled={!catName.trim() || saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>Save category</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Existing categories list */}
              {!addMode && (
                <ScrollView
                  style={{ maxHeight: 360 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {catLoading ? (
                    <ActivityIndicator
                      style={{ marginTop: 32 }}
                      color={colors.primary}
                    />
                  ) : categories.length === 0 ? (
                    <View style={styles.catEmpty}>
                      <Icon
                        name="tag-off-outline"
                        size={32}
                        color={colors.border}
                      />
                      <Text style={styles.catEmptyText}>
                        No custom categories yet
                      </Text>
                    </View>
                  ) : (
                    categories.map(cat => (
                      <View key={cat._id} style={styles.catRow}>
                        <View
                          style={[
                            styles.catRowIcon,
                            { backgroundColor: cat.bg },
                          ]}
                        >
                          <Icon name={cat.icon} size={16} color={cat.color} />
                        </View>
                        <Text style={styles.catRowName}>{cat.name}</Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteCat(cat)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon
                            name="trash-can-outline"
                            size={18}
                            color={colors.textLight}
                          />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: 120 },

  pageHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },

  hero: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    marginHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroEmail: { fontSize: 13, color: colors.textSub },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.base },
  statVal: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  section: { marginTop: spacing.xl, marginHorizontal: spacing.base },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    color: colors.textSub,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.expense,
    backgroundColor: colors.surface,
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: colors.expense },

  // Sheet styles
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sheetAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  sheetAddBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Add form
  addForm: {},
  nameInput: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: { borderWidth: 2.5 },
  colorDotInner: { width: 20, height: 20, borderRadius: 10 },

  addFormActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
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

  // Category list
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: spacing.md,
  },
  catRowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRowName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  catEmpty: { alignItems: 'center', paddingTop: 40, gap: spacing.sm },
  catEmptyText: { fontSize: 14, color: colors.textLight },
});
