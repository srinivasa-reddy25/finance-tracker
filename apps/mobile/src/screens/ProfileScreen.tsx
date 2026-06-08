import React, { useMemo, useEffect, useState } from 'react';
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
import Toggle from '../components/Toggle';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackParams } from '../navigation';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useRecurringStore } from '../stores/recurringStore';
import { useThemeStore } from '../stores/themeStore';
import { signOut } from '../services/firebase';
import {
  useColors,
  TColors,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme';

export default function ProfileScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { user } = useAuthStore();
  const { categories, fetch: fetchCats } = useCategoryStore();
  const { items: recurringItems, fetch: fetchRecurring } = useRecurringStore();

  const [allTimeSpent, setAllTimeSpent] = useState<number | null>(null);
  const [totalTxCount, setTotalTxCount] = useState<number | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const { isDark, toggle: toggleDark } = useThemeStore();

  useEffect(() => {
    fetchCats();
    fetchRecurring();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Total transaction count
    try {
      const res = await api.get('/transactions', { params: { limit: 1 } });
      const pagination = res.data?.data?.pagination;
      setTotalTxCount(pagination?.total ?? 0);
    } catch {
      setTotalTxCount(0);
    }

    // All-time spent: page through all transactions and sum amounts
    try {
      let page = 1;
      let total = 0;
      let hasMore = true;
      while (hasMore) {
        const res = await api.get('/transactions', {
          params: { limit: 100, page },
        });
        const txs: Array<{ amount: number }> =
          res.data?.data?.transactions ?? [];
        total += txs.reduce((s, t) => s + (t.amount ?? 0), 0);
        const pag = res.data?.data?.pagination;
        hasMore = pag ? page < pag.total_pages : false;
        page += 1;
      }
      setAllTimeSpent(total);
    } catch {
      setAllTimeSpent(0);
    }
  };

  const fullName = user?.displayName ?? 'User';
  const firstName = fullName.split(' ')[0] ?? 'User';
  const email = user?.email ?? '';

  const joinedDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const catCount = categories.filter(c => !c.is_income).length;
  const activeRecurring = recurringItems.filter(r => r.is_active).length;

  const formatSpent = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
    return `₹${v}`;
  };

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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.canvas}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Avatar + name + email */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0]!.toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
        </View>

        {/* Stats — 2 cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{totalTxCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {allTimeSpent != null ? formatSpent(allTimeSpent) : '—'}
            </Text>
            <Text style={styles.statLabel}>Overall spent</Text>
          </View>
        </View>

        {/* MANAGE */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Manage</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Categories')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#FFE8F0' }]}>
                <Icon name="tag-outline" size={18} color="#D0407A" />
              </View>
              <Text style={styles.rowText}>Categories</Text>
              <Text style={styles.rowBadge}>{catCount}</Text>
              <Icon name="chevron-right" size={18} color={c.ink3} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Recurring')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#E0F5F0' }]}>
                <Icon name="repeat" size={18} color="#0E9F8E" />
              </View>
              <Text style={styles.rowText}>Recurring</Text>
              {activeRecurring > 0 && (
                <Text style={styles.rowBadge}>{activeRecurring} active</Text>
              )}
              <Icon name="chevron-right" size={18} color={c.ink3} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => setExportOpen(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#EAE8FF' }]}>
                <Icon name="tray-arrow-down" size={18} color="#5B50D6" />
              </View>
              <Text style={styles.rowText}>Export data</Text>
              <Icon name="chevron-right" size={18} color={c.ink3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: c.surface2 }]}>
                <Icon name="bell-outline" size={18} color={c.ink} />
              </View>
              <Text style={styles.rowText}>Notifications</Text>
              <Toggle value={notifEnabled} onValueChange={setNotifEnabled} />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: c.surface2 }]}>
                <Icon name="star-outline" size={18} color={c.ink} />
              </View>
              <Text style={styles.rowText}>Dark appearance</Text>
              <Toggle value={isDark} onValueChange={toggleDark} />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                Alert.alert('Help & support', 'Email us at support@paisa.app')
              }
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: c.surface2 }]}>
                <Icon name="help-circle-outline" size={18} color={c.ink} />
              </View>
              <Text style={styles.rowText}>Help & support</Text>
              <Icon name="chevron-right" size={18} color={c.ink3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.75}
        >
          <Icon name="logout" size={16} color={c.expense} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>Paisa v1.0 · Joined {joinedDate}</Text>
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
                <Icon name="close" size={20} color={c.ink2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSub}>
              We'll email the file to{'\n'}
              <Text style={{ color: c.ink, fontWeight: '600' }}>{email}</Text>
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

function makeStyles(c: TColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.canvas },
    scroll: { paddingBottom: 120 },

    pageHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: 56,
      paddingBottom: spacing.sm,
    },
    pageTitle: {
      fontSize: 28,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -0.5,
    },

    // Hero
    hero: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: radius.full,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 32,
      fontFamily: typography.extrabold,
      fontWeight: '800',
    },
    heroName: {
      fontSize: 20,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink,
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    heroEmail: {
      fontSize: 14,
      fontFamily: typography.regular,
      color: c.ink2,
    },

    // Stats — 2 cards
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.line,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.md,
      ...shadow.sm,
    },
    statVal: {
      fontSize: 22,
      fontFamily: typography.extrabold,
      fontWeight: '800',
      color: c.ink,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: typography.medium,
      fontWeight: '500',
      color: c.ink2,
    },

    // Sections
    section: { marginTop: spacing.xl, marginHorizontal: spacing.lg },
    sectionLabel: {
      fontSize: 11,
      fontFamily: typography.bold,
      fontWeight: '700',
      color: c.ink2,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
      marginLeft: 4,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.line,
      overflow: 'hidden',
      ...shadow.sm,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.line2 },

    // Rows
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.base,
      paddingVertical: 14,
      gap: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      fontSize: 15,
      fontFamily: typography.medium,
      fontWeight: '500',
      color: c.ink,
    },
    rowBadge: {
      fontSize: 14,
      fontFamily: typography.medium,
      fontWeight: '500',
      color: c.ink2,
    },

    // Sign out
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xl,
      paddingVertical: 15,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: '#F5C5C2',
      backgroundColor: c.surface,
    },
    signOutText: {
      fontSize: 15,
      fontFamily: typography.semibold,
      fontWeight: '600',
      color: c.expense,
    },

    // Footer
    footer: {
      textAlign: 'center',
      marginTop: spacing.xl,
      fontSize: 12,
      color: c.ink3,
      fontFamily: typography.regular,
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
      backgroundColor: c.surface,
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
      color: c.ink,
      marginBottom: 6,
    },
    sheetSub: {
      fontSize: 13,
      color: c.ink2,
      marginBottom: spacing.lg,
      lineHeight: 18,
    },
    sheetLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.ink2,
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
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 13, fontWeight: '500', color: c.ink2 },
    chipTextActive: { color: '#fff' },
    sendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
