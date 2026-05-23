import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useAuthStore } from './src/stores/authStore';
import { useTransactionStore } from './src/stores/transactionStore';
import Navigation from './src/navigation';
import './global.css';

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { reset } = useTransactionStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), firebaseUser => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        reset();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Navigation />
    </SafeAreaProvider>
  );
}
