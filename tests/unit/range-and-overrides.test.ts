import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRange } from '../../src/worker/range.ts';
import { parseOverrides } from '../../src/shared/overrides.ts';

test('parseRange: the forms browsers send', () => {
  assert.deepEqual(parseRange(null, 100), { kind: 'none' });
  assert.deepEqual(parseRange('bytes=0-1', 100), { kind: 'ok', start: 0, end: 1 });       // Safari probe
  assert.deepEqual(parseRange('bytes=0-', 100), { kind: 'ok', start: 0, end: 99 });       // Chrome
  assert.deepEqual(parseRange('bytes=90-200', 100), { kind: 'ok', start: 90, end: 99 });  // end clamped
  assert.deepEqual(parseRange('bytes=-10', 100), { kind: 'ok', start: 90, end: 99 });     // suffix
});

test('parseRange: unsatisfiable and unsupported ranges', () => {
  assert.deepEqual(parseRange('bytes=100-', 100), { kind: 'unsatisfiable' });
  assert.deepEqual(parseRange('bytes=5-2', 100), { kind: 'unsatisfiable' });
  assert.deepEqual(parseRange('bytes=-0', 100), { kind: 'unsatisfiable' });
  assert.deepEqual(parseRange('bytes=0-1,5-6', 100), { kind: 'none' }); // multiple ranges: whole file
  assert.deepEqual(parseRange('items=0-1', 100), { kind: 'none' });
});

test('the committed overrides file is valid', () => {
  const map = parseOverrides(JSON.parse(readFileSync(new URL('../../data/overrides.json', import.meta.url), 'utf8')));
  assert.deepEqual([...map.keys()].sort(), ['rietje', 'schep']);
  assert.equal(map.get('schep')?.[0]?.kind, 'youtube');
});

test('parseOverrides rejects mistakes with a clear message', () => {
  const base = { sourceName: 'x', sourcePageUrl: 'https://example.org', licence: 'x', licenceUrl: 'https://example.org' };
  assert.throws(() => parseOverrides({}), /"words"/u);
  assert.throws(() => parseOverrides({ words: { huis: [] } }), /at least one/u);
  assert.throws(() => parseOverrides({ words: { huis: [{ ...base, kind: 'youtube', videoId: 'nope' }] } }), /YouTube id/u);
  assert.throws(() => parseOverrides({ words: { huis: [{ ...base, kind: 'mp4', url: 'https://evil.example/x.mp4' }] } }), /public\/media/u);
  assert.throws(() => parseOverrides({ words: { huis: [{ ...base, kind: 'gif' }] } }), /kind/u);
  assert.throws(() => parseOverrides({ words: { huis: [{ ...base, kind: 'youtube', videoId: '-mZJCBQkhiY', sourcePageUrl: 'javascript:alert(1)' }] } }), /https/u);
  const ok = parseOverrides({ words: { 'Huis!': [{ ...base, kind: 'mp4', url: '/media/huis.mp4' }] } });
  assert.equal(ok.get('huis')?.[0]?.videoUrl, '/media/huis.mp4');
});
