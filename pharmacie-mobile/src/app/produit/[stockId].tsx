import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { apiClient, ApiError } from '@/api/client';

type StockDetail = {
  stockId: number;
  nomProduit: string;
  formeProduit: string | null;
  imageUrl: string | null;
  description: string | null;
  prix: number;
  dateDerniereMaj: string;
  nomPharmacie: string;
  adresse: string;
  ville: string;
  quartier: string | null;
  telephone: string | null;
};

function formaterDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DetailScreen() {
  const router = useRouter();
  const { stockId } = useLocalSearchParams<{ stockId: string }>();

  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!stockId) return;
    let annule = false;
    setChargement(true);

    apiClient
      .get<StockDetail>(`/api/public/stocks/${stockId}`)
      .then((data) => {
        if (!annule) setDetail(data);
      })
      .catch((e) => {
        if (!annule) setErreur(e instanceof ApiError ? e.message : 'Impossible de charger ce produit.');
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [stockId]);

  const appeler = () => {
    if (detail?.telephone) Linking.openURL(`tel:${detail.telephone}`);
  };

  const ouvrirMaps = () => {
    if (!detail) return;
    const adresseComplete = `${detail.adresse}, ${detail.ville}`;
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(adresseComplete)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour aux résultats">
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail?.nomProduit ?? 'Détail'}
        </Text>
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

      {!chargement && detail && (
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.five }}>
          {/* Product card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowStart}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconGlyph}>℞</Text>
                </View>
                {detail.formeProduit && (
                  <View style={styles.formBadge}>
                    <Text style={styles.formBadgeText}>{detail.formeProduit}</Text>
                  </View>
                )}
              </View>
              <View style={styles.availableRow}>
                <View style={styles.dot} />
                <Text style={styles.availableText}>DISPONIBLE</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{detail.prix.toLocaleString('fr-FR')}</Text>
              <Text style={styles.priceUnit}>GNF</Text>
            </View>

            {detail.description && <Text style={styles.description}>{detail.description}</Text>}
            <Text style={styles.updatedAt}>Stock mis à jour le {formaterDate(detail.dateDerniereMaj)}</Text>
          </View>

          {/* Pharmacy card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Pharmacie</Text>
            <Text style={styles.pharmacyName}>{detail.nomPharmacie}</Text>

            <View style={[styles.rowStart, { alignItems: 'flex-start', marginTop: 14 }]}>
              <Text style={styles.pinIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.address}>
                  {detail.adresse}
                  {detail.quartier ? `, ${detail.quartier}` : ''}, {detail.ville}
                </Text>
                <Pressable onPress={ouvrirMaps}>
                  <Text style={styles.mapsLink}>Voir sur Google Maps →</Text>
                </Pressable>
              </View>
            </View>

            {detail.telephone && (
              <View style={[styles.rowStart, { marginTop: 14 }]}>
                <Text style={styles.phoneIcon}>📞</Text>
                <Text style={styles.phoneText}>{detail.telephone}</Text>
              </View>
            )}

            {detail.telephone && (
              <Pressable onPress={appeler} style={styles.callButton} accessibilityRole="button">
                <Text style={styles.callButtonText}>Appeler la pharmacie</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.footerNote}>
            Le conseil et l'achat se font uniquement sur place, directement avec le pharmacien.
          </Text>
        </ScrollView>
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
    alignItems: 'center',
    gap: 14,
  },
  backArrow: { color: Colors.light.background, fontSize: 20, fontWeight: '700' },
  headerTitle: { flex: 1, color: Colors.light.background, fontSize: 17, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  card: {
    margin: Spacing.four,
    marginBottom: 0,
    marginTop: Spacing.four,
    padding: 20,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 18,
    gap: 14,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Brand.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 20, color: Brand.primary },
  formBadge: { backgroundColor: Brand.successBg, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
  formBadgeText: { fontSize: 13, fontWeight: '700', color: Brand.primary },
  availableRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 999, backgroundColor: Brand.success },
  availableText: { fontSize: 11.5, fontWeight: '700', color: Brand.success },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceValue: { fontSize: 30, fontWeight: '800', color: Colors.light.text },
  priceUnit: { fontSize: 14, fontWeight: '600', color: Brand.textFaint },
  description: { fontSize: 14, color: Colors.light.text, lineHeight: 20 },
  updatedAt: { fontSize: 12, color: Brand.textFaint },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pharmacyName: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginTop: 4 },
  pinIcon: { fontSize: 16 },
  phoneIcon: { fontSize: 16 },
  address: { fontSize: 14.5, color: Colors.light.text, lineHeight: 20 },
  mapsLink: { fontSize: 13.5, fontWeight: '700', color: Brand.primary, marginTop: 6 },
  phoneText: { fontSize: 14.5, color: Colors.light.text },
  callButton: {
    backgroundColor: Brand.accent,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  callButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  footerNote: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    fontSize: 12,
    color: Brand.textFaint,
    lineHeight: 18,
    textAlign: 'center',
  },
});