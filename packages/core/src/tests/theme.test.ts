import { beforeAll, describe, expect, it } from 'vitest';
import { expandMotionScale } from '$lib/theme/expand-motion-scale.js';
import { expandTypeScale } from '$lib/theme/expand-type-scale.js';
import { parseStyleKey } from '$lib/theme/parse-style-key.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateOnMediaCss, generateThemeCss } from '$lib/theme/generate-theme-rules.js';
import {
	defaultOnDarkTokens,
	defaultOnLightTokens,
	resolveOnMedia
} from '$lib/theme/on-media-tokens.js';
import {
	defineSyntaxTheme,
	type SyntaxThemeTokenInput
} from '$lib/theme/syntax/define-syntax-theme.js';

/** All 14 tokens, so `defineSyntaxTheme` does not warn about a partial theme. */
const SYNTAX_TOKENS: SyntaxThemeTokenInput = {
	keyword: '#aaa',
	string: '#aaa',
	comment: '#aaa',
	number: '#aaa',
	function: '#aaa',
	type: '#aaa',
	variable: '#aaa',
	operator: '#aaa',
	constant: '#aaa',
	tag: '#aaa',
	attribute: '#aaa',
	property: '#aaa',
	punctuation: '#aaa',
	background: '#aaa'
};

describe('parseStyleKey', () => {
	it('maps style keys to the class suffixes themeProps renders', () => {
		expect(parseStyleKey('base')).toBe('');
		expect(parseStyleKey('checked')).toBe('.checked');
		expect(parseStyleKey('checked+disabled')).toBe('.checked.disabled');
		expect(parseStyleKey('variant:secondary')).toBe('.secondary');
		expect(parseStyleKey('variant:destructive+size:sm')).toBe('.destructive.sm');
	});

	it('prefixes numeric values, since CSS classes cannot start with a digit', () => {
		expect(parseStyleKey('level:1')).toBe('.level-1');
	});
});

describe('expandMotionScale', () => {
	// Expected values are neutral's published theme.css, so this pins our
	// rounding against upstream's real output rather than our own reasoning.
	it("reproduces neutral's duration scale", () => {
		expect(expandMotionScale({ fast: 125, medium: 300, slow: 700, ratio: 0.75 })).toEqual({
			'--duration-fast-min': '95ms',
			'--duration-fast': '125ms',
			'--duration-fast-max': '165ms',
			'--duration-medium-min': '225ms',
			'--duration-medium': '300ms',
			'--duration-medium-max': '400ms',
			'--duration-slow-min': '525ms',
			'--duration-slow': '700ms',
			'--duration-slow-max': '935ms'
		});
	});

	it('omits the slow band when no slow base is given', () => {
		const tokens = expandMotionScale({ fast: 100, medium: 250, ratio: 0.75 });
		expect(tokens['--duration-slow']).toBeUndefined();
	});
});

describe('expandTypeScale', () => {
	it('reproduces the default geometric scale at base 14 / ratio 1.2', () => {
		const tokens = expandTypeScale({ scale: { base: 14, ratio: 1.2 } });
		expect(tokens['--font-size-base']).toBe('0.875rem'); // 14px
		expect(tokens['--font-size-sm']).toBe('0.75rem'); // 12px
		expect(tokens['--font-size-2xl']).toBe('1.5rem'); // 24px
		expect(tokens['--font-size-5xl']).toBe('2.625rem'); // 42px
	});

	it("joins family and fallbacks the way neutral's output does", () => {
		const tokens = expandTypeScale({
			body: { family: 'Figtree', fallbacks: '-apple-system, sans-serif' }
		});
		expect(tokens['--font-family-body']).toBe('Figtree, -apple-system, sans-serif');
	});

	it('emits heading weight overrides as token references', () => {
		const tokens = expandTypeScale({ heading: { weights: { 3: 'bold', 4: 'bold' } } });
		expect(tokens['--text-heading-3-weight']).toBe('var(--font-weight-bold)');
		expect(tokens['--text-heading-4-weight']).toBe('var(--font-weight-bold)');
	});
});

describe('defineTheme', () => {
	it('compiles [light, dark] pairs to light-dark()', () => {
		const theme = defineTheme({
			name: 't',
			tokens: { '--color-accent': ['#000', '#fff'] }
		});
		expect(theme.resolvedTokens['--color-accent']).toBe('light-dark(#000, #fff)');
	});

	it('lets explicit tokens win over generated scales', () => {
		const theme = defineTheme({
			name: 't',
			motion: { fast: 125, medium: 300, ratio: 0.75 },
			tokens: { '--duration-fast': '1ms' }
		});
		expect(theme.resolvedTokens['--duration-fast']).toBe('1ms');
	});

	// Upstream's `defineTheme` applies `syntax` at step 1e and lets the author's
	// explicit `tokens` overwrite it at step 1f. The syntax fold used to happen at
	// CSS-emit time instead, which put it *after* `config.tokens` and inverted
	// this — a `syntax:` preset silently beat an explicit override.
	it('folds syntax tokens into resolvedTokens', () => {
		const theme = defineTheme({
			name: 't',
			syntax: defineSyntaxTheme({ name: 's', tokens: SYNTAX_TOKENS })
		});
		expect(theme.resolvedTokens['--color-syntax-keyword']).toBe('#aaa');
	});

	it('lets explicit tokens win over the syntax theme', () => {
		const theme = defineTheme({
			name: 't',
			syntax: defineSyntaxTheme({ name: 's', tokens: SYNTAX_TOKENS }),
			tokens: { '--color-syntax-keyword': '#f00' }
		});
		expect(theme.resolvedTokens['--color-syntax-keyword']).toBe('#f00');
	});

	it('resolves a syntax [light, dark] tuple to light-dark()', () => {
		const theme = defineTheme({
			name: 't',
			syntax: defineSyntaxTheme({
				name: 's',
				tokens: { ...SYNTAX_TOKENS, keyword: ['#000', '#fff'] }
			})
		});
		expect(theme.resolvedTokens['--color-syntax-keyword']).toBe('light-dark(#000, #fff)');
	});
});

/**
 * Upstream has 9 cases in its own `defineTheme extends` block; **all 9 are
 * here**, plus one for indicators.
 *
 * That tenth is not coverage beyond upstream's — upstream merges `indicators`
 * in `defineTheme` exactly as it merges `icons`, and simply has no case for it
 * in this block. Porting the merge without it would leave a branch of the code
 * this commit adds with nothing exercising it.
 *
 * Upstream reads inherited tokens off `child.tokens`. This port's counterpart is
 * `child.resolvedTokens` — upstream has one token map where this has two, and
 * the resolved one is the equivalent (see `tokens.ts`). The two typography cases
 * are the ones that would pass against the wrong map and then be worthless: they
 * assert on *generated* tokens, which never appear in the raw map at all.
 */
describe('defineTheme extends', () => {
	/** Icons are snippets here where they are strings upstream; only identity matters. */
	const snippet = (id: string) => Object.assign(() => {}, { id }) as never;

	it('inherits tokens from base theme', () => {
		const base = defineTheme({
			name: 'base',
			tokens: { '--color-accent': '#0077B6', '--radius-container': '16px' }
		});
		const child = defineTheme({ name: 'child', extends: base });
		expect(child.resolvedTokens['--color-accent']).toBe('#0077B6');
		expect(child.resolvedTokens['--radius-container']).toBe('16px');
	});

	it('overrides base tokens with explicit tokens', () => {
		const base = defineTheme({
			name: 'base',
			tokens: { '--color-accent': '#0077B6', '--radius-container': '16px' }
		});
		const child = defineTheme({
			name: 'child',
			extends: base,
			tokens: { '--color-accent': '#FF0000' }
		});
		expect(child.resolvedTokens['--color-accent']).toBe('#FF0000');
		expect(child.resolvedTokens['--radius-container']).toBe('16px');
	});

	it('inherits component overrides from base theme', () => {
		const base = defineTheme({
			name: 'base',
			components: {
				button: {
					base: { fontWeight: '600' },
					'variant:secondary': { backgroundColor: 'rgba(0,0,0,0.06)' }
				}
			}
		});
		const child = defineTheme({ name: 'child', extends: base });
		expect(child.components?.button?.base).toEqual({ fontWeight: '600' });
		expect(child.components?.button?.['variant:secondary']).toEqual({
			backgroundColor: 'rgba(0,0,0,0.06)'
		});
	});

	it('merges component overrides — child wins', () => {
		const base = defineTheme({
			name: 'base',
			components: { button: { base: { fontWeight: '600', borderRadius: '4px' } } }
		});
		const child = defineTheme({
			name: 'child',
			extends: base,
			components: { button: { base: { fontWeight: '700' } } }
		});
		expect(child.components?.button?.base).toEqual({
			fontWeight: '700',
			borderRadius: '4px'
		});
	});

	it('merges icons — child overrides base', () => {
		const base = defineTheme({ name: 'base', icons: { close: snippet('X'), menu: snippet('M') } });
		const child = defineTheme({
			name: 'child',
			extends: base,
			icons: { close: snippet('Y') }
		});
		expect(child.icons?.close).toHaveProperty('id', 'Y');
		expect(child.icons?.menu).toHaveProperty('id', 'M');
	});

	it('inherits icons when child has none', () => {
		const base = defineTheme({ name: 'base', icons: { close: snippet('X') } });
		const child = defineTheme({ name: 'child', extends: base });
		expect(child.icons?.close).toHaveProperty('id', 'X');
	});

	it('merges indicators — child overrides base, siblings survive', () => {
		const base = defineTheme({
			name: 'base',
			indicators: { check: snippet('base-check'), radio: snippet('base-radio') }
		});
		const child = defineTheme({
			name: 'child',
			extends: base,
			indicators: { check: snippet('child-check') }
		});
		expect(child.indicators?.check).toHaveProperty('id', 'child-check');
		expect(child.indicators?.radio).toHaveProperty('id', 'base-radio');
	});

	it('uses child name, not base name', () => {
		const base = defineTheme({ name: 'base' });
		const child = defineTheme({ name: 'my-brand', extends: base });
		expect(child.name).toBe('my-brand');
	});

	it('inherits font family tokens from base theme', () => {
		const base = defineTheme({
			name: 'base',
			typography: {
				body: { family: 'Geist', fallbacks: 'sans-serif' },
				scale: { base: 14, ratio: 1.2 }
			}
		});
		const child = defineTheme({ name: 'child', extends: base });
		expect(child.resolvedTokens['--font-family-body']).toBe('Geist, sans-serif');
	});

	it('typography in child overrides base typography tokens', () => {
		const base = defineTheme({
			name: 'base',
			typography: { scale: { base: 14, ratio: 1.2 } }
		});
		const child = defineTheme({
			name: 'child',
			extends: base,
			typography: { scale: { base: 16, ratio: 1.25 } }
		});
		expect(child.resolvedTokens['--font-size-base']).not.toBe(
			base.resolvedTokens['--font-size-base']
		);
	});
});

describe('generateThemeCss', () => {
	const theme = defineTheme({
		name: 'demo',
		tokens: { '--color-accent': ['#000', '#fff'] },
		components: {
			button: {
				'variant:destructive': { '--color-error': '#f00' }
			}
		}
	});

	const css = generateThemeCss(theme);

	it('scopes to the theme attribute, bounded by the next themed subtree', () => {
		expect(css).toContain('@scope ([data-astryx-theme="demo"]) to ([data-astryx-theme])');
	});

	it('emits into the astryx-theme layer so overrides beat StyleX layers', () => {
		expect(css).toContain('@layer astryx-theme {');
	});

	it('keys component overrides off the stable class themeProps renders', () => {
		expect(css).toContain('.astryx-button.destructive {');
	});

	it('emits a pseudo-class block as a second rule on the same selector', () => {
		const withHover = defineTheme({
			name: 'demo',
			components: {
				button: {
					base: { color: 'white', ':hover': { color: 'rgba(255,255,255,0.8)' } }
				}
			}
		});
		const out = generateThemeCss(withHover);
		expect(out).toContain('.astryx-button {');
		expect(out).toContain('.astryx-button:hover {');
		expect(out).toContain('color: rgba(255,255,255,0.8);');
	});
});

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

describe('generateOnMediaCss', () => {
	it('emits @scope with [data-astryx-media] token rules', () => {
		const css = generateOnMediaCss(defineTheme({ name: 'test' }));
		expect(css).toContain('@scope ([data-astryx-theme="test"])');
		// Same scope boundary as the main theme block.
		expect(css).toContain('to ([data-astryx-theme])');
		expect(css).toContain('[data-astryx-media="dark"]');
		expect(css).toContain('color-scheme: dark');
		expect(css).toContain('var(--color-on-dark)');
	});

	it('emits light media rules', () => {
		const css = generateOnMediaCss(defineTheme({ name: 'test' }));
		expect(css).toContain('[data-astryx-media="light"]');
		expect(css).toContain('color-scheme: light');
	});

	it('emits component override rules', () => {
		const css = generateOnMediaCss(
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
		const css = generateOnMediaCss(
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
 * `generateOnMediaCss` — asserted here to *not* be in the baseline, since a
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
