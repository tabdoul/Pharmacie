import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';

const ETAPES = [
  {
    icone: 'search-outline' as const,
    iconeBg: Brand.successBg,
    iconeCouleur: Brand.primary,
    texte: 'Cherchez votre médicament',
  },
  {
    icone: 'location-outline' as const,
    iconeBg: Brand.warningBg,
    iconeCouleur: Brand.warning,
    texte: 'Choisissez une pharmacie et déplacez-vous',
  },
  {
    icone: 'chatbubble-ellipses-outline' as const,
    iconeBg: Brand.dangerBg,
    iconeCouleur: Brand.danger,
    texte: 'Le pharmacien vous conseille sur place',
  },
];

export default function AccueilScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Bandeau reduit : juste le logo, pas un bloc colore plein ecran */}
      <View style={styles.bandeau}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoEmoji}>💊</Text>
        </View>
        <Text style={styles.appName}>Pharma Proche</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Carte hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="medical" size={34} color={Brand.primary} />
          </View>
          <Text style={styles.heroTitle}>La bonne pharmacie, du premier coup</Text>
          <Text style={styles.heroSubtitle}>
            Comparez les prix et la disponibilité de vos médicaments près de chez vous, avant de
            vous déplacer.
          </Text>
        </View>

        {/*
          Emplacement publicitaire (ex: hopital, clinique, ONG partenaire).
          Contenu statique pour l'instant -- a terme, remplacer par un appel
          API si plusieurs annonceurs doivent tourner en rotation.
        */}
        <View style={styles.adCard}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>PUBLICITÉ</Text>
          </View>
          <View style={styles.adRow}>
            <View style={styles.adIconCircle}>
              <Ionicons name="medical-outline" size={24} color="#2B5F8A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adTitle}>Hôpital Docteur Bademba</Text>
              <Text style={styles.adSubtitle}>
                Bilans de santé complets — prenez rendez-vous dès aujourd'hui
              </Text>
            </View>
          </View>
          <View style={styles.adLinkRow}>
            <Text style={styles.adLinkText}>En savoir plus</Text>
            <Ionicons name="arrow-forward" size={13} color={Brand.primary} />
          </View>
        </View>

        {/* Comment ca marche : rangees empilees (icone + texte cote a cote) */}
        <View style={styles.etapesColonne}>
          {ETAPES.map((etape, index) => (
            <View key={index} style={styles.etapeRangee}>
              <View style={[styles.etapeIconCircle, { backgroundColor: etape.iconeBg }]}>
                <Ionicons name={etape.icone} size={16} color={etape.iconeCouleur} />
              </View>
              <Text style={styles.etapeTexteRangee}>{etape.texte}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* CTA fixe en bas */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/recherche')}
          style={styles.ctaButton}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Commencer</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/login')}
          style={styles.pharmacienLink}
          accessibilityRole="button"
        >
          <Text style={styles.pharmacienLinkText}>
            Vous êtes pharmacien ?{' '}
            <Text style={styles.pharmacienLinkTextBold}>Connectez-vous</Text>
          </Text>
        </Pressable>
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
    gap: 9,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 13 },
  appName: { fontWeight: '800', fontSize: 15, color: Colors.light.background },
  scrollContent: { padding: Spacing.four, paddingBottom: Spacing.four },
  heroCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#1C2420',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 27,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  etapesColonne: {
    marginTop: 18,
    gap: 10,
  },
  etapeRangee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    shadowColor: '#1C2420',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  etapeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  etapeTexteRangee: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.light.text,
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.accent,
    paddingVertical: 17,
    borderRadius: 16,
    minHeight: 44,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  pharmacienLink: { alignItems: 'center', paddingTop: 14 },
  pharmacienLinkText: { fontSize: 12.5, color: Brand.textFaint },
  pharmacienLinkTextBold: { color: Brand.primary, fontWeight: '700' },

  adCard: {
    marginTop: 16,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 14,
  },
  adBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: Brand.chipBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Brand.textFaint,
    letterSpacing: 0.5,
  },
  adRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E4EEF7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adTitle: { fontSize: 13.5, fontWeight: '700', color: Colors.light.text },
  adSubtitle: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2, lineHeight: 16 },
  adLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 10,
  },
  adLinkText: { fontSize: 12.5, fontWeight: '700', color: Brand.primary },
});