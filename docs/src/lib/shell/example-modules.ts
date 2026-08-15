import type { Component } from 'svelte';

/**
 * Every ported example block, as lazy importers keyed by registry id.
 *
 * `import.meta.glob` is Vite's build-time directory read: the keys are known at
 * build time (so a missing block is a missing key, not a failed fetch) and each
 * value is a dynamic `import()`, so a block's code is only fetched when a page
 * actually shows it. That is upstream's arrangement too — its `ShowcasePreview`
 * and `ExampleBlock` both lazily `import()` the copied `.tsx`.
 */
const modules = import.meta.glob<{ default: Component }>('$lib/examples/**/*.svelte');

/**
 * The same files again, as *text*.
 *
 * Upstream bakes each block's source into its generated registry
 * (`generate-data.mjs` → `source: ${JSON.stringify(...)}`). Doing that here
 * would put ~400 sources into a module the component pages import eagerly, so
 * they would ship on every page load to serve one collapsed tab. A second glob
 * with `?raw` gets the same bytes lazily — one chunk per block, fetched when a
 * reader actually opens Code — and can never drift from the file the preview
 * renders, because it *is* that file.
 */
const sources = import.meta.glob<string>('$lib/examples/**/*.svelte', {
	query: '?raw',
	import: 'default'
});

/** `Button/ButtonShowcase` → the module path the globs are keyed by. */
function keyFor(id: string): string {
	return `/src/lib/examples/${id}.svelte`;
}

/** The block's importer, or null when its Svelte rewrite has not landed. */
export function importerFor(id: string): (() => Promise<{ default: Component }>) | null {
	return modules[keyFor(id)] ?? null;
}

/** The block's source text, or null when its Svelte rewrite has not landed. */
export function sourceImporterFor(id: string): (() => Promise<string>) | null {
	return sources[keyFor(id)] ?? null;
}

/**
 * The **page** templates, as lazy importers keyed by slug.
 *
 * A second map rather than a second entry in the first: the two sets live in
 * different packages and are addressed differently. Blocks are
 * `<Component>/<Block>` under this app's `src/lib/examples/`; a page template is
 * a slug under `packages/cli/assets/templates/pages/`, authored there because
 * upstream ships page templates through the **CLI** as scaffolding assets and
 * the docsite merely renders them (`port/research/10-page-templates-and-community.md`
 * §B1). Reaching out of `docs/` for them is therefore the arrangement, not a
 * workaround — and it costs nothing at the module graph, because
 * `@astryx-svelte/core` is already a devDependency of `packages/cli`, so a
 * template resolves its imports from where it sits.
 *
 * Vite serves files above the project root only inside `server.fs.allow`, whose
 * default is the workspace root it finds by walking up for `pnpm-workspace.yaml`
 * — which is the monorepo root, above both packages. So no config is needed;
 * this note exists because the failure, if that default ever changed, is a 403
 * on the template chunk rather than anything the type system would catch.
 *
 * The glob resolves to `{}` while the directory is empty, so the gallery is
 * correct before the transcription batches land rather than after: every slug
 * gets a `null` importer and the registry's `hasSvelte` keeps them off the page.
 */
const templateModules = import.meta.glob<{ default: Component }>(
	'../../../../packages/cli/assets/templates/pages/*/+page.svelte'
);

/**
 * The same map, re-keyed by slug.
 *
 * `keyFor` below reconstructs a block's module path from its id, which works
 * because the `$lib` alias gives that glob keys of a shape this file can spell.
 * A *relative* glob is keyed by the pattern's own relative path, and rebuilding
 * a `../../../../…` string to look one up would encode this file's depth in two
 * places that must agree. Reading the slug back out of whatever keys Vite
 * produced cannot drift.
 */
const templateModulesBySlug: Record<string, () => Promise<{ default: Component }>> =
	Object.fromEntries(
		Object.entries(templateModules).map(([key, load]) => {
			const segments = key.split('/');
			return [segments[segments.length - 2], load];
		})
	);

/** The page template's importer, or null when its transcription has not landed. */
export function templateImporterFor(slug: string): (() => Promise<{ default: Component }>) | null {
	return templateModulesBySlug[slug] ?? null;
}

/**
 * Drops the porting note every block file opens with.
 *
 * Upstream shows its block sources verbatim, header comment and all — but its
 * header is a copyright notice that belongs in copied code, whereas ours is a
 * note to *this repo's* contributors about where the block came from and that
 * it was transcribed rather than authored. In a snippet a reader is meant to
 * paste into their own app it is noise at best and misleading at worst, so the
 * Code tab shows the example and not the provenance. Stripping our own addition
 * moves the rendered source closer to upstream's, not further from it.
 */
export function stripPortingNote(source: string): string {
	return source.replace(/^\s*<!--[\s\S]*?-->\s*\n/, '');
}
