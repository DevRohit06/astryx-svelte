import type { HTMLAttributes } from 'svelte/elements';
import type { StyleArg } from './internal/sx.js';

/**
 * Base props shared by every Astryx component, ported from `src/BaseProps.ts`.
 *
 * Keeps: event handlers, `aria-*`, `role`, `tabindex`, `hidden`, `draggable`,
 * `inert`, `dir`, `class`, `style`, `id`, `data-*`.
 * Omits: props that are footguns, deprecated, or irrelevant to a component API.
 * A component that genuinely needs an omitted prop declares it explicitly.
 * (`Text` and `Heading` do not: they set `title` for truncation as a literal
 * attribute in markup, which the omission does not touch — same as upstream.)
 *
 * ## What changed in the port
 *
 * Upstream extends React's `HTMLAttributes`; this extends Svelte's, so the omit
 * list is the same set of *attributes* under Svelte's lowercase names
 * (`contenteditable`, not `contentEditable`). Upstream omits 47 keys; we omit
 * the 34 that exist on Svelte's base type. The remaining thirteen have nothing
 * to remove and are therefore absent rather than omitted — listed at the foot of
 * this file. `Omit` accepts keys a type does not have, so naming them anyway
 * would compile and quietly mean nothing.
 *
 * Upstream also re-adds a `[key: \`data-${string}\`]` index signature, because
 * React's `Omit` strips it. Svelte's survives: `Omit` keeps a template-literal
 * index signature, so `data-*` is inherited here while `title` is correctly
 * gone. Checked, not assumed.
 *
 * `xstyle` is the one member of upstream's body — a StyleX style override
 * applied *after* a component's own styles, so it can retune any of them. It is
 * typed as `sx()`'s own `StyleArg` (the runtime shape our adapter accepts, in
 * place of React's opaque `StyleXStyles`). Every component destructures it out
 * of its rest props and passes it as the **final** argument of the `sx()` call
 * that builds its root, matching upstream's final-argument-to-`stylex.props`
 * ordering — which is what lets it override rather than merely append, since
 * StyleX's atomic dedup keeps the last writer of each property.
 */
export interface BaseProps<T extends EventTarget = HTMLElement> extends Omit<
	HTMLAttributes<T>,
	| 'children'
	| 'title'
	| 'contenteditable'
	// Obscure
	| 'accesskey'
	| 'autocapitalize'
	| 'autofocus'
	| 'contextmenu'
	| 'enterkeyhint'
	| 'lang'
	| 'slot'
	| 'spellcheck'
	| 'translate'
	| 'radiogroup'
	| 'inputmode'
	| 'is'
	// RDFa
	| 'about'
	| 'datatype'
	| 'inlist'
	| 'prefix'
	| 'property'
	| 'resource'
	| 'typeof'
	| 'vocab'
	// Non-standard
	| 'autosave'
	| 'color'
	| 'results'
	| 'security'
	| 'unselectable'
	// Microdata
	| 'itemprop'
	| 'itemscope'
	| 'itemtype'
	| 'itemid'
	| 'itemref'
	// Popover API (use Popover)
	| 'popover'
> {
	/**
	 * StyleX styles applied after the component's own, so they override any
	 * property they set. Authored with `stylex.create` in a `.stylex.ts` module
	 * and handed in as the value — not an inline `style` object.
	 */
	xstyle?: StyleArg;
}

/*
 * Upstream omissions with no Svelte counterpart, listed so the difference is
 * recorded rather than looking like an oversight:
 *
 *   React-only, no Svelte equivalent —
 *     dangerouslySetInnerHTML (Svelte: `{@html}`), suppressContentEditableWarning,
 *     suppressHydrationWarning, defaultChecked, defaultValue
 *
 *   Not on Svelte's base `HTMLAttributes` —
 *     nonce, content, rel, autocorrect, popovertarget, popovertargetaction,
 *     rev, exportparts
 *
 * All but the last two do exist in svelte/elements, on the element interfaces
 * that actually accept them — `nonce` on script/style, `content` on meta, `rel`
 * on a/area/link/form, `autocorrect` on input, the two popover attributes on
 * button — so the base type has nothing to strip. `rev` and `exportparts` appear
 * nowhere in svelte/elements at all.
 *
 * Going the other way, Svelte's base carries `part`, `placeholder`,
 * `elementtiming` and `writingsuggestions`, which React has no counterpart for
 * and upstream therefore never omitted. They are inherited rather than stripped:
 * removing them would be an omission upstream does not make.
 */
