/**
 * Ported from Astryx's `src/theme/expandRadiusScale.ts`.
 *
 * Computes the border-radius tokens from a base unit and a multiplier.
 * `--radius-none` and `--radius-full` are fixed anchors; everything between
 * scales as `base × step × multiplier`.
 *
 * `define-theme.ts` recorded this expander as deliberately omitted "because no
 * shipped theme uses them". The **y2k** theme does — `radius: {base: 4,
 * multiplier: 0}` is how it gets its brutalist square corners. It also pins
 * every named radius token explicitly, so the only declaration the expander
 * actually contributes there is `--radius-chat`, which is exactly what the
 * theme oracle reported missing.
 *
 * SYNC: When modified, update:
 * - /packages/cli/assets/theme.template.ts (the annotated field reference)
 */

/** Radius scale configuration. */
export interface RadiusScaleConfig {
	/** Base radius unit in px. Default: 4 */
	base: number;
	/** Multiplier applied to the scalable tokens (inner through page). Range 0–2. */
	multiplier: number;
}

/** Generated radius token overrides, keyed by custom property name. */
export type RadiusScaleTokens = Record<string, string>;

/**
 * Expands a radius scale config into token overrides.
 *
 * @example
 * ```ts
 * expandRadiusScale({ base: 4, multiplier: 1 });
 * // --radius-inner 4px, --radius-element 8px, --radius-container 12px,
 * // --radius-page 28px, --radius-chat 28px
 * ```
 */
export function expandRadiusScale(config: RadiusScaleConfig): RadiusScaleTokens {
	const { base, multiplier } = config;
	return {
		'--radius-none': '0px',
		'--radius-inner': `${Math.round(base * 1 * multiplier)}px`,
		'--radius-element': `${Math.round(base * 2 * multiplier)}px`,
		'--radius-container': `${Math.round(base * 3 * multiplier)}px`,
		'--radius-page': `${Math.round(base * 7 * multiplier)}px`,
		// Chat surfaces track the page step (× 7) so they scale with the theme
		// multiplier, but stay a distinct token for independent theming. #2072
		'--radius-chat': `${Math.round(base * 7 * multiplier)}px`,
		'--radius-full': '9999px'
	};
}
