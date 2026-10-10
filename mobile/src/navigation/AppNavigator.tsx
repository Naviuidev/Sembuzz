import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, View, StyleSheet, TouchableOpacity, Image, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  EventsScreen,
  SearchScreen,
  AppsScreen,
  ChatScreen,
  LikedNewsScreen,
  SavedNewsScreen,
  NotificationsScreen,
} from '../screens';
import StudentGroupChatScreen from '../screens/StudentGroupChatScreen';
import ClubGroupChatScreen from '../screens/ClubGroupChatScreen';
import DirectChatScreen from '../screens/DirectChatScreen';
import BlogsScreen from '../screens/BlogsScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import UniversitiesScreen from '../screens/UniversitiesScreen';
import UniversityEventsScreen from '../screens/UniversityEventsScreen';
import AllUniversityEventsScreen from '../screens/AllUniversityEventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import SettingsStackNavigator from './SettingsStack';
import type { MainTabParamList, RootStackParamList } from './types';
import { useAuth } from '../contexts/AuthContext';
import { imageSrc } from '../utils/image';
import { userNotificationsService } from '../services/userNotifications';
import { useMessagesUnreadCount } from '../hooks/useMessagesUnreadCount';
import { AppGradientBackground } from '../components/AppGradientBackground';
import { TAB_BAR_AVATAR_SIZE, TAB_BAR_ICON_SIZE, TAB_BAR_SLOT_SIZE } from './tabBarMetrics';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type TabKind = 'home' | 'profile' | 'apps' | 'chat';

/** Home, Profile, Apps, Chat — Search stays on the home header only. */
const TAB_CONFIG: {
  name: keyof MainTabParamList;
  label: string;
  kind: TabKind;
}[] = [
  { name: 'Events', label: 'Home', kind: 'home' },
  { name: 'Settings', label: 'Profile', kind: 'profile' },
  { name: 'Apps', label: 'Apps', kind: 'apps' },
  { name: 'Chat', label: 'Chat', kind: 'chat' },
];

function tabGlyphName(kind: TabKind, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (kind) {
    case 'home':
      return focused ? 'home' : 'home-outline';
    case 'apps':
      return focused ? 'grid' : 'grid-outline';
    case 'chat':
      return focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
    default:
      return focused ? 'person' : 'person-outline';
  }
}

function BottomNavBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { count: chatUnreadCount } = useMessagesUnreadCount(state.index);
  /** Same as web `EventsBottomNav`: profile photo → school logo → initials. */
  const profileImageValue = useMemo(
    () => user?.profilePicUrl?.trim() || user?.image?.trim() || '',
    [user?.profilePicUrl, user?.image],
  );
  /** If school logo URL is wrong/404, fall back to initials (after profile failed). */
  const [settingsSchoolImgFailed, setSettingsSchoolImgFailed] = useState(false);
  /** If profile pic URL fails (wrong host, 404), try school logo then initials. */
  const [settingsProfileImgFailed, setSettingsProfileImgFailed] = useState(false);

  useEffect(() => {
    setSettingsSchoolImgFailed(false);
    setSettingsProfileImgFailed(false);
  }, [user?.id, user?.schoolImage, profileImageValue]);

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
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.tabBar,
        {
          width: windowWidth,
          paddingBottom: Math.max(8, insets.bottom),
        },
      ]}
    >
      <View style={styles.tabBarPill}>
      <View style={styles.tabBarRow}>
      {TAB_CONFIG.map((config) => {
        const route = state.routes.find((r: { name: string }) => r.name === config.name);
        if (!route) return null;

        const focused = activeRouteName === config.name;
        const iconColor = focused ? '#1a1f2e' : '#9ca3af';
        const isProfileTab = config.kind === 'profile';
        const showProfileAvatar =
          isProfileTab &&
          !!user &&
          (profileImageValue || user.schoolImage || user.schoolName || user.name);

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
            style={styles.tabButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={config.label}
          >
            <View style={styles.tabSlot}>
              <View style={styles.tabIconCenter}>
                {isProfileTab && showProfileAvatar ? (
                  profileImageValue && !settingsProfileImgFailed ? (
                    <Image
                      source={{ uri: imageSrc(profileImageValue) }}
                      style={[styles.profileAvatar, focused && styles.profileAvatarFocused]}
                      resizeMode="cover"
                      onError={() => setSettingsProfileImgFailed(true)}
                    />
                  ) : user?.schoolImage && !settingsSchoolImgFailed ? (
                    <Image
                      source={{ uri: imageSrc(user.schoolImage) }}
                      style={[styles.profileAvatar, focused && styles.profileAvatarFocused]}
                      resizeMode="cover"
                      onError={() => setSettingsSchoolImgFailed(true)}
                    />
                  ) : (
                    <View style={[styles.profileAvatarPlaceholder, focused && styles.profileAvatarFocused]}>
                      <Text style={styles.profileAvatarLetter}>
                        {(user?.schoolName?.trim()?.charAt(0) || user?.name?.trim()?.charAt(0) || 'U').toUpperCase()}
                      </Text>
                    </View>
                  )
                ) : (
                  <Ionicons
                    name={tabGlyphName(config.kind, focused)}
                    size={TAB_BAR_ICON_SIZE}
                    color={iconColor}
                  />
                )}
                {isProfileTab && unreadCount > 0 ? (
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                ) : null}
                {config.kind === 'chat' && chatUnreadCount > 0 ? (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
      </View>
      </View>
    </View>
  );
}

function MainTabsNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
        },
      }}
      initialRouteName="Events"
    >
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ tabBarLabel: 'Settings', freezeOnBlur: false }}
      />
      <Tab.Screen name="Apps" component={AppsScreen} options={{ tabBarLabel: 'Apps' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'Chat' }} />
      <Tab.Screen name="Universities" component={UniversitiesScreen} options={{ tabBarLabel: 'Universities' }} />
    </Tab.Navigator>
  );
}

type AppNavigatorProps = {
  onNavigate?: (name: keyof MainTabParamList) => void;
};

export default function AppNavigator({ onNavigate }: AppNavigatorProps) {
  return (
    <View style={styles.appContainer}>
      <AppGradientBackground />
      <View style={styles.content}>
        <Stack.Navigator
          screenOptions={{
            contentStyle: { backgroundColor: 'transparent' },
            headerStyle: { backgroundColor: 'rgba(255, 255, 255, 0.65)' },
            headerShadowVisible: false,
          }}
        >
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
          <Stack.Screen
            name="StudentGroupChat"
            component={StudentGroupChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ClubGroupChat"
            component={ClubGroupChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DirectChat"
            component={DirectChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Blogs"
            component={BlogsScreen}
            options={{
              headerShown: true,
              title: 'Blogs',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="BlogDetail"
            component={BlogDetailScreen}
            options={{
              headerShown: true,
              title: 'Blog',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="UniversityEvents"
            component={UniversityEventsScreen}
            options={({ route }) => ({
              headerShown: true,
              title: route.params.universityName,
              headerBackTitle: 'Back',
            })}
          />
          <Stack.Screen
            name="AllUniversityEvents"
            component={AllUniversityEventsScreen}
            options={{
              headerShown: true,
              title: 'All university events',
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
    backgroundColor: '#E3F0FF',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabBar: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    zIndex: 1000,
    elevation: 8,
    paddingTop: 6,
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  tabBarPill: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: TAB_BAR_SLOT_SIZE,
    overflow: 'visible',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_SLOT_SIZE,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  tabSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  tabIconCenter: {
    width: TAB_BAR_SLOT_SIZE,
    height: TAB_BAR_SLOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileAvatar: {
    width: TAB_BAR_AVATAR_SIZE,
    height: TAB_BAR_AVATAR_SIZE,
    borderRadius: TAB_BAR_AVATAR_SIZE / 2,
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileAvatarFocused: {
    borderColor: '#1a1f2e',
  },
  profileAvatarPlaceholder: {
    width: TAB_BAR_AVATAR_SIZE,
    height: TAB_BAR_AVATAR_SIZE,
    borderRadius: TAB_BAR_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef1f6',
  },
  profileAvatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  profileBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  chatBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
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
  chatBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
