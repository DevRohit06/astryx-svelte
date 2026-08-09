import { stableClassName } from './naming.js';

/**
 * Ported from Astryx's `src/utils/themeProps.ts`.
 *
 * Every component renders a stable base class (`astryx-button`) plus variant
 * classes derived from its visual props, and reflects those props as data
 * attributes so consumers can target stable selectors instead of collision-prone
 * bare class names. Theme packages compile their overrides against exactly these
 * selectors — `.astryx-button.destructive { … }` — so this is load-bearing for
 * theming, not cosmetic.
 *
 * The only change from upstream is `className` → `class`, since that is what
 * Svelte spreads onto an element.
 */

export type ClassValue = string | number | undefined | null;
export type ClassProps = Record<string, ClassValue>;
export type ThemeDataAttributes = Record<`data-${string}`, string | undefined>;
export type ThemeProps = { class: string } & ThemeDataAttributes;

function toDataAttributeName(prop: string): `data-${string}` {
	return `data-${prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
}

function classTokenForPropValue(prop: string, value: string): string {
	// CSS classes can't start with a digit — prefix with the prop name so
	// `level={1}` becomes `level-1` rather than an invalid `1`.
	return /^\d/.test(value) ? `${prop}-${value}` : value;
}

function buildClassName(component: string, props?: ClassProps): string {
	const classes = [stableClassName(component)];

	if (props) {
		for (const [prop, value] of Object.entries(props)) {
			if (value == null) continue;
			classes.push(classTokenForPropValue(prop, String(value)));
		}
	}

	return classes.join(' ');
}

/**
 * Reflect visual props as `data-*` attributes. Keys are kebab-cased
 * (`listStyle` → `data-list-style`); values keep their literal form, including
 * numbers (`level: 1` → `data-level="1"`). Nullish values are omitted.
 */
export function themeDataAttributes(props?: ClassProps): ThemeDataAttributes {
	const attrs: ThemeDataAttributes = {};

	if (props) {
		for (const [prop, value] of Object.entries(props)) {
			if (value == null) continue;
			attrs[toDataAttributeName(prop)] = String(value);
		}
	}

	return attrs;
}

/**
 * Props to spread onto the element that carries the stable Astryx class.
 *
 * @example
 * themeProps('button', { variant: 'primary', size: 'sm' })
 * // → { class: 'astryx-button primary sm', 'data-variant': 'primary', 'data-size': 'sm' }
 */
export function themeProps(component: string, props?: ClassProps): ThemeProps {
	return {
		class: buildClassName(component, props),
		...themeDataAttributes(props)
	};
}
