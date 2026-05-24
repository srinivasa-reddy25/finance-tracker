import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '../stores/authStore';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, radius, spacing } from '../theme';

export type RootStackParams = {
  Login: undefined;
  Main: undefined;
  Budget: undefined;
};
export type BottomTabParams = {
  Dashboard: undefined;
  History: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator<BottomTabParams>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: 'view-dashboard', inactive: 'view-dashboard-outline' },
  History: { active: 'clock', inactive: 'clock-outline' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: colors.surface }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            return (
              <Icon
                name={focused ? icons.active : icons.inactive}
                size={size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
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
            <Stack.Screen name="Budget" component={BudgetScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: { paddingTop: 0 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
