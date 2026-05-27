import React, { useEffect, useState } from 'react';
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
import { colors, radius, spacing } from '../theme';

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
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Recurring')}
              activeOpacity={0.7}
            >
              <View style={styles.rowIconWrap}>
                <Icon name="repeat" size={17} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Recurring</Text>
                <Text style={styles.rowValue}>
                  Auto-transactions on a schedule
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setExportOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowIconWrap}>
                <Icon
                  name="download-outline"
                  size={17}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Export to email</Text>
                <Text style={styles.rowValue}>
                  Get your transactions as CSV or PDF
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
              <Text style={styles.sheetTitle}>Export transactions</Text>
              <TouchableOpacity
                onPress={() => !exporting && setExportOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSub}>
              We'll email the file to{'\n'}
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {email}
              </Text>
            </Text>

            <Text style={styles.sheetLabel}>Format</Text>
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

            <Text style={styles.sheetLabel}>Date range</Text>
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sheetSub: {
    fontSize: 13,
    color: colors.textSub,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSub,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
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
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
