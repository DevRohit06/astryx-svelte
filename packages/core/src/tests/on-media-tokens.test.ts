/** PORTS: theme/onMediaTokens.test.ts */

import { beforeAll, describe, expect, it } from 'vitest';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateOnMediaCSS } from '$lib/theme/generate-theme-rules.js';
import {
	defaultOnDarkTokens,
	defaultOnLightTokens,
	resolveOnMedia
} from '$lib/theme/on-media-tokens.js';

/**
 * Astryx's `theme/onMediaTokens.test.ts`, ported case for case — **22 upstream
 * cases at the 0.5.0 pin, 22 here**, in upstream's order and under upstream's titles.
 * Nothing dropped, nothing added.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: the resolver is
 * pure, and the CSS assertions are on generated text rather than on a rendered
 * document.
 *
 * ## Two translations, neither a case
 *
 * `generateOnMediaCSS` lives in `generate-theme-rules.ts` rather than beside
 * `defineTheme`, and is re-exported from both `./theme` and `./theme/define` as
 * upstream re-exports it from both of its own. It spelled the name
 * `generateOnMediaCss` here until batch 034 closed that drift.
 *
 * Upstream's last three cases read `../reset.css`; this port folds the reset
 * into the always-loaded `base.css`, because the components genuinely require
 * it, so they read `src/lib/styles/base.css` instead. The assertions are
 * unchanged, including the third one's point: the baseline flips `color-scheme`
 * and must **not** carry token overrides, since a theme that could not override
 * them would be the bug. The subpath split is its own open item in
 * `port/todo.md`; this suite tracks whichever file carries the rules.
 *
 * All 22 were already ported — inside `theme.test.ts`, which names six upstream
 * suites at once, so no count in it could be checked against any of them. The
 * move is what makes the contract verifiable, not the coverage.
 */

describe('onMediaTokens', () => {
	describe('defaultOnDarkTokens', () => {
		it('sets color-scheme to dark', () => {
			expect(defaultOnDarkTokens['color-scheme']).toBe('dark');
		});

		it('provides text primary as on-dark color', () => {
			expect(defaultOnDarkTokens['--color-text-primary']).toBe('var(--color-on-dark)');
		});

		it('provides icon primary as on-dark color', () => {
			expect(defaultOnDarkTokens['--color-icon-primary']).toBe('var(--color-on-dark)');
		});

		it('collapses accent to on-dark color', () => {
			expect(defaultOnDarkTokens['--color-accent']).toBe('var(--color-on-dark)');
		});
	});

	describe('defaultOnLightTokens', () => {
		it('sets color-scheme to light', () => {
			expect(defaultOnLightTokens['color-scheme']).toBe('light');
		});

		it('provides text primary as on-light color', () => {
			expect(defaultOnLightTokens['--color-text-primary']).toBe('var(--color-on-light)');
		});
	});

	describe('resolveOnMedia', () => {
		it('returns defaults when no user overrides', () => {
			const result = resolveOnMedia('dark');
			expect(result.tokens).toEqual(defaultOnDarkTokens);
			expect(result.components).toBeUndefined();
		});

		it('merges user token overrides with defaults', () => {
			const result = resolveOnMedia('dark', { tokens: { '--color-accent': '#90CAF9' } });
			expect(result.tokens['--color-accent']).toBe('#90CAF9');
			expect(result.tokens['--color-text-primary']).toBe('var(--color-on-dark)');
		});

		it('resolves [light, dark] tuple tokens', () => {
			const result = resolveOnMedia('dark', { tokens: { '--color-accent': ['#AAA', '#BBB'] } });
			expect(result.tokens['--color-accent']).toBe('light-dark(#AAA, #BBB)');
		});

		it('passes through component overrides', () => {
			const components = { button: { 'variant:ghost': { borderWidth: '1px' } } };
			const result = resolveOnMedia('dark', { components });
			expect(result.components).toBe(components);
		});

		it('returns light defaults for surface=light', () => {
			const result = resolveOnMedia('light');
			expect(result.tokens).toEqual(defaultOnLightTokens);
		});
	});
});

describe('defineTheme with onDark/onLight', () => {
	it('stores resolved onDark on the theme', () => {
		const theme = defineTheme({
			name: 'test',
			onDark: { tokens: { '--color-accent': '#90CAF9' } }
		});
		expect(theme.__onDark.tokens['--color-accent']).toBe('#90CAF9');
		expect(theme.__onDark.tokens['--color-text-primary']).toBe('var(--color-on-dark)');
	});

	it('stores resolved onLight on the theme', () => {
		const theme = defineTheme({
			name: 'test',
			onLight: { tokens: { '--color-accent': '#333' } }
		});
		expect(theme.__onLight.tokens['--color-accent']).toBe('#333');
	});

	it('generates defaults even without explicit onDark/onLight', () => {
		const theme = defineTheme({ name: 'test' });
		expect(theme.__onDark.tokens['color-scheme']).toBe('dark');
		expect(theme.__onLight.tokens['color-scheme']).toBe('light');
	});

	it('stores component overrides on onDark', () => {
		const theme = defineTheme({
			name: 'test',
			onDark: { components: { button: { 'variant:ghost': { borderWidth: '1px' } } } }
		});
		expect(theme.__onDark.components?.button['variant:ghost']).toEqual({ borderWidth: '1px' });
	});
});

describe('generateOnMediaCSS', () => {
	it('emits @scope with [data-astryx-media] token rules', () => {
		const css = generateOnMediaCSS(defineTheme({ name: 'test' }));
		expect(css).toContain('@scope ([data-astryx-theme="test"])');
		// Same scope boundary as the main theme block.
		expect(css).toContain('to ([data-astryx-theme])');
		expect(css).toContain('[data-astryx-media="dark"]');
		expect(css).toContain('color-scheme: dark');
		expect(css).toContain('var(--color-on-dark)');
	});

	it('emits light media rules', () => {
		const css = generateOnMediaCSS(defineTheme({ name: 'test' }));
		expect(css).toContain('[data-astryx-media="light"]');
		expect(css).toContain('color-scheme: light');
	});

	it('emits component override rules', () => {
		const css = generateOnMediaCSS(
			defineTheme({
				name: 'test',
				onDark: {
					components: {
						button: {
							'variant:secondary': {
								backgroundColor: 'color-mix(in srgb, white 20%, transparent)'
							}
						}
					}
				}
			})
		);
		expect(css).toContain(':is([data-astryx-media="dark"]) :is(.astryx-button.secondary)');
		expect(css).toContain('background-color: color-mix(in srgb, white 20%, transparent)');
	});

	it('emits pseudo-class rules for on-media components', () => {
		const css = generateOnMediaCSS(
			defineTheme({
				name: 'test',
				onDark: {
					components: {
						button: {
							base: { color: 'white', ':hover': { color: 'rgba(255,255,255,0.8)' } }
						}
					}
				}
			})
		);
		expect(css).toContain(':is([data-astryx-media="dark"]) :is(.astryx-button):hover');
		expect(css).toContain('color: rgba(255,255,255,0.8)');
	});
});

/**
 * The baseline `<MediaTheme>` needs with no theme present: a `color-scheme`
 * flip on `[data-astryx-media]`. Token overrides are theme-level and come from
 * `generateOnMediaCSS` — asserted here to *not* be in the baseline, since a
 * theme that could not override them would be the bug.
 */
describe('base.css baseline media rules', () => {
	let baseCss: string;

	beforeAll(async () => {
		const { readFile } = await import('node:fs/promises');
		const { fileURLToPath } = await import('node:url');
		// Relative to this file in `src/tests/`, so the stylesheet is reached as
		// `src/lib/styles/base.css`. It is read off disk rather than imported
		// because the assertions are about the *authored* CSS text.
		baseCss = await readFile(
			fileURLToPath(new URL('../lib/styles/base.css', import.meta.url)),
			'utf8'
		);
	});

	const mediaBlock = (surface: string) =>
		baseCss.match(
			new RegExp(`:where\\(\\[data-astryx-media=['"]${surface}['"]\\]\\)\\s*\\{([^}]+)\\}`)
		);

	it('flips color-scheme on [data-astryx-media="dark"]', () => {
		const match = mediaBlock('dark');
		expect(match).not.toBeNull();
		expect(match![1]).toContain('color-scheme: dark');
	});

	it('flips color-scheme on [data-astryx-media="light"]', () => {
		const match = mediaBlock('light');
		expect(match).not.toBeNull();
		expect(match![1]).toContain('color-scheme: light');
	});

	it('does NOT include token overrides at baseline level', () => {
		const block = mediaBlock('dark')![1];
		expect(block).not.toContain('--color-text-primary');
		expect(block).not.toContain('--color-icon-primary');
		expect(block).not.toContain('--color-accent');
	});
});
