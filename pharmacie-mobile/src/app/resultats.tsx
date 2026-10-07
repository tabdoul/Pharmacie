import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { apiClient, ApiError, API_BASE_URL } from '@/api/client';
import { storage } from '@/lib/storage';

type StockRecherche = {
  stockId: number;
  nomProduit: string;
  formeProduit: string | null;
  imageUrl: string | null;
  nomPharmacie: string;
  ville: string;
  quartier: string | null;
  prix: number;
};

const QUARTIER_PATIENT_KEY = 'quartier_patient';

const LIBELLE_FORME: Record<string, string> = {
  COMPRIME: 'Comprimé', GELULE: 'Gélule', SIROP: 'Sirop', INJECTABLE: 'Injectable',
  POMMADE: 'Pommade', CREME: 'Crème', SUPPOSITOIRE: 'Suppositoire', POUDRE: 'Poudre',
  GOUTTES: 'Gouttes', PATCH: 'Patch', SPRAY: 'Spray', AUTRE: 'Autre',
};

export default function ResultatsScreen() {
  const router = useRouter();
  const { nom } = useLocalSearchParams<{ nom: string }>();

  const [resultats, setResultats] = useState<StockRecherche[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [quartiers, setQuartiers] = useState<string[]>([]);
  const [monQuartier, setMonQuartier] = useState<string | null>(null);
  const [formeFiltre, setFormeFiltre] = useState<string | null>(null);

  // Charge le quartier memorise, et la liste des quartiers disponibles
  useEffect(() => {
    storage.getItem(QUARTIER_PATIENT_KEY).then((valeur) => {
      if (valeur) setMonQuartier(valeur);
    });
    apiClient.get<string[]>('/api/public/quartiers').then(setQuartiers).catch(() => {
      // Non bloquant : si ca echoue, on affiche simplement les resultats sans selecteur
    });
  }, []);

  const choisirQuartier = useCallback((quartier: string) => {
    setMonQuartier((precedent) => {
      const nouveau = precedent === quartier ? null : quartier;
      if (nouveau) {
        storage.setItem(QUARTIER_PATIENT_KEY, nouveau);
      } else {
        storage.deleteItem(QUARTIER_PATIENT_KEY);
      }
      return nouveau;
    });
  }, []);

  useEffect(() => {
    if (!nom) return;

    let annule = false;
    setChargement(true);
    setErreur(null);
    setFormeFiltre(null);

    apiClient
      .get<StockRecherche[]>(`/api/public/recherche?nom=${encodeURIComponent(nom)}`)
      .then((data) => {
        if (annule) return;
        setResultats(data);
      })
      .catch((e) => {
        if (annule) return;
        setErreur(e instanceof ApiError ? e.message : 'Impossible de charger les résultats.');
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [nom]);

  // Formes disponibles parmi les resultats de cette recherche (pour le filtre)
  const formesDisponibles = Array.from(
    new Set(resultats.map((r) => r.formeProduit).filter((f): f is string => !!f))
  ).sort();

  // Tri : meme quartier que le patient en premier, puis prix croissant
  // a l'interieur de chaque groupe (meme quartier / autres quartiers).
  const resultatsTries = [...resultats]
    .filter((r) => !formeFiltre || r.formeProduit === formeFiltre)
    .sort((a, b) => {
      if (monQuartier) {
        const aMatch = a.quartier === monQuartier ? 0 : 1;
        const bMatch = b.quartier === monQuartier ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      return a.prix - b.prix;
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour à la recherche"
          style={styles.backLink}
        >
          <Text style={styles.backText}>← Modifier la recherche</Text>
        </Pressable>
        <View style={styles.searchPill}>
          <Text style={styles.searchPillText}>{nom}</Text>
        </View>
      </View>

      {formesDisponibles.length > 1 && (
        <View style={styles.formeSection}>
          <Text style={styles.formeLabel}>Forme</Text>
          <View style={styles.formeChips}>
            {formesDisponibles.map((forme) => {
              const selectionne = formeFiltre === forme;
              return (
                <Pressable
                  key={forme}
                  onPress={() => setFormeFiltre((precedent) => (precedent === forme ? null : forme))}
                  style={[styles.formeChip, selectionne && styles.formeChipActive]}
                >
                  <Text style={[styles.formeChipText, selectionne && styles.formeChipTextActive]}>
                    {LIBELLE_FORME[forme] ?? forme}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {quartiers.length > 0 && (
        <View style={styles.quartierSection}>
          <Text style={styles.quartierLabel}>Mon quartier (optionnel)</Text>
          <View style={styles.quartierChips}>
            {quartiers.map((quartier) => {
              const selectionne = monQuartier === quartier;
              return (
                <Pressable
                  key={quartier}
                  onPress={() => choisirQuartier(quartier)}
                  style={[styles.quartierChip, selectionne && styles.quartierChipActive]}
                >
                  <Text style={[styles.quartierChipText, selectionne && styles.quartierChipTextActive]}>
                    {quartier}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {chargement && (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.primary} size="large" />
        </View>
      )}

      {!chargement && erreur && (
        <View style={styles.centered}>
          <Text style={styles.erreurText}>{erreur}</Text>
        </View>
      )}

      {!chargement && !erreur && resultatsTries.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.videTitle}>Aucun résultat</Text>
          <Text style={styles.videText}>
            {formeFiltre
              ? `Aucune pharmacie n'a "${nom}" sous cette forme pour le moment.`
              : `Aucune pharmacie n'a "${nom}" en stock pour le moment.`}
          </Text>
        </View>
      )}

      {!chargement && !erreur && resultatsTries.length > 0 && (
        <FlatList
          data={resultatsTries}
          keyExtractor={(item) => String(item.stockId)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {resultatsTries.length} pharmacie{resultatsTries.length > 1 ? 's ont' : ' a'} ce produit en stock
            </Text>
          }
          renderItem={({ item, index }) => {
            const memeQuartier = monQuartier !== null && item.quartier === monQuartier;
            const estMeilleurPrix = !monQuartier
              ? index === 0
              : memeQuartier && index === 0;

            return (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/produit/[stockId]', params: { stockId: String(item.stockId) } })
                }
                style={styles.card}
              >
                <View style={styles.iconBox}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}${item.imageUrl}` }}
                      style={styles.iconImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.iconGlyph}>℞</Text>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.nomProduit}</Text>
                    {memeQuartier && (
                      <View style={styles.sameAreaBadge}>
                        <Text style={styles.sameAreaText}>Même quartier</Text>
                      </View>
                    )}
                    {!memeQuartier && estMeilleurPrix && (
                      <View style={styles.bestPriceBadge}>
                        <Text style={styles.bestPriceText}>Meilleur prix</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.pharmacyName}>{item.nomPharmacie}</Text>
                  <Text style={styles.pharmacyLocation}>
                    📍 {item.quartier ? `${item.quartier}, ` : ''}{item.ville}
                  </Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceValue}>{item.prix.toLocaleString('fr-FR')}</Text>
                  <Text style={styles.priceUnit}>GNF</Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                Les écarts de prix ne sont pas toujours suspects : source d'approvisionnement,
                date de péremption, etc.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Brand.primary,
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: 14,
  },
  backLink: { alignSelf: 'flex-start' },
  backText: { color: Colors.light.background, fontSize: 14, fontWeight: '600' },
  searchPill: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  searchPillText: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  formeSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: 4,
    gap: 8,
    backgroundColor: Colors.light.background,
  },
  formeLabel: { fontSize: 12.5, fontWeight: '600', color: Colors.light.textSecondary },
  formeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formeChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  formeChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  formeChipText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  formeChipTextActive: { color: '#FFFFFF' },
  quartierSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: 4,
    gap: 8,
    backgroundColor: Colors.light.background,
  },
  quartierLabel: { fontSize: 12.5, fontWeight: '600', color: Colors.light.textSecondary },
  quartierChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quartierChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: Brand.chipBg,
  },
  quartierChipActive: { backgroundColor: Brand.primary },
  quartierChipText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  quartierChipTextActive: { color: '#FFFFFF' },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.two,
  },
  listContent: { padding: Spacing.four, gap: Spacing.three },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: 8 },
  videTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  videText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 16,
    marginBottom: Spacing.two,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: { width: '100%', height: '100%' },
  iconGlyph: { fontSize: 24, color: Brand.primary },
  cardBody: { flex: 1, gap: 5, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  bestPriceBadge: {
    backgroundColor: Brand.successBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  bestPriceText: { fontSize: 11, fontWeight: '700', color: Brand.primary },
  sameAreaBadge: {
    backgroundColor: Brand.warningBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  sameAreaText: { fontSize: 11, fontWeight: '700', color: Brand.warning },
  pharmacyName: { fontSize: 13, color: Colors.light.textSecondary },
  pharmacyLocation: { fontSize: 12.5, color: Brand.textFaint },
  priceBox: { alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  priceValue: { fontSize: 17, fontWeight: '800', color: Colors.light.text },
  priceUnit: { fontSize: 11, color: Brand.textFaint },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: Brand.chipBg,
    borderRadius: 14,
    marginTop: Spacing.two,
  },
  noteText: { flex: 1, fontSize: 12.5, color: '#5B4A20', lineHeight: 18 },
});