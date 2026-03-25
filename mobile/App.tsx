import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';

const START_LOGO_URI =
  'file:///Users/naveenreddy/.cursor/projects/Users-naveenreddy-Desktop-sembuzz/assets/sembuzzsdmlhq_logo-1a252bd5-fec9-41a4-8d9e-9c23d06b041b.png';

function PushNotificationBootstrap() {
  useRegisterPushToken();
  return null;
}

export default function App() {
  const navRef = useRef<any>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);

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

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {showStartScreen ? (
          <SafeAreaView style={styles.startScreen} edges={['top', 'bottom']}>
            <StatusBar style="dark" />
            <View style={styles.startContent}>
              <Text style={styles.startHeading}>Sembuzz</Text>
              <Text style={styles.startSubheading}>A School Engagement Management Platform</Text>
              <Text style={styles.startPara}>
                It enables real-time updates on announcements, events and academic activities while
                providing personalized notifications based on user personalized categories.
              </Text>
              <Image source={{ uri: START_LOGO_URI }} style={styles.startLogo} resizeMode="contain" />
            </View>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setShowStartScreen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </SafeAreaView>
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
  startScreen: {
    flex: 1,
    backgroundColor: 'rgba(213, 210, 195, 1)',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 22,
  },
  startContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLogo: {
    width: 220,
    height: 220,
    marginTop: 18,
  },
  startHeading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  startSubheading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
    maxWidth: 340,
  },
  startPara: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 350,
  },
  startButton: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    borderRadius: 999,
    backgroundColor: '#212529',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
