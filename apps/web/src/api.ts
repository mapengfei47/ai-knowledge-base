export type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemInput = Pick<KnowledgeItem, 'title' | 'content' | 'tag'>;

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; cache: string | null }> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message = Array.isArray(detail?.message) ? detail.message[0] : detail?.message;
    throw new ApiError(message ?? `请求失败 (${response.status})`, response.status);
  }
  const data = response.status === 204 ? undefined : await response.json();
  return { data: data as T, cache: response.headers.get('X-Cache') };
}

export const api = {
  login: (input: { username: string; password: string; remember: boolean }) =>
    request<{ user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<{ user: SessionUser }>('/auth/me'),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  list: () => request<KnowledgeItem[]>('/knowledge'),
  create: (input: ItemInput) => request<KnowledgeItem>('/knowledge', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: ItemInput) => request<KnowledgeItem>(`/knowledge/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/knowledge/${id}`, { method: 'DELETE' }),
  health: () => request<{ status: string }>('/health'),
};
