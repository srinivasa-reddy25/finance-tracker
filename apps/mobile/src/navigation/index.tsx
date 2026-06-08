import React from 'react';
import {
  DeviceEventEmitter,
  StyleSheet,
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
import { colors, radius, spacing, typography } from '../theme';

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

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  History: { active: 'history', inactive: 'history' },
  Analytics: { active: 'chart-bar', inactive: 'chart-bar' },
  Profile: { active: 'account', inactive: 'account-outline' },
};

function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneStyle: { backgroundColor: colors.canvas },
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'AddAction') return null;
            const icons = TAB_ICONS[route.name];
            return (
              <Icon
                name={focused ? icons.active : icons.inactive}
                size={size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.ink3,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
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
                  <Icon name="plus" size={26} color={colors.accentInk} />
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
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
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: typography.bold,
    fontWeight: '700',
    marginTop: 2,
  },
});
