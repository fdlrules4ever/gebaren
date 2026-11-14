/** Shapes shared between the Worker API and the app. */

export type VideoKind = 'mp4' | 'youtube';

export interface SignResult {
  /** The word as shown to the user. */
  word: string;
  /** For mp4: a playable URL (our /video/... proxy or an allowed source host). For youtube: an embed URL. */
  videoUrl: string;
  kind: VideoKind;
  sourceName: string;
  sourcePageUrl: string;
  licence: string;
  licenceUrl: string;
  /** Dutch meanings of this sign, grouped per meaning. */
  senses: string[][];
  /** Still image (poster), when the source has one. */
  posterUrl?: string;
  /** Source id, for example the Signbank gloss id. */
  sourceId?: string;
}

export interface SignResponse {
  query: string;
  normalized: string;
  results: SignResult[];
  /** "Did you mean …?": close words that do have a sign. */
  suggestions: string[];
  /** Parts of a compound word that do have a sign, e.g. huisdier → huis + dier. */
  parts: string[];
}

export type ApiErrorCode = 'invalid_query' | 'not_found' | 'rate_limited' | 'source_unavailable' | 'timeout' | 'internal';

export interface ApiError {
  error: ApiErrorCode;
  message: string;
}

/** A 404 from /api/sign is a normal "not found" answer and still carries suggestions. */
export type NotFoundResponse = SignResponse & ApiError & { error: 'not_found' };

/** The list of words for suggestions while typing (public/words.json). */
export interface WordList {
  v: 1;
  words: string[];
}
