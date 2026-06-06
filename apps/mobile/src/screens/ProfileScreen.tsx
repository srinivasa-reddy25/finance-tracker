import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackParams } from '../navigation';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { signOut } from '../services/firebase';
import { colors, radius, shadow, spacing } from '../theme';

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { user } = useAuthStore();
  const { transactions, pagination } = useTransactionStore();
  const { categories, fetch: fetchCats } = useCategoryStore();

  useEffect(() => {
    fetchCats();
  }, []);

  const firstName = user?.displayName?.split(' ')[0] ?? 'User';
  const fullName = user?.displayName ?? 'User';
  const email = user?.email ?? '';
  const avatarLetter = fullName[0]?.toUpperCase() ?? 'U';

  const totalTx = pagination?.total ?? transactions.length;
  const catCount = categories.length;

  const thisMonthSpent = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const catMap = new Map(categories.map(c => [c.key, c]));
    return transactions
      .filter(t => {
        const month = t.date.slice(0, 7);
        return month === currentMonth && !catMap.get(t.category)?.is_income;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, categories]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportRange, setExportRange] = useState<
    'this_month' | 'last_month' | 'last_3_months' | 'all'
  >('this_month');
  const [exporting, setExporting] = useState(false);

  const send_export = async () => {
    setExporting(true);
    try {
      const res = await api.post('/export/transactions', {
        format: exportFormat,
        range: exportRange,
      });
      const count = res.data?.data?.transaction_count ?? 0;
      setExportOpen(false);
      Alert.alert(
        'Sent',
        `Your ${exportFormat.toUpperCase()} export (${count} transactions) was sent to ${email}.`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to send export. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setExporting(false);
    }
  };

  const range_options: { key: typeof exportRange; label: string }[] = [
    { key: 'this_month', label: 'This month' },
    { key: 'last_month', label: 'Last month' },
    { key: 'last_3_months', label: 'Last 3 months' },
    { key: 'all', label: 'All time' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
        </View>

        {/* Stats trio */}
        <View style={styles.statsTrio}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTx}</Text>
            <Text style={styles.statKey}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{catCount}</Text>
            <Text style={styles.statKey}>Categories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹{(thisMonthSpent / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.statKey}>This month</Text>
          </View>
        </View>

        {/* MANAGE section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MANAGE</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.lrow}
              onPress={() => navigation.navigate('Categories')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.lrowIcon,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Icon
                  name="tag-multiple-outline"
                  size={17}
                  color={colors.accent}
                />
              </View>
              <View style={styles.lrowContent}>
                <Text style={styles.lrowLabel}>Categories</Text>
                <Text style={styles.lrowValue}>
                  {catCount > 0
                    ? `${catCount} ${catCount === 1 ? 'category' : 'categories'}`
                    : 'Manage spending categories'}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.ink3} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.lrow}
              onPress={() => navigation.navigate('Recurring')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.lrowIcon,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Icon name="repeat" size={17} color={colors.accent} />
              </View>
              <View style={styles.lrowContent}>
                <Text style={styles.lrowLabel}>Recurring</Text>
                <Text style={styles.lrowValue}>
                  Auto-transactions on a schedule
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.ink3} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.lrow}
              onPress={() => setExportOpen(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.lrowIcon,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Icon name="download-outline" size={17} color={colors.accent} />
              </View>
              <View style={styles.lrowContent}>
                <Text style={styles.lrowLabel}>Export to email</Text>
                <Text style={styles.lrowValue}>
                  Get transactions as CSV or PDF
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.ink3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCES section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.card}>
            <View style={styles.lrow}>
              <View
                style={[styles.lrowIcon, { backgroundColor: colors.surface2 }]}
              >
                <Icon name="currency-inr" size={17} color={colors.ink2} />
              </View>
              <View style={styles.lrowContent}>
                <Text style={styles.lrowLabel}>Currency</Text>
                <Text style={styles.lrowValue}>Indian Rupee (₹ INR)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.lrow}>
              <View
                style={[styles.lrowIcon, { backgroundColor: colors.surface2 }]}
              >
                <Icon
                  name="information-outline"
                  size={17}
                  color={colors.ink2}
                />
              </View>
              <View style={styles.lrowContent}>
                <Text style={styles.lrowLabel}>App version</Text>
                <Text style={styles.lrowValue}>1.0.0</Text>
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

        <Text style={styles.versionFooter}>Finance Tracker v1.0.0</Text>
      </ScrollView>

      {/* Export modal */}
      <Modal
        visible={exportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !exporting && setExportOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !exporting && setExportOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dialog}
            onPress={() => {}}
          >
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Export transactions</Text>
              <TouchableOpacity
                onPress={() => !exporting && setExportOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={20} color={colors.ink2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.exportSub}>
              We'll email the file to{'\n'}
              <Text style={{ color: colors.ink, fontWeight: '600' }}>
                {email}
              </Text>
            </Text>

            <Text style={styles.exportLabel}>Format</Text>
            <View style={styles.chipRow}>
              {(['csv', 'pdf'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, exportFormat === f && styles.chipActive]}
                  onPress={() => setExportFormat(f)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      exportFormat === f && styles.chipTextActive,
                    ]}
                  >
                    {f.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.exportLabel}>Date range</Text>
            <View style={styles.chipRow}>
              {range_options.map(o => (
                <TouchableOpacity
                  key={o.key}
                  style={[
                    styles.chip,
                    exportRange === o.key && styles.chipActive,
                  ]}
                  onPress={() => setExportRange(o.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      exportRange === o.key && styles.chipTextActive,
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, exporting && { opacity: 0.6 }]}
              onPress={send_export}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="email-send-outline" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>Send to email</Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  scroll: { paddingBottom: 120 },

  pageHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },

  // Profile hero
  hero: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.canvas, fontSize: 32, fontWeight: '800' },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 14,
    marginBottom: 2,
  },
  heroEmail: { fontSize: 13, color: colors.ink2, marginTop: 2 },

  // Stats trio
  statsTrio: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  statKey: {
    fontSize: 11,
    color: colors.ink2,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },

  // Sections
  section: { marginBottom: 18, paddingHorizontal: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  lrow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 15,
    gap: spacing.md,
  },
  lrowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lrowContent: { flex: 1 },
  lrowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  lrowValue: { fontSize: 12, color: colors.ink2, fontWeight: '400' },
  divider: { height: 1, backgroundColor: colors.line },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: 18,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.expense,
    backgroundColor: colors.surface,
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: colors.expense },

  versionFooter: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Export modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  exportSub: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
  },
  exportLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.ink2 },
  chipTextActive: { color: '#fff' },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
