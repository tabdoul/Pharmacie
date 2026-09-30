import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { apiClient } from '@/api/client';
import { storage } from '@/lib/storage';

type ArticleListe = {
  id: string;
  label: string;
};

const SUGGESTIONS = ['Vitamine C', 'Sirop toux', 'Sérum physio'];
const QUARTIER_PATIENT_KEY = 'quartier_patient';

export default function RechercheScreen() {
  const router = useRouter();
  const [valeur, setValeur] = useState('');
  const [articles, setArticles] = useState<ArticleListe[]>([]);
  const [quartiers, setQuartiers] = useState<string[]>([]);
  const [monQuartier, setMonQuartier] = useState<string | null>(null);
  const [modaleQuartierOuverte, setModaleQuartierOuverte] = useState(false);

  useEffect(() => {
    storage.getItem(QUARTIER_PATIENT_KEY).then((valeur) => {
      if (valeur) setMonQuartier(valeur);
    });
    apiClient.get<string[]>('/api/public/quartiers').then(setQuartiers).catch(() => {
      // Non bloquant : si ca echoue, on n'affiche simplement pas le selecteur
    });
  }, []);

  const choisirQuartier = (quartier: string | null) => {
    setMonQuartier((precedent) => {
      const nouveau = precedent === quartier ? null : quartier;
      if (nouveau) {
        storage.setItem(QUARTIER_PATIENT_KEY, nouveau);
      } else {
        storage.deleteItem(QUARTIER_PATIENT_KEY);
      }
      return nouveau;
    });
    setModaleQuartierOuverte(false);
  };

  const dejaDansListe = (label: string) =>
    articles.some((a) => a.label.toLowerCase() === label.toLowerCase());

  const ajouterCourant = () => {
    const terme = valeur.trim();
    if (!terme) return;
    if (dejaDansListe(terme)) {
      setValeur('');
      return;
    }
    setArticles((precedent) => [...precedent, { id: String(Date.now()), label: terme }]);
    setValeur('');
  };

  const ajouterSuggestion = (label: string) => {
    if (dejaDansListe(label)) return;
    setArticles((precedent) => [...precedent, { id: String(Date.now()) + label, label }]);
  };

  const retirer = (id: string) => {
    setArticles((precedent) => precedent.filter((a) => a.id !== id));
  };

  const peutAjouter = valeur.trim().length > 0;
  const nombreArticles = articles.length;

  const lancerRecherche = () => {
    if (nombreArticles === 1) {
      router.push({ pathname: '/resultats', params: { nom: articles[0].label } });
    } else if (nombreArticles >= 2) {
      router.push({
        pathname: '/resultats-liste',
        params: { noms: JSON.stringify(articles.map((a) => a.label)) },
      });
    }
  };

  let libelleCta = 'Ajoutez un médicament';
  if (nombreArticles === 1) libelleCta = 'Rechercher';
  if (nombreArticles >= 2) libelleCta = `Rechercher ma liste (${nombreArticles})`;

  return (
    <View style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour à l'accueil" style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.light.background} />
          </Pressable>
          <View style={styles.logoBadge}>
            <Ionicons name="medkit" size={20} color={Brand.primary} />
          </View>
          <Text style={styles.appName}>Pharma Proche</Text>
        </View>
        <Text style={styles.tagline}>
          Ajoutez un ou plusieurs médicaments, puis lancez la recherche.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.four }}>
        {/* Barre de recherche + bouton dedie */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Brand.textFaint} />
              <TextInput
                value={valeur}
                onChangeText={setValeur}
                placeholder="Nom du médicament"
                placeholderTextColor={Brand.textFaint}
                style={styles.searchInput}
                onSubmitEditing={ajouterCourant}
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={ajouterCourant}
              disabled={!peutAjouter}
              style={[styles.addButton, peutAjouter && styles.addButtonActive]}
              accessibilityRole="button"
              accessibilityLabel="Ajouter à la liste"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Mon quartier */}
        {quartiers.length > 0 && (
          <View style={styles.quartierSection}>
            <Pressable
              onPress={() => setModaleQuartierOuverte(true)}
              style={styles.quartierSelecteur}
              accessibilityRole="button"
            >
              <Ionicons name="location-outline" size={18} color={Brand.textFaint} />
              <Text style={styles.quartierSelecteurTexte}>
                {monQuartier ? `Mon quartier : ${monQuartier}` : 'Choisir mon quartier (optionnel)'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Brand.textFaint} />
            </Pressable>
          </View>
        )}

        {/* Ma liste */}
        <View style={styles.listeSection}>
          <Text style={styles.listeLabel}>
            Ma liste — {nombreArticles === 0 ? 'vide' : `${nombreArticles} médicament${nombreArticles > 1 ? 's' : ''}`}
          </Text>

          {articles.length === 0 ? (
            <View style={styles.listeVide}>
              <Text style={styles.listeVideText}>
                Tapez un médicament ci-dessus et appuyez sur le bouton +
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {articles.map((article) => (
                <View key={article.id} style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="medkit-outline" size={14} color={Brand.primary} />
                  </View>
                  <Text style={styles.itemText}>{article.label}</Text>
                  <Pressable
                    onPress={() => retirer(article.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer ${article.label}`}
                    style={styles.itemRemove}
                  >
                    <Ionicons name="close" size={16} color={Brand.textFaint} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Suggestions rapides */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsLabel}>Ajout rapide</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SUGGESTIONS.map((label) => (
              <Pressable key={label} onPress={() => ajouterSuggestion(label)} style={styles.suggestionChip}>
                <Text style={styles.suggestionChipText}>+ {label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* CTA fixe en bas */}
      <View style={styles.footer}>
        <Pressable
          onPress={lancerRecherche}
          disabled={nombreArticles === 0}
          style={[styles.ctaButton, nombreArticles === 0 && styles.ctaButtonDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{libelleCta}</Text>
          {nombreArticles > 0 && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </Pressable>
      </View>

      {/* Modale de selection du quartier */}
      <Modal
        visible={modaleQuartierOuverte}
        transparent
        animationType="slide"
        onRequestClose={() => setModaleQuartierOuverte(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModaleQuartierOuverte(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Choisir mon quartier</Text>
            <FlatList
              data={quartiers}
              keyExtractor={(item) => item}
              style={{ maxHeight: 320 }}
              ListHeaderComponent={
                <Pressable onPress={() => choisirQuartier(null)} style={styles.modalItem}>
                  <Text style={styles.modalItemTexte}>Aucun (tous les quartiers)</Text>
                  {monQuartier === null && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
                </Pressable>
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => choisirQuartier(item)} style={styles.modalItem}>
                  <Text style={styles.modalItemTexte}>{item}</Text>
                  {monQuartier === item && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    gap: 6,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { padding: 2 },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 19, fontWeight: '800', color: Colors.light.background },
  tagline: { fontSize: 13.5, color: '#BFE0D6', lineHeight: 19 },
  searchSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 15.5, color: Colors.light.text, paddingVertical: 13 },
  addButton: {
    width: 52,
    borderRadius: 14,
    backgroundColor: '#C7CFC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: { backgroundColor: Brand.primary },
  quartierSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  quartierSelecteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  quartierSelecteurTexte: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.light.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 36, 32, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  modalItemTexte: { fontSize: 15, color: Colors.light.text, fontWeight: '600' },
  listeSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  listeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  listeVide: {
    padding: 16,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  listeVideText: { fontSize: 13, color: Brand.textFaint, textAlign: 'center' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 11,
  },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.light.text },
  itemRemove: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  suggestionsSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: 8 },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  suggestionChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: Brand.chipBg,
    borderRadius: 12,
  },
  suggestionChipText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
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
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 44,
  },
  ctaButtonDisabled: { backgroundColor: '#C7CFC9' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});