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
