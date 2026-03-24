import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useRegisterPushToken } from './src/hooks/useRegisterPushToken';

function PushNotificationBootstrap() {
  useRegisterPushToken();
  return null;
}

export default function App() {
  const navRef = useRef<any>(null);

  const handleNavigate = (name: 'Search' | 'Events' | 'Settings' | 'Apps' | 'Blogs') => {
    navRef.current?.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: name },
      }),
    );
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PushNotificationBootstrap />
        <NavigationContainer ref={navRef}>
          <StatusBar style="light" />
          <AppNavigator onNavigate={handleNavigate} />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
