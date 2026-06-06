import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '../stores/authStore';
import { useTransactionModalStore } from '../stores/transactionModalStore';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecurringScreen from '../screens/RecurringScreen';
import TransactionModal from '../components/TransactionModal';
import { colors, radius, shadow, spacing } from '../theme';

export type RootStackParams = {
  Login: undefined;
  Main: undefined;
  Categories: undefined;
  Recurring: undefined;
};
export type BottomTabParams = {
  Dashboard: undefined;
  History: undefined;
  Add: undefined;
  Analytics: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator<BottomTabParams>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  History: { active: 'clock', inactive: 'clock-outline' },
  Analytics: { active: 'chart-bar', inactive: 'chart-bar' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

function AddButton() {
  return (
    <TouchableOpacity
      style={styles.addBtn}
      onPress={() => useTransactionModalStore.getState().openAdd()}
      activeOpacity={0.85}
    >
      <Icon name="plus" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

// Dummy placeholder screen for Add tab — never actually rendered
function AddPlaceholder() {
  return <View />;
}

function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          sceneStyle: { backgroundColor: colors.canvas },
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Add') return null;
            const icons = TAB_ICONS[route.name];
            if (!icons) return null;
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
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen
          name="Add"
          component={AddPlaceholder}
          options={{
            tabBarButton: () => <AddButton />,
            tabBarLabel: () => null,
          }}
        />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <TransactionModal />
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 22,
    height: 66,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 6,
    ...shadow.card,
    elevation: 8,
  },
  tabItem: { paddingTop: 0 },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...shadow.accent,
  },
});
