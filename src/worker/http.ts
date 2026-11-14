/** Small response helpers. */
import type { ApiErrorCode } from '../shared/types.ts';

const BASE_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'cross-origin-resource-policy': 'same-origin',
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...BASE_HEADERS, ...headers },
  });
}

const MESSAGES: Record<ApiErrorCode, string> = {
  invalid_query: 'Dit woord kunnen we niet zoeken.',
  not_found: 'We hebben geen gebaar voor dit woord.',
  rate_limited: 'Je zoekt heel snel achter elkaar. Wacht een minuut en probeer het opnieuw.',
  source_unavailable: 'De bron van de video reageert nu niet. Probeer het later opnieuw.',
  timeout: 'Het duurde te lang. Probeer het opnieuw.',
  internal: 'Er ging iets mis bij ons. Probeer het later opnieuw.',
};

export function apiError(code: ApiErrorCode, status: number, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}): Response {
  return json({ error: code, message: MESSAGES[code], ...extra }, status, headers);
}

export function plain(status: number, text: string, headers: Record<string, string> = {}): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/plain; charset=utf-8', ...BASE_HEADERS, ...headers } });
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? 'local';
}

export { BASE_HEADERS };
