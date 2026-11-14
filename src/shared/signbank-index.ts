/** Shape of data/signbank/index.json (built by scripts/update-index.ts). */

/** [gloss name, Dutch meanings grouped per sense, video path, image path ('' if none)] */
export type GlossTuple = [name: string, senses: string[][], video: string, image: string];

export interface SignbankIndex {
  v: 1;
  generatedAt: string;
  packageLastModified: string | null;
  glosses: Record<string, GlossTuple>;
  /** lookup key → gloss ids, best first */
  words: Record<string, number[]>;
  /** lookup key → display form, only where it differs from the key (e.g. "cafe" → "café") */
  display: Record<string, string>;
  /** compact key → lookup key, e.g. "dankje" → "dank je" */
  aliases: Record<string, string>;
}

export const SIGNBANK = {
  name: 'NGT Signbank',
  credit: 'Radboud Universiteit en Universiteit van Amsterdam',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/deed.nl',
  glossPage: (id: number | string): string => `https://signbank.cls.ru.nl/dictionary/gloss/${id}`,
  mediaBase: 'https://signbank.cls.ru.nl/dictionary/protected_media/',
} as const;
