import { tokenExpire } from '../lib/jwt';

export const API_BASE_URL = 'http://192.168.1.165:8080';

const DELAI_REQUETE_MS = 15000;
const DELAI_UPLOAD_MS = 60000;

const MESSAGE_RESEAU =
  'Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.';
const MESSAGE_DELAI = 'Le serveur met trop de temps à répondre. Réessayez dans un instant.';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }

  /** true quand la requete n'a jamais abouti (reseau coupe, serveur eteint, delai depasse) */
  get estErreurReseau(): boolean {
    return this.status === 0;
  }
}

// --- Session expiree -------------------------------------------------------
// L'AuthContext enregistre ici la fonction a appeler quand le backend refuse
// le token (401, ou 403 avec un token reellement expire).
let sessionExpireeHandler: (() => void) | null = null;

export function setSessionExpireeHandler(handler: (() => void) | null) {
  sessionExpireeHandler = handler;
}

function verifierSession(status: number, token?: string) {
  if (!token || !sessionExpireeHandler) return;
  if (status === 401 || (status === 403 && tokenExpire(token))) {
    sessionExpireeHandler();
  }
}

// --- Appels reseau ---------------------------------------------------------
async function fetchSecurise(url: string, init: RequestInit, delaiMs: number): Promise<Response> {
  const controller = new AbortController();
  const minuteur = setTimeout(() => controller.abort(), delaiMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError(0, MESSAGE_DELAI);
    }
    throw new ApiError(0, MESSAGE_RESEAU);
  } finally {
    clearTimeout(minuteur);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchSecurise(
    `${API_BASE_URL}${path}`,
    { ...options, headers },
    DELAI_REQUETE_MS
  );

  if (!response.ok) {
    verifierSession(response.status, token);

    let message = `Erreur ${response.status}`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // corps non-JSON, on garde le message par defaut
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

/**
 * Upload d'un fichier (multipart/form-data). Ne pas fixer de Content-Type
 * manuellement : fetch/React Native genere automatiquement l'en-tete avec
 * le bon "boundary" quand le corps est un FormData.
 *
 * Note : sur les versions recentes d'Expo/React Native (New Architecture),
 * passer directement { uri, name, type } a FormData.append() leve
 * "Unsupported FormDataPart implementation". Il faut d'abord recuperer
 * un vrai Blob depuis l'URI locale du fichier avant de l'ajouter.
 */
async function uploadFile<T>(
  path: string,
  champ: string,
  fichier: { uri: string; name: string; type: string },
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const formData = new FormData();

  const reponseFichier = await fetch(fichier.uri);
  const blob = await reponseFichier.blob();
  formData.append(champ, blob, fichier.name);

  const response = await fetchSecurise(
    `${API_BASE_URL}${path}`,
    { method: 'POST', body: formData, headers },
    DELAI_UPLOAD_MS
  );

  if (!response.ok) {
    verifierSession(response.status, token);

    let message = `Erreur ${response.status}`;
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, token),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }, token),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE' }, token),
  uploadFile,
};