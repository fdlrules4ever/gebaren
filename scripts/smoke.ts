/**
 * Smoke test against a deployed URL (a preview URL or production):
 *   pnpm smoke https://gebaren.<subdomain>.workers.dev
 * Checks the app shell, deep links, the API, the video proxy (byte ranges) and the security headers.
 */
const base = (process.argv[2] ?? process.env.BASE_URL ?? '').replace(/\/+$/u, '');
if (!/^https?:\/\//u.test(base)) {
  console.error('Usage: pnpm smoke <base url>');
  process.exit(2);
}

interface Check { name: string; ok: boolean; detail: string }
const checks: Check[] = [];
const check = (name: string, ok: boolean, detail = ''): void => { checks.push({ name, ok, detail }); };
const get = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(base + path, { redirect: 'manual', ...init, headers: { 'user-agent': 'gebaren-smoke-test', ...init?.headers } });

async function main(): Promise<void> {
  const home = await get('/');
  check('/ serves the app', home.status === 200 && (home.headers.get('content-type') ?? '').includes('text/html'), String(home.status));
  check('security headers', !!home.headers.get('content-security-policy') && home.headers.get('x-content-type-options') === 'nosniff',
    home.headers.get('content-security-policy')?.slice(0, 40) ?? 'missing');

  const deep = await get('/dank%20je');
  check('deep link /dank je serves the app', deep.status === 200 && (await deep.text()).includes('id="app"'), String(deep.status));

  const health = await (await get('/api/health')).json() as { ok?: boolean; signs?: number };
  check('/api/health', health.ok === true && (health.signs ?? 0) > 6000, JSON.stringify(health));

  const huis = await get('/api/sign?q=Huis');
  const huisBody = await huis.json() as { results?: Array<{ videoUrl: string; posterUrl?: string }> };
  check('API finds huis with variants', huis.status === 200 && (huisBody.results?.length ?? 0) >= 2, `${huis.status}, ${huisBody.results?.length} results`);

  for (const q of ['café', 'dank je', 'dankje', 'schep']) {
    const r = await get(`/api/sign?q=${encodeURIComponent(q)}`);
    check(`API finds "${q}"`, r.status === 200, String(r.status));
  }

  const missing = await get('/api/sign?q=zzqqxyw');
  const missingBody = await missing.json() as { error?: string };
  check('API: not found is a 404 with JSON', missing.status === 404 && missingBody.error === 'not_found', String(missing.status));

  const bad = await get('/api/sign?q=%3Cscript%3E');
  check('API rejects bad input', bad.status === 400, String(bad.status));

  const video = huisBody.results?.[0]?.videoUrl ?? '/video/sb/1954.mp4';
  for (const attempt of ['first', 'second']) {
    const t = Date.now();
    const r = await get(video, { headers: { range: 'bytes=0-1' } });
    const ms = Date.now() - t;
    check(`video byte range (${attempt} request)`, r.status === 206 && /^bytes 0-1\/\d+$/u.test(r.headers.get('content-range') ?? '')
      && r.headers.get('content-type') === 'video/mp4', `${r.status} ${r.headers.get('content-range')} ${ms} ms`);
    await r.arrayBuffer();
  }

  const poster = huisBody.results?.[0]?.posterUrl;
  if (poster) {
    const r = await get(poster);
    check('poster image', r.status === 200 && (r.headers.get('content-type') ?? '').startsWith('image/'), String(r.status));
    await r.arrayBuffer();
  }

  const words = await get('/words.json');
  const list = await words.json() as { words?: string[] };
  check('words.json for suggestions', words.status === 200 && (list.words?.length ?? 0) > 8000, `${list.words?.length} words`);

  for (const path of ['/manifest.webmanifest', '/sw.js', '/fonts/atkinson-hyperlegible-next-latin.woff2', '/icons/icon-192.png']) {
    const r = await get(path);
    check(path, r.status === 200, String(r.status));
    await r.arrayBuffer();
  }
}

await main().catch((err: unknown) => check('smoke test ran', false, String(err)));
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed against ${base}`);
process.exit(failed ? 1 : 0);
