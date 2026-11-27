export interface ApiErrorOptions {
  message?: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor({
    message = 'Request failed.',
    status = 0,
    code = 'NETWORK_ERROR',
    details = null,
  }: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
}

interface ParsedErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
  code?: string;
  message?: string;
}

export async function mapResponseError(response: Response): Promise<ApiError> {
  let body: ParsedErrorBody | null = null;
  try {
    body = (await response.json()) as ParsedErrorBody;
  } catch {
    /* ignore non-JSON body */
  }
  const details = withRetryAfterHeader(body?.error?.details ?? null, response);
  return new ApiError({
    status: response.status,
    code: body?.error?.code ?? body?.code ?? `HTTP_${response.status}`,
    message:
      body?.error?.message ??
      body?.message ??
      (response.status >= 500
        ? 'A service error occurred. Please try again.'
        : 'Your request could not be completed.'),
    details,
  });
}

function withRetryAfterHeader(details: unknown, response: Response): unknown {
  const header = response.headers?.get?.('retry-after');
  const seconds = header ? Number(header) : NaN;
  if (!Number.isFinite(seconds) || seconds < 0) return details;
  const base = typeof details === 'object' && details !== null ? (details as Record<string, unknown>) : {};
  if (typeof base.retryAfterSeconds === 'number') return details;
  return { ...base, retryAfterSeconds: seconds };
}

/** Seconds the client must wait before retrying (429 `details.retryAfterSeconds`), or null when not provided. */
export function getRetryAfterSeconds(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('details' in error)) return null;
  const details = (error as { details?: unknown }).details;
  if (typeof details !== 'object' || details === null) return null;
  const value = (details as { retryAfterSeconds?: unknown }).retryAfterSeconds;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.ceil(value) : null;
}

export function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function isRateLimited(error: unknown): boolean {
  const status = typeof error === 'object' && error !== null ? (error as { status?: unknown }).status : undefined;
  return status === 429 || getErrorCode(error) === 'RATE_LIMIT_EXCEEDED';
}
