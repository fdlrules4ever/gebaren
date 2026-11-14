import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex } from '../../scripts/lib/signbank.ts';
import { compoundParts, createCatalogue, lookup, suggestionsFor } from '../../src/worker/lookup.ts';
import { parseOverrides } from '../../src/shared/overrides.ts';
import type { SignbankIndex } from '../../src/shared/signbank-index.ts';
import { glosses, images } from './fixtures.ts';

const overrides = parseOverrides({
  words: {
    schep: [{ kind: 'youtube', videoId: '-mZJCBQkhiY', sourceName: 'Het gebaar van de dag (YouTube)',
      sourcePageUrl: 'https://www.youtube.com/watch?v=-mZJCBQkhiY', licence: 'YouTube', licenceUrl: 'https://www.youtube.com/t/terms' }],
  },
});
const cat = createCatalogue(buildIndex(glosses, {}, images, null), overrides);

test('lookup: variants as separate results, with our own media URLs', () => {
  const found = lookup(cat, 'huis');
  assert.ok(found);
  assert.equal(found.word, 'huis');
  assert.deepEqual(found.results.map((r) => r.sourceId), ['1954', '1300']);
  const first = found.results[0]!;
  assert.equal(first.videoUrl, '/video/sb/1954.mp4');
  assert.equal(first.posterUrl, '/poster/sb/1954');
  assert.equal(first.kind, 'mp4');
  assert.equal(first.licence, 'CC BY 4.0');
  assert.equal(first.sourcePageUrl, 'https://signbank.cls.ru.nl/dictionary/gloss/1954');
  assert.deepEqual(first.senses, [['huis', 'huisje', 'hok', 'schuur']]);
  assert.equal(found.results[1]!.posterUrl, undefined);
});

test('lookup: tolerant input (accents, compact form, article)', () => {
  assert.equal(lookup(cat, 'cafe')?.word, 'café');
  assert.equal(lookup(cat, 'dankje')?.key, 'dank je');
  assert.equal(lookup(cat, 'het huis')?.key, 'huis');
  assert.equal(lookup(cat, 'de auto')?.key, 'auto');
  assert.equal(lookup(cat, 'paard'), null);
});

test('lookup: own overrides come first', () => {
  const found = lookup(cat, 'schep');
  assert.ok(found);
  assert.equal(found.results[0]!.kind, 'youtube');
  assert.equal(found.results[0]!.videoUrl, 'https://www.youtube-nocookie.com/embed/-mZJCBQkhiY');
});

test('compoundParts splits Dutch compounds into known words', () => {
  assert.deepEqual(compoundParts(cat, 'huisdier'), ['huis', 'dier']);
  assert.deepEqual(compoundParts(cat, 'kinderopvang'), ['kind', 'opvang']);
  assert.deepEqual(compoundParts(cat, 'kinderen'), []);
  assert.deepEqual(compoundParts(cat, 'huis'), []);
});

test('suggestionsFor: other word forms and small typos', () => {
  assert.deepEqual(suggestionsFor(cat, 'koffi'), ['koffie']);
  assert.ok(suggestionsFor(cat, 'autos').includes('auto'));
  assert.ok(suggestionsFor(cat, "auto's").includes('auto'));
  assert.deepEqual(suggestionsFor(cat, 'xyzzyq'), []);
});

test('the committed index finds the words v1 could not', () => {
  const index = JSON.parse(readFileSync(new URL('../../data/signbank/index.json', import.meta.url), 'utf8')) as SignbankIndex;
  const real = createCatalogue(index, overrides);
  assert.ok(Object.keys(index.glosses).length > 6000);
  for (const word of ['huis', 'cafe', 'dank je', 'dankje', 'koffie', 'school']) {
    assert.ok(lookup(real, word)?.results.length, `no results for ${word}`);
  }
  assert.deepEqual(compoundParts(real, 'huisdier'), ['huis', 'dier']);
});
