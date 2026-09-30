// Remplace par l'adresse IP locale de ta machine (pas "localhost", qui ne
// fonctionne pas depuis un téléphone physique) pendant le développement.
// Exemple : http://192.168.1.42:8080
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
 */
async function uploadFile<T>(
  path: string,
  champ: string,
  fichier: { uri: string; name: string; type: string },
  token?: string
): Promise<T> {
  const formData = new FormData();
  // @ts-expect-error React Native accepte cette forme d'objet pour un fichier,
  // meme si le typage web standard de FormData ne la reconnait pas.
  formData.append(champ, { uri: fichier.uri, name: fichier.name, type: fichier.type });

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
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