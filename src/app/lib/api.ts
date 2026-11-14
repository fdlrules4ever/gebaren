/** Client for GET /api/sign, turning every outcome into a state the UI can show. */
import type { ApiErrorCode, SignResponse } from '../../shared/types.ts';

export type ErrorCode = ApiErrorCode | 'offline';

export type Lookup =
  | { state: 'found'; data: SignResponse }
  | { state: 'notfound'; data: SignResponse }
  | { state: 'error'; code: ErrorCode; message: string; suggestions: string[]; parts: string[] };

const TIMEOUT_MS = 10_000;

function error(code: ErrorCode, message: string, body?: Partial<SignResponse>): Lookup {
  return { state: 'error', code, message, suggestions: body?.suggestions ?? [], parts: body?.parts ?? [] };
}

/** Throws only when the caller aborted (a newer search started); every other outcome is returned. */
export async function lookupSign(word: string, signal: AbortSignal): Promise<Lookup> {
  let res: Response;
  try {
    res = await fetch(`/api/sign?q=${encodeURIComponent(word)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
    });
  } catch (err) {
    if (signal.aborted) throw err;
    if (err instanceof DOMException && err.name === 'TimeoutError') return error('timeout', 'Het zoeken duurde te lang.');
    if (!navigator.onLine) return error('offline', 'Je bent offline.');
    return error('source_unavailable', 'Gebaren is nu niet bereikbaar.');
  }

  let body: (Partial<SignResponse> & { error?: ApiErrorCode; message?: string }) | null = null;
  try { body = await res.json(); } catch { /* not JSON */ }

  if (res.ok && body?.results) return { state: 'found', data: body as SignResponse };
  if (res.status === 404 && body?.error === 'not_found') return { state: 'notfound', data: body as SignResponse };
  if (res.status === 429) return error('rate_limited', body?.message ?? 'Je zoekt heel snel achter elkaar.');
  if (res.status === 400) return error('invalid_query', body?.message ?? 'Dit woord kunnen we niet zoeken.');
  if (res.status === 504) return error('timeout', body?.message ?? 'Het zoeken duurde te lang.', body ?? undefined);
  if (res.status === 502) return error('source_unavailable', body?.message ?? 'Een bron reageert nu niet.', body ?? undefined);
  return error('internal', body?.message ?? 'Er ging iets mis.');
}
