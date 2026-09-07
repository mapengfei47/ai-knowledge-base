export type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemInput = Pick<KnowledgeItem, 'title' | 'content' | 'tag'>;

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; cache: string | null }> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.message ?? `请求失败 (${response.status})`);
  }
  const data = response.status === 204 ? undefined : await response.json();
  return { data: data as T, cache: response.headers.get('X-Cache') };
}

export const api = {
  list: () => request<KnowledgeItem[]>('/knowledge'),
  create: (input: ItemInput) => request<KnowledgeItem>('/knowledge', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: ItemInput) => request<KnowledgeItem>(`/knowledge/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/knowledge/${id}`, { method: 'DELETE' }),
  health: () => request<{ status: string }>('/health'),
};

