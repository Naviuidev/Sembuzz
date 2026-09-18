import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Pressable, StyleSheet, Text, TextInput, useWindowDimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import type { MainTabParamList } from './src/navigation/types';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';
import { NATIVE_UI_TOUCH_RECOVERY } from './src/constants/appEvents';

/**
 * Background illustration ONLY (no phone chrome, no mockup UI).
 * Replace `mobile/assets/onboarding-bg.webp` with your exported art — tagline/body stay in <Text> below.
 */
const ONBOARDING_BG = require('./assets/onboarding-bg.webp');

/** Opaque warm peach — must not use alpha or Android tints body text and shows seams. */
const ONBOARDING_BG_SOLID = '#F2D4A2';

function PushNotificationBootstrap() {
  /** Force a subtree re-render after the system notification sheet dismisses (mitigates iPad stuck touches). */
  const [, setRecoveryTick] = useState(0);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(NATIVE_UI_TOUCH_RECOVERY, () => {
      setRecoveryTick((n) => n + 1);
      if (__DEV__) {
        console.log('[App] NATIVE_UI_TOUCH_RECOVERY applied');
      }
    });
    return () => sub.remove();
  }, []);
  useRegisterPushToken();
  return null;
}

function StartScreen({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const isAndroid = Platform.OS === 'android';
  const heroHeight = Math.round(screenH * (isAndroid ? 0.44 : 0.48));

  return (
    <SafeAreaView style={styles.startRoot} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={ONBOARDING_BG_SOLID} />

      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image source={ONBOARDING_BG} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroBottomFade} pointerEvents="none" />
      </View>

      <View style={styles.startContent}>
        <View style={styles.startTextBlock}>
          <Text style={styles.startTagline}>
            Welcome{'\n'}to Your Campus
          </Text>
          <Text style={[styles.startPara, isAndroid && styles.startParaAndroid]}>
            Explore everything happening on campus — events, updates, and opportunities — all in one place.
          </Text>
        </View>

        <View style={[styles.startButtonWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="Start"
          >
            <Text style={styles.startButtonText}>Start</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const navRef = useRef<any>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    const TextAny = Text as typeof Text & { defaultProps?: Record<string, unknown> };
    const TextInputAny = TextInput as typeof TextInput & { defaultProps?: Record<string, unknown> };
    const textDefaults = TextAny.defaultProps ?? {};
    const inputDefaults = TextInputAny.defaultProps ?? {};
    TextAny.defaultProps = {
      ...textDefaults,
      style: [{ fontFamily: 'Poppins_400Regular' }, textDefaults.style],
    };
    TextInputAny.defaultProps = {
      ...inputDefaults,
      style: [{ fontFamily: 'Poppins_400Regular' }, inputDefaults.style],
    };
  }, []);

  const handleNavigate = (name: keyof MainTabParamList) => {
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
            params: {
              screen: 'Events',
              params: data.eventId ? { focusEventId: data.eventId } : undefined,
            },
          }),
        );
      }, 250);
    };

    void Notifications.getLastNotificationResponseAsync().then((resp) => openFromPush(resp));
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => openFromPush(resp));
    return () => sub.remove();
  }, []);

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
          <StartScreen onStart={() => setShowStartScreen(false)} />
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
  startRoot: {
    flex: 1,
    backgroundColor: ONBOARDING_BG_SOLID,
  },
  heroContainer: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: ONBOARDING_BG_SOLID,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: ONBOARDING_BG_SOLID,
    opacity: 0.85,
  },
  startContent: {
    flex: 1,
    backgroundColor: ONBOARDING_BG_SOLID,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  startTextBlock: {
    alignItems: 'center',
    paddingTop: 4,
  },
  startTagline: {
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    paddingHorizontal: 4,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  startPara: {
    fontSize: 17,
    fontFamily: 'Poppins_400Regular',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 340,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  startParaAndroid: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  startButtonWrap: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
  },
  startButton: {
    minWidth: 220,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 999,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPressed: {
    opacity: 0.88,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});
