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

// Cle de comparaison : sans accents, majuscules, espaces ni ponctuation.
// "Paracétamol 500 mg" et "paracetamol 500mg" donnent la meme cle.
// (Meme logique que TexteUtil.cleComparaison cote serveur.)
const cle = (texte: string): string =>
  (typeof texte.normalize === 'function' ? texte.normalize('NFD') : texte)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/([0-9])[.,]([0-9])/g, '$1p$2')
    .replace(/[^a-z0-9%/]/g, '');

const UNITES = ['mg', 'g', 'mcg', 'ml', 'UI', '%', 'mg/ml', 'AUTRE'];
const LIBELLE_UNITE: Record<string, string> = { AUTRE: 'Autre / combiné' };
const libelleUnite = (u: string) => LIBELLE_UNITE[u] ?? u;

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

  // Dosage (facultatif) : nombre + unite, ou texte libre si l'unite est "Autre / combine"
  const [dosageValeur, setDosageValeur] = useState('');
  const [dosageUnite, setDosageUnite] = useState('mg');
  const [dosageLibre, setDosageLibre] = useState('');
  const [modaleUniteOuverte, setModaleUniteOuverte] = useState(false);

  // Precision de la forme quand "Autre" est choisi (ex : Collyre)
  const [formeAutre, setFormeAutre] = useState('');

  // Nom complet assemble par l'app : "Paracétamol 500 mg" (+ precision de forme si "Autre").
  // C'est ce nom qui est enregistre, affiche aux patients et compare pour les doublons.
  const dosageTexte =
    dosageUnite === 'AUTRE'
      ? dosageLibre.trim()
      : dosageValeur.trim()
        ? `${dosageValeur.trim()} ${dosageUnite}`
        : '';
  const nomComplet = [nom.trim(), dosageTexte, forme === 'AUTRE' ? formeAutre.trim() : '']
    .filter(Boolean)
    .join(' ');

  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Produits que la pharmacie a deja dans son stock (pour la prevenir avant l'envoi)
  const [idsDejaEnStock, setIdsDejaEnStock] = useState<number[]>([]);

  useEffect(() => {
    if (!token) return;
    apiClient
      .get<{ produitId: number }[]>('/api/pharmacien/stocks', token)
      .then((data) => setIdsDejaEnStock(data.map((s) => s.produitId)))
      .catch(() => setIdsDejaEnStock([]));
  }, [token]);

  // Parmi les resultats : ceux qui sont le MEME produit (aux accents, majuscules et espaces pres)
  // et ceux qui sont seulement proches.
  const cleSaisie = cle(nomComplet);
  const exacts = cleSaisie.length >= 3 ? correspondances.filter((p) => cle(p.nom) === cleSaisie) : [];
  const proches = correspondances.filter((p) => !exacts.includes(p));

  const dejaEnStock = produitExistantChoisi
    ? idsDejaEnStock.includes(produitExistantChoisi.id)
    : false;

  // Detection en direct des doublons potentiels pendant la saisie du nom
  useEffect(() => {
    if (produitExistantChoisi || !token || nomComplet.length < 3) {
      setCorrespondances([]);
      return;
    }
    let annule = false;
    setRechercheEnCours(true);
    const delai = setTimeout(() => {
      apiClient
        .get<Produit[]>(`/api/pharmacien/produits?nom=${encodeURIComponent(nomComplet)}`, token)
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
  }, [nomComplet, token, produitExistantChoisi]);

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
    setDosageValeur('');
    setDosageUnite('mg');
    setDosageLibre('');
    setFormeAutre('');
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

    const nomFinal = nomComplet;
    if (!produitExistantChoisi) {
      if (!nom.trim()) {
        setErreur('Le nom du produit est obligatoire.');
        return;
      }
      if (dosageUnite !== 'AUTRE' && dosageValeur.trim() && !/^\d+([.,]\d+)?$/.test(dosageValeur.trim())) {
        setErreur('Le dosage doit être un nombre (ex : 500 ou 2,5).');
        return;
      }
      if (forme === 'AUTRE' && !formeAutre.trim()) {
        setErreur('Précisez la forme du produit (ex : Collyre).');
        return;
      }
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

    if (dejaEnStock) {
      setErreur('Vous avez déjà ce produit dans votre stock. Modifiez plutôt sa quantité depuis la liste de vos stocks.');
      return;
    }

    setEnregistrement(true);
    try {
      // Verification finale (donnees fraiches) : refuse de creer un doublon
      if (!produitExistantChoisi) {
        const liste = await apiClient.get<Produit[]>(
          `/api/pharmacien/produits?nom=${encodeURIComponent(nomFinal)}`,
          token
        );
        const existant = liste.find((p) => cle(p.nom) === cle(nomFinal));
        if (existant) {
          setCorrespondances(liste);
          setErreur(
            `« ${existant.nom} » existe déjà dans le catalogue. Utilisez cette fiche au lieu d'en créer une nouvelle.`
          );
          return;
        }
      }

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
                placeholder="ex : Paracétamol"
                placeholderTextColor={Brand.textFaint}
                style={styles.input}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Dosage (optionnel)</Text>
              <View style={styles.dosageRow}>
                {dosageUnite === 'AUTRE' ? (
                  <TextInput
                    value={dosageLibre}
                    onChangeText={setDosageLibre}
                    placeholder="ex : 500 mg / 125 mg"
                    placeholderTextColor={Brand.textFaint}
                    style={[styles.input, { flex: 1 }]}
                  />
                ) : (
                  <TextInput
                    value={dosageValeur}
                    onChangeText={setDosageValeur}
                    keyboardType="decimal-pad"
                    placeholder="ex : 500"
                    placeholderTextColor={Brand.textFaint}
                    style={[styles.input, { flex: 1 }]}
                  />
                )}
                <Pressable onPress={() => setModaleUniteOuverte(true)} style={[styles.selecteur, styles.uniteSelecteur]}>
                  <Text style={styles.selecteurTexte}>{libelleUnite(dosageUnite)}</Text>
                  <Ionicons name="chevron-down" size={16} color={Brand.textFaint} />
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Forme (optionnel)</Text>
              <Pressable onPress={() => setModaleFormeOuverte(true)} style={styles.selecteur}>
                <Text style={styles.selecteurTexte}>
                  {forme ? LIBELLE_FORME[forme] : 'Choisir une forme'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Brand.textFaint} />
              </Pressable>
            </View>

            {forme === 'AUTRE' && (
              <View style={styles.field}>
                <Text style={styles.label}>Précisez la forme</Text>
                <TextInput
                  value={formeAutre}
                  onChangeText={setFormeAutre}
                  placeholder="ex : Collyre"
                  placeholderTextColor={Brand.textFaint}
                  style={styles.input}
                />
              </View>
            )}

            {nomComplet.length > 0 && (
              <View style={styles.apercuBox}>
                <Text style={styles.apercuLabel}>Nom affiché aux patients</Text>
                <Text style={styles.apercuNom}>{nomComplet}</Text>
              </View>
            )}

            {rechercheEnCours && (
              <View style={styles.checkingRow}>
                <ActivityIndicator size="small" color={Brand.textFaint} />
                <Text style={styles.checkingText}>Vérification des doublons…</Text>
              </View>
            )}

            {!rechercheEnCours && exacts.length > 0 && (
              <View style={styles.exactBox}>
                <View style={styles.doublonHeader}>
                  <Ionicons name="close-circle-outline" size={16} color={Brand.danger} />
                  <Text style={styles.exactTitre}>Ce produit existe déjà dans le catalogue</Text>
                </View>
                {exacts.map((item) => (
                  <Pressable key={item.id} onPress={() => choisirProduitExistant(item)} style={styles.doublonItem}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.doublonItemNom}>{item.nom}</Text>
                      {item.forme && (
                        <Text style={styles.doublonItemForme}>{LIBELLE_FORME[item.forme] ?? item.forme}</Text>
                      )}
                    </View>
                    <Text style={styles.doublonItemAction}>Utiliser cette fiche</Text>
                  </Pressable>
                ))}
                <Text style={styles.exactHint}>
                  Pour éviter les doublons, on ne crée pas une deuxième fiche pour le même produit.
                  Utilisez la fiche existante, puis indiquez votre quantité et votre prix.
                </Text>
              </View>
            )}

            {!rechercheEnCours && proches.length > 0 && (
              <View style={styles.doublonBox}>
                <View style={styles.doublonHeader}>
                  <Ionicons name="alert-circle-outline" size={16} color={Brand.warning} />
                  <Text style={styles.doublonTitre}>
                    Des produits proches existent déjà dans le catalogue
                  </Text>
                </View>
                {proches.map((item) => (
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
                  Aucun ne correspond (dosage ou forme différents) ? Continuez ci-dessous pour créer un nouveau produit.
                </Text>
              </View>
            )}

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

        {dejaEnStock && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Vous avez déjà ce produit dans votre stock. Modifiez plutôt sa quantité depuis la liste de vos stocks.
            </Text>
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
          disabled={enregistrement || exacts.length > 0 || dejaEnStock}
          style={[
            styles.submitButton,
            (enregistrement || exacts.length > 0 || dejaEnStock) && styles.submitButtonDisabled,
          ]}
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

      {/* Modale de selection de l'unite du dosage */}
      <Modal
        visible={modaleUniteOuverte}
        transparent
        animationType="slide"
        onRequestClose={() => setModaleUniteOuverte(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModaleUniteOuverte(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Unité du dosage</Text>
            <FlatList
              data={UNITES}
              keyExtractor={(item) => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setDosageUnite(item);
                    setModaleUniteOuverte(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemTexte}>{libelleUnite(item)}</Text>
                  {dosageUnite === item && <Ionicons name="checkmark" size={18} color={Brand.primary} />}
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
  dosageRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  uniteSelecteur: { minWidth: 130, gap: 6 },
  apercuBox: { backgroundColor: Brand.chipBg, borderRadius: 12, padding: 12, gap: 2 },
  apercuLabel: { fontSize: 11.5, color: Brand.textFaint },
  apercuNom: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  exactBox: {
    backgroundColor: Brand.dangerBg,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  exactTitre: { flex: 1, fontSize: 12.5, fontWeight: '700', color: Brand.danger },
  exactHint: { fontSize: 11.5, color: Brand.danger, lineHeight: 15 },
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