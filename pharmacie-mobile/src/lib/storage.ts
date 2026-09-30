import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};

/**
 * expo-secure-store est un module natif : il ne fonctionne que sur iOS/Android
 * (Expo Go ou build). Sur web (navigateur, `npx expo start` puis 'w'), on
 * bascule sur localStorage — moins securise, mais suffisant en developpement
 * et pour le web, qui n'est pas la cible principale de l'app pharmacien/patient.
 */
export const storage: Storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};