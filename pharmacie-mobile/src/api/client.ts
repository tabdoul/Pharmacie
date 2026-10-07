export const API_BASE_URL = 'http://192.168.1.170:8080';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
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