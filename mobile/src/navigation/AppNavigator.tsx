import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutChangeEvent, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchIcon from 'react-native-bootstrap-icons/icons/search';
import HouseDoorIcon from 'react-native-bootstrap-icons/icons/house-door';
import GearIcon from 'react-native-bootstrap-icons/icons/gear';
import Grid3x3GapIcon from 'react-native-bootstrap-icons/icons/grid-3x3-gap';

import GlobalNavbar from '../components/GlobalNavbar';
import EventsScreen from '../screens/EventsScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AppsScreen from '../screens/AppsScreen';

const Tab = createBottomTabNavigator();

const TAB_LABELS: Record<string, string> = {
  Search: 'Search',
  Home: 'Home',
  Settings: 'Settings',
  Apps: 'Apps',
};

const ICON_SIZE = 22;

const TAB_ICONS: Record<string, React.ComponentType<{ width: number; height: number; fill: string }>> = {
  Search: SearchIcon,
  Home: HouseDoorIcon,
  Settings: GearIcon,
  Apps: Grid3x3GapIcon,
};

const TAB_COUNT = 4;
const PILL_ANIM_DURATION = 220;

/** Custom tab bar with smooth sliding pill animation when switching tabs. */
function BottomNavBar({ state, descriptors, navigation }: any) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: state.index,
      duration: PILL_ANIM_DURATION,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();
  }, [state.index, slideAnim]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setLayoutWidth(width);
  };

  const segmentWidth = layoutWidth > 0 ? layoutWidth / TAB_COUNT : 0;
  const pillWidth = Math.max(0, segmentWidth - 16);
  const pillOffset = 8 + (segmentWidth - pillWidth) / 2;
  const pillTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      pillOffset,
      segmentWidth + pillOffset,
      segmentWidth * 2 + pillOffset,
      segmentWidth * 3 + pillOffset,
    ],
  });

  return (
    <View style={styles.tabBar} onLayout={onLayout}>
      {layoutWidth > 0 && (
        <Animated.View
          style={[
            styles.slidingPill,
            {
              width: pillWidth,
              transform: [{ translateX: pillTranslateX }],
            },
          ]}
          pointerEvents="none"
        />
      )}
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const focused = state.index === index;
        const label = TAB_LABELS[route.name] ?? route.name;
        const IconComponent = TAB_ICONS[route.name];

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
            accessibilityLabel={label}
          >
            {IconComponent ? (
              <View style={!focused ? { opacity: 0.7 } : undefined}>
                <IconComponent
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  fill={focused ? '#fff' : '#1a1f2e'}
                />
              </View>
            ) : null}
            {focused ? (
              <Text style={styles.tabLabelActive}>{label}</Text>
            ) : null}
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
  const topInsetRef = useRef<number | null>(null);
  if (topInsetRef.current === null) topInsetRef.current = insets.top;
  const topInset = topInsetRef.current;

  return (
    <View style={styles.appContainer}>
      <View style={[styles.navbarWrapper, { paddingTop: topInset }]} pointerEvents="box-none">
        <GlobalNavbar
          onNavigateToEvents={() => onNavigate?.('Home')}
          onNavigateToSettings={() => onNavigate?.('Settings')}
        />
      </View>
      <View style={[styles.tabContent, { paddingTop: 0 }]}>
        <Tab.Navigator
        tabBar={(props) => <BottomNavBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Home" component={EventsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="Apps" component={AppsScreen} />
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
  tabContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    height: 72,
  },
  slidingPill: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: '#212529',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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
  tabLabelActive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
