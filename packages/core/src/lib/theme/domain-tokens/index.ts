/**
 * Ported from Astryx's `theme/domainTokens/index.ts`.
 *
 * Merges every domain token default into one map. The definitions live in their
 * own modules — `../syntax/tokens.ts` and `./data-tokens.ts` — and this is only
 * the merged view of them.
 *
 * Upstream additionally folds `domainTokenDefaults` into the flat
 * `tokenDefaults` map that `resolveThemeTokens` and `tokenVars` are built from;
 * this port does not, so `useTheme().token('--color-data-…')` still comes back
 * empty here. That is the long-standing gap `port/ledger/009-batch-8.md` records
 * against the whole domain group, syntax included, and it is unrelated to the
 * CSS these tokens emit — the defaults reach a document from
 * `generateDataTokenDefaultsCSS`, never from `tokenDefaults`.
 */

export { syntaxTokenDefaults } from '../syntax/tokens.js';
export type { SyntaxTokenName } from '../syntax/tokens.js';

export { dataTokenDefaults } from './data-tokens.js';
export type { DataTokenName } from './data-tokens.js';

import { syntaxTokenDefaults } from '../syntax/tokens.js';
import { dataTokenDefaults } from './data-tokens.js';
import type { SyntaxTokenName } from '../syntax/tokens.js';
import type { DataTokenName } from './data-tokens.js';

/** All domain token defaults merged — upstream's `domainTokenDefaults`. */
export const domainTokenDefaults: Record<string, string> = {
	...syntaxTokenDefaults,
	...dataTokenDefaults
};

/** Union of all domain token names. */
export type DomainTokenName = SyntaxTokenName | DataTokenName;
