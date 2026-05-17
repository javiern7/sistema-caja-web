import { env } from '../../app/config/env';
import { useAuthStore } from '../../store/auth-store';
import type { ApiResponse } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  public readonly apiCode: string | null;
  public readonly apiMessage: string | null;

  constructor(
    message: string,
    public readonly status: number,
    options?: {
      apiCode?: string | null;
      apiMessage?: string | null;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.apiCode = options?.apiCode ?? null;
    this.apiMessage = options?.apiMessage ?? null;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let apiMessage: string | null = null;
    let apiCode: string | null = null;

    try {
      const errorPayload = (await response.json()) as Partial<ApiResponse<unknown>>;
      apiMessage = errorPayload.message ?? null;
      apiCode = errorPayload.error?.code ?? null;
    } catch {
      apiMessage = null;
      apiCode = null;
    }

    throw new ApiError(apiMessage ?? `Request failed with status ${response.status}`, response.status, {
      apiCode,
      apiMessage,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
