import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { buildIndex, glossBaseKey, mediaPath, splitSenses } from '../../scripts/lib/signbank.ts';
import { readZip } from '../../scripts/lib/zip.ts';
import { glosses, images } from './fixtures.ts';

test('mediaPath keeps only safe Signbank media paths', () => {
  assert.equal(mediaPath('https://signbank.cls.ru.nl//dictionary/protected_media/glossvideo/NGT/HU/HUIS-A-1954.mp4'), 'glossvideo/NGT/HU/HUIS-A-1954.mp4');
  assert.equal(mediaPath('/dictionary/protected_media/glossimage/NGT/HU/HUIS-A-1954.png'), 'glossimage/NGT/HU/HUIS-A-1954.png');
  assert.equal(mediaPath("/dictionary/protected_media/glossvideo/NGT/AB/ABBE-DE-L'EPEE-2_small.mp4"), "glossvideo/NGT/AB/ABBE-DE-L'EPEE-2_small.mp4");
  assert.equal(mediaPath('/dictionary/protected_media/glossvideo/NGT/../../x.mp4'), null);
  assert.equal(mediaPath('https://evil.example/x.mp4'), null);
  assert.equal(mediaPath(undefined), null);
});

test('splitSenses drops notes in brackets and very long entries', () => {
  assert.deepEqual(splitSenses('koffie, visite (op bezoek), koffie malen'), ['koffie', 'visite', 'koffie malen']);
  assert.deepEqual(splitSenses('eten, (met alle kleine object vasthouden bij zwakke hand)'), ['eten']);
  assert.deepEqual(splitSenses('een, twee drie vier vijf zes zeven'), ['een']); // more than 5 words
});

test('glossBaseKey strips the variant letter', () => {
  assert.equal(glossBaseKey('HUIS-A'), 'huis');
  assert.equal(glossBaseKey('HAND-SCHUDDEN-B'), 'hand schudden');
  assert.equal(glossBaseKey('AUTO'), 'auto');
});

test('buildIndex: variants, order, display, aliases and skipped entries', () => {
  const index = buildIndex(glosses, {}, images, null, new Date('2026-01-01T00:00:00Z'));
  assert.deepEqual(index.words['huis'], [1954, 1300], 'HUIS-A before HUIS-B');
  assert.deepEqual(index.words['school'], [1861, 2407], 'the sign named SCHOOL comes before LEREN');
  assert.deepEqual(index.words['cafe'], [2519]);
  assert.equal(index.display['cafe'], 'café');
  assert.equal(index.aliases['dankje'], 'dank je');
  assert.equal(index.glosses['1954']?.[3], 'glossimage/NGT/HU/HUIS-A-1954.png');
  assert.equal(index.glosses['1300']?.[3], '');
  assert.deepEqual(index.glosses['5004']?.[1], [['koffie', 'visite'], ['koffie malen']]);
  for (const missing of ['9001', '9002', '9003']) assert.equal(index.glosses[missing], undefined);
  assert.equal(index.words['hallo'], undefined);
  assert.equal(index.generatedAt, '2026-01-01T00:00:00.000Z');
});

/** Builds a tiny ZIP in memory: one stored and one deflated entry. */
function makeZip(entries: Array<{ name: string; data: Buffer; deflate: boolean }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const body = e.deflate ? deflateRawSync(e.data) : e.data;
    const name = Buffer.from(e.name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(e.deflate ? 8 : 0, 8);
    local.writeUInt32LE(body.length, 18); local.writeUInt32LE(e.data.length, 22); local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(e.deflate ? 8 : 0, 10);
    central.writeUInt32LE(body.length, 20); central.writeUInt32LE(e.data.length, 24); central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, body);
    centrals.push(central, name);
    offset += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

test('readZip reads stored and deflated entries', () => {
  const json = Buffer.from(JSON.stringify({ hello: 'wereld' }));
  const zip = makeZip([{ name: 'a.json', data: json, deflate: false }, { name: 'b.json', data: json, deflate: true }]);
  const files = readZip(zip);
  assert.equal(files.get('a.json')?.toString(), json.toString());
  assert.equal(files.get('b.json')?.toString(), json.toString());
});

test('readZip rejects something that is not a ZIP', () => {
  assert.throws(() => readZip(Buffer.from('<html>error</html>'.padEnd(100, ' '))), /Not a ZIP/u);
});
