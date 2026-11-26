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
  return new ApiError({
    status: response.status,
    code: body?.error?.code ?? body?.code ?? `HTTP_${response.status}`,
    message:
      body?.error?.message ??
      body?.message ??
      (response.status >= 500
        ? 'A service error occurred. Please try again.'
        : 'Your request could not be completed.'),
    details: body?.error?.details ?? null,
  });
}
