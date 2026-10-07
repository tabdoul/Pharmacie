import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  Keyboard,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError, API_BASE_URL } from '@/api/client';

type ImportResultat = {
  ajoutes: number;
  ignores: number;
  erreurs: string[];
};

type StockPharmacien = {
  stockId: number;
  produitId: number;
  nomProduit: string;
  formeProduit: string | null;
  imageUrl: string | null;
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
  const [menuFormesOuvert, setMenuFormesOuvert] = useState(false);
  const [statutFiltre, setStatutFiltre] = useState<string | null>(statutParam ?? null);

  const [stockEnEdition, setStockEnEdition] = useState<StockPharmacien | null>(null);
  const [quantiteEdit, setQuantiteEdit] = useState('');
  const [prixEdit, setPrixEdit] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEdition, setErreurEdition] = useState<string | null>(null);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);

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

  const exporterStock = async () => {
    if (!token) return;
    setExportEnCours(true);
    try {
      const reponse = await fetch(`${API_BASE_URL}/api/pharmacien/stocks/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reponse.ok) {
        throw new Error();
      }
      const contenu = await reponse.text();
      const fichier = new File(Paths.cache, 'stock-pharmacie.csv');
      fichier.write(contenu);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fichier.uri, { mimeType: 'text/csv', dialogTitle: 'Exporter mon stock' });
      } else {
        Alert.alert('Export prêt', 'Le fichier CSV a été généré, mais le partage n\'est pas disponible sur cet appareil.');
      }
    } catch {
      Alert.alert('Erreur', "Échec de l'export du stock. Réessayez plus tard.");
    } finally {
      setExportEnCours(false);
    }
  };

  const importerStock = async () => {
    const selection = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
      copyToCacheDirectory: true,
    });
    if (selection.canceled || !selection.assets?.[0] || !token) return;

    const fichier = selection.assets[0];
    setImportEnCours(true);
    try {
      const resultat = await apiClient.uploadFile<ImportResultat>(
        '/api/pharmacien/stocks/import',
        'fichier',
        { uri: fichier.uri, name: fichier.name ?? 'stock.csv', type: 'text/csv' },
        token
      );
      charger();

      const apercuErreurs = resultat.erreurs.slice(0, 5).join('\n');
      const resteErreurs = resultat.erreurs.length > 5 ? `\n… et ${resultat.erreurs.length - 5} autre(s).` : '';
      const detailErreurs = resultat.erreurs.length > 0 ? `\n\n${apercuErreurs}${resteErreurs}` : '';

      Alert.alert(
        'Import terminé',
        `${resultat.ajoutes} produit(s) ajouté(s), ${resultat.ignores} ignoré(s) (déjà dans votre stock).${detailErreurs}`
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof ApiError ? e.message : "Échec de l'import du fichier.");
    } finally {
      setImportEnCours(false);
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
        <View style={styles.bandeauActions}>
          <Pressable
            onPress={importerStock}
            disabled={importEnCours}
            accessibilityRole="button"
            accessibilityLabel="Importer un fichier CSV"
            style={styles.exportButton}
          >
            {importEnCours ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={19} color="#FFFFFF" />
            )}
          </Pressable>
          <Pressable
            onPress={exporterStock}
            disabled={exportEnCours}
            accessibilityRole="button"
            accessibilityLabel="Exporter le stock en CSV"
            style={styles.exportButton}
          >
            {exportEnCours ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="download-outline" size={19} color="#FFFFFF" />
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/pharmacien/ajouter-produit')}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un produit"
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Recherche */}
      <View style={styles.searchSection}>
        {formesDisponibles.length > 1 && (
          <Pressable
            onPress={() => setMenuFormesOuvert(true)}
            accessibilityRole="button"
            accessibilityLabel="Filtrer par forme"
            style={styles.burgerButton}
          >
            <Ionicons name="menu" size={20} color={Colors.light.text} />
          </Pressable>
        )}
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

      {/* Forme selectionnee (via le menu burger) */}
      {formeSelectionnee && (
        <View style={styles.filtreStatutBandeau}>
          <Text style={styles.filtreStatutTexte}>
            Forme : {LIBELLE_FORME[formeSelectionnee] ?? formeSelectionnee}
          </Text>
          <Pressable onPress={() => setFormeSelectionnee(null)} accessibilityRole="button" accessibilityLabel="Retirer le filtre de forme">
            <Ionicons name="close" size={16} color={Brand.primary} />
          </Pressable>
        </View>
      )}

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
          key="grille-3"
          keyExtractor={(item) => String(item.stockId)}
          numColumns={3}
          columnWrapperStyle={styles.ligneGrille}
          contentContainerStyle={styles.grilleContent}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun produit ne correspond à cette recherche.</Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => ouvrirEdition(item)} style={styles.carte}>
              <View style={styles.cartePhoto}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: `${API_BASE_URL}${item.imageUrl}` }}
                    style={styles.cartePhotoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="image-outline" size={18} color={Brand.textFaint} />
                )}
              </View>
              <Text style={styles.carteNom} numberOfLines={2}>{item.nomProduit}</Text>
              <Text style={styles.carteQuantite}>
                {item.quantite} en stock
              </Text>
              <Text style={styles.cartePrix}>{item.prix.toLocaleString('fr-FR')}</Text>
            </Pressable>
          )}
        />
      )}

      {/* Menu burger : liste des formes en tiroir, par-dessus l'ecran */}
      <Modal
        visible={menuFormesOuvert}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuFormesOuvert(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuFormesOuvert(false)}>
          <Pressable style={styles.menuTiroir} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitre}>Filtrer par forme</Text>
            <FlatList
              data={['TOUS', ...formesDisponibles]}
              keyExtractor={(item) => item}
              contentContainerStyle={{ gap: 4 }}
              renderItem={({ item }) => {
                const estTous = item === 'TOUS';
                const selectionne = estTous ? formeSelectionnee === null : formeSelectionnee === item;
                return (
                  <Pressable
                    onPress={() => {
                      setFormeSelectionnee(estTous ? null : item);
                      setMenuFormesOuvert(false);
                    }}
                    style={[styles.menuItem, selectionne && styles.menuItemActif]}
                  >
                    <Text style={[styles.menuItemTexte, selectionne && styles.menuItemTexteActif]}>
                      {estTous ? 'Toutes les formes' : LIBELLE_FORME[item] ?? item}
                    </Text>
                    {selectionne && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
  bandeauActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  burgerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  searchInput: { flex: 1, fontSize: 14, color: Colors.light.text, paddingVertical: 12 },
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  emptyText: {
    fontSize: 13.5,
    color: Brand.textFaint,
    textAlign: 'center',
    marginTop: Spacing.four,
    width: '100%',
  },

  grilleContent: { padding: Spacing.three, gap: 8 },
  ligneGrille: { gap: 8, alignItems: 'flex-start' },
  carte: {
    width: '31.5%',
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 11,
    padding: 7,
    gap: 4,
  },
  cartePhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: Brand.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cartePhotoImage: { width: '100%', height: '100%' },
  carteNom: { fontSize: 10, fontWeight: '700', color: Colors.light.text, lineHeight: 12.5 },
  carteQuantite: { fontSize: 8.5, color: Brand.textFaint },
  cartePrix: { fontSize: 9.5, fontWeight: '800', color: Colors.light.text },

  // Menu burger : tiroir des formes en overlay
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 36, 32, 0.45)',
    justifyContent: 'flex-end',
  },
  menuTiroir: {
    backgroundColor: Colors.light.backgroundElement,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingHorizontal: Spacing.four,
    paddingBottom: 28,
    maxHeight: '70%',
    gap: 10,
  },
  menuTitre: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  menuItemActif: { backgroundColor: Brand.chipBg },
  menuItemTexte: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  menuItemTexteActif: { color: Brand.primary, fontWeight: '800' },

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