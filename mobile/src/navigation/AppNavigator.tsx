import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, TouchableOpacity, Text, useWindowDimensions, Platform } from 'react-native';
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
import { useMessagesUnreadCount } from '../hooks/useMessagesUnreadCount';
import { AppGradientBackground } from '../components/AppGradientBackground';
import { TAB_BAR_ICON_SIZE, TAB_BAR_SLOT_SIZE } from './tabBarMetrics';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type TabKind = 'search' | 'home' | 'apps' | 'chat';

/** Search, Home, Apps, Chat — profile lives in the home header. */
const TAB_CONFIG: {
  name: keyof MainTabParamList;
  label: string;
  kind: TabKind;
}[] = [
  { name: 'Search', label: 'Search', kind: 'search' },
  { name: 'Events', label: 'Home', kind: 'home' },
  { name: 'Apps', label: 'Apps', kind: 'apps' },
  { name: 'Chat', label: 'Chat', kind: 'chat' },
];

function tabGlyphName(kind: TabKind, focused: boolean): keyof typeof Ionicons.glyphMap {
  switch (kind) {
    case 'search':
      return focused ? 'search' : 'search-outline';
    case 'home':
      return focused ? 'home' : 'home-outline';
    case 'apps':
      return focused ? 'grid' : 'grid-outline';
    case 'chat':
      return focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
    default:
      return focused ? 'home' : 'home-outline';
  }
}

/** RN bottom tabs paint a default surface behind custom bars on Android — keep fully clear. */
function TabBarBackground() {
  return <View style={styles.tabBarBackground} pointerEvents="none" />;
}

function BottomNavBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { count: chatUnreadCount } = useMessagesUnreadCount(state.index);
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      pointerEvents="box-none"
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
                <Ionicons
                  name={tabGlyphName(config.kind, focused)}
                  size={TAB_BAR_ICON_SIZE}
                  color={iconColor}
                />
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
          shadowOpacity: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
        },
        tabBarBackground: TabBarBackground,
      }}
      initialRouteName="Events"
    >
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Apps" component={AppsScreen} options={{ tabBarLabel: 'Apps' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'Chat' }} />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ tabBarLabel: 'Settings', freezeOnBlur: false }}
      />
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
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  tabBar: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    zIndex: 1000,
    elevation: 0,
    shadowOpacity: 0,
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
    ...Platform.select({
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
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
