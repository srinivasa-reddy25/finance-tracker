import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signInWithGoogle } from '../services/firebase';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { colors, radius, spacing } from '../theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { setOverallBudget } = useAuthStore();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      const res = await api.post('/auth/sync');
      const budget = res.data?.data?.budget ?? null;
      setOverallBudget(typeof budget === 'number' ? budget : null);
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Icon name="chart-line" size={32} color={colors.primary} />
        </View>
        <Text style={styles.appName}>Finance Tracker</Text>
        <Text style={styles.tagline}>Know where every rupee goes</Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: 'lightning-bolt', label: 'Track in seconds' },
          { icon: 'shield-check-outline', label: 'Secure & private' },
          { icon: 'chart-bar', label: 'Clear insights' },
        ].map(f => (
          <View key={f.icon} style={styles.featureRow}>
            <View style={styles.featureDot}>
              <Icon name={f.icon} size={14} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={styles.googleBtn}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textMed} />
          ) : (
            <>
              <Icon name="google" size={20} color="#4285F4" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 15,
    color: colors.textSub,
    textAlign: 'center',
  },
  features: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureDot: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: colors.textMed,
    fontWeight: '500',
  },
  bottom: {
    paddingBottom: 40,
    gap: spacing.md,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: 16,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  terms: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
  },
});
