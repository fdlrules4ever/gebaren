/**
 * Runs before `vite build`:
 * - checks data/overrides.json (a mistake fails the build),
 * - writes public/words.json, the word list for suggestions while typing.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { parseOverrides } from '../src/shared/overrides.ts';
import type { SignbankIndex } from './lib/signbank.ts';
import type { WordList } from '../src/shared/types.ts';

const read = async (path: string): Promise<unknown> => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

const overrides = parseOverrides(await read('../data/overrides.json'));
const index = (await read('../data/signbank/index.json')) as SignbankIndex;

const words = new Set<string>();
for (const key of Object.keys(index.words)) words.add(index.display[key] ?? key);
for (const results of overrides.values()) for (const r of results) words.add(r.word);

const list: WordList = { v: 1, words: [...words].sort((a, b) => a.localeCompare(b, 'nl')) };
await writeFile(new URL('../public/words.json', import.meta.url), JSON.stringify(list));
console.log(`public/words.json: ${list.words.length} words. Overrides OK: ${overrides.size} words.`);
