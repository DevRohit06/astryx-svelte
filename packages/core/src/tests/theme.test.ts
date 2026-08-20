import { describe, expect, it } from 'vitest';
import { expandMotionScale } from '$lib/theme/expand-motion-scale.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
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

/**
 * Upstream's `describe('typography weight derivation')` (`theme/defineTheme.test.ts`),
 * all six cases. New here rather than restated: this port had no role-level
 * `weight` at all until it was added, which `port/debts.md` recorded as an
 * `api-divergence` — `typography: {heading: {weight: 'semibold'}}` typechecked
 * and was silently ignored.
 *
 * Read from `resolvedTokens`, not `tokens`: this port keeps the raw input map on
 * `tokens` and the generated map on `resolvedTokens`, where upstream merges both
 * into `tokens`. These assert on *generated* tokens, so the wrong map would make
 * every one of them vacuous — the same note the two typography cases above carry.
 */
describe('typography weight derivation', () => {
	it('applies heading weight from typography role', () => {
		const theme = defineTheme({
			name: 'heading-weight',
			typography: { scale: { base: 14, ratio: 1.2 }, heading: { weight: 'bold' } }
		});
		// All heading levels should get bold weight
		expect(theme.resolvedTokens['--text-heading-1-weight']).toBe('var(--font-weight-bold)');
		expect(theme.resolvedTokens['--text-heading-4-weight']).toBe('var(--font-weight-bold)');
	});

	it('per-level heading weights override default heading weight', () => {
		const theme = defineTheme({
			name: 'per-level',
			typography: {
				scale: { base: 14, ratio: 1.2 },
				heading: { weight: 'semibold', weights: { 3: 'bold', 4: 'bold' } }
			}
		});
		expect(theme.resolvedTokens['--text-heading-1-weight']).toBe('var(--font-weight-semibold)');
		expect(theme.resolvedTokens['--text-heading-3-weight']).toBe('var(--font-weight-bold)');
		expect(theme.resolvedTokens['--text-heading-4-weight']).toBe('var(--font-weight-bold)');
	});

	it('body weight flows to text body token', () => {
		const theme = defineTheme({
			name: 'body-weight',
			typography: { scale: { base: 14, ratio: 1.2 }, body: { weight: 'medium' } }
		});
		expect(theme.resolvedTokens['--text-body-weight']).toBe('var(--font-weight-medium)');
	});

	it('code weight flows to text code token', () => {
		const theme = defineTheme({
			name: 'code-weight',
			typography: { scale: { base: 14, ratio: 1.2 }, code: { weight: 'medium' } }
		});
		expect(theme.resolvedTokens['--text-code-weight']).toBe('var(--font-weight-medium)');
	});

	it('named weight maps to var reference', () => {
		const theme = defineTheme({
			name: 'named-weight',
			typography: { scale: { base: 14, ratio: 1.2 }, heading: { weight: 'normal' } }
		});
		expect(theme.resolvedTokens['--text-heading-1-weight']).toBe('var(--font-weight-normal)');
	});

	it('raw CSS weight value passes through', () => {
		const theme = defineTheme({
			name: 'raw-weight',
			typography: { scale: { base: 14, ratio: 1.2 }, heading: { weight: '900' } }
		});
		expect(theme.resolvedTokens['--text-heading-1-weight']).toBe('900');
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
