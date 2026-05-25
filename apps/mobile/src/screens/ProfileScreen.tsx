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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackParams } from '../navigation';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { signOut } from '../services/firebase';
import { api } from '../services/api';
import { colors, radius, spacing } from '../theme';

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { user, overallBudget, setOverallBudget } = useAuthStore();
  const { transactions, pagination } = useTransactionStore();
  const { categories, fetch: fetchCats } = useCategoryStore();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const budgetInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchCats();
  }, []);

  const openBudgetModal = () => {
    setBudgetInput(overallBudget != null ? String(overallBudget) : '');
    setBudgetModalOpen(true);
  };

  const handleSaveBudget = async () => {
    const parsed = budgetInput.trim() === '' ? null : parseFloat(budgetInput);
    if (
      budgetInput.trim() !== '' &&
      (isNaN(parsed as number) || (parsed as number) < 0)
    ) {
      Alert.alert('Invalid amount', 'Please enter a valid positive number');
      return;
    }
    setSavingBudget(true);
    try {
      await api.patch('/auth/budget', { budget: parsed });
      setOverallBudget(parsed);
      setBudgetModalOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setSavingBudget(false);
    }
  };

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

  const catCount = categories.length;

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
              onPress={openBudgetModal}
              activeOpacity={0.7}
            >
              <View style={styles.rowIconWrap}>
                <Icon
                  name="piggy-bank-outline"
                  size={17}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Overall monthly budget</Text>
                <Text style={styles.rowValue}>
                  {overallBudget != null
                    ? `₹${overallBudget.toLocaleString('en-IN')}`
                    : 'Not set — tap to set'}
                </Text>
              </View>
              <Icon name="pencil-outline" size={16} color={colors.textLight} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Categories')}
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
                <Text style={styles.rowLabel}>Categories</Text>
                <Text style={styles.rowValue}>
                  {catCount > 0
                    ? `${catCount} ${catCount === 1 ? 'category' : 'categories'}`
                    : 'Manage your spending categories'}
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

      {/* Overall budget modal */}
      <Modal
        visible={budgetModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBudgetModalOpen(false)}
        onShow={() => setTimeout(() => budgetInputRef.current?.focus(), 150)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setBudgetModalOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.sheet}
              onPress={() => {}}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Overall monthly budget</Text>
              <Text style={styles.sheetSubtitle}>
                Set a total monthly spending cap. Leave empty to remove it.
              </Text>

              <View style={styles.budgetInputWrap}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  ref={budgetInputRef}
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="e.g. 30000"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  style={styles.budgetInput}
                />
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setBudgetModalOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, savingBudget && { opacity: 0.5 }]}
                  onPress={handleSaveBudget}
                  disabled={savingBudget}
                >
                  {savingBudget ? (
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
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textSub,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.base,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSub },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

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
});
