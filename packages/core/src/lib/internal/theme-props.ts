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
 * Options for {@link themeProps}.
 */
export type ThemePropsOptions = {
	/**
	 * Stable class names to emit ALONGSIDE the component's own, for targets that
	 * have been renamed.
	 *
	 * A theme target is public API: renaming one silently breaks every theme
	 * that styles it. Emitting the old name beside the new one keeps those
	 * themes working through a deprecation window, at the cost of one extra
	 * class on the element until the old name is dropped in a major.
	 *
	 * Pass plain string literals — the theming guards scan for them statically.
	 * Document the old name with `deprecatedFor` in the component's
	 * `theming.targets` so the docs site says which to use.
	 */
	legacyNames?: ReadonlyArray<string>;
};

/**
 * Props to spread onto the element that carries the stable Astryx class.
 *
 * @example
 * themeProps('button', { variant: 'primary', size: 'sm' })
 * // → { class: 'astryx-button primary sm', 'data-variant': 'primary', 'data-size': 'sm' }
 */
export function themeProps(
	component: string,
	props?: ClassProps,
	options?: ThemePropsOptions
): ThemeProps {
	const className = buildClassName(component, props);
	const legacy = options?.legacyNames?.map((name) => stableClassName(name)) ?? [];

	return {
		class: legacy.length > 0 ? [className, ...legacy].join(' ') : className,
		...themeDataAttributes(props)
	};
}
