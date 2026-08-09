import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snippet } from 'svelte';
import { defaultIcons } from '$lib/components/icon/default-icons.svelte';
import {
	getExtendedIcon,
	getIcon,
	getIconRegistry,
	registerIcons,
	resetIcons
} from '$lib/components/icon/icon-registry.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { resetThemes } from '$lib/theme/theme-registry.js';
import { __resetDevWarnings } from '$lib/utils/dev-warning.js';

/**
 * Astryx's `Icon/globalIconRegistry.test.tsx`, all 18 of its cases.
 *
 * The registry is a pure module with no DOM in it, so this is a **server**
 * project file (`*.test.ts`), which is also the environment that proves the
 * module's own claim: it resolves icons with no component, no context and no
 * browser, which is what makes it readable during SSR.
 *
 * **Registry values are snippets here, where upstream's are `ReactNode` and its
 * test uses bare strings as sentinels.** `sentinel()` is the equivalent: an
 * opaque function compared by identity. Upstream's one `null` registration
 * becomes `undefined`, which is the same "registered, but empty" input for the
 * `??` chain the case is about — `Snippet` has no null member, and `Partial`
 * already admits `undefined`.
 *
 * `resolves icons from a registered theme name for SSR-friendly lookups` was
 * dropped while this port had no `theme/theme-registry.ts`; it landed in batch
 * 18 and the case is restored, so the count is now upstream's exactly.
 */

/** An opaque registry value, compared by identity — upstream's string sentinel. */
function sentinel(id: string): Snippet {
	const fn = (): void => {};
	Object.defineProperty(fn, 'name', { value: id });
	return fn as unknown as Snippet;
}

describe('iconRegistry (global, SSR-compatible)', () => {
	beforeEach(() => {
		resetIcons();
		resetThemes();
		__resetDevWarnings();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns a default icon registry snapshot', () => {
		const registry = getIconRegistry();

		expect(Object.keys(registry)).toEqual(Object.keys(defaultIcons));
		expect(registry).toEqual(defaultIcons);
		expect(registry).not.toBe(defaultIcons);
	});

	it('returns default icons when nothing is registered', () => {
		const icon = getIcon('close');
		expect(icon).toBeDefined();
		expect(icon).not.toBeNull();
	});

	it('warns once that registerIcons applies global overrides', () => {
		const warnSpy = vi.mocked(console.warn);

		registerIcons({ close: sentinel('custom-close') });
		registerIcons({ check: sentinel('custom-check') });

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0]?.[0]).toContain(
			'`registerIcons()` applies icon overrides globally'
		);
	});

	it('returns registered icons over defaults', () => {
		const customClose = sentinel('custom-close-icon');
		registerIcons({ close: customClose });

		expect(getIcon('close')).toBe(customClose);
		expect(getIconRegistry().close).toBe(customClose);
		expect(getIconRegistry().check).toBe(defaultIcons.check);
	});

	it('falls back to defaults for unregistered names', () => {
		const customClose = sentinel('custom-close');
		registerIcons({ close: customClose });
		// 'check' was not registered, should fall back to default
		const checkIcon = getIcon('check');
		expect(checkIcon).toBeDefined();
		expect(checkIcon).not.toBe(customClose);
	});

	it('keeps registry snapshots aligned with getIcon fallback behavior', () => {
		registerIcons({ close: undefined });

		expect(getIcon('close')).toBe(defaultIcons.close);
		expect(getIconRegistry().close).toBe(defaultIcons.close);
	});

	it('merges multiple registerIcons calls', () => {
		const closeV1 = sentinel('close-v1');
		const checkV1 = sentinel('check-v1');
		registerIcons({ close: closeV1 });
		registerIcons({ check: checkV1 });
		expect(getIcon('close')).toBe(closeV1);
		expect(getIcon('check')).toBe(checkV1);
	});

	it('later registrations override earlier ones', () => {
		const closeV2 = sentinel('close-v2');
		registerIcons({ close: sentinel('close-v1') });
		registerIcons({ close: closeV2 });
		expect(getIcon('close')).toBe(closeV2);
	});

	it('resolves icons from an explicit theme object over global registrations', () => {
		const themeClose = sentinel('theme-close');
		registerIcons({ close: sentinel('global-close') });
		const theme = defineTheme({
			name: 'brand',
			icons: { close: themeClose }
		});

		expect(getIcon('close', theme)).toBe(themeClose);
		expect(getIconRegistry(theme).close).toBe(themeClose);
	});

	it('resolves icons from a registered theme name for SSR-friendly lookups', () => {
		const themeClose = sentinel('theme-close');
		defineTheme({
			name: 'brand',
			icons: { close: themeClose }
		});

		expect(getIcon('close', 'brand')).toBe(themeClose);
		expect(getIconRegistry('brand').close).toBe(themeClose);
	});

	it('falls back through global registrations when a theme omits a name', () => {
		const globalClose = sentinel('global-close');
		const themeCheck = sentinel('theme-check');
		registerIcons({ close: globalClose });
		const theme = defineTheme({ name: 'brand', icons: { check: themeCheck } });

		expect(getIcon('close', theme)).toBe(globalClose);
		expect(getIcon('check', theme)).toBe(themeCheck);
	});

	it('resetIcons clears the global registry', () => {
		const custom = sentinel('custom');
		registerIcons({ close: custom });
		expect(getIcon('close')).toBe(custom);
		resetIcons();
		// Should fall back to default
		expect(getIcon('close')).not.toBe(custom);
	});

	describe('extension keys', () => {
		it('registers and resolves library-contributed keys', () => {
			const myBold = sentinel('my-bold');
			registerIcons({ 'richtext:bold': myBold });
			expect(getIcon('richtext:bold')).toBe(myBold);
			expect(getExtendedIcon('richtext:bold')).toBe(myBold);
		});

		it('getExtendedIcon returns the caller fallback when unregistered', () => {
			const inlineSvg = sentinel('inline-svg');
			expect(getExtendedIcon('richtext:bold', inlineSvg)).toBe(inlineSvg);
		});

		it('getExtendedIcon prefers a registered icon over the fallback', () => {
			const themeBold = sentinel('theme-bold');
			registerIcons({ 'richtext:bold': themeBold });
			expect(getExtendedIcon('richtext:bold', sentinel('inline-svg'))).toBe(themeBold);
		});

		it('getExtendedIcon still resolves built-in defaults', () => {
			expect(getExtendedIcon('close', sentinel('fallback'))).toBe(defaultIcons.close);
		});

		it('extension keys do not leak into the built-in registry snapshot', () => {
			registerIcons({ 'richtext:bold': sentinel('my-bold') });
			// getIconRegistry() is the built-in IconName snapshot; extension keys
			// are resolved via getIcon/getExtendedIcon, not surfaced here.
			expect(Object.keys(getIconRegistry())).toEqual(Object.keys(defaultIcons));
		});

		it('extension keys are cleared by resetIcons', () => {
			const fallback = sentinel('fallback');
			registerIcons({ 'richtext:bold': sentinel('my-bold') });
			resetIcons();
			expect(getExtendedIcon('richtext:bold', fallback)).toBe(fallback);
		});
	});
});
