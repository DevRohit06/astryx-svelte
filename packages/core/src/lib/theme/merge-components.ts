import type { ComponentOverrides } from './define-theme.js';

/**
 * Ported from Astryx's `theme/mergeComponents.ts`, extracted there at 0.4.5.
 *
 * One merge rule for component overrides, shared by every layer that composes
 * them: `extends` inheritance, generated type-scale rules, and the on-media
 * (`onDark`/`onLight`) surfaces. Merging is per style key, so a child that
 * restates one property of `button.base` keeps the rest of the base's.
 */

/**
 * Deep-merge component style maps **three levels deep** — component, then style
 * key, then the declarations within it — so `overrides` wins per style key and
 * every component and key the base declared that the overrides do not mention is
 * carried through untouched.
 *
 * The depth is the whole point, and this port had it one level too shallow once:
 * a theme writing `text: {'type:display-1': {fontFamily}}` (butter, gothic and
 * y2k all do, to put a display face on the largest three sizes) replaced the
 * generated entry outright and silently dropped the `fontSize` and `lineHeight`
 * bindings with it — six missing declarations per theme, and a display heading
 * that fell back to the component's compiled default size. Neutral never
 * exercised it: none of its `components` keys collide with a generated one.
 */
export function deepMergeComponents(
	base?: ComponentOverrides,
	overrides?: ComponentOverrides
): ComponentOverrides | undefined {
	if (!base && !overrides) {
		return undefined;
	}
	if (!base) {
		return overrides;
	}
	if (!overrides) {
		return base;
	}

	const result: ComponentOverrides = {};
	for (const [component, styleKeys] of Object.entries(base)) {
		result[component] = { ...styleKeys };
	}

	for (const [component, styleKeys] of Object.entries(overrides)) {
		if (!result[component]) {
			result[component] = { ...styleKeys };
			continue;
		}
		for (const [styleKey, styles] of Object.entries(styleKeys)) {
			result[component][styleKey] = { ...result[component][styleKey], ...styles };
		}
	}

	return result;
}
