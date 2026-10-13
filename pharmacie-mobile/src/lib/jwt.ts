
export function tokenExpire(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = (globalThis as any).atob(base64);
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' && exp * 1000 < Date.now();
  } catch {
    return false;
  }
}