import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closest, maxTypos, typoDistance } from '../../src/shared/fuzzy.ts';

test('typoDistance: edits and swapped letters', () => {
  assert.equal(typoDistance('huis', 'huis', 2), 0);
  assert.equal(typoDistance('koffi', 'koffie', 2), 1);   // missing letter
  assert.equal(typoDistance('fietz', 'fiets', 2), 1);    // wrong letter
  assert.equal(typoDistance('hius', 'huis', 2), 1);      // swapped letters count as one typo
  assert.equal(typoDistance('huisdier', 'huisdeur', 2), 2);
});

test('typoDistance stops early above the budget', () => {
  assert.equal(typoDistance('school', 'koffie', 2), 3);
  assert.equal(typoDistance('a', 'abcdef', 1), 2);
});

test('maxTypos grows with word length', () => {
  assert.equal(maxTypos(3), 0);
  assert.equal(maxTypos(5), 1);
  assert.equal(maxTypos(8), 2);
});

test('closest: best first, nothing for very short words', () => {
  const keys = ['koffie', 'koffer', 'kofta', 'huis', 'fiets', 'feit'];
  assert.deepEqual(closest('koffi', keys).slice(0, 1), ['koffie']);
  assert.deepEqual(closest('fietz', keys), ['fiets']);
  assert.deepEqual(closest('hus', keys), []); // 3 letters: no typo tolerance, too many false hits
});
