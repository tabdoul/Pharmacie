import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
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

type NotificationPharmacien = {
  id: number;
  stockId: number | null;
  message: string;
  lue: boolean;
  dateCreation: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { token, nomPharmacie, logout } = useAuth();

  const [stocks, setStocks] = useState<StockPharmacien[]>([]);
  const [notifsNonLues, setNotifsNonLues] = useState<NotificationPharmacien[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    if (!token) return;
    setChargement(true);
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
      .finally(() => setChargement(false));
  }, [token]);

  // Recharge a chaque retour sur cet ecran (ex: apres modification d'un stock)
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

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
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.pharmacyName} numberOfLines={1}>{nomPharmacie ?? 'Pharmacie'}</Text>
        </View>
        <Pressable onPress={seDeconnecter} accessibilityRole="button" accessibilityLabel="Se déconnecter">
          <Text style={styles.logoutText}>Déconnexion</Text>
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

      {!chargement && !erreur && (
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.five }}>
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stocks.length}</Text>
              <Text style={styles.summaryLabel}>produits en stock</Text>
            </View>
            <View style={[styles.summaryCard, notifsNonLues.length > 0 && styles.summaryCardWarning]}>
              <Text style={[styles.summaryValue, notifsNonLues.length > 0 && styles.summaryValueWarning]}>
                {notifsNonLues.length}
              </Text>
              <Text style={[styles.summaryLabel, notifsNonLues.length > 0 && styles.summaryLabelWarning]}>
                alerte{notifsNonLues.length > 1 ? 's' : ''} stock faible
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValueSmall}>{heureDerniereMaj}</Text>
              <Text style={styles.summaryLabel}>dernière MAJ</Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            <Pressable onPress={() => router.push('/pharmacien/stocks')} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>Voir mes stocks</Text>
            </Pressable>
          </View>

          {/* Alertes récentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertes récentes</Text>
            {notifsNonLues.length === 0 && (
              <Text style={styles.emptyText}>Aucune alerte pour le moment.</Text>
            )}
            {notifsNonLues.map((notif) => (
              <Pressable
                key={notif.id}
                onPress={() => router.push('/pharmacien/stocks')}
                style={styles.alertCard}
              >
                <View style={styles.alertIconBox}>
                  <Text style={styles.alertIconGlyph}>⚠</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertText}>{notif.message}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Tableau de bord</Text>
        </View>
        <Pressable onPress={() => router.push('/pharmacien/stocks')} style={styles.navItem}>
          <Text style={styles.navLabel}>Stocks</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    backgroundColor: Brand.headerDark,
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 12.5, color: '#B8B2A2', fontWeight: '600' },
  pharmacyName: { fontFamily: undefined, fontWeight: '700', fontSize: 19, color: Colors.light.background, marginTop: 2 },
  logoutText: { fontSize: 12.5, color: '#D9C9A8', fontWeight: '600', marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', gap: 10, padding: Spacing.four },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  summaryCardWarning: { backgroundColor: Brand.warningBg, borderColor: '#EAD9BB' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  summaryValueWarning: { color: Brand.warning },
  summaryValueSmall: { fontSize: 15, fontWeight: '800', color: Colors.light.text },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.light.textSecondary, textAlign: 'center' },
  summaryLabelWarning: { color: Brand.warning },
  actionsRow: { paddingHorizontal: Spacing.four },
  primaryAction: {
    backgroundColor: Brand.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  section: { padding: Spacing.four, gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyText: { fontSize: 13.5, color: Brand.textFaint },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
  },
  alertIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Brand.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconGlyph: { fontSize: 17, color: Brand.warning },
  alertText: { fontSize: 13.5, color: Colors.light.text, lineHeight: 18 },
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
});