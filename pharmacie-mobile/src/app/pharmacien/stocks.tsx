import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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

export default function StocksScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [stocks, setStocks] = useState<StockPharmacien[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  const [stockEnEdition, setStockEnEdition] = useState<StockPharmacien | null>(null);
  const [quantiteEdit, setQuantiteEdit] = useState('');
  const [prixEdit, setPrixEdit] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurEdition, setErreurEdition] = useState<string | null>(null);

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

  const stocksFiltres = stocks.filter((s) =>
    s.nomProduit.toLowerCase().includes(recherche.trim().toLowerCase())
  );

  const ouvrirEdition = (stock: StockPharmacien) => {
    setStockEnEdition(stock);
    setQuantiteEdit(String(stock.quantite));
    setPrixEdit(String(stock.prix));
    setErreurEdition(null);
  };

  const fermerEdition = () => {
    setStockEnEdition(null);
    setErreurEdition(null);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes stocks</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher un produit du stock"
          placeholderTextColor={Brand.textFaint}
          style={styles.searchInput}
        />
      </View>

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
            const dotColor =
              item.statut === 'DISPONIBLE' ? Brand.success : item.statut === 'STOCK_FAIBLE' ? Brand.warning : Brand.danger;
            const bgColor =
              item.statut === 'DISPONIBLE' ? Colors.light.backgroundElement : item.statut === 'STOCK_FAIBLE' ? Brand.warningBg : Brand.dangerBg;
            const borderColor =
              item.statut === 'DISPONIBLE' ? Brand.border : item.statut === 'STOCK_FAIBLE' ? '#EAD9BB' : '#EBC9BF';

            return (
              <View style={[styles.card, { backgroundColor: bgColor, borderColor }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.dot, { backgroundColor: dotColor }]} />
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
                  <Text style={styles.editButtonGlyph}>✎</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <View style={styles.bottomNav}>
        <Pressable onPress={() => router.push('/pharmacien/dashboard')} style={styles.navItem}>
          <Text style={styles.navLabel}>Tableau de bord</Text>
        </Pressable>
        <View style={styles.navItem}>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Stocks</Text>
        </View>
      </View>

      {/* Modale d'édition rapide */}
      <Modal visible={!!stockEnEdition} transparent animationType="slide" onRequestClose={fermerEdition}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{stockEnEdition?.nomProduit}</Text>

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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Brand.headerDark,
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: Colors.light.background },
  searchSection: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  searchInput: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.light.text,
  },
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
  editButtonGlyph: { fontSize: 15, color: Colors.light.textSecondary },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    backgroundColor: Colors.light.backgroundElement,
    paddingVertical: 12,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 12, fontWeight: '600', color: Brand.navInactive },
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
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text },
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
});