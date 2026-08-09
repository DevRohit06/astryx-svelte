// React → Svelte prop-type mapping for the generated props tables.
//
// `.doc.mjs` prop `type` strings are React-typed (`ReactNode`,
// `ReactElement<IconProps>`, `(e: MouseEvent) => void`). Rendering them verbatim
// would document an API this library does not have, so each is rewritten to the
// type the Svelte port actually accepts. This is adaptation the port cannot
// avoid — planning/04 risk #2 — not an invented API: every rewrite below
// corresponds to a translation the components already make.
//
// Anything not matched here is passed through unchanged, so a type this table
// does not know about is still shown truthfully rather than mangled.

/**
 * Ordered rewrites. Longest / most specific patterns first, because
 * `ReactElement<IconProps>` must not be caught by the bare `ReactElement` rule.
 *
 * @type {Array<{pattern: RegExp, replacement: string, note?: string}>}
 */
const TYPE_RULES = [
	// A slot that upstream types as a specific element becomes a snippet taking
	// no arguments — the port renders these with `{@render}`.
	{
		pattern: /\bReactElement<[^>]*>/g,
		replacement: 'Snippet',
		note: 'React element slots are Svelte snippets.'
	},
	// `ReactNode` is upstream's "anything renderable". The port accepts either a
	// plain string or a snippet; the `typeof === "function"` discriminator in
	// the components is what makes the union safe.
	{
		pattern: /\bReactNode\b/g,
		replacement: 'string | Snippet',
		note: 'Renderable slots accept a string or a snippet.'
	},
	{ pattern: /\bReactElement\b/g, replacement: 'Snippet' },
	{ pattern: /\bJSX\.Element\b/g, replacement: 'Snippet' },
	// Refs have no Svelte counterpart; the port exposes the element through an
	// attachment or `bind:this` instead.
	//
	// Each of these must absorb an optional `React.` prefix, and the `RefObject`
	// rule did not: `React.RefObject<HTMLElement>` matched at `RefObject`, the
	// generic was substituted, and the orphaned namespace was left glued to it —
	// rendering `React.HTMLElement | null`, which is not a type in any language.
	// Four rows carried it.
	//
	// A row reaching these rules is one core does not declare, so it is already
	// flagged and carries a note naming the real mechanism (an `attach…`
	// attachment, or an instance export for `handleRef`). These rewrites only
	// keep the Type column showing a *real* type rather than a React spelling.
	{
		pattern: /\b(?:React\.)?RefObject<([^>]*)>/g,
		replacement: '$1 | null',
		note: 'Refs are replaced by `bind:this` or an attachment.'
	},
	{
		pattern: /\b(?:React\.)?RefCallback<([^>]*)>/g,
		replacement: '(node: $1 | null) => void',
		note: 'Refs are replaced by `bind:this` or an attachment.'
	},
	{
		pattern: /\b(?:React\.)?Ref<([^>]*)>/g,
		replacement: '$1 | null',
		note: 'Refs are replaced by `bind:this` or an attachment.'
	},
	{ pattern: /\bReact\.CSSProperties\b/g, replacement: 'string' },
	{ pattern: /\bCSSProperties\b/g, replacement: 'string' },
	// React's synthetic events are the DOM events in Svelte.
	{ pattern: /\bReact\.(\w+)Event<[^>]*>/g, replacement: '$1Event' },
	{ pattern: /\bReact\.(\w+)Event\b/g, replacement: '$1Event' },
	{ pattern: /\bReact\.ComponentType<([^>]*)>/g, replacement: 'Component<$1>' },
	{ pattern: /\bReact\.ComponentType\b/g, replacement: 'Component' },
	{ pattern: /\bComponentType<([^>]*)>/g, replacement: 'Component<$1>' }
];

/**
 * Prop names React spells in camelCase and the DOM (so Svelte) spells lowercase.
 * Only the handlers upstream actually documents are listed; an unknown `onX`
 * stays as authored rather than being guessed at.
 */
const EVENT_PROP_RENAMES = new Map([
	['onClick', 'onclick'],
	['onChange', 'onchange'],
	['onInput', 'oninput'],
	['onFocus', 'onfocus'],
	['onBlur', 'onblur'],
	['onKeyDown', 'onkeydown'],
	['onKeyUp', 'onkeyup'],
	['onMouseEnter', 'onmouseenter'],
	['onMouseLeave', 'onmouseleave'],
	['onPointerDown', 'onpointerdown'],
	['onPointerUp', 'onpointerup'],
	['onSubmit', 'onsubmit'],
	['onScroll', 'onscroll']
]);

/**
 * Rewrite one `type` string.
 *
 * @param {string} type
 * @returns {{type: string, notes: string[]}}
 */
export function mapPropType(type) {
	if (typeof type !== 'string' || type.length === 0) return { type, notes: [] };

	let mapped = type;
	/** @type {string[]} */
	const notes = [];

	for (const rule of TYPE_RULES) {
		// `.test` on a /g regex is stateful; rebuild per use.
		const probe = new RegExp(rule.pattern.source, rule.pattern.flags);
		if (!probe.test(mapped)) continue;
		mapped = mapped.replace(rule.pattern, rule.replacement);
		if (rule.note && !notes.includes(rule.note)) notes.push(rule.note);
	}

	// Collapse a union that the rewrites made redundant, e.g. a
	// `ReactNode | string` becoming `string | Snippet | string`.
	if (mapped.includes('|')) {
		const parts = mapped.split('|').map((p) => p.trim());
		if (parts.every((p) => p.length > 0 && !p.includes('('))) {
			const unique = [...new Set(parts)];
			if (unique.length !== parts.length) mapped = unique.join(' | ');
		}
	}

	return { type: mapped, notes };
}

/**
 * Rewrite one prop name, if it is a React-cased DOM handler.
 *
 * @param {string} name
 * @returns {{name: string, renamedFrom?: string}}
 */
export function mapPropName(name) {
	const renamed = EVENT_PROP_RENAMES.get(name);
	return renamed ? { name: renamed, renamedFrom: name } : { name };
}

/**
 * Apply both mappings to a whole `PropDoc`, preserving every other field.
 *
 * **The notes are deliberately not attached.** They used to ride along as
 * `typeNotes` and they were wrong wherever they were visible: `reconcileProp`
 * keeps the *compiler's* type, so on 244 of the 287 rows that carried a note the
 * rewrite it describes had not been applied — `AppShell.children` read
 * "Renderable slots accept a string or a snippet" beside a declared `Snippet`,
 * which is exactly the `Button.icon` mistake CLAUDE.md warns about. On the other
 * 43, where the mapping *is* what gets rendered, every one already carried a
 * more specific `unsupported` note from `classifyUndeclaredProp`.
 *
 * `mapPropType` still returns them because each note documents its rule in
 * place, and a future caller that renders a mapped type without a fallback note
 * would want them. Nothing renders them today.
 *
 * @param {Record<string, unknown>} prop
 * @returns {Record<string, unknown>}
 */
export function mapProp(prop) {
	const { type } = mapPropType(/** @type {string} */ (prop.type));
	const { name, renamedFrom } = mapPropName(/** @type {string} */ (prop.name));

	return {
		...prop,
		name,
		type,
		...(renamedFrom ? { renamedFrom } : {})
	};
}
