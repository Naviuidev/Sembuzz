import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  EventsScreen,
  SearchScreen,
  AppsScreen,
  BlogsScreen,
  LikedNewsScreen,
  SavedNewsScreen,
} from '../screens';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import SettingsStackNavigator from './SettingsStack';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_CONFIG = [
  { name: 'Search' as const, label: 'Search', inactiveIconName: 'search-outline', activeIconName: 'search' },
  { name: 'Events' as const, label: 'Home', inactiveIconName: 'home-outline', activeIconName: 'home' },
  { name: 'Settings' as const, label: 'Settings', inactiveIconName: 'settings-outline', activeIconName: 'settings' },
  { name: 'Apps' as const, label: 'Apps', inactiveIconName: 'grid-outline', activeIconName: 'grid' },
  { name: 'Blogs' as const, label: 'Blogs', inactiveIconName: 'newspaper-outline', activeIconName: 'newspaper' },
];

function BottomNavBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(10, insets.bottom) }]}>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const focused = state.index === index;
        const config =
          TAB_CONFIG.find((c) => c.name === route.name) ??
          { label: route.name, inactiveIconName: 'ellipse-outline', activeIconName: 'ellipse' };
        const { label, inactiveIconName, activeIconName } = config;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tabButton, focused && styles.tabButtonActive]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
          >
            <Ionicons
              name={(focused ? activeIconName : inactiveIconName) as any}
              size={22}
              color={focused ? '#1a1f2e' : '#6c757d'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabsNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Events"
    >
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{ tabBarLabel: 'Settings' }} />
      <Tab.Screen name="Apps" component={AppsScreen} options={{ tabBarLabel: 'Apps' }} />
      <Tab.Screen name="Blogs" component={BlogsScreen} options={{ tabBarLabel: 'Blogs' }} />
    </Tab.Navigator>
  );
}

type AppNavigatorProps = {
  onNavigate?: (name: keyof MainTabParamList) => void;
};

export default function AppNavigator({ onNavigate }: AppNavigatorProps) {
  return (
    <View style={styles.appContainer}>
      <View style={styles.content}>
        <Stack.Navigator>
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="LikedNews"
            component={LikedNewsScreen}
            options={{
              headerShown: true,
              title: 'Liked news',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="SavedNews"
            component={SavedNewsScreen}
            options={{
              headerShown: true,
              title: 'Saved news',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: true,
              title: 'Profile',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: 'Edit profile',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="ViewProfile"
            component={ViewProfileScreen}
            options={{
              headerShown: true,
              title: 'View profile',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});
