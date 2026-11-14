/** Validation and plain-language (B1) error messages for the API. */
import { cleanQuery, queryProblem, toKey, MAX_QUERY_LENGTH } from '../shared/normalize.ts';

export type QueryCheck = { ok: true; query: string; key: string } | { ok: false; message: string };

export function checkQuery(raw: string | null): QueryCheck {
  const query = cleanQuery(raw ?? '');
  switch (queryProblem(query)) {
    case 'empty': return { ok: false, message: 'Typ eerst een woord.' };
    case 'too_long': return { ok: false, message: `Dit is te lang. Typ een woord van hoogstens ${MAX_QUERY_LENGTH} tekens.` };
    case 'bad_characters': return { ok: false, message: 'Gebruik alleen letters, cijfers, spaties, streepjes en apostroffen.' };
    default: return { ok: true, query, key: toKey(query) };
  }
}
