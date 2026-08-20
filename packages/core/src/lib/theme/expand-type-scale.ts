/**
 * Ported from Astryx's `src/theme/expandTypeScale.ts`.
 *
 * Two layers, as upstream describes them:
 *
 * 1. **Raw sizes** — `round(base × ratio^step) / 16`, in rem. Step mapping is
 *    upstream's: h6 = -2, h5 = -1, h4 = 0 (the base anchor), h3 = +1, h2 = +2,
 *    h1 = +3, display continuing to +4/+5/+6.
 * 2. **Semantic tokens** — `--text-{role}-size|weight|leading`, which is what
 *    `Text` and `Heading` actually render from. Sizes are `var()` references
 *    into layer 1; leadings are computed and 4px-grid-snapped.
 *
 * Layer 2 was missing until 2026-08-03, so the shipped theme emitted **2 of
 * upstream's 42** `--text-*` declarations and every component fell through to
 * `typeScaleDefaults` in `tokens.stylex.ts`. Those defaults happen to agree with
 * the neutral theme everywhere except `--text-display-3-leading`, where the
 * static table says `1.2414` and the snapping algorithm says **`1.3793`** — so
 * the gap was invisible until something rendered `display-3`. It also meant a
 * theme with a *different* `scale` got upstream's leadings rather than its own,
 * which is the more serious half.
 *
 * SYNC: When modified, update:
 * - /packages/cli/assets/theme.template.ts (the annotated field reference)
 */

/** Font weight value — either a CSS string or a `var()` reference. */
export type FontWeightValue = string;

/**
 * Weight overrides for heading levels. Keys are heading levels 1–6, values are
 * CSS font-weight values (e.g. `'600'`, `'var(--font-weight-bold)'`).
 */
export type HeadingWeightOverrides = Partial<Record<1 | 2 | 3 | 4 | 5 | 6, FontWeightValue>>;

/**
 * Weight overrides for text types. Accepts additional string keys for custom
 * theme-defined text types.
 */
export type TextWeightOverrides = Partial<
	Record<
		| 'body'
		| 'large'
		| 'label'
		| 'code'
		| 'supporting'
		| 'display-1'
		| 'display-2'
		| 'display-3'
		| (string & {}),
		FontWeightValue
	>
>;

/**
 * Type scale configuration.
 *
 * Named weights are **already resolved** by the time they reach here — this
 * takes CSS values, not `FontWeight` names. `defineTheme` owns that mapping,
 * which is where upstream puts it too.
 */
export interface TypeScaleConfig {
	/** Base font size in px. Anchored to h4 and body text. */
	base: number;
	/** Scaling ratio for the geometric progression. */
	ratio: number;
	/** Optional weight overrides for headings and text types. */
	weights?: {
		/** Per-level heading weight overrides. Unset levels use the defaults. */
		heading?: HeadingWeightOverrides;
		/** Per-type text weight overrides. Unset types use the defaults. */
		text?: TextWeightOverrides;
	};
}

/** Generated typography token overrides, keyed by custom property name. */
export type TypeScaleTokens = Record<string, string>;

/** Raw size token names in ascending step order, from -5 to +6. */
const SIZE_STEPS: ReadonlyArray<[name: string, step: number]> = [
	['--font-size-4xs', -5],
	['--font-size-3xs', -4],
	['--font-size-2xs', -3],
	['--font-size-xs', -2],
	['--font-size-sm', -1],
	['--font-size-base', 0],
	['--font-size-lg', 1],
	['--font-size-xl', 2],
	['--font-size-2xl', 3],
	['--font-size-3xl', 4],
	['--font-size-4xl', 5],
	['--font-size-5xl', 6]
];

/**
 * Trims trailing zeros so 0.875 stays `0.875rem` while 1.5 does not become
 * `1.5000rem` — upstream's output has no padding.
 */
function rem(px: number): string {
	const value = px / 16;
	return `${parseFloat(value.toFixed(4))}rem`;
}

/** Step token name by step, for `var()` references from the semantic layer. */
const SIZE_TOKEN_BY_STEP = new Map(SIZE_STEPS.map(([name, step]) => [step, name]));

/** Heading level → step offset. h4 is the base anchor. */
const HEADING_STEPS: ReadonlyArray<[level: number, step: number]> = [
	[1, 3],
	[2, 2],
	[3, 1],
	[4, 0],
	[5, -1],
	[6, -2]
];

/**
 * Text type → step offset. `body`/`label`/`code` sit at the base, `large` one
 * step up, `supporting` one down, and display continues above h1.
 */
const TEXT_STEPS: ReadonlyArray<[type: string, step: number]> = [
	['body', 0],
	['large', 1],
	['label', 0],
	['code', 0],
	['supporting', -1],
	['display-1', 6],
	['display-2', 5],
	['display-3', 4]
];

const DEFAULT_HEADING_WEIGHTS: Record<number, string> = {
	1: 'var(--font-weight-semibold)',
	2: 'var(--font-weight-semibold)',
	3: 'var(--font-weight-semibold)',
	4: 'var(--font-weight-semibold)',
	5: 'var(--font-weight-semibold)',
	6: 'var(--font-weight-semibold)'
};

const DEFAULT_TEXT_WEIGHTS: Record<string, string> = {
	body: 'var(--font-weight-normal)',
	large: 'var(--font-weight-semibold)',
	label: 'var(--font-weight-medium)',
	code: 'var(--font-weight-normal)',
	supporting: 'var(--font-weight-normal)',
	'display-1': 'var(--font-weight-normal)',
	'display-2': 'var(--font-weight-normal)',
	'display-3': 'var(--font-weight-normal)'
};

/**
 * Upstream's tiered target ratio: small text needs more leading than display
 * text, which reads better tight.
 */
function targetLeadingRatio(fontSize: number): number {
	return fontSize < 20 ? 1.5 : fontSize < 32 ? 1.4 : 1.25;
}

/**
 * A unitless line height whose computed px value lands on the 4px grid, with a
 * floor of `fontSize + 4`.
 *
 * The snapping is why these are emitted as computed constants rather than left
 * to a ratio: `29px × 1.4` is 40.6, which snaps to 40 and so to `1.3793` — not
 * a number any hand-written table would land on.
 */
function computeLeading(fontSize: number): number {
	const raw = fontSize * targetLeadingRatio(fontSize);
	const snapped = Math.max(Math.round(raw / 4) * 4, Math.ceil((fontSize + 4) / 4) * 4);
	return Math.round((snapped / fontSize) * 10000) / 10000;
}

export function expandTypeScale(config: TypeScaleConfig): TypeScaleTokens {
	const { base, ratio, weights } = config;
	const tokens: TypeScaleTokens = {};

	// Overrides arrive already resolved to CSS values, so this is a plain merge
	// over the defaults — no name mapping happens here.
	const headingWeights: Record<number, string> = {
		...DEFAULT_HEADING_WEIGHTS,
		...(weights?.heading as Record<number, string> | undefined)
	};
	const textWeights: Record<string, string> = {
		...DEFAULT_TEXT_WEIGHTS,
		...(weights?.text as Record<string, string> | undefined)
	};

	const sizeAt = (step: number) => Math.round(base * ratio ** step);

	// Layer 1 — the raw geometric size scale.
	for (const [name, step] of SIZE_STEPS) {
		tokens[name] = rem(sizeAt(step));
	}

	// Layer 2 — the semantic tokens `Text` and `Heading` actually render from.
	// Sizes are `var()` references back into layer 1, so a theme that retunes the
	// scale moves both together; leadings are the computed constants above.
	for (const [level, step] of HEADING_STEPS) {
		tokens[`--text-heading-${level}-size`] = `var(${SIZE_TOKEN_BY_STEP.get(step)})`;
		tokens[`--text-heading-${level}-weight`] = headingWeights[level];
		tokens[`--text-heading-${level}-leading`] = String(computeLeading(sizeAt(step)));
	}

	for (const [type, step] of TEXT_STEPS) {
		tokens[`--text-${type}-size`] = `var(${SIZE_TOKEN_BY_STEP.get(step)})`;
		tokens[`--text-${type}-weight`] = textWeights[type];
		tokens[`--text-${type}-leading`] = String(computeLeading(sizeAt(step)));
	}

	return tokens;
}

/** Which family each text type draws from. Display follows the heading face. */
const TEXT_FONT_FAMILIES: Record<string, string> = {
	body: 'var(--font-family-body)',
	large: 'var(--font-family-body)',
	label: 'var(--font-family-body)',
	code: 'var(--font-family-code)',
	supporting: 'var(--font-family-body)',
	'display-1': 'var(--font-family-heading)',
	'display-2': 'var(--font-family-heading)',
	'display-3': 'var(--font-family-heading)'
};

/**
 * Upstream's `generateTypeScaleComponents`: `Heading` and `Text` overrides that
 * bind those components to the theme's type scale.
 *
 * These land in the `astryx-theme` layer, *above* the components' own StyleX, so
 * the theme — not the component's compiled defaults — is what finally decides a
 * heading's size and a text type's family. Without them a theme can retune
 * `scale` and `Text`/`Heading` will ignore it, which is why this is generated
 * rather than left to each theme's `components` map.
 */
export function generateTypeScaleComponents(
	_config: TypeScaleConfig
): Record<string, Record<string, Record<string, string>>> {
	const heading: Record<string, Record<string, string>> = {};
	for (const [level] of HEADING_STEPS) {
		heading[`level:${level}`] = {
			fontFamily: 'var(--font-family-heading)',
			fontSize: `var(--text-heading-${level}-size)`,
			fontWeight: `var(--text-heading-${level}-weight)`,
			lineHeight: `var(--text-heading-${level}-leading)`
		};
	}
	// `Heading` renders both a `level:N` and, when set, a `type:display-N`
	// visual-prop class simultaneously (type sizing takes precedence over level
	// sizing — see `heading.svelte`'s own `type ? sizeByType[type] :
	// sizeByLevel[level]`). Without a `type:display-N` rule here, the `level:N`
	// rule is the only one that matches, so it silently wins regardless of
	// `type` once a theme supplies a type scale — a bug that looked intermittent
	// because a theme with no typography config was unaffected. Emitting these
	// after the level rules keeps them later in source order, so they take
	// precedence at equal specificity, matching the component's own logic.
	// `fontWeight` is intentionally omitted, mirroring the `text` branch below
	// and preserving the default-weight-by-type styles.
	for (const type of ['display-1', 'display-2', 'display-3']) {
		heading[`type:${type}`] = {
			fontFamily: 'var(--font-family-heading)',
			fontSize: `var(--text-${type}-size)`,
			lineHeight: `var(--text-${type}-leading)`
		};
	}

	const text: Record<string, Record<string, string>> = {};
	for (const [type] of TEXT_STEPS) {
		text[`type:${type}`] = {
			fontFamily: TEXT_FONT_FAMILIES[type],
			fontSize: `var(--text-${type}-size)`,
			lineHeight: `var(--text-${type}-leading)`
		};
	}

	return { heading, text };
}

/**
 * `color` for every `Text`/`Heading` colour variant, bound to the theme's text
 * tokens.
 *
 * Independent of the type scale — a theme with no `typography` still gets these
 * — because they are what make a retuned `--color-text-*` reach the components
 * that render most of the words on a page. Emitted in the `astryx-theme` layer,
 * so the theme wins over the components' compiled StyleX.
 *
 * `placeholder` deliberately resolves to `--color-text-secondary`: upstream has
 * no distinct placeholder token, and inventing one would be an added API.
 */
export function generateTextColorComponents(): Record<
	string,
	Record<string, Record<string, string>>
> {
	const COLORS: ReadonlyArray<[variant: string, token: string]> = [
		['primary', 'var(--color-text-primary)'],
		['secondary', 'var(--color-text-secondary)'],
		['disabled', 'var(--color-text-disabled)'],
		['placeholder', 'var(--color-text-secondary)'],
		['accent', 'var(--color-text-accent)']
	];

	const rules: Record<string, Record<string, string>> = {};
	for (const [variant, token] of COLORS) rules[variant] = { color: token };

	// Same rule set for both components — upstream emits `.astryx-text.secondary`
	// and `.astryx-heading.secondary` alike.
	return { heading: { ...rules }, text: { ...rules } };
}
