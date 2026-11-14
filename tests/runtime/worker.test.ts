/**
 * Runs inside workerd (the real Workers runtime) through wrangler. Needs `pnpm build` first (for the assets folder).
 * No outbound requests: the lerengebaren fallback is switched off for the API tests, and the parser is fed saved pages.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { unstable_startWorker } from 'wrangler';

type Started = Awaited<ReturnType<typeof unstable_startWorker>>;
const quiet = { server: { port: 0 }, inspector: false as const, logLevel: 'error' as const };
let app: Started;
let harness: Started;
let appUrl: URL;
let harnessUrl: URL;

before(async () => {
  if (!existsSync('dist')) mkdirSync('dist');
  app = await unstable_startWorker({
    config: 'wrangler.jsonc',
    name: 'gebaren-test-app', // a different name, so a running `wrangler dev` of the app does not get in the way
    bindings: { LERENGEBAREN_FALLBACK: { type: 'plain_text', value: 'off' } },
    dev: quiet,
  });
  harness = await unstable_startWorker({ config: 'tests/runtime/wrangler.harness.jsonc', dev: quiet });
  await Promise.all([app.ready, harness.ready]);
  appUrl = await app.url;
  harnessUrl = await harness.url;
});

after(async () => {
  await Promise.allSettled([app?.dispose(), harness?.dispose()]);
});

async function parse(fixture: string, key: string): Promise<unknown> {
  const res = await fetch(new URL(`/parse-lg?fixture=${fixture}&key=${encodeURIComponent(key)}`, harnessUrl));
  assert.equal(res.status, 200);
  return res.json();
}

test('HTMLRewriter parser: finds word and video on a saved page', async () => {
  assert.deepEqual(await parse('afval', 'afval'), { videoId: '2454', word: 'Afval' });
  assert.deepEqual(await parse('huis', 'huis'), { videoId: '1084', word: 'Huis' });
});

test('HTMLRewriter parser: "Niet gevonden!" page and a different word give null', async () => {
  assert.equal(await parse('zzqqxy', 'zzqqxy'), null);
  assert.equal(await parse('huis', 'afval'), null);
});

test('API: a word with variants', async () => {
  const res = await fetch(new URL('/api/sign?q=Huis', appUrl));
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/u);
  const body = await res.json() as { query: string; normalized: string; results: Array<{ videoUrl: string; kind: string }> };
  assert.equal(body.query, 'Huis');
  assert.equal(body.normalized, 'huis');
  assert.ok(body.results.length >= 2);
  assert.match(body.results[0]!.videoUrl, /^\/video\/sb\/\d+\.mp4$/u);
});

test('API: accents, spaces and the old v1 problem words', async () => {
  for (const q of ['café', 'cafe', 'dank je', 'Dank-je', 'dankje', 'schep']) {
    const res = await fetch(new URL(`/api/sign?q=${encodeURIComponent(q)}`, appUrl));
    assert.equal(res.status, 200, q);
  }
});

test('API: not found gives 404 with suggestions and compound parts', async () => {
  const res = await fetch(new URL('/api/sign?q=huisdier', appUrl));
  assert.equal(res.status, 404);
  const body = await res.json() as { error: string; message: string; parts: string[]; suggestions: string[] };
  assert.equal(body.error, 'not_found');
  assert.deepEqual(body.parts, ['huis', 'dier']);
  assert.ok(body.suggestions.includes('huisdeur'));
  assert.ok(body.message.length > 0);
});

test('API: invalid input is rejected with a plain message', async () => {
  for (const q of ['', '<script>', 'a'.repeat(61)]) {
    const res = await fetch(new URL(`/api/sign?q=${encodeURIComponent(q)}`, appUrl));
    assert.equal(res.status, 400, JSON.stringify(q));
    const body = await res.json() as { error: string };
    assert.equal(body.error, 'invalid_query');
  }
  const post = await fetch(new URL('/api/sign?q=huis', appUrl), { method: 'POST' });
  assert.equal(post.status, 405);
});

test('media: unknown ids are refused before any upstream request', async () => {
  assert.equal((await fetch(new URL('/video/sb/99999999.mp4', appUrl))).status, 404);
  assert.equal((await fetch(new URL('/video/sb/abc.mp4', appUrl))).status, 404);
  assert.equal((await fetch(new URL('/video/lg/1084.mp4', appUrl))).status, 404, 'fallback is off');
  assert.equal((await fetch(new URL('/poster/sb/..%2F..%2Fetc', appUrl))).status, 404);
});

test('health endpoint reports the index', async () => {
  const body = await (await fetch(new URL('/api/health', appUrl))).json() as { ok: boolean; signs: number };
  assert.equal(body.ok, true);
  assert.ok(body.signs > 6000);
});
