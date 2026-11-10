import { csrfHeaders } from './csrf.js';
import { mapResponseError } from './errorMapper.js';
import { createRequestId } from './requestId.js';
const defaultApiBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? '/api/v1';
export function createHttpClient({ baseUrl = defaultApiBaseUrl, fetchImpl = fetch } = {}) { return Object.freeze({ async request(path, { method = 'GET', body, headers = {}, signal } = {}) { const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method); const response = await fetchImpl(`${baseUrl}${path}`, { method, credentials: 'include', signal, headers: { accept: 'application/json', 'x-request-id': createRequestId(), ...(body ? { 'content-type': 'application/json' } : {}), ...(mutating ? csrfHeaders() : {}), ...headers }, body: body ? JSON.stringify(body) : undefined }); if (!response.ok) throw await mapResponseError(response); if (response.status === 204) return null; return response.json(); }, get(path, options) { return this.request(path, options); }, post(path, body, options) { return this.request(path, { ...options, method: 'POST', body }); } }); }
export const httpClient = createHttpClient();
