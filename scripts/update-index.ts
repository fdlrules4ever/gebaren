/**
 * Refreshes data/signbank/index.json from the public NGT Signbank package (CC BY 4.0).
 * Run by hand: pnpm update-index. The result is committed, so builds never depend on Signbank being up.
 * Fails loudly when the package looks wrong, and never overwrites the index with a much smaller one.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readZip } from './lib/zip.ts';
import { buildIndex, type RawGloss, type SignbankIndex } from './lib/signbank.ts';

const PACKAGE_URL = 'https://signbank.cls.ru.nl/dictionary/package/?dataset_name=NGT';
const OUT = new URL('../data/signbank/index.json', import.meta.url);
const MAX_BYTES = 50 * 1024 * 1024;

function parseJson<T>(files: Map<string, Buffer>, name: string): T {
  const file = files.get(name);
  if (!file) throw new Error(`The Signbank package has no ${name}.`);
  return JSON.parse(file.toString('utf8')) as T;
}

const res = await fetch(PACKAGE_URL, { headers: { 'user-agent': 'gebaren-index-builder (https://gebaren.franklippes.com)' } });
if (!res.ok) throw new Error(`Signbank answered ${res.status} ${res.statusText}.`);
const body = Buffer.from(await res.arrayBuffer());
if (body.length > MAX_BYTES) throw new Error(`The package is unexpectedly large (${body.length} bytes).`);

const files = readZip(body);
const index = buildIndex(
  parseJson<Record<string, RawGloss>>(files, 'glosses.json'),
  parseJson<Record<string, string>>(files, 'video_urls.json'),
  parseJson<Record<string, string>>(files, 'image_urls.json'),
  res.headers.get('last-modified'),
);

const glossCount = Object.keys(index.glosses).length;
const wordCount = Object.keys(index.words).length;
let previous: SignbankIndex | null = null;
try { previous = JSON.parse(await readFile(OUT, 'utf8')) as SignbankIndex; } catch { /* first run */ }
const previousCount = previous ? Object.keys(previous.glosses).length : 0;
if (glossCount < 1000 || glossCount < previousCount * 0.8) {
  throw new Error(`Refusing to write: ${glossCount} signs now, ${previousCount} before. Check the package by hand.`);
}

await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(index) + '\n');
console.log(`Wrote ${glossCount} signs and ${wordCount} words (${Object.keys(index.aliases).length} aliases) to data/signbank/index.json.`);
