import React, { useMemo } from 'react';
import {
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '../stores/authStore';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecurringScreen from '../screens/RecurringScreen';
import { useColors, TColors, radius, typography } from '../theme';

export type RootStackParams = {
  Login: undefined;
  Main: undefined;
  Categories: undefined;
  Recurring: undefined;
};
export type BottomTabParams = {
  Dashboard: undefined;
  History: undefined;
  AddAction: undefined;
  Analytics: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator<BottomTabParams>();

function EmptyTabScreen() {
  return null;
}

const TAB_ICONS: Record<string, string> = {
  Dashboard: 'home-outline',
  History: 'history',
  Analytics: 'poll',
  Profile: 'account-outline',
};

function MainTabs() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneStyle: { backgroundColor: c.canvas },
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'AddAction') return null;
            return (
              <Icon name={TAB_ICONS[route.name]} size={size} color={color} />
            );
          },
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.ink3,
          tabBarShowLabel: true,
          tabBarLabel: ({ children, focused }) => (
            <Text
              style={[styles.tabLabel, { color: focused ? c.accent : c.ink3 }]}
            >
              {children}
            </Text>
          ),
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen
          name="AddAction"
          component={EmptyTabScreen}
          options={{
            tabBarLabel: '',
            tabBarButton: () => (
              <View style={styles.addSlot}>
                <TouchableOpacity
                  style={styles.addButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    DeviceEventEmitter.emit('openTransactionModal')
                  }
                >
                  <Icon name="plus" size={26} color={c.accentInk} />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ tabBarLabel: 'Insights' }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

export default function Navigation() {
  const { user, loading } = useAuthStore();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="Recurring" component={RecurringScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const dockShadow = {
  shadowColor: '#1A1714',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

function makeStyles(c: TColors) {
  return StyleSheet.create({
    tabBar: {
      position: 'absolute',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius['2xl'],
      marginHorizontal: 14,
      marginBottom: 22,
      height: 66,
      paddingBottom: 8,
      paddingTop: 8,
      ...dockShadow,
    },
    tabItem: { paddingTop: 0 },
    addSlot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      width: 50,
      height: 50,
      borderRadius: radius.lg,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 6,
    },
    tabLabel: {
      fontSize: 10,
      fontFamily: typography.semibold,
      marginTop: 2,
      includeFontPadding: false,
    },
  });
}
