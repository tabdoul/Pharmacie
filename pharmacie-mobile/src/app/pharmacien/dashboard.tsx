import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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

type NotificationPharmacien = {
  id: number;
  stockId: number | null;
  message: string;
  lue: boolean;
  dateCreation: string;
};

function salutationSelonHeure(): string {
  const heure = new Date().getHours();
  if (heure < 5) return 'Bonsoir';
  if (heure < 18) return 'Bonjour';
  return 'Bonsoir';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { token, nomPharmacie, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [stocks, setStocks] = useState<StockPharmacien[]>([]);
  const [notifsNonLues, setNotifsNonLues] = useState<NotificationPharmacien[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback((enTacheDeFond = false) => {
    if (!token) return;
    if (enTacheDeFond) {
      setRafraichissement(true);
    } else {
      setChargement(true);
    }
    setErreur(null);

    Promise.all([
      apiClient.get<StockPharmacien[]>('/api/pharmacien/stocks', token),
      apiClient.get<NotificationPharmacien[]>('/api/pharmacien/notifications/non-lues', token),
    ])
      .then(([stocksData, notifsData]) => {
        setStocks(stocksData);
        setNotifsNonLues(notifsData);
      })
      .catch((e) => {
        setErreur(e instanceof ApiError ? e.message : 'Impossible de charger le tableau de bord.');
      })
      .finally(() => {
        setChargement(false);
        setRafraichissement(false);
      });
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const nombreDisponibles = stocks.filter((s) => s.statut === 'DISPONIBLE').length;
  const nombreFaibles = stocks.filter((s) => s.statut === 'STOCK_FAIBLE').length;
  const nombreRuptures = stocks.filter((s) => s.statut === 'RUPTURE').length;

  const valeurTotaleStock = stocks.reduce((somme, s) => somme + s.quantite * s.prix, 0);

  const derniereMaj = stocks.length
    ? stocks.reduce((plusRecent, s) => (s.dateDerniereMaj > plusRecent ? s.dateDerniereMaj : plusRecent), stocks[0].dateDerniereMaj)
    : null;

  const heureDerniereMaj = derniereMaj
    ? new Date(derniereMaj).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const seDeconnecter = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Bandeau reduit */}
      <View style={styles.bandeau}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{salutationSelonHeure()},</Text>
          <Text style={styles.pharmacyName} numberOfLines={1}>{nomPharmacie ?? 'Pharmacie'}</Text>
        </View>
        <Pressable onPress={seDeconnecter} accessibilityRole="button" accessibilityLabel="Se déconnecter" style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.background} />
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

      {!chargement && !erreur && stocks.length === 0 && (
        <View style={styles.centeredEmpty}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cube-outline" size={32} color={Brand.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aucun produit pour l'instant</Text>
          <Text style={styles.emptyText}>
            Ajoutez votre premier produit pour commencer à gérer votre stock et apparaître dans les
            recherches des patients.
          </Text>
          <Pressable onPress={() => router.push('/pharmacien/ajouter-produit')} style={styles.emptyButton}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Ajouter mon premier produit</Text>
          </Pressable>
        </View>
      )}

      {!chargement && !erreur && stocks.length > 0 && (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.four, paddingBottom: Spacing.five }}
          refreshControl={
            <RefreshControl refreshing={rafraichissement} onRefresh={() => charger(true)} tintColor={Brand.primary} />
          }
        >
          {/* Valeur totale du stock */}
          <View style={styles.valeurCard}>
            <View style={styles.valeurIconCircle}>
              <Ionicons name="wallet-outline" size={20} color={Brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.valeurLabel}>Valeur totale du stock</Text>
              <Text style={styles.valeurMontant}>{valeurTotaleStock.toLocaleString('fr-FR')} GNF</Text>
            </View>
          </View>

          {/* Repartition par statut */}
          <View style={styles.summaryRow}>
            <Pressable
              onPress={() => router.push({ pathname: '/pharmacien/stocks', params: { statut: 'DISPONIBLE' } })}
              style={styles.summaryCard}
            >
              <View style={[styles.summaryIconCircle, { backgroundColor: Brand.successBg }]}>
                <Ionicons name="checkmark-circle-outline" size={17} color={Brand.success} />
              </View>
              <Text style={styles.summaryValue}>{nombreDisponibles}</Text>
              <Text style={styles.summaryLabel}>disponible{nombreDisponibles > 1 ? 's' : ''}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push({ pathname: '/pharmacien/stocks', params: { statut: 'STOCK_FAIBLE' } })}
              style={[styles.summaryCard, nombreFaibles > 0 && styles.summaryCardWarning]}
            >
              <View style={[styles.summaryIconCircle, { backgroundColor: Brand.warningBg }]}>
                <Ionicons name="alert-circle-outline" size={17} color={Brand.warning} />
              </View>
              <Text style={[styles.summaryValue, styles.summaryValueWarning]}>{nombreFaibles}</Text>
              <Text style={[styles.summaryLabel, styles.summaryLabelWarning]}>stock faible</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push({ pathname: '/pharmacien/stocks', params: { statut: 'RUPTURE' } })}
              style={[styles.summaryCard, nombreRuptures > 0 && styles.summaryCardDanger]}
            >
              <View style={[styles.summaryIconCircle, { backgroundColor: Brand.dangerBg }]}>
                <Ionicons name="close-circle-outline" size={17} color={Brand.danger} />
              </View>
              <Text style={[styles.summaryValue, styles.summaryValueDanger]}>{nombreRuptures}</Text>
              <Text style={[styles.summaryLabel, styles.summaryLabelDanger]}>
                rupture{nombreRuptures > 1 ? 's' : ''}
              </Text>
            </Pressable>
          </View>

          {/* Barre de repartition visuelle */}
          {stocks.length > 0 && (
            <View style={styles.repartitionBarTrack}>
              <View style={[styles.repartitionBarSegment, { flex: nombreDisponibles || 0.0001, backgroundColor: Brand.success }]} />
              <View style={[styles.repartitionBarSegment, { flex: nombreFaibles || 0.0001, backgroundColor: Brand.warning }]} />
              <View style={[styles.repartitionBarSegment, { flex: nombreRuptures || 0.0001, backgroundColor: Brand.danger }]} />
            </View>
          )}

          <Text style={styles.derniereMajTexte}>Dernière mise à jour : {heureDerniereMaj}</Text>

          {/* Actions rapides */}
          <View style={styles.actionsRow}>
            <Pressable onPress={() => router.push('/pharmacien/ajouter-produit')} style={styles.primaryAction}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Ajouter un produit</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/pharmacien/stocks')} style={styles.secondaryAction}>
              <Ionicons name="cube-outline" size={18} color={Brand.primary} />
              <Text style={styles.secondaryActionText}>Voir mes stocks</Text>
            </Pressable>
          </View>

          {/* Alertes récentes */}
          <Text style={styles.sectionTitle}>Alertes récentes</Text>
          {notifsNonLues.length === 0 ? (
            <View style={styles.emptyAlertBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Brand.success} />
              <Text style={styles.emptyAlertText}>Aucune alerte pour le moment.</Text>
            </View>
          ) : (
            notifsNonLues.map((notif) => (
              <Pressable
                key={notif.id}
                onPress={() => router.push('/pharmacien/stocks')}
                style={styles.alertCard}
              >
                <View style={styles.alertIconBox}>
                  <Ionicons name="warning-outline" size={18} color={Brand.warning} />
                </View>
                <Text style={styles.alertText}>{notif.message}</Text>
                <Ionicons name="chevron-forward" size={16} color={Brand.textFaint} />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { paddingBottom: 12 + insets.bottom }]}>
        <View style={styles.navItem}>
          <Ionicons name="grid" size={20} color={Brand.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Tableau de bord</Text>
        </View>
        <Pressable onPress={() => router.push('/pharmacien/stocks')} style={styles.navItem}>
          <Ionicons name="cube-outline" size={20} color={Brand.navInactive} />
          <Text style={styles.navLabel}>Stocks</Text>
        </Pressable>
      </View>
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
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 12.5, color: '#B8B2A2', fontWeight: '600' },
  pharmacyName: { fontWeight: '800', fontSize: 18, color: Colors.light.background, marginTop: 2 },
  logoutButton: { padding: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  centeredEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: 12,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  emptyText: { fontSize: 13.5, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 19 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.accent,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  valeurCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    padding: 16,
    marginBottom: Spacing.three,
    shadowColor: '#1C2420',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  valeurIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valeurLabel: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },
  valeurMontant: { fontSize: 19, fontWeight: '800', color: Colors.light.text, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1C2420',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summaryCardWarning: { backgroundColor: Brand.warningBg },
  summaryCardDanger: { backgroundColor: Brand.dangerBg },
  summaryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  summaryValueWarning: { color: Brand.warning },
  summaryValueDanger: { color: Brand.danger },
  summaryLabel: { fontSize: 10.5, fontWeight: '600', color: Colors.light.textSecondary, textAlign: 'center' },
  summaryLabelWarning: { color: Brand.warning },
  summaryLabelDanger: { color: Brand.danger },
  repartitionBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: Brand.chipBg,
  },
  repartitionBarSegment: { height: '100%' },
  derniereMajTexte: {
    fontSize: 11.5,
    color: Brand.textFaint,
    textAlign: 'center',
    marginTop: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.four },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Brand.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryActionText: { color: Brand.primary, fontWeight: '700', fontSize: 13.5 },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Brand.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.five,
    marginBottom: 10,
  },
  emptyAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.successBg,
    borderRadius: 12,
    padding: 14,
  },
  emptyAlertText: { fontSize: 13, color: '#0E4238', fontWeight: '600' },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 13,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#1C2420',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Brand.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: { flex: 1, fontSize: 13, color: Colors.light.text, lineHeight: 18 },
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
});