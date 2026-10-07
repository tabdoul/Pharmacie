import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/api/client';

type NotificationPharmacien = {
  id: number;
  stockId: number | null;
  message: string;
  lue: boolean;
  dateCreation: string;
};

function formaterDate(iso: string): string {
  const date = new Date(iso);
  const maintenant = new Date();
  const memeJour = date.toDateString() === maintenant.toDateString();
  if (memeJour) {
    return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<NotificationPharmacien[]>([]);
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

    apiClient
      .get<NotificationPharmacien[]>('/api/pharmacien/notifications', token)
      .then(setNotifications)
      .catch((e) => setErreur(e instanceof ApiError ? e.message : 'Impossible de charger les notifications.'))
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

  const ouvrirNotification = async (notif: NotificationPharmacien) => {
    if (!notif.lue && token) {
      // Non bloquant : on navigue meme si le marquage echoue
      apiClient
        .patch<NotificationPharmacien>(`/api/pharmacien/notifications/${notif.id}/lue`, {}, token)
        .then(() => {
          setNotifications((precedent) =>
            precedent.map((n) => (n.id === notif.id ? { ...n, lue: true } : n))
          );
        })
        .catch(() => {
          // ignore
        });
    }
    router.push({ pathname: '/pharmacien/stocks', params: { statut: 'STOCK_FAIBLE' } });
  };

  const nombreNonLues = notifications.filter((n) => !n.lue).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.light.background} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {nombreNonLues > 0 && (
            <Text style={styles.headerSubtitle}>{nombreNonLues} non lue{nombreNonLues > 1 ? 's' : ''}</Text>
          )}
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
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={rafraichissement} onRefresh={() => charger(true)} tintColor={Brand.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centeredEmpty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={28} color={Brand.success} />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyText}>
                Vous serez prévenu ici dès qu'un produit passe sous son seuil d'alerte.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => ouvrirNotification(item)} style={styles.card}>
              {!item.lue && <View style={styles.dotNonLue} />}
              <View style={[styles.iconBox, item.lue && styles.iconBoxLue]}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={item.lue ? Brand.textFaint : Brand.warning}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.message, item.lue && styles.messageLue]}>{item.message}</Text>
                <Text style={styles.date}>{formaterDate(item.dateCreation)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Brand.textFaint} />
            </Pressable>
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
    alignItems: 'center',
    gap: 14,
  },
  backButton: { padding: 2 },
  headerTitle: { color: Colors.light.background, fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  erreurText: { fontSize: 14, color: Brand.danger, textAlign: 'center' },
  centeredEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
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
  listContent: { padding: Spacing.four, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    shadowColor: '#1C2420',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dotNonLue: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: Brand.accent,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Brand.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLue: { backgroundColor: Brand.chipBg },
  cardBody: { flex: 1, gap: 3 },
  message: { fontSize: 13.5, color: Colors.light.text, lineHeight: 18, fontWeight: '600' },
  messageLue: { color: Colors.light.textSecondary, fontWeight: '500' },
  date: { fontSize: 11.5, color: Brand.textFaint },
});