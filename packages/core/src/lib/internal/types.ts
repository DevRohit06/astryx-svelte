/**
 * Shared value types, ported verbatim from Astryx's `src/utils/types.ts`.
 *
 * They carry no React, so the port is a copy. Keeping them in one module means
 * `Stack`, `Grid` and `Center` agree on what a "size" and a "spacing step" are,
 * exactly as upstream's components do.
 */

/**
 * A CSS length. Numbers are treated as pixels; strings are used as-is, so
 * `'100%'`, `'50vh'` and `'min(100%, 40rem)'` all pass through untouched.
 */
export type SizeValue = number | string;

/**
 * Resting elevation level for configurable surfaces, new in 0.1.9.
 *
 * Maps to the shadow token scale:
 * - `none` = flat (`box-shadow: none`)
 * - `low`  = `--shadow-low`
 * - `med`  = `--shadow-med`
 * - `high` = `--shadow-high`
 *
 * Components narrow this union to the steps they actually need — Card exposes
 * all four, while ChatComposer exposes only `'none' | 'low'`.
 */
export type Elevation = 'none' | 'low' | 'med' | 'high';

/**
 * A step on the Astryx spacing scale.
 *
 * Maps to the spacing tokens:
 * - 0 = 0px (`--spacing-0`)
 * - 0.5 = 2px (`--spacing-0-5`)
 * - 1 = 4px (`--spacing-1`)
 * - 1.5 = 6px (`--spacing-1-5`)
 * - 2 = 8px (`--spacing-2`)
 * - 3 = 12px (`--spacing-3`)
 * - 4 = 16px (`--spacing-4`)
 * - 5 = 20px (`--spacing-5`)
 * - 6 = 24px (`--spacing-6`)
 * - 8 = 32px (`--spacing-8`)
 * - 10 = 40px (`--spacing-10`)
 */
export type SpacingStep = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
