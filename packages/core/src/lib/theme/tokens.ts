import type { DefinedTheme, TokenValue } from './define-theme.js';
import { formatColor, parseColor } from '../utils/color.js';
import {
	colorDefaults,
	durationDefaults,
	easeDefaults,
	fontWeightDefaults,
	radiusDefaults,
	shadowDefaults,
	sizeDefaults,
	spacingDefaults,
	textSizeDefaults,
	typeScaleDefaults,
	typographyDefaults
} from '../styles/tokens.stylex.js';

/**
 * Every Astryx token default as one flat map, as upstream's `tokenDefaults` is.
 *
 * The declaration sites stay in `styles/tokens.stylex.ts` — that module's
 * `defineVars` calls are what mint the custom-property names, and this is only
 * a merged view of the plain objects it feeds them.
 *
 * It lives here rather than in `define-theme.ts`, where upstream declares it:
 * this package ships `.stylex.js` uncompiled, so importing that module under
 * plain Node throws, and `define-theme.ts` is on the theme build's plain-Node
 * import path. See the note at that file's head.
 *
 * Upstream also folds in its `domainTokens/` (data-viz) group, which this port
 * does not ship — and **omits `borderDefaults`**, which it does ship and does
 * publish a `BorderVarName` type for. That looks like an upstream bug, so it is
 * recorded in TODO.md rather than corrected here: including the group would put
 * a `--border-width` key in `tokenVars` and in every `useTheme().tokens` that
 * upstream's does not have.
 */
export const tokenDefaults: Record<string, string> = {
	...colorDefaults,
	...spacingDefaults,
	...sizeDefaults,
	...radiusDefaults,
	...shadowDefaults,
	...durationDefaults,
	...easeDefaults,
	...typographyDefaults,
	...textSizeDefaults,
	...fontWeightDefaults,
	...typeScaleDefaults
};

/**
 * Ported from Astryx's `src/theme/tokens.ts` — the server-safe half of the theme
 * API, and what `useTheme()` is built on.
 *
 * Derived tokens may reference other tokens (`var(--color-accent)`) and use CSS
 * colour functions (`color-mix`). The CSS cascade resolves those for anything
 * painted by CSS; a canvas, an SVG `fill` or a chart config needs the concrete
 * value instead, so the resolver replays the same resolution in JS.
 *
 * Two adaptations to this port's `DefinedTheme`, which splits the fields
 * differently from upstream's:
 *
 * - upstream's `theme.tokens` (already resolved to strings) is our
 *   `theme.resolvedTokens`;
 * - upstream's `theme.__inputTokens` (the raw input, `[light, dark]` tuples
 *   intact) is our `theme.tokens`, because `DefinedTheme extends ThemeConfig`
 *   here and the input map survives on the object rather than being copied to a
 *   private field.
 *
 * The reapply-the-input pass exists for the same reason upstream's does: an
 * explicit tuple keeps its own light/dark sides rather than being recovered by
 * parsing a `light-dark()` string.
 */

/** Resolved colour mode used when choosing the side of a light/dark value. */
export type ResolvedThemeMode = 'light' | 'dark';

/** Options for resolving all tokens from a theme object. */
export interface ResolveThemeTokensOptions {
	/** Effective mode to resolve. Pass an explicit value; this reads no media query. */
	mode: ResolvedThemeMode;
}

/** Options for resolving one token from a theme object. */
export interface ResolveThemeTokenOptions extends ResolveThemeTokensOptions {
	/** Value to return when the token name is unknown. Defaults to the empty string. */
	fallback?: string;
}

/**
 * A CSS custom-property reference for an Astryx token name.
 *
 * Useful for non-StyleX styling-library configs (Panda, Chakra, Emotion, CSS
 * Modules) where the value should stay connected to the active theme through
 * the cascade.
 *
 * @example
 * ```ts
 * const theme = {
 *   colors: {
 *     text: tokenVar('--color-text-primary'),
 *     surface: tokenVar('--color-background-surface')
 *   }
 * };
 * ```
 */
export function tokenVar(name: string): string {
	return `var(${name})`;
}

/** Every known token name mapped to its `var(--token-name)` reference. */
export const tokenVars: Record<string, string> = Object.fromEntries(
	Object.keys(tokenDefaults).map((name) => [name, tokenVar(name)])
);

/**
 * Splits a CSS function body on its first top-level comma, stepping over nested
 * functions (`rgba()`, `color-mix()`, `var()`) and quoted strings.
 */
function splitTopLevelComma(input: string): [string, string] | null {
	let depth = 0;
	let quote: '"' | "'" | null = null;
	let isEscaped = false;

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		if (quote !== null) {
			if (isEscaped) {
				isEscaped = false;
			} else if (char === '\\') {
				isEscaped = true;
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}

		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}

		if (char === '(') {
			depth++;
			continue;
		}

		if (char === ')') {
			depth = Math.max(0, depth - 1);
			continue;
		}

		if (char === ',' && depth === 0) {
			return [input.slice(0, i).trim(), input.slice(i + 1).trim()];
		}
	}

	return null;
}

/** Parses `light-dark(light, dark)` into its two arguments. */
function parseLightDark(value: string): [light: string, dark: string] | null {
	const trimmed = value.trim();
	const prefix = 'light-dark(';
	if (!trimmed.startsWith(prefix) || !trimmed.endsWith(')')) {
		return null;
	}

	return splitTopLevelComma(trimmed.slice(prefix.length, -1));
}

/**
 * Resolves one token value for a mode.
 *
 * - `[light, dark]` tuple → the side for `mode`
 * - `light-dark(light, dark)` string → parsed, then the side for `mode`
 * - anything else → unchanged
 */
function resolveTokenValueForMode(value: TokenValue, mode: ResolvedThemeMode): string {
	if (Array.isArray(value)) {
		return mode === 'dark' ? value[1] : value[0];
	}

	const parsed = parseLightDark(value as string);
	if (parsed !== null) {
		return mode === 'dark' ? parsed[1] : parsed[0];
	}

	return value as string;
}

// =============================================================================
// Reference resolution — turn token expressions into concrete raw values
// =============================================================================

/** Index of the `)` matching the `(` at `openIndex`, or -1 when unbalanced. */
function findMatchingParen(input: string, openIndex: number): number {
	let depth = 0;
	for (let i = openIndex; i < input.length; i++) {
		const char = input[i];
		if (char === '(') {
			depth++;
		} else if (char === ')') {
			depth--;
			if (depth === 0) {
				return i;
			}
		}
	}
	return -1;
}

/** Splits a `color-mix` component into its colour and optional percentage. */
function parseMixComponent(part: string): { color: string; percentage: number | null } {
	const trimmed = part.trim();
	const match = trimmed.match(/\s+([\d.]+)%$/);
	if (match) {
		return {
			color: trimmed.slice(0, match.index).trim(),
			percentage: parseFloat(match[1])
		};
	}
	return { color: trimmed, percentage: null };
}

/**
 * Evaluates `color-mix(in <space>, c1 [p1], c2 [p2])` to a concrete colour.
 *
 * Supports `srgb` — the space the theme generator emits — using the CSS Color 5
 * algorithm: normalise the percentages, interpolate premultiplied channels, then
 * apply the alpha multiplier when the weights sum to under 100%. Returns null
 * for anything it cannot evaluate, so the original expression is preserved
 * rather than guessed at.
 */
function evaluateColorMix(body: string): string | null {
	const spaceMatch = body.match(/^in\s+([\w-]+)\s*,\s*(.+)$/s);
	if (!spaceMatch) {
		return null;
	}
	const [, colorSpace, rest] = spaceMatch;
	if (colorSpace.toLowerCase() !== 'srgb') {
		return null;
	}

	const split = splitTopLevelComma(rest);
	if (split === null) {
		return null;
	}
	const first = parseMixComponent(split[0]);
	const second = parseMixComponent(split[1]);

	const c1 = parseColor(first.color);
	const c2 = parseColor(second.color);
	if (c1 === null || c2 === null) {
		return null;
	}

	// Fill in omitted percentages, then normalise so they sum to 100%.
	let p1: number;
	let p2: number;
	if (first.percentage !== null && second.percentage !== null) {
		p1 = first.percentage;
		p2 = second.percentage;
	} else if (first.percentage !== null) {
		p1 = first.percentage;
		p2 = 100 - p1;
	} else if (second.percentage !== null) {
		p2 = second.percentage;
		p1 = 100 - p2;
	} else {
		p1 = 50;
		p2 = 50;
	}
	const sum = p1 + p2;
	if (sum <= 0) {
		return null;
	}
	const w1 = p1 / sum;
	const w2 = p2 / sum;
	const alphaMultiplier = sum < 100 ? sum / 100 : 1;

	// Interpolate in premultiplied sRGB, then un-premultiply.
	const mixedA = w1 * c1.a + w2 * c2.a;
	const premix = (k1: number, k2: number): number => w1 * k1 * c1.a + w2 * k2 * c2.a;
	const rp = premix(c1.r, c2.r);
	const gp = premix(c1.g, c2.g);
	const bp = premix(c1.b, c2.b);
	const rgb =
		mixedA === 0 ? { r: 0, g: 0, b: 0 } : { r: rp / mixedA, g: gp / mixedA, b: bp / mixedA };

	return formatColor({ ...rgb, a: mixedA * alphaMultiplier });
}

/** Evaluates every supported colour function in an expression, innermost first. */
function evaluateColorFunctions(expr: string): string {
	const idx = expr.indexOf('color-mix(');
	if (idx === -1) {
		return expr;
	}
	const openIndex = idx + 'color-mix'.length;
	const closeIndex = findMatchingParen(expr, openIndex);
	if (closeIndex === -1) {
		return expr;
	}
	const body = evaluateColorFunctions(expr.slice(openIndex + 1, closeIndex));
	const evaluated = evaluateColorMix(body);
	const replacement = evaluated ?? `color-mix(${body})`;
	return expr.slice(0, idx) + replacement + evaluateColorFunctions(expr.slice(closeIndex + 1));
}

/**
 * Substitutes `var(--name[, fallback])` references with their resolved values.
 * `seen` tracks the reference chain, so a cycle resolves to the literal
 * reference instead of recursing forever.
 */
function substituteVars(
	expr: string,
	raw: Record<string, string>,
	cache: Record<string, string>,
	seen: Set<string>
): string {
	const start = expr.indexOf('var(');
	if (start === -1) {
		return expr;
	}
	const openIndex = start + 'var'.length;
	const closeIndex = findMatchingParen(expr, openIndex);
	if (closeIndex === -1) {
		return expr;
	}

	const inner = expr.slice(openIndex + 1, closeIndex);
	const commaSplit = splitTopLevelComma(inner);
	const name = (commaSplit ? commaSplit[0] : inner).trim();
	const fallback = commaSplit ? commaSplit[1] : null;

	let replacement: string;
	if (seen.has(name)) {
		replacement = expr.slice(start, closeIndex + 1);
	} else if (name in raw) {
		seen.add(name);
		replacement = resolveReference(name, raw, cache, seen);
		seen.delete(name);
	} else if (fallback !== null) {
		replacement = substituteVars(fallback.trim(), raw, cache, seen);
	} else {
		replacement = expr.slice(start, closeIndex + 1);
	}

	const rest = substituteVars(expr.slice(closeIndex + 1), raw, cache, seen);
	return expr.slice(0, start) + replacement + rest;
}

/** Fully resolves one expression: substitute references, then evaluate colours. */
function resolveExpression(
	expr: string,
	raw: Record<string, string>,
	cache: Record<string, string>,
	seen: Set<string>
): string {
	if (!expr.includes('var(') && !expr.includes('color-mix(')) {
		return expr;
	}
	return evaluateColorFunctions(substituteVars(expr, raw, cache, seen));
}

/** Resolves one token by name, memoising into `cache`. */
function resolveReference(
	name: string,
	raw: Record<string, string>,
	cache: Record<string, string>,
	seen: Set<string>
): string {
	if (name in cache) {
		return cache[name];
	}
	const value = raw[name];
	if (value === undefined) {
		return '';
	}
	const resolved = resolveExpression(value, raw, cache, seen);
	cache[name] = resolved;
	return resolved;
}

/** Resolves every reference and colour function in a raw token map. */
function resolveReferences(raw: Record<string, string>): Record<string, string> {
	const cache: Record<string, string> = {};
	for (const name of Object.keys(raw)) {
		// A scratch set for cycle detection inside a pure function — nothing
		// renders from it, so it stays a plain Set.
		resolveReference(name, raw, cache, new Set<string>());
	}
	return cache;
}

/**
 * Resolves all Astryx token values for a theme and effective colour mode.
 *
 * Starts from `tokenDefaults`, applies the theme's resolved tokens, then
 * reapplies its raw input so explicit `[light, dark]` tuples keep their own
 * sides. A final pass resolves `var()` references between tokens and evaluates
 * the colour functions the theme generator emits, so a derived token like
 * `--color-text-accent` comes back as a concrete value rather than
 * `var(--color-accent)`.
 *
 * Pass `theme` as null to resolve the defaults alone.
 */
export function resolveThemeTokens(
	theme: DefinedTheme | null | undefined,
	options: ResolveThemeTokensOptions
): Record<string, string> {
	const { mode } = options;
	const resolved: Record<string, string> = {};

	for (const [key, value] of Object.entries(tokenDefaults)) {
		resolved[key] = resolveTokenValueForMode(value, mode);
	}

	if (theme == null) {
		return resolveReferences(resolved);
	}

	for (const [key, value] of Object.entries(theme.resolvedTokens)) {
		resolved[key] = resolveTokenValueForMode(value, mode);
	}

	if (theme.tokens) {
		for (const [key, value] of Object.entries(theme.tokens)) {
			if (value !== undefined) {
				resolved[key] = resolveTokenValueForMode(value, mode);
			}
		}
	}

	return resolveReferences(resolved);
}

/** Resolves one Astryx token value for a theme and effective colour mode. */
export function resolveThemeToken(
	theme: DefinedTheme | null | undefined,
	name: string,
	options: ResolveThemeTokenOptions
): string {
	const tokens = resolveThemeTokens(theme, options);
	return tokens[name] ?? options.fallback ?? '';
}
