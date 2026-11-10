import { createRequestId } from './requestId.js';
import { mapResponseError } from './errorMapper.js';
const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? '/api/v1';
export async function downloadFile(path, { filename = 'download', fetchImpl = fetch } = {}) { const response = await fetchImpl(`${apiBaseUrl}${path}`, { credentials: 'include', headers: { 'x-request-id': createRequestId() } }); if (!response.ok) throw await mapResponseError(response); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
