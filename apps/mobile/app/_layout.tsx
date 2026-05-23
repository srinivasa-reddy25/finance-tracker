import { useEffect } from 'react'

import { Stack, useRouter, useSegments } from 'expo-router'
import { onAuthStateChanged } from 'firebase/auth'

import { auth } from '../services/firebase'
import { useAuthStore } from '../stores/authStore'

export default function RootLayout() {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!user && !inAuth) router.replace('/(auth)/login')
    if (user && inAuth) router.replace('/(tabs)')
  }, [user, loading, segments])

  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
