import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useAuthStore } from './src/stores/authStore';
import { useTransactionStore } from './src/stores/transactionStore';
import Navigation from './src/navigation';
import { cleanupNotifications } from './src/services/notifications';
import ErrorBoundary from './src/components/ErrorBoundary';
import './global.css';

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { reset } = useTransactionStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), firebaseUser => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        cleanupNotifications().catch(() => {});
        reset();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ErrorBoundary>
          <Navigation />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
