// Types for the modules scripts/generate-content.mjs emits.
//
// The generated files are `.js` carrying a `@type` annotation that points here,
// so the data is typed at every import site without the generator having to
// emit TypeScript.
//
// **This file is the contract for what is emitted, so it has to stay in step
// with the generator.** A field declared here and never rendered is a field the
// next reader will try to use: `typeNotes`, `slotElements`, entry-level
// `examples`, `relatedComponents` / `relatedHooks` and `subComponentOf` all sat
// here unread, 16% of the registry's bytes, and two of them were actively wrong
// (see `finaliseRow` and `mapProp`). Anything kept but unrendered says why, in
// the doc comment on the field itself.

/** A prop row, after reconciliation against core's real declarations. */
export interface PropEntry {
	name: string;
	/** The type core declares. Falls back to the mapped upstream type when `unverified`. */
	type: string;
	description: string;
	default?: string;
	required?: boolean;
	/**
	 * The row's name upstream, when this port spells it differently
	 * (`onClick` → `onclick`, `containerRef` → `container`). Only ever set once
	 * the declaration has confirmed the new spelling.
	 */
	renamedFrom?: string;
	/**
	 * The React type upstream documents. Present **only on `unverified` rows**,
	 * where the displayed type is the mapping rather than the compiler's answer
	 * and naming what it was mapped from is the provenance. On a row core does
	 * declare, a React type would contradict the heading above the table.
	 */
	upstreamType?: string;
	/** True when core declares no such prop, so `type` is a mapping rather than ground truth. */
	unverified?: boolean;
	/**
	 * Why this field's documented value differs from upstream's `.doc.mjs`.
	 * Set by `DOC_CORRECTIONS` in `scripts/generate-content.mjs`, for the case
	 * where an upstream doc table contradicts the upstream source it documents.
	 * Rendered beside the value it corrects — a corrected default with no reason
	 * is an unexplained disagreement with the published docs.
	 */
	correctedFromUpstream?: string;
	/** Why the prop is absent from this port, when that is a deliberate translation. */
	unsupported?: string;
}

export interface BestPractice {
	guidance: boolean;
	description: string;
}

export interface AnatomyElement {
	name: string;
	required: boolean;
	description: string;
}

export interface UsageDoc {
	description: string;
	bestPractices?: BestPractice[];
	/**
	 * Deliberately unrendered: upstream ships `component-detail/Anatomy.tsx` and
	 * imports it nowhere, so the anatomy in `.doc.mjs` appears on no upstream
	 * page. Rendering it here would be invented content. See the note at
	 * `routes/components/[name]/+page.svelte`.
	 */
	anatomy?: AnatomyElement[];
}

export interface ThemingTarget {
	className: string;
	visualProps?: string[];
	states?: string[];
}

export interface ComponentVar {
	name: string;
	description?: string;
	default?: string;
	private?: boolean;
}

/** A CSS property a theme can drive through the component's vars. */
export interface DerivedVar {
	property: string;
	vars?: string[];
	expand?: string;
	formula?: string;
}

export interface ThemingDoc {
	container?: boolean;
	targets?: ThemingTarget[];
	vars?: ComponentVar[];
	derived?: DerivedVar[];
}

/**
 * The Properties tab's seed, authored upstream as `playground` in a `.doc.mjs`
 * and reduced to the three fields the stage reads (`normalisePlayground`).
 *
 * A default whose value is an upstream `ElementDescriptor` — a serialised React
 * `createElement` argument — is **dropped by the generator**, for the reason
 * `slotElements` was: this port's slots are `Snippet`s and a React element
 * cannot be turned into one. Those slots seed empty and the row's text control
 * fills them.
 */
export interface PlaygroundConfig {
	/**
	 * Initial values, keyed by prop name. Anything JSON can carry: the primitives
	 * the controls edit, plus the arrays and objects that make a preview of a
	 * data-driven component (`items`, `columns`) show something real even though
	 * no control edits them.
	 */
	defaults?: Record<string, unknown>;
	/**
	 * The component opens as a full-viewport overlay and renders nothing inline
	 * while closed, so the stage shows an open-trigger placeholder rather than an
	 * empty box. Two entries: `Lightbox` and `MobileNav`.
	 */
	overlay?: true;
	/**
	 * The parent a sub-component needs before it can render at all — `Tab` reads
	 * `useTabListContext()` and throws standalone. The previewed component
	 * becomes the wrapper's children.
	 */
	wrapper?: { component: string; props?: Record<string, unknown> };
}

export interface ComponentEntry {
	name: string;
	displayName: string;
	/** One-line prose for sub-components, which carry no full `usage` block. */
	description: string | null;
	/** The upstream directory the doc came from. */
	moduleName: string;
	/** The specifier a consumer imports this from. */
	importPath: string;
	group: string | null;
	category: string | null;
	keywords: string[];
	isHook: boolean;
	hidden: boolean;
	isHiddenFromOverview: boolean;
	usage: UsageDoc | null;
	/** The interface core publishes for this component, when it publishes one. */
	propsTypeName: string | null;
	/** Null for hooks — their surface is `params`/`returns`. */
	props: PropEntry[] | null;
	/** Reconciled against the hook's call-signature **parameter list**. */
	params: PropEntry[] | null;
	/** Reconciled against the hook's call-signature **return type**. */
	returns: PropEntry[] | null;
	/**
	 * Carried unrendered **on purpose**, unlike the fields that used to sit
	 * beside it here. Upstream renders a Theming section on the component detail
	 * Overview (`component-detail/Theming.tsx`) and this port has not built it
	 * yet, so the data is the input to work that is planned rather than dead
	 * weight. `usage.anatomy` below is the opposite case.
	 */
	theming: ThemingDoc | null;
	/** Null for the entries upstream authors no `playground` block for. */
	playground: PlaygroundConfig | null;
}

/**
 * The sidebar's projection of a `ComponentEntry` — the label it renders and the
 * name it links to, and nothing else.
 *
 * This used to be the whole entry. `side-nav.svelte` imports the grouped
 * registry into the **client** bundle, so every prop row, usage paragraph and
 * theming block in the library was shipped a second time, in a second module
 * Rollup has no way to fold into the first.
 */
export interface SidebarEntry {
	name: string;
	displayName: string;
}

export interface SidebarItem {
	kind: 'item';
	sortKey: string;
	entry: SidebarEntry;
}

export interface SidebarGroup {
	kind: 'group';
	sortKey: string;
	label: string;
	entries: SidebarEntry[];
}

export interface GroupedRegistry {
	items: Array<SidebarItem | SidebarGroup>;
	utilities: SidebarEntry[];
}

export type ContentBlock =
	| { type: 'prose'; text: string }
	| { type: 'heading'; level: 3 | 4 | 5 | 6; text: string }
	| { type: 'code'; lang: string; code: string; label?: string }
	| { type: 'table'; headers: string[]; rows: string[][] }
	| { type: 'list'; style: 'ordered' | 'unordered' | 'do' | 'dont'; items: string[] }
	| { type: 'token-ref'; topic: string; section: string };

export interface ReferenceSection {
	title: string;
	content: ContentBlock[];
	previewType?: string;
	/**
	 * Some sections repeat their topic's category. Not read by the site — the
	 * topic's own `category` is what the sidebar groups on — but it is in the
	 * authored data, so the type admits it rather than rejecting the file.
	 */
	category?: string;
}

export interface ReferenceTopic {
	name: string;
	title: string;
	description: string;
	category: 'guide' | 'foundations' | null;
	tokenCategory: string | null;
	sections: ReferenceSection[];
}

export interface ExampleEntry {
	/** `<Component>/<Block>` — also the path of its Svelte rewrite. */
	id: string;
	block: string;
	name: string;
	displayName: string;
	description: string;
	isShowcase: boolean;
	aspectRatio: number | null;
	componentsUsed: string[];
	/** False until the block's `.tsx` has been rewritten as `.svelte`. */
	hasSvelte: boolean;
}

export interface ExampleRegistry {
	byComponent: Record<string, ExampleEntry[]>;
	portedCount: number;
	pendingCount: number;
}

/**
 * One of upstream's **page** templates — a whole page, as opposed to the block
 * templates above, which are one component's worth of markup.
 *
 * Upstream's counterpart carries a `source` field holding the entire `page.tsx`;
 * it is dropped here, because the only thing that reads it is the "Open in
 * Playground" button and this port has no playground. See `buildTemplateRegistry`.
 *
 * The CLI ships 43 page templates; 42 reach this registry, because upstream's
 * generator skips the one marked `scaffold` and so does ours. The CLI still
 * scaffolds it — see `buildTemplateRegistry`.
 */
export interface TemplateEntry {
	/**
	 * Directory name under `assets/templates/pages` — the CLI's argument
	 * (`astryx-svelte template <slug>`), the gallery's `?preview=` value, and the
	 * key the importer map in `shell/example-modules.ts` resolves.
	 */
	slug: string;
	name: string;
	/**
	 * Upstream's authored display name. **Carried but not rendered**, and the
	 * reason is that it is upstream's field rather than a derivation: its own
	 * template registry drops it and its gallery captions with `name`, which is
	 * what this port's gallery does too. Every template declares it equal to
	 * `name` today, so rendering it would be indistinguishable — and inventing a
	 * difference by preferring one over the other on some rows is worse than
	 * carrying both.
	 */
	displayName: string;
	description: string;
	/** Functional category, e.g. `Dashboard - Analytics`. Empty when untagged. */
	category: string;
	/** Upstream's editorial call. A `false` template stays out of the gallery. */
	isReady: boolean;
	/** Upstream's second editorial call — CLI-available, gallery-hidden. */
	isHiddenFromOverview: boolean;
	/** `category` before the first ` - `; `Other` when untagged. */
	group: string;
	/** False until `packages/cli/assets/templates/pages/<slug>/+page.svelte` exists. */
	hasSvelte: boolean;
}

/**
 * One published theme package, as `/themes` lists it.
 *
 * Deliberately thin: everything that can be read off the imported theme object
 * — token counts, light/dark pairs, component overrides, the heading family —
 * is read there instead of copied here, so the page cannot show a stale count.
 */
export interface ThemePackage {
	/** `neutral`, `liquid-glass` — the CLI's name for it and the URL fragment. */
	slug: string;
	/** `@astryx-svelte/theme-neutral`. */
	package: string;
	version: string;
	description: string;
	/**
	 * The upstream package this one is diffed against, or **null** when it ports
	 * nothing. Only `liquid-glass` is null, and the page says so rather than
	 * letting it pass as one of Astryx's own.
	 */
	upstreamPackage: string | null;
}

/**
 * One non-theme package, as the sidebar's **Libraries** group lists it and
 * `/docs/<slug>` renders it.
 *
 * The README markdown is deliberately **not** a field here. This type reaches
 * the root layout through the sidebar, and a second copy of ~20 KB of markdown
 * in the layout chunk is exactly the leak `component-groups.js` was — the
 * bundler does not dedupe it. The text lives in {@link PackageReadmes}, which
 * only the package page's `load` imports.
 */
export interface LibraryPackage {
	/** `core`, `cli` — the URL fragment, and the key into `PackageReadmes`. */
	slug: string;
	/** `@astryx-svelte/core`. The page's `h1` and the sidebar's label. */
	name: string;
	/** Upstream's derivation: scope stripped, first letter capitalised. Title only. */
	displayName: string;
	version: string;
	description: string;
	/**
	 * True when the manifest is `private`, so npm cannot resolve it. Upstream
	 * skips such a package entirely; this port renders it and says so, because
	 * `@astryx-svelte/cli` is private and is still the CLI everything is driven
	 * by. The install block reads off this flag.
	 */
	isPrivate: boolean;
	/** Whether `PackageReadmes` has an entry for this slug. */
	hasReadme: boolean;
}

/** Package README markdown, keyed by slug. Loaded only by `/docs/<package>`. */
export type PackageReadmes = Record<string, string>;

export interface Coverage {
	/** Name and version of the package these docs describe. */
	corePackage: { name: string; version: string };
	documentedComponents: number;
	upstreamComponents: number;
	/** Upstream doc entries with no matching export in this port. */
	unported: string[];
	examplesPorted: number;
	examplesPending: number;
	/** Page templates with a `+page.svelte` under `packages/cli/assets/templates/pages`. */
	templatesPorted: number;
	/** The transcription backlog — counted over the whole registry, not the listed subset. */
	templatesPending: number;
}
