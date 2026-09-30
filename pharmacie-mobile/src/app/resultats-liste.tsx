import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { apiClient, ApiError } from '@/api/client';
import { usePanier } from '@/context/PanierContext';
import { storage } from '@/lib/storage';

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

const SEUIL_BONNE_CORRESPONDANCE = 0.5;

export default function ResultatsListeScreen() {
  const router = useRouter();
  const { noms } = useLocalSearchParams<{ noms: string }>();
  const { items: panierItems, ajouter, retirer, estDansPanier } = usePanier();

  const [resultats, setResultats] = useState<PharmacieMatch[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [articlesDemandes, setArticlesDemandes] = useState<string[]>([]);
  const [pharmacieOuverte, setPharmacieOuverte] = useState<number | null>(null);
  const [autresDepliees, setAutresDepliees] = useState(false);
  const [monQuartier, setMonQuartier] = useState<string | null>(null);

  useEffect(() => {
    storage.getItem('quartier_patient').then((valeur) => {
      if (valeur) setMonQuartier(valeur);
    });
  }, []);

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

  const voirDetail = (stockId: number | null) => {
    if (stockId === null) return;
    router.push({ pathname: '/produit/[stockId]', params: { stockId: String(stockId) } });
  };

  const resultatsTries = [...resultats].sort((a, b) => {
    if (monQuartier) {
      const aMatch = a.quartier === monQuartier ? 0 : 1;
      const bMatch = b.quartier === monQuartier ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    if (a.nombreTrouves !== b.nombreTrouves) return b.nombreTrouves - a.nombreTrouves;
    return a.prixTotal - b.prixTotal;
  });

  const bonnesCorrespondances = resultatsTries.filter(
    (r) => r.nombreTrouves / r.nombreDemandes >= SEUIL_BONNE_CORRESPONDANCE
  );
  const autresPharmacies = resultatsTries.filter(
    (r) => r.nombreTrouves / r.nombreDemandes < SEUIL_BONNE_CORRESPONDANCE
  );

  const basculerPanier = (pharmacie: PharmacieMatch, article: ArticleMatch) => {
    if (!article.trouve || article.stockId === null || article.prix === null || !article.nomProduit) return;

    if (estDansPanier(article.stockId)) {
      retirer(article.stockId);
      return;
    }

    ajouter({
      stockId: article.stockId,
      nomDemande: article.nomDemande,
      nomProduit: article.nomProduit,
      formeProduit: article.formeProduit,
      prix: article.prix,
      nomPharmacie: pharmacie.nomPharmacie,
      pharmacieId: pharmacie.pharmacieId,
      ville: pharmacie.ville,
      quartier: pharmacie.quartier,
      telephone: pharmacie.telephone,
    });
  };

  const renderPharmacieCard = (item: PharmacieMatch, indexDansGroupe: number, estBonneCorrespondance: boolean) => {
    const complet = item.nombreTrouves === item.nombreDemandes;
    const ouverte = pharmacieOuverte === item.pharmacieId;
    const memeQuartier = monQuartier !== null && item.quartier === monQuartier;

    return (
      <View key={item.pharmacieId} style={[styles.card, complet && styles.cardComplete]}>
        <Pressable
          onPress={() => setPharmacieOuverte(ouverte ? null : item.pharmacieId)}
          style={styles.cardHeader}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{item.nomPharmacie}</Text>
              {memeQuartier && (
                <View style={styles.sameAreaBadge}>
                  <Text style={styles.sameAreaBadgeText}>Même quartier</Text>
                </View>
              )}
              {!memeQuartier && estBonneCorrespondance && indexDansGroupe === 0 && (
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
          <Ionicons name={ouverte ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.textFaint} />
        </Pressable>

        {ouverte && (
          <View style={styles.detailSection}>
            {item.articles.map((article) => {
              const cliquable = article.trouve && article.stockId !== null;
              const dansPanier = article.stockId !== null && estDansPanier(article.stockId);

              return (
                <View key={article.nomDemande} style={styles.articleRow}>
                  <Pressable
                    onPress={() => voirDetail(article.stockId)}
                    disabled={!cliquable}
                    style={styles.articleInfo}
                  >
                    <Ionicons
                      name={article.trouve ? 'checkmark-circle' : 'close-circle-outline'}
                      size={17}
                      color={article.trouve ? Brand.success : Brand.textFaint}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.articleText, !article.trouve && styles.articleTextIndisponible]}>
                        {article.nomDemande}
                      </Text>
                      {article.trouve && article.prix !== null && (
                        <Text style={styles.articlePrixSousTexte}>
                          {article.prix.toLocaleString('fr-FR')} GNF
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  {cliquable && (
                    <Pressable
                      onPress={() => basculerPanier(item, article)}
                      style={[styles.ajouterButton, dansPanier && styles.ajouterButtonActif]}
                      accessibilityRole="button"
                      accessibilityLabel={dansPanier ? `Retirer ${article.nomDemande} du panier` : `Ajouter ${article.nomDemande} au panier`}
                    >
                      <Ionicons
                        name={dansPanier ? 'checkmark' : 'add'}
                        size={15}
                        color={dansPanier ? '#FFFFFF' : Brand.primary}
                      />
                      <Text style={[styles.ajouterButtonText, dansPanier && styles.ajouterButtonTextActif]}>
                        {dansPanier ? 'Ajouté' : 'Ajouter'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total (articles disponibles)</Text>
              <Text style={styles.totalValue}>{item.prixTotal.toLocaleString('fr-FR')} GNF</Text>
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
        <Pressable
          onPress={() => router.push('/panier')}
          style={styles.panierButton}
          accessibilityRole="button"
          accessibilityLabel="Voir mon panier"
        >
          <Ionicons name="bag-outline" size={20} color="#FFFFFF" />
          {panierItems.length > 0 && (
            <View style={styles.panierBadge}>
              <Text style={styles.panierBadgeText}>{panierItems.length}</Text>
            </View>
          )}
        </Pressable>
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
          data={bonnesCorrespondances}
          keyExtractor={(item) => String(item.pharmacieId)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.videText}>
              Aucune pharmacie n'a la moitié ou plus des médicaments demandés.
            </Text>
          }
          renderItem={({ item, index }) => renderPharmacieCard(item, index, true)}
          ListFooterComponent={
            autresPharmacies.length > 0 ? (
              <View>
                <Pressable
                  onPress={() => setAutresDepliees((precedent) => !precedent)}
                  style={styles.toggleAutresButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.toggleAutresText}>
                    {autresDepliees ? 'Masquer' : 'Voir aussi'} {autresPharmacies.length} autre
                    {autresPharmacies.length > 1 ? 's' : ''} pharmacie
                    {autresPharmacies.length > 1 ? 's' : ''} (couverture partielle)
                  </Text>
                  <Ionicons
                    name={autresDepliees ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Brand.primary}
                  />
                </Pressable>
                {autresDepliees &&
                  autresPharmacies.map((item, index) => renderPharmacieCard(item, index, false))}
              </View>
            ) : null
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
    paddingBottom: Spacing.four,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: Colors.light.background },
  headerSubtitle: { fontSize: 13, color: '#BFE0D6', marginTop: 4 },
  panierButton: { position: 'relative', padding: 2 },
  panierBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  panierBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
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
  sameAreaBadge: { backgroundColor: Brand.warningBg, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  sameAreaBadgeText: { fontSize: 10.5, fontWeight: '700', color: Brand.warning },
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
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  articleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  articleText: { fontSize: 13.5, color: Colors.light.text, fontWeight: '600' },
  articleTextIndisponible: { color: Brand.textFaint, fontWeight: '400', textDecorationLine: 'line-through' },
  articlePrixSousTexte: { fontSize: 11.5, color: Brand.textFaint, marginTop: 1 },
  ajouterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Brand.successBg,
    flexShrink: 0,
  },
  ajouterButtonActif: { backgroundColor: Brand.success },
  ajouterButtonText: { fontSize: 11.5, fontWeight: '700', color: Brand.primary },
  ajouterButtonTextActif: { color: '#FFFFFF' },
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
  toggleAutresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 6,
  },
  toggleAutresText: { fontSize: 13.5, fontWeight: '700', color: Brand.primary, textAlign: 'center' },
});