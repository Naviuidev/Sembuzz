import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, TextInput, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import type { MainTabParamList } from './src/navigation/types';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';
import { NATIVE_UI_TOUCH_RECOVERY } from './src/constants/appEvents';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { appNavigationTheme } from './src/styles/appTheme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Splash may already be hidden in dev reloads. */
});

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

export default function App() {
  const navRef = useRef<any>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [welcomeFollowUp, setWelcomeFollowUp] = useState<'login' | 'signup' | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const onWelcomeLayoutReady = useCallback(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && !showStartScreen) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, showStartScreen]);

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
    if (showStartScreen || !welcomeFollowUp) return;

    const timer = setTimeout(() => {
      if (welcomeFollowUp === 'login') {
        navRef.current?.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Settings',
              params: { screen: 'SettingsMain', params: { openLogin: true } },
            },
          }),
        );
      } else if (welcomeFollowUp === 'signup') {
        navRef.current?.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Settings',
              params: { screen: 'SettingsMain', params: { openSignUp: true } },
            },
          }),
        );
      }
      setWelcomeFollowUp(null);
    }, 200);

    return () => clearTimeout(timer);
  }, [showStartScreen, welcomeFollowUp]);

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
        <ActivityIndicator size="large" color="#F9FAFB" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {showStartScreen ? (
          <WelcomeScreen
            onLayoutReady={onWelcomeLayoutReady}
            onLogin={() => {
              setWelcomeFollowUp('login');
              setShowStartScreen(false);
            }}
            onSignUp={() => {
              setWelcomeFollowUp('signup');
              setShowStartScreen(false);
            }}
            onContinueAsGuest={() => setShowStartScreen(false)}
          />
        ) : (
          <>
            <PushNotificationBootstrap />
            <NavigationContainer ref={navRef} theme={appNavigationTheme}>
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
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
