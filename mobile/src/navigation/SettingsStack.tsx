import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsScreen from '../screens/SettingsScreen';
import ChangeCategoriesScreen from '../screens/ChangeCategoriesScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen
        name="ChangeCategories"
        component={ChangeCategoriesScreen}
        options={{
          headerShown: true,
          title: 'Change categories',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}
