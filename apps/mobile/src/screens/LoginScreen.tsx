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
import { colors, radius, spacing } from '../theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      await api.post('/auth/sync');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again';
      Alert.alert('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      {/* Top hero section */}
      <View style={styles.topSection}>
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <Text style={styles.logoText}>₹</Text>
        </View>
        <Text style={styles.appName}>Finance Tracker</Text>
        <Text style={styles.tagline}>Know where every rupee goes</Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {[
            { icon: 'lightning-bolt', text: 'Track an expense in seconds' },
            { icon: 'chart-pie', text: 'See exactly where money goes' },
            {
              icon: 'shield-check-outline',
              text: 'Private & secure by default',
            },
          ].map(f => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIconBubble}>
                <Icon name={f.icon} size={18} color={colors.accent} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={styles.googleBtn}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.ink2} />
          ) : (
            <>
              <Icon name="google" size={20} color="#4285F4" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.terms}>
          By continuing you agree to our Terms &amp; Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: 26,
  },

  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  logoBlock: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    color: colors.canvas,
    fontSize: 38,
    fontWeight: '800',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 15,
    color: colors.ink2,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  featureList: {
    width: '100%',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: colors.ink2,
    fontWeight: '500',
  },

  bottomSection: {
    paddingBottom: 40,
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.xl,
    paddingVertical: 15,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  terms: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
  },
});
