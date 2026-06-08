import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { signInWithGoogle } from '../services/firebase';
import { api } from '../services/api';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

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

      <View style={styles.ambientOne} />
      <View style={styles.ambientTwo} />
      <View style={styles.ambientThree} />

      <View style={styles.heroArea}>
        <Animated.View
          style={[
            styles.cardStage,
            {
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
                { rotate: '-5deg' },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.ink, '#2A251F']}
            style={styles.floatCard}
          >
            <Text style={styles.floatLabel}>Monthly spend</Text>
            <Text style={styles.floatAmount}>
              <Text style={styles.floatCurrency}>₹</Text>24,860
            </Text>
            <View style={styles.floatTrack}>
              <View style={styles.floatFill} />
            </View>
            <View style={styles.floatCap}>
              <Text style={styles.floatCapText}>62% used</Text>
              <Text style={styles.floatCapText}>₹15k left</Text>
            </View>
          </LinearGradient>
          {[
            {
              style: styles.coinFood,
              icon: 'food-fork-drink',
              color: colors.catFood,
              bg: colors.catFoodBg,
            },
            {
              style: styles.coinTransport,
              icon: 'car-outline',
              color: colors.catTransport,
              bg: colors.catTransportBg,
            },
            {
              style: styles.coinShopping,
              icon: 'shopping-outline',
              color: colors.catShopping,
              bg: colors.catShoppingBg,
            },
            {
              style: styles.coinBills,
              icon: 'receipt',
              color: colors.catBills,
              bg: colors.catBillsBg,
            },
          ].map(item => (
            <View
              key={item.icon}
              style={[styles.coin, item.style, { backgroundColor: item.bg }]}
            >
              <Icon name={item.icon} size={23} color={item.color} />
            </View>
          ))}
        </Animated.View>

        <View style={styles.brandBlock}>
          <Text style={styles.appName}>
            Paisa<Text style={styles.brandDot}>.</Text>
          </Text>
          <Text style={styles.tagline}>Know where every rupee goes</Text>
        </View>
      </View>

      <View style={styles.bottom}>
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
          By continuing you agree to our Terms & Privacy Policy
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
    overflow: 'hidden',
  },
  ambientOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -110,
    right: -130,
    backgroundColor: colors.accentSoft,
    opacity: 0.9,
  },
  ambientTwo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: 130,
    left: -130,
    backgroundColor: colors.catFoodBg,
    opacity: 0.8,
  },
  ambientThree: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    bottom: 30,
    right: -100,
    backgroundColor: colors.catEntertainBg,
    opacity: 0.65,
  },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 44,
  },
  cardStage: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  floatCard: {
    width: 232,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    ...shadow.strong,
  },
  floatLabel: {
    fontSize: 10,
    fontFamily: typography.bold,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.52)',
  },
  floatAmount: {
    fontSize: 34,
    fontFamily: typography.extrabold,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: colors.canvas,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  floatCurrency: {
    fontSize: 18,
    fontFamily: typography.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  floatTrack: {
    height: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  floatFill: {
    height: '100%',
    width: '62%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  floatCap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  floatCapText: {
    fontSize: 11,
    fontFamily: typography.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
  },
  coin: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
  coinFood: { top: 5, left: -14 },
  coinTransport: { top: 30, right: -20 },
  coinShopping: { bottom: 22, left: -22 },
  coinBills: { bottom: 2, right: -7 },
  brandBlock: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 40,
    fontFamily: typography.extrabold,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -1.6,
  },
  brandDot: { color: colors.accent },
  tagline: {
    fontSize: 16,
    fontFamily: typography.medium,
    fontWeight: '500',
    color: colors.ink2,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottom: {
    paddingBottom: 34,
    gap: spacing.md,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line2,
    borderRadius: radius.md,
    paddingVertical: 16,
    ...shadow.sm,
  },
  googleBtnText: {
    fontSize: 16,
    fontFamily: typography.bold,
    fontWeight: '700',
    color: colors.ink,
  },
  terms: {
    fontSize: 11.5,
    fontFamily: typography.regular,
    color: colors.ink3,
    textAlign: 'center',
  },
});
