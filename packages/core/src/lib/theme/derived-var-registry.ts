/**
 * Ported from Astryx's `src/theme/derivedVarRegistry.ts`.
 *
 * Maps the standard CSS properties a theme author writes (`borderRadius`,
 * `padding`) onto the internal custom properties the components actually read.
 * A theme writes
 *
 *   button: { base: { borderRadius: 'var(--radius-full)' } }
 *
 * and gets both `border-radius` *and* `--_button-radius` — the second is what
 * `Button` reads through its `var(--_button-radius, …)` fallback chain, which is
 * how a nested consumer (the chat composer) can override the radius without the
 * theme's declaration winning on specificity.
 *
 * The port had approximated this with a single `CONTAINER_PROPERTIES` set
 * holding `padding`, which is every derived var the *neutral* theme happens to
 * exercise. Matcha's `button.borderRadius`/`card.borderRadius` were the first to
 * need the rest, and the theme oracle reported them as two missing declarations.
 *
 * Upstream keeps this file in sync with each component's `doc.mjs`
 * `theming.derived` field via a consistency test. There is no counterpart here:
 * the `.doc.mjs` files are upstream's, read by the docs generator, and this
 * registry is checked against upstream's *compiled output* by the theme oracles
 * instead — a stricter test, since it compares what the browser gets.
 */

/** One property's expansion for one component. */
export interface DerivedVarEntry {
	/** The standard CSS property name (camelCase) that theme authors write. */
	property: string;
	/** Internal CSS custom property names to set. Omit when using `expand`. */
	vars?: string[];
	/** Named expansion strategy. `'container'` expands padding to container tokens. */
	expand?: 'container';
}

/**
 * Component → derived var mappings, transcribed from upstream.
 *
 * Keys are the lowercase component names `defineTheme`'s `components` map uses.
 * Values are ordered arrays — earlier entries emit first when several share a
 * property.
 */
export const derivedVarRegistry: Record<string, DerivedVarEntry[]> = {
	banner: [{ property: 'borderRadius', vars: ['--_banner-radius'] }],
	button: [{ property: 'borderRadius', vars: ['--_button-radius'] }],
	card: [
		{ property: 'borderRadius', vars: ['--_card-radius'] },
		{ property: 'padding', expand: 'container' }
	],
	chat: [
		{ property: 'borderRadius', vars: ['--_chat-composer-radius'] },
		{ property: 'padding', vars: ['--_chat-composer-padding'] }
	],
	dialog: [
		{ property: 'borderRadius', vars: ['--_dialog-radius'] },
		{ property: 'padding', expand: 'container' }
	],
	'dropdown-menu': [
		{ property: 'borderRadius', vars: ['--_dropdown-menu-radius'] },
		{ property: 'padding', vars: ['--_dropdown-menu-padding'] }
	],
	field: [{ property: 'borderRadius', vars: ['--_field-radius'] }],
	hovercard: [{ property: 'borderRadius', vars: ['--_hovercard-radius'] }],
	popover: [{ property: 'borderRadius', vars: ['--_popover-radius'] }],
	section: [{ property: 'padding', expand: 'container' }],
	'segmented-control': [
		{ property: 'borderRadius', vars: ['--_segmented-control-radius'] },
		{ property: 'padding', vars: ['--_segmented-control-padding'] }
	]
};

/** Derived var entries for a component + CSS property, in priority order. */
export function getDerivedVars(component: string, property: string): DerivedVarEntry[] {
	return (derivedVarRegistry[component] ?? []).filter((e) => e.property === property);
}
