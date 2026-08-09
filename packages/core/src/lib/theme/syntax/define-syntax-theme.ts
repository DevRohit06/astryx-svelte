import { syntaxTokenDefaults, type SyntaxTokenName } from './tokens.js';
import { devWarn } from '../../utils/dev-warning.js';

/**
 * Ported from Astryx's `theme/syntax/defineSyntaxTheme.ts`.
 *
 * The syntax theme definition API, consumed by the presets, by `SyntaxTheme` and
 * by `defineTheme`'s `syntax` option.
 */

// =============================================================================
// Types
// =============================================================================

/** Human-readable syntax token name (without the CSS custom property prefix). */
export type SyntaxThemeTokenKey =
	| 'keyword'
	| 'string'
	| 'comment'
	| 'number'
	| 'function'
	| 'type'
	| 'variable'
	| 'operator'
	| 'constant'
	| 'tag'
	| 'attribute'
	| 'property'
	| 'punctuation'
	| 'background';

/**
 * Token value — either a single string or a `[light, dark]` tuple. Tuples are
 * converted to CSS `light-dark()` at theme creation time.
 */
export type SyntaxTokenValue = string | [light: string, dark: string];

/** Token map for `defineSyntaxTheme` input — values can be strings or tuples. */
export type SyntaxThemeTokenInput = Record<SyntaxThemeTokenKey, SyntaxTokenValue>;

/** Resolved token map — every value is a CSS string (tuples resolved to `light-dark()`). */
export type SyntaxThemeTokenMap = Record<SyntaxThemeTokenKey, string>;

/** Input to `defineSyntaxTheme`. */
export interface SyntaxThemeInput {
	name: string;
	tokens: SyntaxThemeTokenInput;
}

/** A defined syntax theme — tokens resolved to CSS strings. */
export interface SyntaxThemeDefinition {
	/** Theme name. */
	name: string;
	/** Resolved token values (`light-dark()` CSS strings). */
	tokens: SyntaxThemeTokenMap;
	/** Original input tokens, preserving tuples for mode resolution. */
	__inputTokens: SyntaxThemeTokenInput;
}

// =============================================================================
// Token key <-> CSS property mapping
// =============================================================================

const CSS_PREFIX = '--color-syntax-';

function toCSSProperty(key: SyntaxThemeTokenKey): SyntaxTokenName {
	return (CSS_PREFIX + key) as SyntaxTokenName;
}

/** Every valid human-readable token key, derived from the defaults. */
export const ALL_SYNTAX_KEYS: SyntaxThemeTokenKey[] = Object.keys(syntaxTokenDefaults).map(
	(k) => k.replace(CSS_PREFIX, '') as SyntaxThemeTokenKey
);

// =============================================================================
// Helpers
// =============================================================================

/** Resolve a token value to a CSS string. Tuples become `light-dark()`. */
function resolveTokenValue(value: SyntaxTokenValue): string {
	if (Array.isArray(value)) {
		return `light-dark(${value[0]}, ${value[1]})`;
	}
	return value;
}

/**
 * Resolve a token value for a specific colour mode.
 *
 * - a `[light, dark]` tuple picks the matching side
 * - a `light-dark(a, b)` string is parsed and picked from
 * - a plain string passes through
 */
export function resolveSyntaxTokenForMode(value: SyntaxTokenValue, mode: 'light' | 'dark'): string {
	if (Array.isArray(value)) {
		return mode === 'dark' ? value[1] : value[0];
	}
	const match = value.match(/^light-dark\(([^,]+),([^)]+)\)$/);
	if (match) {
		return mode === 'dark' ? match[2].trim() : match[1].trim();
	}
	return value;
}

// =============================================================================
// defineSyntaxTheme
// =============================================================================

/**
 * Create a syntax theme from a complete token map.
 *
 * Token values can be:
 * - a string, used as-is (`'#ff79c6'`, or `'light-dark(#0064E0, #2694FE)'`)
 * - a `[light, dark]` tuple, converted to `light-dark(light, dark)`
 *
 * A missing token warns rather than throwing, as upstream's does — all 14 are
 * required, but a partial theme still renders.
 *
 * @example
 * ```ts
 * const myTheme = defineSyntaxTheme({
 * 	name: 'my-theme',
 * 	tokens: {
 * 		keyword: ['#0064E0', '#2694FE'],     // [light, dark] tuple
 * 		string: '#98c379',                    // same in both modes
 * 		comment: 'light-dark(#666, #999)',    // CSS light-dark() string
 * 		// ... all 14 tokens
 * 	}
 * });
 * ```
 */
export function defineSyntaxTheme(input: SyntaxThemeInput): SyntaxThemeDefinition {
	const missing = ALL_SYNTAX_KEYS.filter((key) => !(key in input.tokens));
	if (missing.length > 0) {
		devWarn(
			'defineSyntaxTheme',
			`"${input.name}": missing tokens: ${missing.join(', ')}. ` +
				`All 14 syntax tokens are required.`
		);
	}

	// Resolve tuples to light-dark() CSS strings.
	const resolved: Partial<SyntaxThemeTokenMap> = {};
	for (const key of ALL_SYNTAX_KEYS) {
		resolved[key] = resolveTokenValue(input.tokens[key]);
	}

	return {
		name: input.name,
		tokens: resolved as SyntaxThemeTokenMap,
		__inputTokens: { ...input.tokens }
	};
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Build the CSS custom property map for a theme.
 *
 * Upstream returns this for React's `style` prop, which takes an object; Svelte's
 * `style` attribute is a string, so `SyntaxTheme` serialises it. The object shape
 * is kept because it is published API.
 */
export function syntaxThemeStyle(theme: SyntaxThemeDefinition): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const key of ALL_SYNTAX_KEYS) {
		vars[toCSSProperty(key)] = theme.tokens[key];
	}
	return vars;
}

/** Convert a syntax theme to CSS declarations, with no selector wrapper. */
export function syntaxThemeToCSS(theme: SyntaxThemeDefinition): string {
	return ALL_SYNTAX_KEYS.map((key) => toCSSProperty(key) + ': ' + theme.tokens[key] + ';').join(
		'\n  '
	);
}
