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
	/**
	 * Emit only the internal `vars`, dropping the source property from the rule.
	 * Use when the class-carrying element must NOT receive the standard property
	 * itself — the value is consumed by a child through the var instead. Without
	 * this, the property is emitted alongside the var (correct when the same
	 * element both reads the var and applies the property, e.g. Chat/DropdownMenu).
	 */
	replaces?: boolean;
}

/**
 * Component → derived var mappings, transcribed from upstream.
 *
 * Keys are the lowercase component names `defineTheme`'s `components` map uses.
 * Values are ordered arrays — earlier entries emit first when several share a
 * property.
 */
export const derivedVarRegistry: Record<string, DerivedVarEntry[]> = {
	avatar: [{ property: 'borderRadius', vars: ['--_avatar-radius'] }],
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
	'context-menu': [
		{ property: 'borderRadius', vars: ['--_dropdown-menu-radius'] },
		{ property: 'padding', vars: ['--_dropdown-menu-padding'] }
	],
	'dropdown-menu': [
		{ property: 'borderRadius', vars: ['--_dropdown-menu-radius'] },
		{ property: 'padding', vars: ['--_dropdown-menu-padding'] }
	],
	field: [{ property: 'borderRadius', vars: ['--_field-radius'] }],
	'hover-card': [{ property: 'borderRadius', vars: ['--_hovercard-radius'] }],
	'number-input': [
		{ property: 'padding', expand: 'container' },
		{ property: 'borderRadius', vars: ['--_field-radius'] }
	],
	popover: [{ property: 'borderRadius', vars: ['--_popover-radius'] }],
	// `replaces`, because the mark's own `width`/`height` must not compete with
	// the var. They were plain StyleX declarations through 0.3.0, so a
	// `progressbar-mark` override only landed where `@layer astryx-theme`
	// outranks the component atomics — in a source build that compiles StyleX
	// without `useCSSLayers` the atomics are unlayered and beat every theme rule,
	// leaving no way to resize the tick but an unlayered `!important`.
	'progress-bar-mark': [
		{ property: 'width', vars: ['--_progressbar-mark-width'], replaces: true },
		{ property: 'height', vars: ['--_progressbar-mark-height'], replaces: true }
	],
	section: [{ property: 'padding', expand: 'container' }],
	'segmented-control': [
		{ property: 'borderRadius', vars: ['--_segmented-control-radius'] },
		{ property: 'padding', vars: ['--_segmented-control-padding'] }
	],
	// `replaces`, because the wrapper must stay flush at `padding: 0` so the
	// native resize grip keeps its true-corner position — the inset is applied by
	// the `<textarea>` inside it, which reads the var.
	'text-area': [
		{
			property: 'paddingInline',
			vars: ['--_textarea-inline-padding'],
			replaces: true
		}
	]
};

/**
 * Deprecated component keys → the key that superseded them.
 *
 * A renamed target keeps emitting its old class, so a theme written against the
 * old key still selects the element. Without this the rule would land but its
 * derived vars would not expand, and the half that travels through a var (a
 * hover card's radius, a text area's inline padding) would silently do nothing.
 * Drop these with the classes, in the next major.
 */
const DEPRECATED_REGISTRY_KEYS: Record<string, string> = {
	hovercard: 'hover-card',
	'progressbar-mark': 'progress-bar-mark',
	textarea: 'text-area'
};

/** Derived var entries for a component + CSS property, in priority order. */
export function getDerivedVars(component: string, property: string): DerivedVarEntry[] {
	const renamedTo = DEPRECATED_REGISTRY_KEYS[component];
	const entries =
		derivedVarRegistry[component] ?? (renamedTo ? derivedVarRegistry[renamedTo] : undefined);
	if (!entries) return [];
	return entries.filter((e) => e.property === property);
}
