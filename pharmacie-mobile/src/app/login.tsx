import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      {/* Bandeau reduit */}
      <View style={styles.bandeau}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour" style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.light.background} />
        </Pressable>
        <View style={styles.logoBadge}>
          <Ionicons name="business" size={18} color={Brand.primary} />
        </View>
        <Text style={styles.bandeauTitle}>Espace pharmacien</Text>
      </View>

      <View style={styles.content}>
        {/* Carte d'intro */}
        <View style={styles.introCard}>
          <View style={styles.introIconCircle}>
            <Ionicons name="lock-closed-outline" size={22} color={Brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Connexion</Text>
            <Text style={styles.introSubtitle}>Gérez le stock de votre pharmacie.</Text>
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Identifiant de connexion</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={17} color={Brand.textFaint} />
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
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={17} color={Brand.textFaint} />
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
          </View>

          {erreur && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Brand.danger} />
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
              <>
                <Text style={styles.submitText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  bandeau: {
    backgroundColor: Brand.primary,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: { padding: 2 },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandeauTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.background },
  content: { flex: 1, padding: Spacing.four },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 18,
    padding: 18,
    marginBottom: Spacing.four,
    shadowColor: '#1C2420',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  introIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  introSubtitle: { fontSize: 12.5, color: Colors.light.textSecondary, marginTop: 2 },
  form: { gap: Spacing.three },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 15.5, color: Colors.light.text, paddingVertical: 14 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.dangerBg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, color: Brand.danger, fontSize: 13, lineHeight: 18 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.accent,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 50,
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});