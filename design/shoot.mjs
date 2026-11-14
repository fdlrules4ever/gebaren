// Screenshots of the mockups through the Chrome DevTools Protocol, with real phone emulation
// (headless Chrome's --window-size cannot go below ~500 px). No dependencies; needs Node 22+ (global WebSocket).
// Usage: start the mockup server (node design/serve.mjs), then: node design/shoot.mjs
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
const PORT = 9333;
const DIRS = [['a', 'a-stilte'], ['b', 'b-signaal'], ['c', 'c-zakboek']];
const STATES = ['gebaar', 'niet-gevonden', 'start'];
const THEMES = ['licht', 'donker'];
const SIZES = {
  desktop: { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false },
  mobiel: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = await mkdtemp(join(tmpdir(), 'gebaren-shots-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

async function devtools(path, method = 'GET') {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`, { method }); if (r.ok) return r.json(); } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}

try {
  const target = await devtools('/json/new?about:blank', 'PUT');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      if (m.error) rej(new Error(m.error.message)); else res(m.result);
    } else if (m.method) {
      for (const w of [...waiters]) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((res) => waiters.push({ method, res }));

  await send('Page.enable');
  await mkdir(OUT, { recursive: true });
  let n = 0;
  for (const [k, file] of DIRS) for (const st of STATES) for (const th of THEMES) for (const [size, metrics] of Object.entries(SIZES)) {
    await send('Emulation.setDeviceMetricsOverride', metrics);
    await send('Emulation.setTouchEmulationEnabled', { enabled: metrics.mobile });
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `${BASE}/${file}.html?n=${++n}#${st}-${th}-foto` });
    await loaded;
    await sleep(1800); // web fonts and the mid-sign video frame
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    const name = `${k}-${st}-${th}-${size}.jpg`;
    await writeFile(join(OUT, name), Buffer.from(data, 'base64'));
    console.log('saved', name);
  }
  ws.close();
} finally {
  chrome.kill();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
