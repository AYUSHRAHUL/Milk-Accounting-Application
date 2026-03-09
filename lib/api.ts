function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Web can use relative paths (same-origin). Native needs absolute URLs.
  if (!base) return path;

  const normalized = normalizeBaseUrl(base);
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/')) return `${normalized}/${path}`;
  return `${normalized}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init);
}

