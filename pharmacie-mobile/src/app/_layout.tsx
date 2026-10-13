import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PanierProvider } from '../context/PanierContext';
import { Colors, Brand } from '@/constants/theme';

/**
 * Au lancement de l'app : si une session pharmacien est sauvegardee (et non expiree),
 * on ouvre directement le tableau de bord au lieu de l'accueil patient.
 * La redirection n'a lieu qu'une fois, pour ne pas empecher un pharmacien connecte
 * de revenir ensuite sur la recherche patient.
 */
function Navigation() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const redirectionFaite = useRef(false);
  const tokenPrecedent = useRef<string | null>(null);

  // Deconnexion (bouton ou session expiree) : retour a l'accueil
  useEffect(() => {
    if (tokenPrecedent.current && !token) {
      router.replace('/');
    }
    tokenPrecedent.current = token;
  }, [token, router]);

  useEffect(() => {
    if (loading || redirectionFaite.current) return;
    redirectionFaite.current = true;

    if (token && segments[0] !== 'pharmacien') {
      router.replace('/pharmacien/dashboard');
    }
  }, [loading, token, segments, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {loading && (
        <View style={styles.splash}>
          <ActivityIndicator color={Brand.primary} size="large" />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PanierProvider>
        <Navigation />
      </PanierProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});