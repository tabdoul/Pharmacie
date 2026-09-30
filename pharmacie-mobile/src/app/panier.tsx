import React, { useMemo } from 'react';
import { View, Text, Pressable, FlatList, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { usePanier, PanierItem } from '@/context/PanierContext';

type GroupePharmacie = {
  pharmacieId: number;
  nomPharmacie: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
  articles: PanierItem[];
  total: number;
};

export default function PanierScreen() {
  const router = useRouter();
  const { items, retirer, basculerAchete, retirerAchetes, vider } = usePanier();

  const groupes: GroupePharmacie[] = useMemo(() => {
    const map = new Map<number, GroupePharmacie>();
    for (const item of items) {
      const existant = map.get(item.pharmacieId);
      if (existant) {
        existant.articles.push(item);
        existant.total += item.prix;
      } else {
        map.set(item.pharmacieId, {
          pharmacieId: item.pharmacieId,
          nomPharmacie: item.nomPharmacie,
          ville: item.ville,
          quartier: item.quartier,
          telephone: item.telephone,
          articles: [item],
          total: item.prix,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const totalGeneral = items.reduce((somme, i) => somme + i.prix, 0);
  const nombreAchetes = items.filter((i) => i.achete).length;

  const appeler = (telephone: string | null) => {
    if (telephone) Linking.openURL(`tel:${telephone}`);
  };

  const voirDetail = (stockId: number) => {
    router.push({ pathname: '/produit/[stockId]', params: { stockId: String(stockId) } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={Colors.light.background} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mon panier</Text>
          <Text style={styles.headerSubtitle}>
            {items.length} article{items.length > 1 ? 's' : ''}
            {nombreAchetes > 0 ? ` · ${nombreAchetes} acheté${nombreAchetes > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        {items.length > 0 && (
          <Pressable onPress={vider} accessibilityRole="button" accessibilityLabel="Vider le panier">
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={44} color={Brand.border} />
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyText}>
            Ajoutez des médicaments depuis les résultats de recherche pour les retrouver ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupes}
          keyExtractor={(g) => String(g.pharmacieId)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            nombreAchetes > 0 ? (
              <Pressable onPress={retirerAchetes} style={styles.retirerAchetesButton}>
                <Ionicons name="checkmark-done-outline" size={16} color={Brand.primary} />
                <Text style={styles.retirerAchetesText}>
                  Retirer les {nombreAchetes} article{nombreAchetes > 1 ? 's' : ''} déjà acheté
                  {nombreAchetes > 1 ? 's' : ''}
                </Text>
              </Pressable>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.totalGeneralBox}>
              <Text style={styles.totalGeneralLabel}>Total général</Text>
              <Text style={styles.totalGeneralValue}>{totalGeneral.toLocaleString('fr-FR')} GNF</Text>
            </View>
          }
          renderItem={({ item: groupe }) => (
            <View style={styles.pharmacieCard}>
              <View style={styles.pharmacieHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.pharmacieNom}>{groupe.nomPharmacie}</Text>
                  <Text style={styles.pharmacieLocation}>
                    📍 {groupe.quartier ? `${groupe.quartier}, ` : ''}{groupe.ville}
                  </Text>
                </View>
                {groupe.telephone && (
                  <Pressable
                    onPress={() => appeler(groupe.telephone)}
                    style={styles.callIconButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Appeler ${groupe.nomPharmacie}`}
                  >
                    <Ionicons name="call-outline" size={17} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>

              <View style={styles.articlesList}>
                {groupe.articles.map((article) => (
                  <View key={article.stockId} style={styles.articleRow}>
                    <Pressable
                      onPress={() => basculerAchete(article.stockId)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: article.achete }}
                      accessibilityLabel={`Marquer ${article.nomProduit} comme acheté`}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={article.achete ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={article.achete ? Brand.success : Brand.textFaint}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => voirDetail(article.stockId)}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Text style={[styles.articleNom, article.achete && styles.texteAchete]}>
                        {article.nomProduit}
                      </Text>
                      <Text style={[styles.articlePrix, article.achete && styles.texteAchete]}>
                        {article.prix.toLocaleString('fr-FR')} GNF
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => retirer(article.stockId)}
                      accessibilityRole="button"
                      accessibilityLabel={`Retirer ${article.nomProduit}`}
                      style={styles.removeButton}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={16} color={Brand.textFaint} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={styles.sousTotalRow}>
                <Text style={styles.sousTotalLabel}>Sous-total</Text>
                <Text style={styles.sousTotalValue}>{groupe.total.toLocaleString('fr-FR')} GNF</Text>
              </View>
            </View>
          )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  emptyText: { fontSize: 13.5, color: Brand.textFaint, textAlign: 'center', lineHeight: 19 },
  listContent: { padding: Spacing.four, gap: 10 },
  retirerAchetesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Brand.successBg,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  retirerAchetesText: { fontSize: 13, fontWeight: '700', color: Brand.primary },
  pharmacieCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  pharmacieHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pharmacieNom: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  pharmacieLocation: { fontSize: 12.5, color: Brand.textFaint, marginTop: 3 },
  callIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articlesList: {
    marginTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 10,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  articleNom: { fontSize: 13.5, fontWeight: '600', color: Colors.light.text },
  articlePrix: { fontSize: 12.5, color: Brand.textFaint, marginTop: 1 },
  texteAchete: { color: '#8FA89C', textDecorationLine: 'line-through' },
  removeButton: { padding: 4 },
  sousTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  sousTotalLabel: { fontSize: 12.5, color: Colors.light.textSecondary, fontWeight: '600' },
  sousTotalValue: { fontSize: 14.5, fontWeight: '800', color: Colors.light.text },
  totalGeneralBox: {
    backgroundColor: Brand.successBg,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalGeneralLabel: { fontSize: 14, fontWeight: '700', color: Brand.primary },
  totalGeneralValue: { fontSize: 18, fontWeight: '800', color: Brand.primary },
});