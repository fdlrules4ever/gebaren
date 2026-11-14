/** Loads the bundled data once per isolate. A broken overrides file stops the Worker from starting (and the deploy). */
import indexJson from '../../data/signbank/index.json';
import overridesJson from '../../data/overrides.json';
import type { SignbankIndex } from '../shared/signbank-index.ts';
import { parseOverrides } from '../shared/overrides.ts';
import { createCatalogue } from './lookup.ts';

export const index = indexJson as SignbankIndex;
export const catalogue = createCatalogue(index, parseOverrides(overridesJson));
