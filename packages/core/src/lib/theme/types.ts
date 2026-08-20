/**
 * Ported from Astryx's `src/theme/types.ts`.
 *
 * Upstream's file is larger than this one: most of its type surface is declared
 * here in `text.stylex.ts` instead (the standing "two homes for one upstream
 * dir" placement debt). What lives here is what upstream publishes from here
 * and this port has nowhere better to put — `ThemeMode` for `<Theme>`, and the
 * two prose-theming types below, which were waiting on the Phase 3 prose
 * defaults and land with them.
 */

/** Theme mode — `'system'` follows the OS preference. */
export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Named font weight — maps to `var(--font-weight-*)` at the token layer. Raw CSS
 * values (e.g. `'800'`) are accepted as an escape hatch; `(string & {})` keeps
 * the four names in editor completion while still admitting any string.
 */
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | (string & {});

/**
 * A typography role declaration (`body`, `heading` or `code`).
 *
 * Fonts must be loaded by the consumer — a `<link>` in `<head>` or an `@import`
 * in CSS. Astryx does not handle font loading; it only sets the font-family
 * token so the font is used once available.
 */
export interface TypographyRole {
	/** Primary font name — must be loaded by the consumer. */
	family?: string;
	/** CSS fallback stack, appended after `family` in the computed token. */
	fallbacks?: string;
	/** Default font weight for this role. */
	weight?: FontWeight;
	/** Per-level weight overrides (heading only: keys are heading levels 1–6). */
	weights?: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, FontWeight>>;
}

/**
 * Unified typography configuration — fonts, scale and weights.
 *
 * `scale` drives the geometric type scale; `body`/`heading`/`code` declare
 * fonts, fallbacks and weights per role, and `heading` inherits family and
 * fallbacks from `body` when it declares none of its own.
 */
export interface TypographyConfig {
	/** Type scale: generates text size tokens from base + ratio. */
	scale?: { base: number; ratio: number };
	/** Body text font configuration. */
	body?: TypographyRole;
	/** Heading font configuration. Inherits family/fallbacks from `body` if omitted. */
	heading?: TypographyRole;
	/** Code/monospace font configuration. */
	code?: TypographyRole;
}

/**
 * Allowed CSS properties for Text/Heading xstyle prop.
 * Constrained to layout-only properties to prevent typography escapes.
 *
 * Published but unapplied, exactly as upstream: nothing in Astryx's own `src/`
 * references it either — its `Text` and `Heading` type `xstyle` the ordinary
 * way. It is a constraint a consumer opts into, so it is ported as surface
 * rather than imposed on our own props, which would narrow an API upstream
 * leaves open.
 */
export type TextXStyleAllowed = {
	// Index signature required for StyleXStyles compatibility
	[key: string]: unknown;

	// Margins
	margin?: unknown;
	marginTop?: unknown;
	marginBottom?: unknown;
	marginStart?: unknown;
	marginEnd?: unknown;
	marginBlock?: unknown;
	marginBlockStart?: unknown;
	marginBlockEnd?: unknown;
	marginInline?: unknown;
	marginInlineStart?: unknown;
	marginInlineEnd?: unknown;

	// Width constraints
	width?: unknown;
	minWidth?: unknown;
	maxWidth?: unknown;

	// Flex child properties
	alignSelf?: unknown;
	flexBasis?: unknown;
	flexGrow?: unknown;
	flexShrink?: unknown;

	// Text layout (non-typography)
	textAlign?: unknown;
	textAlignLast?: unknown;
	verticalAlign?: unknown;
};

/**
 * Prose element types for typography CSS
 */
export type ProseElement =
	| 'p'
	| 'ul'
	| 'ol'
	| 'li'
	| 'liLast'
	| 'blockquote'
	| 'code'
	| 'pre'
	| 'preCode'
	| 'hr'
	| 'strong'
	| 'em'
	| 'a'
	| 'aHover'
	| 'firstChild'
	| 'lastChild';
