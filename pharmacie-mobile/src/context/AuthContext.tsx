import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [pharmacieId, setPharmacieId] = useState<number | null>(null);
  const [nomPharmacie, setNomPharmacie] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedId = await SecureStore.getItemAsync(PHARMACIE_ID_KEY);
      const savedNom = await SecureStore.getItemAsync(NOM_PHARMACIE_KEY);
      if (savedToken && savedId && savedNom) {
        setToken(savedToken);
        setPharmacieId(Number(savedId));
        setNomPharmacie(savedNom);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (identifiantConnexion: string, motDePasse: string) => {
    const data = await apiClient.post<LoginResponse>('/api/auth/login', {
      identifiantConnexion,
      motDePasse,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(PHARMACIE_ID_KEY, String(data.pharmacieId));
    await SecureStore.setItemAsync(NOM_PHARMACIE_KEY, data.nomPharmacie);
    setToken(data.token);
    setPharmacieId(data.pharmacieId);
    setNomPharmacie(data.nomPharmacie);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(PHARMACIE_ID_KEY);
    await SecureStore.deleteItemAsync(NOM_PHARMACIE_KEY);
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