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

export async function apiFetch(path: string, init?: RequestInit, retries = 2): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      signal: controller.signal,
    });
    
    // Auto-retry on 5xx or network-like failures for GET only
    if (!response.ok && response.status >= 500 && retries > 0 && (!init?.method || init.method === 'GET')) {
      console.warn(`Retrying ${path}... (${retries} attempts left)`);
      return apiFetch(path, init, retries - 1);
    }

    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    // Retry on network errors
    if (retries > 0 && (!init?.method || init.method === 'GET')) {
      return apiFetch(path, init, retries - 1);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
