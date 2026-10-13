import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { storage } from '../lib/storage';
import { tokenExpire } from '../lib/jwt';
import { apiClient, ApiError, setSessionExpireeHandler } from '../api/client';

type AuthState = {
  token: string | null;
  pharmacieId: number | null;
  nomPharmacie: string | null;
  loading: boolean;
  login: (identifiantConnexion: string, motDePasse: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'pharmacie_token';
const PHARMACIE_ID_KEY = 'pharmacie_id';
const NOM_PHARMACIE_KEY = 'pharmacie_nom';

type LoginResponse = {
  token: string;
  pharmacieId: number;
  nomPharmacie: string;
};

/**
 * Verifie aupres du backend que la session sauvegardee est toujours acceptee
 * (compte supprime, base reinitialisee, cle JWT changee...).
 * - 401/403 -> session refusee, on la supprime
 * - serveur injoignable ou trop lent -> on garde la session (mode hors ligne tolerant)
 */
async function sessionAcceptee(token: string): Promise<boolean> {
  try {
    await Promise.race([
      apiClient.get('/api/pharmacien/notifications/non-lues', token),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    return true;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return false;
    }
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [pharmacieId, setPharmacieId] = useState<number | null>(null);
  const [nomPharmacie, setNomPharmacie] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const effacerSession = async () => {
    await Promise.all([
      storage.deleteItem(TOKEN_KEY),
      storage.deleteItem(PHARMACIE_ID_KEY),
      storage.deleteItem(NOM_PHARMACIE_KEY),
    ]).catch(() => {
      // ignore
    });
  };

  // Le client HTTP nous previent quand le backend refuse le token (session expiree)
  useEffect(() => {
    setSessionExpireeHandler(() => {
      // Plusieurs requetes en parallele peuvent echouer en meme temps : une seule alerte
      if (!tokenRef.current) return;
      tokenRef.current = null;
      effacerSession();
      setToken(null);
      setPharmacieId(null);
      setNomPharmacie(null);
      Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
    });
    return () => setSessionExpireeHandler(null);
  }, []);

  // Restaure la session sauvegardee au lancement de l'app
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await storage.getItem(TOKEN_KEY);
        const savedId = await storage.getItem(PHARMACIE_ID_KEY);
        const savedNom = await storage.getItem(NOM_PHARMACIE_KEY);

        if (savedToken && savedId && savedNom) {
          if (tokenExpire(savedToken) || !(await sessionAcceptee(savedToken))) {
            await effacerSession();
          } else {
            setToken(savedToken);
            setPharmacieId(Number(savedId));
            setNomPharmacie(savedNom);
          }
        }
      } catch {
        // Stockage inaccessible : on demarre simplement deconnecte
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (identifiantConnexion: string, motDePasse: string) => {
    const data = await apiClient.post<LoginResponse>('/api/auth/login', {
      identifiantConnexion,
      motDePasse,
    });
    await storage.setItem(TOKEN_KEY, data.token);
    await storage.setItem(PHARMACIE_ID_KEY, String(data.pharmacieId));
    await storage.setItem(NOM_PHARMACIE_KEY, data.nomPharmacie);
    tokenRef.current = data.token;
    setToken(data.token);
    setPharmacieId(data.pharmacieId);
    setNomPharmacie(data.nomPharmacie);
  };

  const logout = async () => {
    await effacerSession();
    setToken(null);
    setPharmacieId(null);
    setNomPharmacie(null);
  };

  return (
    <AuthContext.Provider value={{ token, pharmacieId, nomPharmacie, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit etre utilise a l\'interieur de AuthProvider');
  }
  return ctx;
}