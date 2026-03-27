import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  EventsScreen,
  SearchScreen,
  AppsScreen,
  BlogsScreen,
  LikedNewsScreen,
  SavedNewsScreen,
  NotificationsScreen,
} from '../screens';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import SettingsStackNavigator from './SettingsStack';
import type { MainTabParamList, RootStackParamList } from './types';
import { useAuth } from '../contexts/AuthContext';
import { imageSrc } from '../utils/image';
import { userNotificationsService } from '../services/userNotifications';

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
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  /** If school logo URL is wrong/404, fall back to profile pic instead of initials. */
  const [settingsSchoolImgFailed, setSettingsSchoolImgFailed] = useState(false);
  /** If profile pic URL fails (wrong host, 404), show initials. */
  const [settingsProfileImgFailed, setSettingsProfileImgFailed] = useState(false);

  useEffect(() => {
    setSettingsSchoolImgFailed(false);
    setSettingsProfileImgFailed(false);
  }, [user?.id, user?.schoolImage, user?.profilePicUrl, user?.image]);

  const refreshUnread = useCallback(async () => {
    if (!user?.id || !token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await userNotificationsService.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      /* Keep last count on failure (network / transient error) — do not force 0. */
    }
  }, [user?.id, token]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread, state.index]);

  /** When root stack state changes (e.g. pop back from Notifications), refetch immediately. */
  useEffect(() => {
    const parent = navigation.getParent?.() as
      | { addListener?: (e: string, cb: () => void) => () => void }
      | undefined;
    if (!parent?.addListener) return;
    const unsub = parent.addListener('state', () => {
      void refreshUnread();
    });
    return unsub;
  }, [navigation, refreshUnread]);

  useEffect(() => {
    if (!user?.id || !token) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshUnread();
    });
    return () => sub.remove();
  }, [user?.id, token, refreshUnread]);

  useEffect(() => {
    if (!user?.id) return;
    const id = setInterval(() => {
      void refreshUnread();
    }, 15000);
    return () => clearInterval(id);
  }, [user?.id, refreshUnread]);
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(10, insets.bottom) }]}>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const focused = state.index === index;
        const config =
          TAB_CONFIG.find((c) => c.name === route.name) ??
          { label: route.name, inactiveIconName: 'ellipse-outline', activeIconName: 'ellipse' };
        const { label, inactiveIconName, activeIconName } = config;

        const profilePicRaw = user?.profilePicUrl || user?.image || '';

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
            {route.name === 'Settings' ? (
              <View style={styles.profileAvatarWrap}>
                {user?.schoolImage && !settingsSchoolImgFailed ? (
                  <Image
                    source={{ uri: imageSrc(user.schoolImage) }}
                    style={styles.profileAvatar}
                    onError={() => setSettingsSchoolImgFailed(true)}
                  />
                ) : profilePicRaw && !settingsProfileImgFailed ? (
                  <Image
                    source={{ uri: imageSrc(profilePicRaw) }}
                    style={styles.profileAvatar}
                    onError={() => setSettingsProfileImgFailed(true)}
                  />
                ) : (
                  <View style={styles.profileAvatarPlaceholder}>
                    <Text style={styles.profileAvatarLetter}>
                      {(user?.schoolName?.trim()?.charAt(0) || user?.name?.trim()?.charAt(0) || '?').toUpperCase()}
                    </Text>
                  </View>
                )}
                {unreadCount > 0 ? (
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Ionicons
                name={(focused ? activeIconName : inactiveIconName) as any}
                size={22}
                color={focused ? '#1a1f2e' : '#6c757d'}
              />
            )}
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
            name="Notifications"
            component={NotificationsScreen}
            options={{
              headerShown: true,
              title: 'Notifications',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    paddingBottom: 10,
    overflow: 'visible',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  tabButtonActive: {
    backgroundColor: '#f3f6ff',
    borderWidth: 1,
    borderColor: '#dbe4ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#e9ecef',
  },
  profileAvatarWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  profileAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef1f6',
  },
  profileAvatarLetter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  profileBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#dc3545',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
    elevation: 12,
  },
  profileBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
