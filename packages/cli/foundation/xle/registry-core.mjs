/**
 * @file XLE registry — pure core (no Node deps).
 *
 * The fs-bound builder lives in registry.mjs; everything here is
 * environment-agnostic so it can run in the browser playground too.
 * This holds the alias table, enum parsing, the component-entry shape,
 * name resolution, and the serialize/hydrate pair that lets a Node
 * build step ship a registry to the browser as plain JSON.
 *
 * @input  doc.mjs-shaped prop arrays (from registry.mjs) or serialized JSON
 * @output ALIAS_TABLE, parseEnumValues, toComponentEntry, resolveComponent,
 *         serializeRegistry, hydrateRegistry
 * @position foundation/xle — imported by registry.mjs (Node) and the browser barrel
 */

/**
 * Curated alias table (from the XLE research, paste P2376666892 §2).
 * Single letters reserved for the highest-frequency structural set.
 * Collision policy: case-only pairs forbidden; HTML mnemonics win the
 * Table family; form-frequency wins contested pairs (CB, NI).
 *
 * Aliases are validated against the discovered registry — an alias whose
 * component doesn't exist on this branch is silently dropped. Ported
 * unchanged: all 122 targets resolve against `@astryx-svelte/core`, so the
 * table needed no editing for the port.
 */
export const ALIAS_TABLE = {
	// Layout core
	A: 'AppShell',
	L: 'Layout',
	LH: 'LayoutHeader',
	LC: 'LayoutContent',
	LF: 'LayoutFooter',
	LP: 'LayoutPanel',
	V: 'VStack',
	H: 'HStack',
	SI: 'StackItem',
	G: 'Grid',
	GS: 'GridSpan',
	S: 'Section',
	Ctr: 'Center',
	F: 'FormLayout',
	D: 'Divider',
	Tbar: 'Toolbar',
	AR: 'AspectRatio',
	// Navigation
	TN: 'TopNav',
	TNH: 'TopNavHeading',
	TNI: 'TopNavItem',
	SN: 'SideNav',
	SNI: 'SideNavItem',
	SNS: 'SideNavSection',
	SNH: 'SideNavHeading',
	MN: 'MobileNav',
	MNT: 'MobileNavToggle',
	BC: 'Breadcrumbs',
	BCI: 'BreadcrumbItem',
	TL: 'TabList',
	Tab: 'Tab',
	PG: 'Pagination',
	SG: 'SegmentedControl',
	SGI: 'SegmentedControlItem',
	// Data display
	T: 'Table',
	TH: 'TableHeader',
	TB: 'TableBody',
	TF: 'TableFooter',
	TR: 'TableRow',
	TC: 'TableCell',
	TD: 'TableCell',
	THC: 'TableHeaderCell',
	UL: 'List',
	LI: 'ListItem',
	ML: 'MetadataList',
	MLI: 'MetadataListItem',
	C: 'Card',
	CC: 'ClickableCard',
	ES: 'EmptyState',
	Bd: 'Badge',
	SD: 'StatusDot',
	Av: 'Avatar',
	AvG: 'AvatarGroup',
	Tmb: 'Thumbnail',
	Ts: 'Timestamp',
	OFL: 'OverflowList',
	Cs: 'Carousel',
	It: 'Item',
	// Forms & inputs
	Fd: 'Field',
	IG: 'InputGroup',
	IGT: 'InputGroupText',
	TI: 'TextInput',
	TA: 'TextArea',
	NI: 'NumberInput',
	DI: 'DateInput',
	DR: 'DateRangeInput',
	DT: 'DateTimeInput',
	TM: 'TimeInput',
	FI: 'FileInput',
	CB: 'CheckboxInput',
	CL: 'CheckboxList',
	CLI: 'CheckboxListItem',
	RL: 'RadioList',
	RLI: 'RadioListItem',
	SW: 'Switch',
	SL: 'Slider',
	SE: 'Selector',
	MS: 'MultiSelector',
	TY: 'Typeahead',
	Tkz: 'Tokenizer',
	PS: 'PowerSearch',
	CAL: 'Calendar',
	// Overlay & feedback
	Dlg: 'Dialog',
	DH: 'DialogHeader',
	AD: 'AlertDialog',
	Po: 'Popover',
	HC: 'HoverCard',
	Tt: 'Tooltip',
	Bn: 'Banner',
	Ov: 'Overlay',
	CM: 'ContextMenu',
	DM: 'DropdownMenu',
	MM: 'MoreMenu',
	CP: 'CommandPalette',
	Col: 'Collapsible',
	ColG: 'CollapsibleGroup',
	Sp: 'Spinner',
	PB: 'ProgressBar',
	Sk: 'Skeleton',
	// Content & chat
	Tx: 'Text',
	Hd: 'Heading',
	MD: 'Markdown',
	Cd: 'CodeBlock',
	BQ: 'Blockquote',
	K: 'Kbd',
	Ic: 'Icon',
	Lk: 'Link',
	Tk: 'Token',
	B: 'Button',
	IB: 'IconButton',
	BG: 'ButtonGroup',
	Tg: 'ToggleButton',
	TgG: 'ToggleButtonGroup',
	ChL: 'ChatLayout',
	ChML: 'ChatMessageList',
	ChM: 'ChatMessage',
	ChB: 'ChatMessageBubble',
	ChC: 'ChatComposer',
	ChCD: 'ChatComposerDrawer',
	ChS: 'ChatSystemMessage',
	ChT: 'ChatToolCalls'
};

/** SpacingStep — the canonical spacing enum (matches the doc.mjs prose). */
export const SPACING_STEPS = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10];

/**
 * Parse enum values from a doc.mjs prop type string.
 * "'a' | 'b' | 'c'" -> ['a','b','c'];  "1|2|3" -> [1,2,3];
 * "SpacingStep" -> SPACING_STEPS. Mixed/non-enum types -> null.
 *
 * Both spellings matter here. Upstream's docs write the named alias
 * `SpacingStep`; this port's are generated from its own compiled declarations,
 * where the alias is already expanded to the literal union — which is exactly
 * what the second branch of the first test recognises.
 *
 * @param {string | undefined | null} type
 * @returns {Array<string | number> | null}
 */
export function parseEnumValues(type) {
	if (!type || typeof type !== 'string') return null;
	const t = type.trim();
	if (t === 'SpacingStep' || /^0\|0\.5\|/.test(t.replace(/\s+/g, ''))) {
		return SPACING_STEPS;
	}
	const parts = t.split('|').map((p) => p.trim());
	if (parts.length < 2) return null;
	/** @type {Array<string | number>} */
	const values = [];
	for (const part of parts) {
		const str = part.match(/^'([^']*)'$/) || part.match(/^"([^"]*)"$/);
		if (str) {
			values.push(str[1]);
			continue;
		}
		if (/^\d+(\.\d+)?$/.test(part)) {
			values.push(Number(part));
			continue;
		}
		return null; // union of non-literal types (e.g. number|string) — not an enum
	}
	return values;
}

/**
 * Strip the legacy `XDS` prefix from a name.
 *
 * Kept as *input* leniency only. Neither Astryx's own core nor this port
 * exports a prefixed identifier, but the grammar cheatsheet documents the
 * prefix as optional and expressions in the wild carry it, so `XDSAppShell`
 * still resolves to `AppShell`.
 *
 * @param {string} name
 */
export function normalizeName(name) {
	return name.replace(/^XDS/, '');
}

/**
 * Index one doc entry's props into the registry component shape.
 *
 * Two divergences from upstream, both forced by what this port's core really
 * is:
 *
 * - `exportName` is the bare name. Upstream stores `XDS${name}` and emits it as
 *   the tag, which does not resolve against upstream's own package either
 *   (`@astryxdesign/core/Button` exports `Button`, never `XDSButton`) — its
 *   layout suite only checks that the generated TSX *parses*, so the dangling
 *   identifier is never caught. Replicating it would make every generated file
 *   fail to compile, so it is corrected rather than inherited; see port/todo.md.
 * - `isNode` looks for `Snippet`, the type this port's docs give renderable
 *   props, where upstream's give `ReactNode`/`ReactElement`.
 *
 * @param {string} name
 * @param {import('./xle-ast').DocProp[]} props
 * @param {string} dirName
 * @param {string} importPath
 * @returns {import('./xle-ast').RegistryComponent}
 */
export function toComponentEntry(name, props, dirName, importPath) {
	/** @type {Map<string, import('./xle-ast').RegistryProp>} */
	const propMap = new Map();
	for (const p of props || []) {
		propMap.set(p.name, {
			name: p.name,
			type: p.type || '',
			required: p.required === true,
			enumValues: parseEnumValues(p.type),
			isBoolean: (p.type || '').trim() === 'boolean',
			isFunction: /^\(/.test((p.type || '').trim()),
			isNode: /\bSnippet\b/.test(p.type || '')
		});
	}
	return { name, exportName: name, dirName, importPath, props: propMap };
}

/**
 * Resolve a node name (alias, bare name, or XDS-prefixed name) to a
 * registry component entry, or null.
 * @param {import('./xle-ast').Registry} registry
 * @param {string | null} name
 * @returns {import('./xle-ast').RegistryComponent | null}
 */
export function resolveComponent(registry, name) {
	if (name == null) return null;
	const viaAlias = registry.aliases.get(name);
	if (viaAlias) return registry.components.get(viaAlias) ?? null;
	const bare = normalizeName(name);
	return registry.components.get(bare) || null;
}

/**
 * Serialize a built registry (with Map fields) to a plain JSON-safe object
 * so a Node build step can ship it to the browser.
 * @param {import('./xle-ast').Registry} registry
 * @returns {import('./browser').SerializedRegistry}
 */
export function serializeRegistry(registry) {
	return {
		components: [...registry.components.values()].map((c) => ({
			name: c.name,
			exportName: c.exportName,
			dirName: c.dirName,
			importPath: c.importPath,
			undocumented: c.undocumented || false,
			props: /** @type {Array<Record<string, unknown>>} */ (
				/** @type {unknown} */ ([...c.props.values()])
			)
		})),
		aliases: [...registry.aliases.entries()],
		componentNames: registry.componentNames
	};
}

/**
 * Hydrate a serialized registry back into the Map-bearing shape that
 * validate()/expand() expect. Inverse of serializeRegistry.
 * @param {import('./browser').SerializedRegistry} json
 * @returns {import('./xle-ast').Registry}
 */
export function hydrateRegistry(json) {
	/** @type {Map<string, import('./xle-ast').RegistryComponent>} */
	const components = new Map();
	for (const c of json.components) {
		/** @type {Map<string, import('./xle-ast').RegistryProp>} */
		const props = new Map();
		for (const p of c.props) {
			const prop = /** @type {import('./xle-ast').RegistryProp} */ (/** @type {unknown} */ (p));
			props.set(String(p.name), prop);
		}
		components.set(c.name, {
			name: c.name,
			exportName: c.exportName,
			dirName: c.dirName,
			importPath: c.importPath,
			undocumented: c.undocumented || false,
			props
		});
	}
	return {
		components,
		aliases: new Map(json.aliases),
		componentNames: json.componentNames || [...components.keys()].sort()
	};
}
