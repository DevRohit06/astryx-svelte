/**
 * Public type surface for file-based codemod authoring (exported from
 * `@astryx-svelte/cli/codemod` and `@astryx-svelte/cli/authoring`).
 *
 * Authors write a plain object against {@link AstryxCodemodDef} /
 * {@link AstryxConfigCodemodDef} and default-export it with a `type`
 * discriminant (`'code'` | `'config'`); the CLI validates it via `parseCodemod`
 * at the load boundary. There is no factory to call.
 */

import type MagicString from 'magic-string';

/** A single source file presented to a codemod's transform. */
export interface AstryxCodemodFile {
	/** Absolute path to the file being transformed. */
	path: string;
	/** The current source contents of the file. */
	source: string;
}

/**
 * The `magic-string` constructor, as the codemod api hands it over. Declared as
 * a constructor type rather than re-exporting the class so this file states the
 * one thing the contract promises — that `new api.magicString(source)` gives you
 * a MagicString — without republishing `magic-string`'s whole surface.
 */
export type MagicStringCtor = new (source: string) => MagicString;

/**
 * `svelte/compiler`'s `parse`, in modern (AST) mode. The return is `unknown`
 * because Svelte does not publish a stable AST type and this port will not
 * invent one; a transform narrows it itself. See `assets/codemods/svelte-parser.mjs`
 * for what it can read.
 */
export type SvelteParse = (source: string, options: { modern: true }) => unknown;

/**
 * A node the walker visits. Deliberately structural rather than Svelte's own
 * AST union: `svelte/compiler` does not publish the node types, and naming a
 * closed set here would go stale on every Svelte minor. What a transform
 * actually needs is the discriminant and the two offsets, and those are stable.
 */
export interface SvelteAstNode {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

/** The context object `walk`'s visitors receive as their second argument. */
export interface SvelteWalkContext<State> {
	/** State for this subtree; pass a new object to scope it to children. */
	state: State;
	/** Continue into this node's children. A visitor that never calls it prunes. */
	next: (state?: State) => void;
	/** Visit a specific node with the given state. */
	visit: (node: SvelteAstNode, state?: State) => void;
	/** Ancestors, nearest first. */
	path: SvelteAstNode[];
	/** Stop the walk entirely. */
	stop: () => void;
}

/**
 * `zimmerframe`'s `walk` — the walker Svelte's own Svelte 4 -> 5 codemod uses.
 *
 * Taken from `zimmerframe` directly, not from the compiler namespace:
 * `svelte/compiler` exports the *name* `walk`, but it is a tombstone that
 * throws on call ("no longer exports a `walk` utility"), so a `typeof` check
 * passes and the transform fails at runtime.
 *
 * Visitors are keyed by node `type`, and a visitor that does not call `next()`
 * prunes that subtree. This is a **read** interface: the walk locates offsets
 * and `magicString` performs the edit. Mutating a node changes nothing, because
 * nothing re-prints the tree.
 */
export type SvelteWalk = <State>(
	node: SvelteAstNode,
	state: State,
	visitors: Record<string, (node: any, context: SvelteWalkContext<State>) => void>
) => SvelteAstNode;

/** Helpers and context passed to a codemod's transform as the second argument. */
export interface AstryxCodemodApi {
	/**
	 * The `magic-string` class. Construct one over `file.source`, splice by byte
	 * offset, and return `s.toString()`:
	 *
	 * ```js
	 * const s = new api.magicString(file.source);
	 * s.overwrite(attr.start, attr.end, 'variant="primary"');
	 * return s.toString();
	 * ```
	 *
	 * This is half of what replaces jscodeshift here. It edits the original
	 * buffer instead of re-printing an AST, so everything the transform does not
	 * touch — formatting, comments, line endings — survives byte for byte.
	 */
	magicString: MagicStringCtor;
	/**
	 * `svelte/compiler`'s parser, the other half. Parse `file.source` to locate
	 * the offsets you then hand to `magicString`; every AST node carries `start`
	 * and `end`.
	 */
	parseSvelte: SvelteParse;
	/**
	 * `svelte/compiler`'s `walk`, for finding those offsets without hand-rolling
	 * a recursive descent over the tree `parseSvelte` returns:
	 *
	 * ```js
	 * const ast = api.parseSvelte(file.source, {modern: true});
	 * const s = new api.magicString(file.source);
	 * api.walk(ast, null, {
	 *   RegularElement(node, {next}) { next(); },
	 *   Component(node, {next}) {
	 *     if (node.name === 'Widget') {
	 *       for (const attr of node.attributes) {
	 *         if (attr.name === 'wash') s.overwrite(attr.start, attr.start + 4, 'muted');
	 *       }
	 *     }
	 *     next();
	 *   }
	 * });
	 * return s.toString();
	 * ```
	 *
	 * Visitors are keyed by node `type`; one that does not call `next()` prunes
	 * that subtree. **The walk is for reading only** — mutating a node changes
	 * nothing, because the runner splices the original buffer rather than
	 * re-printing the tree. Svelte's own Svelte 4 -> 5 codemod pairs the same
	 * three pieces (parse, walk, magic-string), so this is the framework's own
	 * combination rather than one invented here.
	 */
	walk: SvelteWalk;
	/**
	 * A jscodeshift instance configured with a parser for the file.
	 *
	 * The wrong tool in this port, and knowingly so: jscodeshift cannot parse
	 * `.svelte`, so it is never being ported. The field survives because it is
	 * part of upstream's published authoring contract and removing it would
	 * change the shape a third-party codemod is written against; **nothing here
	 * populates it** — the runner passes `undefined` and the pair above is what a
	 * Svelte codemod actually uses.
	 */
	jscodeshift: unknown;
	/** Report a statistic (no-op-friendly; provided for jscodeshift parity). */
	stats: (...args: unknown[]) => void;
	/** Report progress (no-op-friendly; provided for jscodeshift parity). */
	report: (...args: unknown[]) => void;
}

/**
 * A codemod's transform. Return the new source to rewrite the file, or
 * `null`/`undefined` to leave the file unchanged.
 */
export type AstryxCodemodTransform = (
	file: AstryxCodemodFile,
	api: AstryxCodemodApi
) => string | null | undefined;

/** Definition an author writes for a file-transforming codemod. */
export interface AstryxCodemodDef {
	/** Short, human-readable title shown in upgrade output. */
	title: string;
	/** Optional longer description. */
	description?: string;
	/** When true, the codemod runs only when explicitly requested. */
	isOptional?: boolean;
	/** File extensions this codemod applies to (e.g. ['.svelte', '.ts']). */
	fileExtensions?: string[];
	/** The transform function. */
	transform: AstryxCodemodTransform;
}

/** A validated file-transforming codemod (its default export, `type: 'code'`). */
export interface AstryxCodemod extends AstryxCodemodDef {
	isOptional: boolean;
	type: 'code';
}

/** Definition an author writes for a config-targeting codemod. */
export interface AstryxConfigCodemodDef {
	/** Short, human-readable title shown in upgrade output. */
	title: string;
	/** Optional longer description. */
	description?: string;
	/** When true, the codemod runs only when explicitly requested. */
	isOptional?: boolean;
	/** The transform function applied to the astryx-svelte.config.* file. */
	transform: AstryxCodemodTransform;
}

/** A validated config-targeting codemod (its default export, `type: 'config'`). */
export interface AstryxConfigCodemod extends AstryxConfigCodemodDef {
	isOptional: boolean;
	type: 'config';
}

// ---------------------------------------------------------------------------
// Internal types — shared by the CLI codemod runner infra. Not part of the
// public authoring barrel; kept here so the .mjs runners' JSDoc stays
// consistent, exactly as upstream keeps its own.
//
// Five of upstream's six are below. The sixth, `JscodeshiftFactory`, has no
// counterpart and never will: it exists only to describe jscodeshift's untyped
// AST surface, and jscodeshift cannot parse `.svelte`. {@link MagicStringCtor}
// and {@link SvelteParse} above are what this runner threads through instead,
// so `CodemodTransformApi` differs from {@link AstryxCodemodApi} in the opposite
// direction from upstream's: it *narrows* `jscodeshift` to `undefined` rather
// than widening it to a callable factory.
// ---------------------------------------------------------------------------

/**
 * A codemod transform as the runner invokes it. Same call signature an author
 * writes ({@link AstryxCodemodTransform}); the difference is the api it is
 * handed, which is {@link CodemodTransformApi}.
 */
export type CodemodTransform = (
	file: AstryxCodemodFile,
	api: CodemodTransformApi
) => string | null | undefined;

/**
 * The `api` argument as the runner constructs it. Identical to
 * {@link AstryxCodemodApi} except `jscodeshift` is `undefined` — the runner has
 * no jscodeshift to give, and saying so in the type is what stops a transform
 * in this repo from being written against a field that is always absent.
 */
export interface CodemodTransformApi {
	magicString: MagicStringCtor;
	parseSvelte: SvelteParse;
	walk: SvelteWalk;
	jscodeshift: undefined;
	stats: (...args: unknown[]) => void;
	report: (...args: unknown[]) => void;
}

/**
 * A normalized codemod entry produced by both the core registry runner and
 * integration discovery. See the header of `run-codemod.mjs` for the contract.
 */
export interface CodemodEntry {
	/** Unique id within its package/version (e.g. the transform module name). */
	id: string;
	/** Whether this is a source-file codemod or a config-file codemod. */
	type: 'code' | 'config';
	/** The codemod itself. */
	codemod: {
		title: string;
		description?: string;
		isOptional?: boolean;
		fileExtensions?: string[];
		transform: CodemodTransform;
	};
	/** Owning package name. */
	package: string;
	/** Owning package version. */
	version?: string;
}

/** The result of running a single codemod over one or more files. */
export interface CodemodRunResult {
	filesChanged: number;
	writtenFiles: string[];
	errors: Array<{ file: string; codemod: string; error: string }>;
}

/** The console-like log surface used across the codemod runners. */
export interface CliLog {
	step: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	success: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
	message?: (...args: unknown[]) => void;
}
