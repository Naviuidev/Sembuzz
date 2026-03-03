import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const navRef = useRef<any>(null);

  const handleNavigate = (name: string) => {
    navRef.current?.dispatch(
      CommonActions.navigate({ name })
    );
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navRef}>
          <StatusBar style="light" />
          <AppNavigator onNavigate={handleNavigate} />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
