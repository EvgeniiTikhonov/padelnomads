const API_BASE = '/api';

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export async function uploadProofFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { url } = await apiFetch<{ url: string }>('/upload/proof', {
    method: 'POST',
    body: formData,
  });
  return url;
}
