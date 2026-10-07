import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/api/client';

type Produit = {
  id: number;
  nom: string;
  forme: string | null;
  imageUrl: string | null;
  description: string | null;
};

const FORMES = [
  'COMPRIME', 'GELULE', 'SIROP', 'INJECTABLE', 'POMMADE',
  'CREME', 'SUPPOSITOIRE', 'POUDRE', 'GOUTTES', 'PATCH', 'SPRAY', 'AUTRE',
];

const LIBELLE_FORME: Record<string, string> = {
  COMPRIME: 'Comprimé', GELULE: 'Gélule', SIROP: 'Sirop', INJECTABLE: 'Injectable',
  POMMADE: 'Pommade', CREME: 'Crème', SUPPOSITOIRE: 'Suppositoire', POUDRE: 'Poudre',
  GOUTTES: 'Gouttes', PATCH: 'Patch', SPRAY: 'Spray', AUTRE: 'Autre',
};

export default function AjouterProduitScreen() {
  const router = useRouter();
  const { token } = useAuth();

  // Produit (nouveau ou existant)
  const [nom, setNom] = useState('');
  const [forme, setForme] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [modaleFormeOuverte, setModaleFormeOuverte] = useState(false);

  // Detection de doublons pendant la saisie
  const [correspondances, setCorrespondances] = useState<Produit[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [produitExistantChoisi, setProduitExistantChoisi] = useState<Produit | null>(null);

  // Stock a creer avec ce produit
  const [quantite, setQuantite] = useState('');
  const [seuilAlerte, setSeuilAlerte] = useState('5');
  const [prix, setPrix] = useState('');

  // Photo du produit (optionnelle) -- uploadee seulement a la soumission,
  // une fois l'id du produit connu (creation ou produit existant).
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Detection en direct des doublons potentiels pendant la saisie du nom
  useEffect(() => {
    if (produitExistantChoisi || !token || nom.trim().length < 3) {
      setCorrespondances([]);
      return;
    }
    let annule = false;
    setRechercheEnCours(true);
    const delai = setTimeout(() => {
      apiClient
        .get<Produit[]>(`/api/pharmacien/produits?nom=${encodeURIComponent(nom.trim())}`, token)
        .then((data) => {
          if (!annule) setCorrespondances(data);
        })
        .catch(() => {
          if (!annule) setCorrespondances([]);
        })
        .finally(() => {
          if (!annule) setRechercheEnCours(false);
        });
    }, 400);

    return () => {
      annule = true;
      clearTimeout(delai);
    };
  }, [nom, token, produitExistantChoisi]);

  const choisirProduitExistant = (produit: Produit) => {
    setProduitExistantChoisi(produit);
    setNom(produit.nom);
    setForme(produit.forme);
    setDescription(produit.description ?? '');
    setCorrespondances([]);
    setErreur(null);
  };

  const annulerProduitExistant = () => {
    setProduitExistantChoisi(null);
    setNom('');
    setForme(null);
    setDescription('');
  };

  const choisirPhotoGalerie = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErreur('Autorisation refusée pour accéder à vos photos.');
        return;
      }
      const resultat = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!resultat.canceled && resultat.assets && resultat.assets[0]) {
        setPhotoUri(resultat.assets[0].uri);
      }
    } catch (e) {
      setErreur(
        `Impossible d'ouvrir la galerie : ${e instanceof Error ? e.message : 'erreur inconnue'}`
      );
    }
  };

  const choisirPhotoCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErreur("Autorisation refusée pour accéder à l'appareil photo.");
        return;
      }
      const resultat = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!resultat.canceled && resultat.assets && resultat.assets[0]) {
        setPhotoUri(resultat.assets[0].uri);
      }
    } catch (e) {
      setErreur(
        `Impossible d'ouvrir l'appareil photo : ${e instanceof Error ? e.message : 'erreur inconnue'}`
      );
    }
  };

  const soumettre = async () => {
    if (!token) return;
    setErreur(null);

    const nomFinal = nom.trim();
    if (!produitExistantChoisi && !nomFinal) {
      setErreur('Le nom du produit est obligatoire.');
      return;
    }

    const quantiteNum = Number(quantite);
    const seuilNum = Number(seuilAlerte);
    const prixNum = Number(prix);

    if (!Number.isFinite(quantiteNum) || quantiteNum < 0) {
      setErreur('La quantité doit être un nombre positif.');
      return;
    }
    if (!Number.isFinite(seuilNum) || seuilNum < 0) {
      setErreur("Le seuil d'alerte doit être un nombre positif.");
      return;
    }
    if (!Number.isFinite(prixNum) || prixNum < 0) {
      setErreur('Le prix doit être un nombre positif.');
      return;
    }

    setEnregistrement(true);
    try {
      const produit: Produit = produitExistantChoisi
        ? produitExistantChoisi
        : await apiClient.post<Produit>(
            '/api/pharmacien/produits',
            { nom: nomFinal, forme, imageUrl: null, description: description.trim() || null },
            token
          );

      if (photoUri) {
        try {
          await apiClient.uploadFile(
            `/api/pharmacien/produits/${produit.id}/image`,
            'image',
            { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' },
            token
          );
        } catch (e) {
          // Le produit et le stock sont tout de meme crees : on ne bloque
          // pas toute l'operation pour un echec d'upload de la photo.
          console.error('Erreur upload photo:', e);
        }
      }

      await apiClient.post(
        '/api/pharmacien/stocks',
        { produitId: produit.id, quantite: quantiteNum, seuilAlerte: seuilNum, prix: prixNum },
        token
      );

      Alert.alert('Produit ajouté', 'Le produit a bien été ajouté au stock.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : "Échec de l'ajout du produit.");
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bandeau}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={20} color={Colors.light.background} />
        </Pressable>
        <Text style={styles.bandeauTitle}>Ajouter un produit</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.form}>
        {!produitExistantChoisi ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Nom du produit</Text>
              <TextInput
                value={nom}
                onChangeText={setNom}
                placeholder="ex : Paracétamol 500mg"
                placeholderTextColor={Brand.textFaint}
                style={styles.input}
                autoFocus
              />
            </View>

            {rechercheEnCours && (
              <View style={styles.checkingRow}>
                <ActivityIndicator size="small" color={Brand.textFaint} />
                <Text style={styles.checkingText}>Vérification des doublons…</Text>
              </View>
            )}

            {!rechercheEnCours && correspondances.length > 0 && (
              <View style={styles.doublonBox}>
                <View style={styles.doublonHeader}>
                  <Ionicons name="alert-circle-outline" size={16} color={Brand.warning} />
                  <Text style={styles.doublonTitre}>
                    Ce produit existe peut-être déjà dans le catalogue
                  </Text>
                </View>
                {correspondances.map((item) => (
                  <Pressable key={item.id} onPress={() => choisirProduitExistant(item)} style={styles.doublonItem}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.doublonItemNom}>{item.nom}</Text>
                      {item.forme && (
                        <Text style={styles.doublonItemForme}>{LIBELLE_FORME[item.forme] ?? item.forme}</Text>
                      )}
                    </View>
                    <Text style={styles.doublonItemAction}>Utiliser celui-ci</Text>
                  </Pressable>
                ))}
                <Text style={styles.doublonHint}>
                  Aucun ne correspond ? Continuez ci-dessous pour créer un nouveau produit.
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Forme (optionnel)</Text>
              <Pressable onPress={() => setModaleFormeOuverte(true)} style={styles.selecteur}>
                <Text style={styles.selecteurTexte}>
                  {forme ? LIBELLE_FORME[forme] : 'Choisir une forme'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Brand.textFaint} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Usage, indication..."
                placeholderTextColor={Brand.textFaint}
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
              />
            </View>
          </>
        ) : (
          <View style={styles.produitRecapCard}>
            <View style={styles.resultIcon}>
              <Ionicons name="medkit-outline" size={18} color={Brand.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.resultNom}>{produitExistantChoisi.nom}</Text>
              {produitExistantChoisi.forme && (
                <Text style={styles.resultForme}>
                  {LIBELLE_FORME[produitExistantChoisi.forme] ?? produitExistantChoisi.forme}
                </Text>
              )}
            </View>
            <Pressable onPress={annulerProduitExistant} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={Brand.textFaint} />
            </Pressable>
          </View>
        )}

        {/* Photo du produit (optionnelle) */}
        <View style={styles.field}>
          <Text style={styles.label}>Photo du produit (optionnel)</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoPreview}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Ionicons name="image-outline" size={28} color={Brand.textFaint} />
              )}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Pressable onPress={choisirPhotoGalerie} style={styles.photoButton}>
                <Ionicons name="images-outline" size={16} color={Brand.primary} />
                <Text style={styles.photoButtonText}>Galerie</Text>
              </Pressable>
              <Pressable onPress={choisirPhotoCamera} style={styles.photoButton}>
                <Ionicons name="camera-outline" size={16} color={Brand.primary} />
                <Text style={styles.photoButtonText}>Prendre une photo</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {erreur && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erreur}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Quantité en stock</Text>
          <TextInput
            value={quantite}
            onChangeText={setQuantite}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Brand.textFaint}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Seuil d'alerte (stock faible)</Text>
          <TextInput
            value={seuilAlerte}
            onChangeText={setSeuilAlerte}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor={Brand.textFaint}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Prix (GNF)</Text>
          <TextInput
            value={prix}
            onChangeText={setPrix}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Brand.textFaint}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={soumettre}
          disabled={enregistrement}
          style={[styles.submitButton, enregistrement && styles.submitButtonDisabled]}
        >
          {enregistrement ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Ajouter le produit</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Modale de selection de la forme */}
      <Modal
        visible={modaleFormeOuverte}
        transparent
        animationType="slide"
        onRequestClose={() => setModaleFormeOuverte(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModaleFormeOuverte(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Forme du produit</Text>
            <FlatList
              data={FORMES}
              keyExtractor={(item) => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setForme(item);
                    setModaleFormeOuverte(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemTexte}>{LIBELLE_FORME[item]}</Text>
                  {forme === item && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
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
  bandeau: {
    backgroundColor: Brand.headerDark,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bandeauTitle: { fontSize: 17, fontWeight: '800', color: Colors.light.background },
  form: { padding: Spacing.four, gap: Spacing.three },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  input: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.light.text,
  },
  checkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  checkingText: { fontSize: 12.5, color: Brand.textFaint },
  doublonBox: {
    backgroundColor: Brand.warningBg,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  doublonHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  doublonTitre: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#8A6A2E' },
  doublonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 10,
    padding: 10,
  },
  doublonItemNom: { fontSize: 13.5, fontWeight: '700', color: Colors.light.text },
  doublonItemForme: { fontSize: 11.5, color: Brand.textFaint, marginTop: 1 },
  doublonItemAction: { fontSize: 12, fontWeight: '700', color: Brand.primary },
  doublonHint: { fontSize: 11.5, color: '#8A6A2E', lineHeight: 15 },
  selecteur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  selecteurTexte: { fontSize: 15, color: Colors.light.text, fontWeight: '600' },
  produitRecapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Brand.successBg,
    borderRadius: 14,
    padding: 14,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultNom: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  resultForme: { fontSize: 12, color: Brand.textFaint, marginTop: 2 },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoPreview: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Brand.chipBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  photoButtonText: { fontSize: 12.5, fontWeight: '700', color: Brand.primary },
  errorBox: { backgroundColor: Brand.dangerBg, borderRadius: 12, padding: 12 },
  errorText: { color: Brand.danger, fontSize: 13, lineHeight: 18 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.accent,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 50,
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
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
});