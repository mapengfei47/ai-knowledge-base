const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string | null) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join('；') : body?.message;
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('akb:unauthorized'));
    }
    throw new ApiError(message ?? `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}
