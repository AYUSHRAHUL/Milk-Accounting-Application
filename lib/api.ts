function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string) {
  // Use environment variable if set, otherwise fallback to local backend on port 3000
  const base = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const normalized = normalizeBaseUrl(base);
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/')) return `${normalized}/${path}`;
  return `${normalized}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init);
}
