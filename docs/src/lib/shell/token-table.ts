/**
 * The data half of `token-table.svelte`.
 *
 * Upstream splits the token tables across eight files under
 * `components/tokens/` (`ColorTokenTable`, `SpacingTokenTable`, `ShapeTokenTable`,
 * `ElevationTokenTable`, `MotionTokenTable`, `SizeTokenTable`,
 * `FontTokenTables`, `TypographyTokenTable`) plus a shared `helpers.ts`, and
 * wires them to section titles in `TokensDocView`. Twelve tables, twelve column
 * shapes. This module is their pure part — dispatch, value parsing and row
 * building — kept out of the `.svelte` file so the shapes can be read in one
 * place and so none of it re-runs per render.
 */

/**
 * The `previewType` values the authored token sections carry. Upstream's own
 * vocabulary: the field is declared on `DocSection` in `docs-types.ts` and set
 * by `tokens.doc.mjs`.
 */
export type PreviewType =
	| 'swatch'
	| 'spacing-bar'
	| 'size-bar'
	| 'border-line'
	| 'radius-box'
	| 'shadow-box'
	| 'duration-bar'
	| 'easing-curve'
	| 'font-sample';

/** One of upstream's twelve token tables. */
export type TokenTableKind =
	| 'color'
	| 'spacing'
	| 'size'
	| 'border'
	| 'radius'
	| 'elevation'
	| 'duration'
	| 'easing'
	| 'font-family'
	| 'font-size'
	| 'font-weight'
	| 'type-scale';

/**
 * Eight of the twelve are named by `previewType` one-for-one — the authored
 * field and upstream's component map were derived from the same list.
 */
const KIND_BY_PREVIEW_TYPE: Record<string, TokenTableKind> = {
	swatch: 'color',
	'spacing-bar': 'spacing',
	'size-bar': 'size',
	'border-line': 'border',
	'radius-box': 'radius',
	'shadow-box': 'elevation',
	'duration-bar': 'duration',
	'easing-curve': 'easing'
};

/**
 * `font-sample` covers four upstream tables, so it needs a second key. Upstream
 * separates them by *section title* (`TOPIC_SECTION_OVERRIDES`), which needs one
 * entry per title per topic — "Font Family Tokens" on `/docs/tokens` and "Font
 * Families" on `/docs/typography` both map to `FontFamilyTokenTable`. The token
 * prefix is the same partition with no table to keep in sync, and it is what
 * each of those components already selects its rows by (`getTokensByPrefix`).
 */
const KIND_BY_TOKEN_PREFIX: [string, TokenTableKind][] = [
	['--font-family-', 'font-family'],
	['--font-size-', 'font-size'],
	['--font-weight-', 'font-weight'],
	['--text-', 'type-scale']
];

/**
 * Which table a section renders as, or `null` when nothing claims it — in which
 * case `token-table.svelte` falls back to the authored headers rather than
 * guessing at a shape.
 */
export function tokenTableKind(
	previewType: string | undefined,
	rows: readonly string[][]
): TokenTableKind | null {
	if (!previewType) {
		return null;
	}
	const direct = KIND_BY_PREVIEW_TYPE[previewType];
	if (direct) {
		return direct;
	}
	if (previewType !== 'font-sample') {
		return null;
	}
	const first = rows[0]?.[0] ?? '';
	for (const [prefix, kind] of KIND_BY_TOKEN_PREFIX) {
		if (first.startsWith(prefix)) {
			return kind;
		}
	}
	return null;
}

/**
 * The index of the first comma that is not inside a nested function, or `-1`.
 *
 * Upstream writes this scanner once, in `FontTokenTables.primaryFamily`, to keep
 * a leading `var(--x, fallback)` from being chopped mid-token — and then
 * *doesn't* use it in `helpers.resolveValue`, which splits `light-dark(…)` on
 * `indexOf(',')`. That is fine for the theme it renders, whose dual-mode colours
 * are `[light, dark]` tuples of hexes, and wrong for the authored defaults this
 * port renders: `light-dark(rgba(5, 54, 89, 0.1), rgba(223, 226, 229, 0.2))`
 * splits at the comma inside `rgba(`, so `--color-neutral` reads
 * `rgba(5 / 54, 89, 0.1), rgba(…)` — a value that is not a colour. Upstream's
 * own scanner, applied to upstream's other splitter. See port/todo.md → Known debts.
 */
function topLevelCommaIndex(value: string): number {
	let depth = 0;
	for (let i = 0; i < value.length; i++) {
		const ch = value[i];
		if (ch === '(') {
			depth++;
		} else if (ch === ')') {
			depth--;
		} else if (ch === ',' && depth === 0) {
			return i;
		}
	}
	return -1;
}

/** The first family of a font stack — upstream's `primaryFamily`. */
export function primaryFamily(value: string): string {
	const comma = topLevelCommaIndex(value);
	return comma === -1 ? value.trim() : value.slice(0, comma).trim();
}

/**
 * One side of a `light-dark()` value — upstream's `helpers.resolveValue`, over
 * the top-level comma. Anything else is returned as authored.
 */
export function resolveForMode(value: string, mode: 'light' | 'dark'): string {
	const prefix = 'light-dark(';
	if (value.startsWith(prefix) && value.endsWith(')')) {
		const inner = value.slice(prefix.length, -1);
		const comma = topLevelCommaIndex(inner);
		if (comma !== -1) {
			return (mode === 'dark' ? inner.slice(comma + 1) : inner.slice(0, comma)).trim();
		}
	}
	return value;
}

/** A colour row: the authored `Token | Light | Dark` triple, mode-resolved. */
export interface ColorTokenRow extends Record<string, unknown> {
	tokenName: string;
	light: string;
	dark: string;
}

export function colorRows(rows: readonly string[][]): ColorTokenRow[] {
	return rows.map((row) => ({
		tokenName: row[0] ?? '',
		light: resolveForMode(row[1] ?? '', 'light'),
		// A section authored with a single value column resolves both sides from
		// it, which is what a `light-dark()` value in one column means.
		dark: resolveForMode(row[2] ?? row[1] ?? '', 'dark')
	}));
}

/** Every other family is the authored `Token | Value` pair. */
export interface ValueTokenRow extends Record<string, unknown> {
	tokenName: string;
	value: string;
}

export function valueRows(rows: readonly string[][]): ValueTokenRow[] {
	return rows.map((row) => ({ tokenName: row[0] ?? '', value: row[1] ?? '' }));
}

// ---------------------------------------------------------------------------
// Type scale
// ---------------------------------------------------------------------------

/**
 * The fourteen text styles upstream's `TypographyTokenTable` tabulates, in its
 * order: the six heading levels, then `TEXT_TYPES`.
 */
const TYPE_SCALE_NAMES: string[] = [
	'heading-1',
	'heading-2',
	'heading-3',
	'heading-4',
	'heading-5',
	'heading-6',
	'display-1',
	'display-2',
	'display-3',
	'large',
	'body',
	'label',
	'code',
	'supporting'
];

/** Upstream's `STYLE_LABEL`. */
const STYLE_LABEL: Record<string, string> = {
	'display-1': 'Display 1',
	'display-2': 'Display 2',
	'display-3': 'Display 3',
	'heading-1': 'H1',
	'heading-2': 'H2',
	'heading-3': 'H3',
	'heading-4': 'H4',
	'heading-5': 'H5',
	'heading-6': 'H6',
	body: 'Body',
	large: 'Large',
	label: 'Label',
	code: 'Code',
	supporting: 'Supporting'
};

/** Upstream's `FONT_FAMILY_MAP`. */
const FONT_FAMILY_MAP: Record<string, string> = {
	'heading-1': '--font-family-heading',
	'heading-2': '--font-family-heading',
	'heading-3': '--font-family-heading',
	'heading-4': '--font-family-heading',
	'heading-5': '--font-family-heading',
	'heading-6': '--font-family-heading',
	body: '--font-family-body',
	large: '--font-family-body',
	label: '--font-family-body',
	supporting: '--font-family-body',
	code: '--font-family-code',
	'display-1': '--font-family-heading',
	'display-2': '--font-family-heading',
	'display-3': '--font-family-heading'
};

export interface TypeScaleRow extends Record<string, unknown> {
	name: string;
	label: string;
	fontFamily: string;
	fontSize: string;
	fontWeight: string;
	leading: string;
}

const ROOT_FONT_SIZE_PX = 16;

/**
 * The computed line box in pixels, for the `1.3333 (32px)` hint.
 *
 * Upstream writes `Math.round(parseFloat(leading) * parseFloat(fontSize))`,
 * which multiplies a ratio by a *rem* count: `--text-heading-1-size` is
 * `1.5rem`, so its H1 row reads `1.3333 (2px)` on the live site. Converting rem
 * to px first is the same expression with the unit honoured. See port/todo.md →
 * Known debts.
 */
function lineBoxPx(fontSize: string, leading: string): number | null {
	const size = Number.parseFloat(fontSize);
	const ratio = Number.parseFloat(leading);
	if (!Number.isFinite(size) || !Number.isFinite(ratio)) {
		return null;
	}
	const trimmed = fontSize.trim();
	const px = trimmed.endsWith('rem') || trimmed.endsWith('em') ? size * ROOT_FONT_SIZE_PX : size;
	return Math.round(ratio * px);
}

/**
 * Upstream's `TypographyTokenTable` data, resolved through the active theme's
 * `token()` exactly as `resolveToken(theme, …)` does — this table is the one
 * place upstream's token tables read the theme for anything but a colour, and
 * the reason `useTheme()` is in this component at all.
 */
export function typeScaleRows(token: (name: string) => string): TypeScaleRow[] {
	return TYPE_SCALE_NAMES.map((name) => {
		const fontSize = token(`--text-${name}-size`);
		const fontWeight = token(`--text-${name}-weight`);
		const leading = token(`--text-${name}-leading`);
		const fontFamily = token(FONT_FAMILY_MAP[name] ?? '--font-family-body');
		const px = fontSize && leading ? lineBoxPx(fontSize, leading) : null;
		return {
			name,
			label: STYLE_LABEL[name] ?? name,
			fontFamily,
			fontSize,
			fontWeight,
			leading: px == null ? leading : `${leading} (${px}px)`
		};
	});
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/** Upstream's `EasingCurve` match, as a parsed tuple. */
export function parseCubicBezier(value: string): [number, number, number, number] | null {
	const match = value.match(
		/cubic-bezier\(\s*([\d.]+)\s*,\s*([-\d.]+)\s*,\s*([\d.]+)\s*,\s*([-\d.]+)\s*\)/
	);
	if (!match) {
		return null;
	}
	return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
}

/** Upstream's `evaluateBezier`, transcribed. */
export function evaluateBezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const sampleX = (s: number): number => ((ax * s + bx) * s + cx) * s;
	const sampleY = (s: number): number => ((ay * s + by) * s + cy) * s;
	const sampleXDeriv = (s: number): number => (3 * ax * s + 2 * bx) * s + cx;
	let g = t;
	for (let i = 0; i < 8; i++) {
		const cur = sampleX(g) - t;
		if (Math.abs(cur) < 1e-6) {
			break;
		}
		const d = sampleXDeriv(g);
		if (Math.abs(d) < 1e-6) {
			break;
		}
		g -= cur / d;
	}
	return sampleY(Math.max(0, Math.min(1, g)));
}
