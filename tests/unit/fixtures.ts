/** Small Signbank-shaped fixture, taken from the real package (CC BY 4.0) and trimmed. */
import type { RawGloss } from '../../scripts/lib/signbank.ts';

const v = (p: string): string => `https://signbank.cls.ru.nl//dictionary/protected_media/glossvideo/NGT/${p}`;

export const glosses: Record<string, RawGloss> = {
  '1954': { 'Annotation ID Gloss: Dutch': 'HUIS-A', 'Senses: Dutch': { '1': 'huis, huisje, hok, schuur' }, Video: v('HU/HUIS-A-1954.mp4') },
  '1300': { 'Annotation ID Gloss: Dutch': 'HUIS-B', 'Senses: Dutch': { '1': 'huis, dak' }, Video: v('HU/HUIS-B-1300.mp4') },
  '2519': { 'Annotation ID Gloss: Dutch': 'CAFE-B', 'Senses: Dutch': { '1': 'café, kroeg, pub' }, Video: v('CA/CAFE-B-2519.mp4') },
  '1040': { 'Annotation ID Gloss: Dutch': 'BEDANKEN-A', 'Senses: Dutch': { '1': 'dankjewel, bedankt, dank je, dankbaar, bedanken' }, Video: v('BE/BEDANKEN-A-1040.mp4') },
  '2407': { 'Annotation ID Gloss: Dutch': 'LEREN-A', 'Senses: Dutch': { '1': 'leren, aanleren, school, studeren' }, Video: v('LE/LEREN-A-2407.mp4') },
  '1861': { 'Annotation ID Gloss: Dutch': 'SCHOOL-A', 'Senses: Dutch': { '1': 'school, onderwijs' }, Video: v('SC/SCHOOL-A-1861.mp4') },
  '5001': { 'Annotation ID Gloss: Dutch': 'DIER', 'Senses: Dutch': { '1': 'dier, beest' }, Video: v('DI/DIER-5001.mp4') },
  '5002': { 'Annotation ID Gloss: Dutch': 'KIND', 'Senses: Dutch': { '1': 'kind' }, Video: v('KI/KIND-5002.mp4') },
  '5003': { 'Annotation ID Gloss: Dutch': 'OPVANG', 'Senses: Dutch': { '1': 'opvang' }, Video: v('OP/OPVANG-5003.mp4') },
  '5004': { 'Annotation ID Gloss: Dutch': 'KOFFIE-A', 'Senses: Dutch': { '1': 'koffie, visite (op bezoek)', '2': 'koffie malen' }, Video: v('KO/KOFFIE-A-5004.mp4') },
  '5005': { 'Annotation ID Gloss: Dutch': 'AUTO', 'Senses: Dutch': { '1': 'auto, wagen' }, Video: v('AU/AUTO-5005.mp4') },
  // No video: must be left out.
  '9001': { 'Annotation ID Gloss: Dutch': 'HALLO-A', 'Senses: Dutch': { '1': 'hallo' } },
  // Suspicious path: must be left out.
  '9002': { 'Annotation ID Gloss: Dutch': 'EVIL', 'Senses: Dutch': { '1': 'evil' }, Video: v('../../etc/passwd.mp4') },
  // No Dutch meaning: must be left out.
  '9003': { 'Annotation ID Gloss: Dutch': 'LEEG', Video: v('LE/LEEG-9003.mp4') },
};

export const images: Record<string, string> = {
  'HUIS-A-1954': '/dictionary/protected_media/glossimage/NGT/HU/HUIS-A-1954.png',
};
