import { beforeEach, describe, expect, it } from 'vitest';
import { defineTheme } from '$lib/theme/define-theme.js';
import {
	getRegisteredTheme,
	getRegisteredThemes,
	registerTheme,
	resetThemes
} from '$lib/theme/theme-registry.js';

/**
 * Ported from Astryx's `theme/themeRegistry.test.ts` — all 5 of its `it` cases at
 * the 0.5.0 pin.
 *
 * A **server** project file (`*.test.ts`), as upstream's is a plain `.test.ts`:
 * the registry is a pure module map with no DOM and no component in it, which
 * is the property the module exists for.
 *
 * No translation beyond the import paths — the module is upstream's line for
 * line, and every assertion is on plain object identity.
 */
describe('themeRegistry', () => {
	beforeEach(() => {
		resetThemes();
	});

	it('registers and resolves themes by name', () => {
		const theme = defineTheme({
			name: 'brand',
			tokens: { '--color-accent': '#123456' }
		});

		expect(getRegisteredTheme('brand')).toBe(theme);
	});

	it('returns null for empty or unknown names', () => {
		expect(getRegisteredTheme(null)).toBeNull();
		expect(getRegisteredTheme('')).toBeNull();
		expect(getRegisteredTheme('missing')).toBeNull();
	});

	it('replaces an existing theme with the same name', () => {
		const first = defineTheme({ name: 'brand' });
		const second = defineTheme({
			name: 'brand',
			tokens: { '--color-accent': '#654321' }
		});

		expect(getRegisteredTheme('brand')).not.toBe(first);
		expect(getRegisteredTheme('brand')).toBe(second);
	});

	it('returns a defensive snapshot of registered themes', () => {
		const theme = defineTheme({ name: 'brand' });
		const snapshot = getRegisteredThemes();

		expect(snapshot.get('brand')).toBe(theme);
		expect(snapshot).not.toBe(getRegisteredThemes());
	});

	it('allows explicit registration of built theme objects', () => {
		const theme = defineTheme({ name: 'built' });
		resetThemes();

		registerTheme(theme);

		expect(getRegisteredTheme('built')).toBe(theme);
	});
});
