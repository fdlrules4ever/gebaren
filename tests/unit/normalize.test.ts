import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanQuery, compactKey, queryProblem, toKey, MAX_QUERY_LENGTH } from '../../src/shared/normalize.ts';
import { checkQuery } from '../../src/worker/validate.ts';

test('toKey: case and diacritics', () => {
  assert.equal(toKey('Café'), 'cafe');
  assert.equal(toKey('CAFÉ'), 'cafe');
  assert.equal(toKey('café'.normalize('NFD')), 'cafe'); // decomposed input
  assert.equal(toKey('Ëénmaal'), 'eenmaal');
  assert.equal(toKey('reünie'), 'reunie');
});

test('toKey: spaces, hyphens, dots and apostrophes', () => {
  assert.equal(toKey('  dank   je  '), 'dank je');
  assert.equal(toKey('dank-je'), 'dank je');
  assert.equal(toKey('e-mail'), 'e mail');
  assert.equal(toKey("zo’n"), "zo'n");
  assert.equal(toKey("auto's"), "auto's");
  assert.equal(toKey("'s avonds"), 's avonds');
  assert.equal(toKey('a.s.'), 'a s');
  assert.equal(toKey('huis!'), 'huis');
});

test('compactKey removes spaces only', () => {
  assert.equal(compactKey('dank je'), 'dankje');
  assert.equal(compactKey("zo'n"), "zo'n");
});

test('cleanQuery keeps what the user wrote, tidied', () => {
  assert.equal(cleanQuery('  Dank\tje \n'), 'Dank je');
  assert.equal(cleanQuery('café'), 'café'); // NFC
});

test('queryProblem', () => {
  assert.equal(queryProblem(''), 'empty');
  assert.equal(queryProblem('a'.repeat(MAX_QUERY_LENGTH + 1)), 'too_long');
  assert.equal(queryProblem('<script>'), 'bad_characters');
  assert.equal(queryProblem('huis/../../etc'), 'bad_characters');
  assert.equal(queryProblem('---'), 'bad_characters');
  assert.equal(queryProblem('dank je'), null);
  assert.equal(queryProblem("zo'n"), null);
  assert.equal(queryProblem('Ελληνικά'), null); // any script is a valid query, it just will not be found
});

test('checkQuery gives plain-language messages', () => {
  assert.deepEqual(checkQuery(' Huis '), { ok: true, query: 'Huis', key: 'huis' });
  const empty = checkQuery(null);
  assert.equal(empty.ok, false);
  assert.match(!empty.ok ? empty.message : '', /Typ eerst een woord/u);
  const bad = checkQuery('huis?');
  assert.equal(bad.ok, false);
});
