import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { PanierProvider } from '../context/PanierContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PanierProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PanierProvider>
    </AuthProvider>
  );
}