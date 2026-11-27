import { csrfHeaders } from './csrf';
import { mapResponseError } from './errorMapper';
import { createRequestId } from './requestId';

const defaultApiBaseUrl: string = import.meta.env?.VITE_API_BASE_URL ?? '/api/v1';

export interface HttpRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface CreateHttpClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface HttpClient {
  request<T = Record<string, any>>(path: string, options?: HttpRequestOptions): Promise<T>;
  get<T = Record<string, any>>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<T>;
  post<T = Record<string, any>>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T>;
  patch<T = Record<string, any>>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<T>;
}

export function createHttpClient({
  baseUrl = defaultApiBaseUrl,
  fetchImpl = fetch,
}: CreateHttpClientOptions = {}): HttpClient {
  return Object.freeze({
    async request<T = Record<string, any>>(
      path: string,
      { method = 'GET', body, headers = {}, signal }: HttpRequestOptions = {}
    ): Promise<T> {
      const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      const requestHeaders: Record<string, string> = {
        accept: 'application/json',
        'x-request-id': createRequestId(),
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(mutating ? csrfHeaders() : {}),
        ...headers,
      };
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        signal,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw await mapResponseError(response);
      if (response.status === 204) return null as T;
      return (await response.json()) as T;
    },
    get<T = Record<string, any>>(
      path: string,
      options?: Omit<HttpRequestOptions, 'method' | 'body'>
    ): Promise<T> {
      return this.request<T>(path, options);
    },
    post<T = Record<string, any>>(
      path: string,
      body?: unknown,
      options?: Omit<HttpRequestOptions, 'method' | 'body'>
    ): Promise<T> {
      return this.request<T>(path, { ...options, method: 'POST', body });
    },
    patch<T = Record<string, any>>(
      path: string,
      body?: unknown,
      options?: Omit<HttpRequestOptions, 'method' | 'body'>
    ): Promise<T> {
      return this.request<T>(path, { ...options, method: 'PATCH', body });
    },
  });
}

export const httpClient: HttpClient = createHttpClient();
