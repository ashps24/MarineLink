/**
 * Client for the real Catalyst backend (the Advanced I/O function in
 * functions/api). This is the seam the mock-api layer's read functions now
 * call through instead of reading the static @/data fixtures directly.
 *
 * The base URL is build-time only (Slate is a static export — there is no
 * server to read a runtime env var from), matching the same
 * NEXT_PUBLIC_-prefixed pattern already used for the release id.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  'https://marinelink-876513394.development.catalystserverless.com/server/api/execute';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    // The function lives on the Catalyst domain and the app is served from
    // Slate, so the Catalyst session cookie is third-party here. Without
    // this it is never sent and every request looks anonymous. The gateway
    // answers the Slate origin with Allow-Credentials, which is what makes
    // this work at all.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // A non-JSON body (e.g. a gateway-level error page) still needs to fail
    // with the real status rather than an opaque parse error.
  }

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return (body as { data: T }).data;
}

export const apiClient = {
  /** The Catalyst identity behind the session cookie, or null. */
  me: <T>() => request<T>('/me'),
  list: <T>(resource: string, query?: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) params.set(key, value);
    }
    const qs = params.toString();
    return request<T[]>(`/${resource}${qs ? `?${qs}` : ''}`);
  },
  get: <T>(resource: string, id: string) => request<T>(`/${resource}/${id}`),
  create: <T>(resource: string, payload: unknown) =>
    request<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) }),
  update: <T>(resource: string, id: string, payload: unknown) =>
    request<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (resource: string, id: string) =>
    request<{ id: string; deleted: boolean }>(`/${resource}/${id}`, { method: 'DELETE' }),
};
