/**
 * Test-only Worker: runs our HTMLRewriter parser inside workerd on saved pages. Never deployed.
 * The fixtures are bundled as text modules (wrangler's default rule for .html), so no request body is needed.
 */
import { parseLerengebaren } from '../../src/worker/lerengebaren.ts';
import afval from '../fixtures/lerengebaren-afval.html';
import huis from '../fixtures/lerengebaren-huis.html';
import missing from '../fixtures/lerengebaren-zzqqxy.html';

const FIXTURES: Record<string, string> = { afval, huis, zzqqxy: missing };

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);
    const html = FIXTURES[url.searchParams.get('fixture') ?? ''];
    if (url.pathname !== '/parse-lg' || html === undefined) return new Response('not found', { status: 404 });
    const page = new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    return Response.json(await parseLerengebaren(page, url.searchParams.get('key') ?? ''));
  },
} satisfies ExportedHandler;
