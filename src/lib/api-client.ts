import type { ApiResponse } from '@/lib/api-types';

/** Calls an API route and always resolves with the common response shape. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { ok: false, error: { code: 'internal' } };
  }
}

export function postJson<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) });
}
