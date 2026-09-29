import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Brand, Spacing } from '@/constants/theme';

const RECHERCHES_RECENTES = ['Paracétamol 500mg', 'Amoxicilline', 'Vitamine C'];

export default function RechercheScreen() {
  const router = useRouter();
  const [recherche, setRecherche] = useState('');

  const lancerRecherche = (nom: string) => {
    const terme = nom.trim();
    if (!terme) return;
    router.push({ pathname: '/resultats', params: { nom: terme } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <Text style={styles.appName}>Pharma Proche</Text>
        <Text style={styles.tagline}>
          Trouvez un médicament disponible près de chez vous, sans faire le tour des pharmacies.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nom du médicament</Text>
        <View style={styles.searchBox}>
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Ex : Paracétamol, Amoxicilline…"
            placeholderTextColor={Brand.textFaint}
            style={styles.searchInput}
            onSubmitEditing={() => lancerRecherche(recherche)}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={[styles.section, { paddingTop: 4 }]}>
        <Text style={styles.label}>Recherches récentes</Text>
        <View style={styles.chipsRow}>
          {RECHERCHES_RECENTES.map((terme) => (
            <Pressable key={terme} onPress={() => lancerRecherche(terme)} style={styles.chip}>
              <Text style={styles.chipText}>{terme}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={() => lancerRecherche(recherche)}
          style={styles.ctaButton}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Rechercher</Text>
        </Pressable>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Comment ça marche</Text>
        {[
          "Cherchez votre médicament et comparez les prix des pharmacies à proximité.",
          "Choisissez la pharmacie qui vous convient et déplacez-vous pour l'achat.",
          'Le pharmacien vous conseille sur place, comme d\'habitude.',
        ].map((texte, index) => (
          <View key={index} style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.infoText}>{texte}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    gap: 6,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.background,
  },
  tagline: {
    fontSize: 15,
    color: '#BFE0D6',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  searchBox: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    fontSize: 16,
    color: Colors.light.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: Brand.chipBg,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  ctaButton: {
    backgroundColor: Brand.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  infoCard: {
    margin: Spacing.four,
    marginTop: Spacing.five,
    padding: 18,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    gap: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    color: Brand.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});