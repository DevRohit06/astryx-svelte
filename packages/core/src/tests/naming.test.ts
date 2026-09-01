/** PORTS: naming.test.ts */

import { describe, expect, it } from 'vitest';
import {
	NAMESPACE,
	classPrefix,
	cssVar,
	cssVarNamespace,
	dataAttr,
	dataAttrNamespace,
	stableClassName
} from '$lib/internal/naming.js';

/**
 * Astryx's `src/naming.test.ts`, ported case for case — **5 upstream `it`
 * declarations at the 0.5.0 pin, 5 here**, in upstream's order and under upstream's
 * titles. Nothing dropped, nothing added, and every assertion is upstream's
 * verbatim.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: it imports one
 * module of pure string functions and renders nothing.
 *
 * The one translation is the import path. Upstream imports `./naming`; this
 * port's copy lives at `$lib/internal/naming.ts` and is published under the same
 * `./naming` subpath, so the surface under test is identical — `NAMESPACE`,
 * `classPrefix`, `dataAttrNamespace`, `cssVarNamespace`, `stableClassName`,
 * `dataAttr`, `cssVar`.
 *
 * These five cases pin an **externally observable contract**, not an
 * implementation detail: `.astryx-button` is what every theme package selects
 * on, `data-astryx-theme` is what the theme provider writes, and `--astryx-*` is
 * the custom-property namespace themes read. A rename that slipped through here
 * would break consumers silently rather than loudly.
 */

describe('naming constants', () => {
	it('exposes the namespace prefix', () => {
		expect(NAMESPACE).toBe('astryx');
	});

	it('derives per-surface prefixes from the namespace', () => {
		expect(classPrefix).toBe('astryx');
		expect(dataAttrNamespace).toBe('astryx');
		expect(cssVarNamespace).toBe('astryx');
	});
});

describe('stableClassName', () => {
	it('builds namespace class tokens', () => {
		expect(stableClassName('button')).toBe('astryx-button');
		expect(stableClassName('card')).toBe('astryx-card');
	});
});

describe('dataAttr', () => {
	it('builds namespace data attribute names', () => {
		expect(dataAttr('theme')).toBe('data-astryx-theme');
		expect(dataAttr('media')).toBe('data-astryx-media');
	});
});

describe('cssVar', () => {
	it('builds namespace custom property names', () => {
		expect(cssVar('card-padding')).toBe('--astryx-card-padding');
	});
});
