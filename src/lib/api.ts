/**
 * frontend/src/lib/api.ts
 *
 * Centralised API client for the web frontend.
 * Uses Clerk tokens for authentication.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

let tokenFetcher: (() => Promise<string | null>) | null = null;

export function setTokenFetcher(fetcher: () => Promise<string | null>) {
  tokenFetcher = fetcher;
}

export function clearToken() {
  tokenFetcher = null;
}

// ── Base fetch ────────────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = tokenFetcher ? await tokenFetcher() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // If unauthorized, Clerk will typically handle the redirect on next re-render
    // but we can clear our local cache if needed.
  }

  return res;
}

async function get<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await apiFetch(path, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  register: (email: string, password: string, firstName?: string, lastName?: string) =>
    post<{ token: string; user: any }>('/api/auth/register', { email, password, firstName, lastName }),

  login: (email: string, password: string) =>
    post<{ token: string; user: any }>('/api/auth/login', { email, password }),

  getUser: () => get<any>('/api/auth/user'),

  logout: () => clearToken(),
};

// ── Usage ─────────────────────────────────────────────────────────────────────

export const usage = {
  get: () => get<any>('/api/usage'),
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => get<any[]>('/api/categories'),
  create: (data: any) => post<any>('/api/categories', data),
  update: (id: number, data: any) => put<any>(`/api/categories/${id}`, data),
  delete: (id: number) => del(`/api/categories/${id}`),
  reset: () => post<any[]>('/api/categories/reset', {}),
};

// ── Assessments ───────────────────────────────────────────────────────────────

export const assessmentsApi = {
  create: (data: any) => post<any>('/api/assessments', data),
  recent: (limit = 10) => get<any[]>(`/api/assessments/recent?limit=${limit}`),
};

// ── AI Analysis ───────────────────────────────────────────────────────────────

export const analyzeApi = {
  run: (scores: number[], categories: any[]) =>
    post<any>('/api/analyze', { scores, categories }),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  create: (data: any) => post<any>('/api/reports', data),
  list: (limit = 10) => get<any[]>(`/api/reports?limit=${limit}`),
};

// ── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  initialize: (plan: string, amount: number, currency?: string) =>
    post<any>('/api/payments/initialize', { plan, amount, currency }),
  verify: (reference: string) => get<any>(`/api/payments/verify/${reference}`),
  history: () => get<any>('/api/payments/history'),
  subscription: () => get<any>('/api/subscription'),
};
