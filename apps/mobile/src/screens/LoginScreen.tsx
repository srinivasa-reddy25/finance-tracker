import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signInWithGoogle } from '../services/firebase';
import { api } from '../services/api';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      await api.post('/auth/sync');
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <View className="items-center mb-16">
        <Text className="text-4xl font-bold text-gray-900 mb-2">💰</Text>
        <Text className="text-2xl font-bold text-gray-900">
          Finance Tracker
        </Text>
        <Text className="text-gray-400 mt-2 text-center">
          Track your money, simply.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-3"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            Continue with Google
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
