import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FinanceProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F8FAFC' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal/new-expense"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/itemized-split"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/new-income"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modal/settle-debt"
              options={{ presentation: 'modal', headerShown: false }}
            />
          </Stack>
        </FinanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
