import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Image,
  PanResponder,
  type PanResponderInstance,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';

/**
 * Background illustration ONLY (no phone chrome, no mockup UI).
 * Replace `mobile/assets/onboarding-bg.png` with your exported art — tagline/body stay in <Text> below.
 */
const ONBOARDING_BG = require('./assets/onboarding-bg.png');

/** Solid peach for main onboarding body; translucent for status / home-indicator strips only. */
const ONBOARDING_CONTENT_BG = '#f9bf8540';
const ONBOARDING_SAFE_STRIP_BG = '#f9bf8540';

function PushNotificationBootstrap() {
  useRegisterPushToken();
  return null;
}

function StartScreen({
  slideTrackWidth,
  slideKnobSize,
  slideHeight,
  slideAnim,
  panResponder,
}: {
  slideTrackWidth: number;
  slideKnobSize: number;
  slideHeight: number;
  slideAnim: Animated.Value;
  panResponder: PanResponderInstance;
}) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  /** Hero band below status bar (white bar stays for clock / battery). */
  const heroHeight = Math.round(screenH * 0.48);

  return (
    <View style={[styles.startScreenWrap, { backgroundColor: ONBOARDING_CONTENT_BG }]}>
      <View
        pointerEvents="none"
        style={[styles.safeStripTop, { height: insets.top, backgroundColor: ONBOARDING_SAFE_STRIP_BG }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.safeStripBottom,
          { height: Math.max(insets.bottom, 0), backgroundColor: ONBOARDING_SAFE_STRIP_BG },
        ]}
      />
      <SafeAreaView style={styles.startRoot} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <View style={styles.heroInner}>
          <Image source={ONBOARDING_BG} style={styles.heroImage} resizeMode="cover" />
        </View>
      </View>

      <View style={[styles.startCard, { flex: 1 }]}>
        <View
          style={[
            styles.startCardInner,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <View style={styles.startTextBlock}>
            <Text style={styles.startTagline}>
              Welcome{'\n'}to Your Campus
            </Text>
            <Text style={styles.startPara}>
              Explore everything happening on campus from events and updates to opportunities all in one place.
            </Text>
          </View>

          <View style={styles.paraToSlideGap} />

          <View style={styles.slideWrap}>
            <View style={[styles.slideOuter, { width: slideTrackWidth, height: slideHeight }]}>
              <View style={styles.slideUnderlay} pointerEvents="none">
                <Text style={styles.slideLabel}>Continue</Text>
                <View style={styles.chevronRow} accessibilityLabel="">
                  <Text style={[styles.chevron, styles.chevronLight]}>›</Text>
                  <Text style={[styles.chevron, styles.chevronMid, styles.chevronSpacing]}>›</Text>
                  <Text style={[styles.chevron, styles.chevronDark, styles.chevronSpacing]}>›</Text>
                </View>
              </View>

              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.slideKnob,
                  {
                    width: slideKnobSize,
                    height: slideKnobSize,
                    top: Math.max(4, (slideHeight - slideKnobSize) / 2),
                    transform: [{ translateX: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.slideCheck} aria-hidden>
                  ✓
                </Text>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const navRef = useRef<any>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [swipeDone, setSwipeDone] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const handleNavigate = (name: 'Search' | 'Events' | 'Settings' | 'Apps' | 'Blogs') => {
    navRef.current?.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params:
          name === 'Settings'
            ? { screen: 'Settings', params: { screen: 'SettingsMain' } }
            : { screen: name },
      }),
    );
  };

  useEffect(() => {
    const openFromPush = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification?.request?.content?.data as
        | { type?: string; eventId?: string }
        | undefined;
      if (!data || data.type !== 'news_approved') return;

      setShowStartScreen(false);
      setTimeout(() => {
        navRef.current?.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: { screen: 'Events' },
          }),
        );
      }, 250);
    };

    void Notifications.getLastNotificationResponseAsync().then((resp) => openFromPush(resp));
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => openFromPush(resp));
    return () => sub.remove();
  }, []);

  /** Wider track: more horizontal margin only on small phones. */
  const slideTrackWidth = Math.min(360, screenWidth - 28);
  const slideHeight = 70;
  const slideKnobSize = 54;
  const slideMaxTranslateX = Math.max(0, slideTrackWidth - slideKnobSize - 10);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 4,
        onPanResponderMove: (_, gestureState) => {
          if (swipeDone) return;
          const clamped = Math.max(0, Math.min(slideMaxTranslateX, gestureState.dx));
          slideAnim.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (swipeDone) return;

          const final = Math.max(0, Math.min(slideMaxTranslateX, gestureState.dx));
          const shouldComplete = final >= slideMaxTranslateX * 0.75;

          if (shouldComplete) {
            setSwipeDone(true);
            Animated.timing(slideAnim, {
              toValue: slideMaxTranslateX,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              setShowStartScreen(false);
            });
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
      }),
    [slideAnim, slideMaxTranslateX, swipeDone],
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator size="large" color="#1a1f2e" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {showStartScreen ? (
          <StartScreen
            slideTrackWidth={slideTrackWidth}
            slideKnobSize={slideKnobSize}
            slideHeight={slideHeight}
            slideAnim={slideAnim}
            panResponder={panResponder}
          />
        ) : (
          <>
            <PushNotificationBootstrap />
            <NavigationContainer ref={navRef}>
              <StatusBar style="auto" />
              <AppNavigator onNavigate={handleNavigate} />
            </NavigationContainer>
          </>
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fontLoading: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startScreenWrap: {
    flex: 1,
  },
  safeStripTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  safeStripBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  startRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  heroContainer: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    /** Keeps status-bar / notch area visually clean above the illustration. */
    backgroundColor: '#f9bf8540',
    alignItems: 'stretch',
  },
  heroInner: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  startCard: {
    marginTop: -28,
    backgroundColor: ONBOARDING_CONTENT_BG,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  startCardInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  startTextBlock: {
    alignItems: 'center',
  },
  paraToSlideGap: {
    height: 14,
  },
  startTagline: {
    fontSize: 35,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
    textAlign: 'center',
    /** Must be ≥ fontSize per line or multi-line text overlaps (was 34 vs 55). */
    lineHeight: 44,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  startPara: {
    fontSize: 22,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 35,
    maxWidth: 350,
    marginBottom: 0,
  },
  slideOuter: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideUnderlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  slideLabel: {
    color: '#374151',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  chevronRow: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 24,
  },
  chevronLight: {
    color: '#9ca3af',
    opacity: 0.45,
  },
  chevronMid: {
    color: '#64748b',
    opacity: 0.75,
  },
  chevronDark: {
    color: '#111827',
    opacity: 1,
  },
  chevronSpacing: {
    marginLeft: 3,
  },
  slideKnob: {
    position: 'absolute',
    left: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCheck: {
    color: '#111827',
    fontSize: 19,
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  slideWrap: {
    alignItems: 'center',
    width: '100%',
  },
});
