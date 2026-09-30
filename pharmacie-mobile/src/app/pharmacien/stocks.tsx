import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/api/client';

type StockPharmacien = {
  stockId: number;
  produitId: number;
  nomProduit: string;
  formeProduit: string | null;
  quantite: number;
  seuilAlerte: number;
  prix: number;
  statut: 'DISPONIBLE' | 'STOCK_FAIBLE' | 'RUPTURE';
  dateDerniereMaj: string;
};

const LIBELLE_FORME: Record<string, string> = {
  COMPRIME: 'Comprimé', GELULE: 'Gélule', SIROP: 'Sirop', INJECTABLE: 'Injectable',
  POMMADE: 'Pommade', CREME: 'Crème', SUPPOSITOIRE: 'Suppositoire', POUDRE: 'Poudre',
  GOUTTES: 'Gouttes', PATCH: 'Patch', SPRAY: 'Spray', AUTRE: 'Autre',
};

const STATUT_COULEUR = {
  DISPONIBLE: { point: Brand.success, fond: Colors.light.backgroundElement, bordure: Brand.border },
  STOCK_FAIBLE: { point: Brand.warning, fond: Brand.warningBg, bordure: '#EAD9BB' },
  RUPTURE: { point: Brand.danger, fond: Brand.dangerBg, bordure: '#EBC9BF' },
} as const;

export default function StocksScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { statut: statutParam } = useLocalSearchParams<{ statut?: string }>();

  const [stocks, setStocks] = useState<StockPharmacien[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [formeSelectionnee, setFormeSelectionnee] = useState<string | null>(null);
  const [statutFiltre, setStatutFiltre] = useState<string | null>(statutParam ?? null);

  const [stockEnEdition, setStockEnEdition] = useState<StockPharmacien | null>(null);
  const [quantiteEdit, setQuantiteEdit] = useState('');
  const [prixEdit, setPrixEdit] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEdition, setErreurEdition] = useState<string | null>(null);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    setChargement(true);
    setErreur(null);
    apiClient
      .get<StockPharmacien[]>('/api/pharmacien/stocks', token)
      .then(setStocks)
      .catch((e) => setErreur(e instanceof ApiError ? e.message : 'Impossible de charger le stock.'))
      .finally(() => setChargement(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const formesDisponibles = Array.from(
    new Set(stocks.map((s) => s.formeProduit).filter((f): f is string => !!f))
  ).sort();

  const stocksFiltres = stocks.filter((s) => {
    const matchRecherche = s.nomProduit.toLowerCase().includes(recherche.trim().toLowerCase());
    const matchForme = !formeSelectionnee || s.formeProduit === formeSelectionnee;
    const matchStatut = !statutFiltre || s.statut === statutFiltre;
    return matchRecherche && matchForme && matchStatut;
  });

  const ouvrirEdition = (stock: StockPharmacien) => {
    setStockEnEdition(stock);
    setQuantiteEdit(String(stock.quantite));
    setPrixEdit(String(stock.prix));
    setErreurEdition(null);
    setConfirmationSuppressionOuverte(false);
  };

  const fermerEdition = () => {
    Keyboard.dismiss();
    setStockEnEdition(null);
    setErreurEdition(null);
    setConfirmationSuppressionOuverte(false);
  };

  const enregistrerModification = async () => {
    if (!stockEnEdition || !token) return;

    const quantite = Number(quantiteEdit);
    const prix = Number(prixEdit);

    if (!Number.isFinite(quantite) || quantite < 0) {
      setErreurEdition('La quantité doit être un nombre positif.');
      return;
    }
    if (!Number.isFinite(prix) || prix < 0) {
      setErreurEdition('Le prix doit être un nombre positif.');
      return;
    }

    setEnregistrement(true);
    setErreurEdition(null);
    try {
      const stockMisAJour = await apiClient.patch<StockPharmacien>(
        `/api/pharmacien/stocks/${stockEnEdition.stockId}`,
        { quantite, prix },
        token
      );
      setStocks((precedent) =>
        precedent.map((s) => (s.stockId === stockMisAJour.stockId ? stockMisAJour : s))
      );
      fermerEdition();
    } catch (e) {
      setErreurEdition(e instanceof ApiError ? e.message : 'Échec de la mise à jour.');
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimerStock = async () => {
    if (!stockEnEdition || !token) return;
    setSuppressionEnCours(true);
    setErreurEdition(null);
    try {
      await apiClient.delete(`/api/pharmacien/stocks/${stockEnEdition.stockId}`, token);
      setStocks((precedent) => precedent.filter((s) => s.stockId !== stockEnEdition.stockId));
      fermerEdition();
    } catch (e) {
      setErreurEdition(e instanceof ApiError ? e.message : 'Échec de la suppression.');
    } finally {
      setSuppressionEnCours(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Bandeau reduit */}
      <View style={styles.bandeau}>
        <Text style={styles.bandeauTitle}>Mes stocks</Text>
        <Pressable
          onPress={() => router.push('/pharmacien/ajouter-produit')}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un produit"
          style={styles.addButton}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Recherche */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={Brand.textFaint} />
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un produit du stock"
            placeholderTextColor={Brand.textFaint}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filtre statut actif (venant du dashboard) */}
      {statutFiltre && (
        <View style={styles.filtreStatutBandeau}>
          <Text style={styles.filtreStatutTexte}>
            Filtré : {statutFiltre === 'DISPONIBLE' ? 'Disponible' : statutFiltre === 'STOCK_FAIBLE' ? 'Stock faible' : 'Rupture'}
          </Text>
          <Pressable onPress={() => setStatutFiltre(null)} accessibilityRole="button" accessibilityLabel="Retirer le filtre">
            <Ionicons name="close" size={16} color={Brand.primary} />
          </Pressable>
        </View>
      )}

      {/* Filtres par forme */}
      {formesDisponibles.length > 1 && (
        <View style={styles.filtresSection}>
          <FlatList
            data={['TOUS', ...formesDisponibles]}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => {
              const estTous = item === 'TOUS';
              const selectionne = estTous ? formeSelectionnee === null : formeSelectionnee === item;
              return (
                <Pressable
                  onPress={() => setFormeSelectionnee(estTous ? null : item)}
                  style={[styles.filtreChip, selectionne && styles.filtreChipActif]}
                >
                  <Text style={[styles.filtreChipTexte, selectionne && styles.filtreChipTexteActif]}>
                    {estTous ? 'Tous' : LIBELLE_FORME[item] ?? item}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Legende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Brand.success }]} />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Brand.warning }]} />
          <Text style={styles.legendText}>Stock faible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Brand.danger }]} />
          <Text style={styles.legendText}>Rupture</Text>
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

      {!chargement && !erreur && (
        <FlatList
          data={stocksFiltres}
          keyExtractor={(item) => String(item.stockId)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun produit ne correspond à cette recherche.</Text>
          }
          renderItem={({ item }) => {
            const couleurs = STATUT_COULEUR[item.statut];
            return (
              <View style={[styles.card, { backgroundColor: couleurs.fond, borderColor: couleurs.bordure }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.dot, { backgroundColor: couleurs.point }]} />
                    <Text style={styles.cardTitle}>{item.nomProduit}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {item.quantite} unité{item.quantite > 1 ? 's' : ''}
                    {item.statut === 'STOCK_FAIBLE' ? ` (seuil ${item.seuilAlerte})` : ''}
                    {' · '}
                    {item.prix.toLocaleString('fr-FR')} GNF
                  </Text>
                </View>
                <Pressable
                  onPress={() => ouvrirEdition(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Modifier ${item.nomProduit}`}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={17} color={Colors.light.textSecondary} />
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable onPress={() => router.push('/pharmacien/dashboard')} style={styles.navItem}>
          <Ionicons name="grid-outline" size={20} color={Brand.navInactive} />
          <Text style={styles.navLabel}>Tableau de bord</Text>
        </Pressable>
        <View style={styles.navItem}>
          <Ionicons name="cube" size={20} color={Brand.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Stocks</Text>
        </View>
      </View>

      {/* Modale d'édition rapide */}
      <Modal visible={!!stockEnEdition} transparent animationType="slide" onRequestClose={fermerEdition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{stockEnEdition?.nomProduit}</Text>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setConfirmationSuppressionOuverte(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Supprimer ce produit du stock"
                style={styles.deleteIconButton}
              >
                <Ionicons name="trash-outline" size={18} color={Brand.danger} />
              </Pressable>
            </View>

            {!confirmationSuppressionOuverte ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Quantité en stock</Text>
                  <TextInput
                    value={quantiteEdit}
                    onChangeText={setQuantiteEdit}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Prix (GNF)</Text>
                  <TextInput
                    value={prixEdit}
                    onChangeText={setPrixEdit}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                {erreurEdition && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{erreurEdition}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Pressable onPress={fermerEdition} style={styles.cancelButton} disabled={enregistrement}>
                    <Text style={styles.cancelText}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={enregistrerModification}
                    style={[styles.saveButton, enregistrement && styles.saveButtonDisabled]}
                    disabled={enregistrement}
                  >
                    {enregistrement ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveText}>Enregistrer</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.confirmationBox}>
                  <Ionicons name="warning-outline" size={22} color={Brand.danger} />
                  <Text style={styles.confirmationTexte}>
                    Retirer définitivement "{stockEnEdition?.nomProduit}" du stock de votre pharmacie ?
                    Cette action est irréversible.
                  </Text>
                </View>

                {erreurEdition && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{erreurEdition}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => setConfirmationSuppressionOuverte(false)}
                    style={styles.cancelButton}
                    disabled={suppressionEnCours}
                  >
                    <Text style={styles.cancelText}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={supprimerStock}
                    style={[styles.deleteButton, suppressionEnCours && styles.saveButtonDisabled]}
                    disabled={suppressionEnCours}
                  >
                    {suppressionEnCours ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveText}>Supprimer</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  bandeau: {
    backgroundColor: Brand.headerDark,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bandeauTitle: { fontWeight: '800', fontSize: 18, color: Colors.light.background },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.light.text, paddingVertical: 12 },
  filtresSection: { paddingHorizontal: Spacing.four, paddingTop: 12 },
  filtreStatutBandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.four,
    marginTop: 12,
    backgroundColor: Brand.chipBg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filtreStatutTexte: { fontSize: 12.5, fontWeight: '700', color: Brand.primary },
  filtreChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: Brand.chipBg,
  },
  filtreChipActif: { backgroundColor: Brand.primary },
  filtreChipTexte: { fontSize: 12.5, fontWeight: '600', color: Colors.light.text },
  filtreChipTexteActif: { color: '#FFFFFF' },
  legend: { flexDirection: 'row', gap: 14, paddingHorizontal: Spacing.four, paddingTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 999 },
  legendText: { fontSize: 11.5, fontWeight: '600', color: Colors.light.textSecondary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  emptyText: { fontSize: 13.5, color: Brand.textFaint, textAlign: 'center', marginTop: Spacing.four },
  listContent: { padding: Spacing.four, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 999 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: Colors.light.text },
  cardSubtitle: { fontSize: 12.5, color: Colors.light.textSecondary, marginTop: 3 },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Brand.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    backgroundColor: Colors.light.backgroundElement,
    paddingTop: 12,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navLabel: { fontSize: 11, fontWeight: '600', color: Brand.navInactive },
  navLabelActive: { color: Brand.primary, fontWeight: '700' },
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
    gap: Spacing.three,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text, flex: 1 },
  deleteIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Brand.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorBox: { backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 10 },
  errorText: { color: Brand.danger, fontSize: 13 },
  confirmationBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Brand.dangerBg,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  confirmationTexte: { flex: 1, fontSize: 13.5, color: '#7A2E20', lineHeight: 19 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Brand.chipBg,
  },
  cancelText: { fontWeight: '700', color: Colors.light.text, fontSize: 14.5 },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.primary,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { fontWeight: '700', color: '#FFFFFF', fontSize: 14.5 },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.danger,
  },
});