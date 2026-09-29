import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const seConnecter = async () => {
    if (!identifiant.trim() || !motDePasse) {
      setErreur('Merci de renseigner votre identifiant et votre mot de passe.');
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      await login(identifiant.trim(), motDePasse);
      router.replace('/pharmacien/dashboard');
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setErreur("Votre compte n'a pas encore été validé par un administrateur, ou a été rejeté.");
      } else if (e instanceof ApiError && e.status === 401) {
        setErreur('Identifiant ou mot de passe incorrect.');
      } else {
        setErreur('Connexion impossible. Vérifiez votre connexion internet.');
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Espace pharmacien</Text>
        <Text style={styles.headerSubtitle}>Connectez-vous pour gérer votre stock.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Identifiant de connexion</Text>
          <TextInput
            value={identifiant}
            onChangeText={setIdentifiant}
            placeholder="ex : pharmacie.demo"
            placeholderTextColor={Brand.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            value={motDePasse}
            onChangeText={setMotDePasse}
            placeholder="••••••••"
            placeholderTextColor={Brand.textFaint}
            secureTextEntry
            style={styles.input}
            onSubmitEditing={seConnecter}
            returnKeyType="go"
          />
        </View>

        {erreur && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erreur}</Text>
          </View>
        )}

        <Pressable
          onPress={seConnecter}
          disabled={chargement}
          style={[styles.submitButton, chargement && styles.submitButtonDisabled]}
          accessibilityRole="button"
        >
          {chargement ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Se connecter</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Brand.headerDark,
    paddingTop: Platform.select({ ios: 64, android: 48, default: 48 }),
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: 6,
  },
  backArrow: { color: Colors.light.background, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.background },
  headerSubtitle: { fontSize: 14, color: '#B8B2A2' },
  form: { padding: Spacing.four, gap: Spacing.three, marginTop: Spacing.two },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  input: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorBox: {
    backgroundColor: Brand.dangerBg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: Brand.danger, fontSize: 13.5, lineHeight: 18 },
  submitButton: {
    backgroundColor: Brand.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});