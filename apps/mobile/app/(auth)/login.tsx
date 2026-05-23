import { useState } from 'react'

import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { api } from '../../services/api'
import { signInWithGoogle } from '../../services/firebase'

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const user = await signInWithGoogle()
      if (!user) throw new Error('Sign in cancelled')
      await api.post('/auth/sync')
    } catch (e: any) {
      setError(e.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-gray-900 mb-2">
        Finance Tracker
      </Text>
      <Text className="text-gray-500 mb-12">Track your money, simply.</Text>

      {error && (
        <Text className="text-red-500 mb-4 text-sm text-center">{error}</Text>
      )}

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-primary py-4 rounded-2xl items-center"
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
  )
}
