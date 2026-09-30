import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { apiClient, ApiError } from '@/api/client';

type ArticleMatch = {
  nomDemande: string;
  trouve: boolean;
  nomProduit: string | null;
  formeProduit: string | null;
  prix: number | null;
  stockId: number | null;
};

type PharmacieMatch = {
  pharmacieId: number;
  nomPharmacie: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
  nombreTrouves: number;
  nombreDemandes: number;
  prixTotal: number;
  articles: ArticleMatch[];
};

export default function ResultatsListeScreen() {
  const router = useRouter();
  const { noms } = useLocalSearchParams<{ noms: string }>();

  const [resultats, setResultats] = useState<PharmacieMatch[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [articlesDemandes, setArticlesDemandes] = useState<string[]>([]);
  const [pharmacieOuverte, setPharmacieOuverte] = useState<number | null>(null);

  useEffect(() => {
    if (!noms) return;

    let listeArticles: string[] = [];
    try {
      listeArticles = JSON.parse(noms);
    } catch {
      setErreur('Liste de médicaments invalide.');
      setChargement(false);
      return;
    }
    setArticlesDemandes(listeArticles);

    let annule = false;
    setChargement(true);
    setErreur(null);

    apiClient
      .post<PharmacieMatch[]>('/api/public/recherche-liste', { noms: listeArticles })
      .then((data) => {
        if (!annule) setResultats(data);
      })
      .catch((e) => {
        if (!annule) setErreur(e instanceof ApiError ? e.message : 'Impossible de charger les résultats.');
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [noms]);

  const appeler = (telephone: string | null) => {
    if (telephone) Linking.openURL(`tel:${telephone}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={Colors.light.background} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Résultats de ma liste</Text>
          <Text style={styles.headerSubtitle}>
            {articlesDemandes.length} médicament{articlesDemandes.length > 1 ? 's' : ''} recherché
            {articlesDemandes.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

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

      {!chargement && !erreur && resultats.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Brand.border} />
          <Text style={styles.videTitle}>Aucune pharmacie trouvée</Text>
          <Text style={styles.videText}>
            Aucune pharmacie n'a l'un de ces médicaments en stock pour le moment.
          </Text>
        </View>
      )}

      {!chargement && !erreur && resultats.length > 0 && (
        <FlatList
          data={resultats}
          keyExtractor={(item) => String(item.pharmacieId)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const complet = item.nombreTrouves === item.nombreDemandes;
            const ouverte = pharmacieOuverte === item.pharmacieId;

            return (
              <View style={[styles.card, complet && styles.cardComplete]}>
                <Pressable
                  onPress={() => setPharmacieOuverte(ouverte ? null : item.pharmacieId)}
                  style={styles.cardHeader}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{item.nomPharmacie}</Text>
                      {index === 0 && (
                        <View style={styles.bestBadge}>
                          <Text style={styles.bestBadgeText}>Meilleure couverture</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardLocation}>
                      📍 {item.quartier ? `${item.quartier}, ` : ''}{item.ville}
                    </Text>
                    <View style={styles.coverageRow}>
                      <View style={styles.coverageBarTrack}>
                        <View
                          style={[
                            styles.coverageBarFill,
                            { width: `${(item.nombreTrouves / item.nombreDemandes) * 100}%` },
                            complet && styles.coverageBarFillComplete,
                          ]}
                        />
                      </View>
                      <Text style={[styles.coverageText, complet && styles.coverageTextComplete]}>
                        {item.nombreTrouves}/{item.nombreDemandes}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={ouverte ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Brand.textFaint}
                  />
                </Pressable>

                {ouverte && (
                  <View style={styles.detailSection}>
                    {item.articles.map((article) => (
                      <View key={article.nomDemande} style={styles.articleRow}>
                        <Ionicons
                          name={article.trouve ? 'checkmark-circle' : 'close-circle-outline'}
                          size={17}
                          color={article.trouve ? Brand.success : Brand.textFaint}
                        />
                        <Text
                          style={[
                            styles.articleText,
                            !article.trouve && styles.articleTextIndisponible,
                          ]}
                        >
                          {article.nomDemande}
                        </Text>
                        {article.trouve && article.prix !== null && (
                          <Text style={styles.articlePrix}>
                            {article.prix.toLocaleString('fr-FR')} GNF
                          </Text>
                        )}
                      </View>
                    ))}

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total (articles disponibles)</Text>
                      <Text style={styles.totalValue}>
                        {item.prixTotal.toLocaleString('fr-FR')} GNF
                      </Text>
                    </View>

                    {item.telephone && (
                      <Pressable onPress={() => appeler(item.telephone)} style={styles.callButton}>
                        <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.callButtonText}>Appeler la pharmacie</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          }}
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
    paddingBottom: Spacing.four,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: Colors.light.background },
  headerSubtitle: { fontSize: 13, color: '#BFE0D6', marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: 8 },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  videTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  videText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
  listContent: { padding: Spacing.four, gap: 10 },
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardComplete: { borderColor: Brand.success },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15.5, fontWeight: '700', color: Colors.light.text },
  bestBadge: { backgroundColor: Brand.successBg, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  bestBadgeText: { fontSize: 10.5, fontWeight: '700', color: Brand.primary },
  cardLocation: { fontSize: 12.5, color: Brand.textFaint, marginTop: 3 },
  coverageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  coverageBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: Brand.chipBg,
    overflow: 'hidden',
  },
  coverageBarFill: { height: '100%', backgroundColor: Brand.warning, borderRadius: 999 },
  coverageBarFillComplete: { backgroundColor: Brand.success },
  coverageText: { fontSize: 12, fontWeight: '700', color: Brand.warning },
  coverageTextComplete: { color: Brand.success },
  detailSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 12,
  },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  articleText: { flex: 1, fontSize: 13.5, color: Colors.light.text, fontWeight: '600' },
  articleTextIndisponible: { color: Brand.textFaint, fontWeight: '400', textDecorationLine: 'line-through' },
  articlePrix: { fontSize: 13, fontWeight: '700', color: Colors.light.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  totalLabel: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.accent,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  callButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});