import { createRequestId } from './requestId';
import { mapResponseError } from './errorMapper';

const apiBaseUrl: string = import.meta.env?.VITE_API_BASE_URL ?? '/api/v1';

export interface DownloadFileOptions {
  filename?: string;
  fetchImpl?: typeof fetch;
}

export async function downloadFile(
  path: string,
  { filename = 'download', fetchImpl = fetch }: DownloadFileOptions = {}
): Promise<void> {
  const response = await fetchImpl(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: { 'x-request-id': createRequestId() },
  });
  if (!response.ok) throw await mapResponseError(response);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
