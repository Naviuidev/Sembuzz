import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from 'react-native-bootstrap-icons/icons/search';
import HouseDoorIcon from 'react-native-bootstrap-icons/icons/house-door';
import GearIcon from 'react-native-bootstrap-icons/icons/gear';
import Grid3x3GapIcon from 'react-native-bootstrap-icons/icons/grid-3x3-gap';
import JournalTextIcon from 'react-native-bootstrap-icons/icons/journal-text';

import GlobalNavbar from '../components/GlobalNavbar';
import { EventsScreen, SearchScreen, SettingsScreen, AppsScreen, BlogsScreen } from '../screens';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Search', label: 'Search', Icon: SearchIcon },
  { name: 'Events', label: 'Home', Icon: HouseDoorIcon },
  { name: 'Settings', label: 'Settings', Icon: GearIcon },
  { name: 'Apps', label: 'Apps', Icon: Grid3x3GapIcon },
  { name: 'Blogs', label: 'Blogs', Icon: JournalTextIcon },
];

function BottomNavBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(10, insets.bottom) }]}>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const focused = state.index === index;
        const config = TAB_CONFIG.find((c) => c.name === route.name) ?? { label: route.name, Icon: null };
        const { label, Icon } = config;

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
            {Icon ? (
              <Icon
                width={22}
                height={22}
                fill={focused ? '#1a1f2e' : '#6c757d'}
              />
            ) : null}
            {focused ? <Text style={styles.tabLabelActive}>{label}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type AppNavigatorProps = {
  onNavigate?: (name: string) => void;
};

export default function AppNavigator({ onNavigate }: AppNavigatorProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.appContainer}>
      <View style={[styles.navbarWrapper, { paddingTop: insets.top }]} pointerEvents="box-none">
        <GlobalNavbar
          onNavigateToEvents={() => onNavigate?.('Events')}
          onNavigateToSettings={() => onNavigate?.('Settings')}
          onNavigateToBlogs={() => onNavigate?.('Blogs')}
        />
      </View>
      <View style={styles.content}>
        <Tab.Navigator
          tabBar={(props) => <BottomNavBar {...props} />}
          screenOptions={{ headerShown: false }}
          initialRouteName="Events"
        >
          <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
          <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarLabel: 'Home' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
          <Tab.Screen name="Apps" component={AppsScreen} options={{ tabBarLabel: 'Apps' }} />
          <Tab.Screen name="Blogs" component={BlogsScreen} options={{ tabBarLabel: 'Blogs' }} />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  navbarWrapper: {
    backgroundColor: 'transparent',
    zIndex: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 999,
    gap: 6,
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
  tabLabelActive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1f2e',
  },
});
