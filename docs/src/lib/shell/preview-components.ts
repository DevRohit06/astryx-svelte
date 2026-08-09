import { createRawSnippet, type Component, type Snippet } from 'svelte';
import * as core from '@astryx-svelte/core';

/**
 * The two things the interactive preview needs from the library itself: the
 * component behind a registry name, and a way to put an edited string into a
 * slot.
 *
 * Upstream's counterpart is `component-detail/resolveElements.ts`, which reads
 * the same barrel by name. The second half has no upstream counterpart at all,
 * and it is where this port's playground has to be its own thing rather than a
 * translation — see {@link textSnippet}.
 */

/**
 * Every named export of the barrel. Components are plain functions in Svelte 5,
 * so this is the same "look the name up and check it is callable" upstream does
 * with `Core[name as keyof typeof Core]`.
 */
const exported = core as unknown as Record<string, unknown>;

/**
 * The component a registry entry names, or null when there is nothing to render.
 *
 * Two reasons for null, and the second is the interesting one. A name the barrel
 * does not export is simply absent. A name that *is* exported but is a **hook**
 * is refused: a Svelte 5 component is an ordinary function, so `useTableSortable`
 * and `Button` are indistinguishable by inspection, and calling a hook as a
 * component throws inside the renderer rather than returning nothing. Nine
 * registry entries are hooks upstream authors as `ComponentDoc`s — the
 * `useTable*` plugins, noted in TODO.md's props-page audit — and they reach this
 * function looking exactly like components.
 */
export function previewComponentFor(name: string): Component<Record<string, unknown>> | null {
	if (/^use[A-Z]/.test(name)) return null;
	const value = exported[name];
	// The cast is the same one upstream makes with `ComponentType<any>`: the
	// registry knows a name, and the props it will be handed are only known at
	// runtime.
	return typeof value === 'function' ? (value as Component<Record<string, unknown>>) : null;
}

/** `&`, `<` and `"` — the three that can end a text node or an attribute early. */
function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * Wrap an edited string into a `Snippet`, so a text control can fill a slot.
 *
 * **This is the playground's one real divergence from upstream, and it exists
 * because the port itself diverges there.** Upstream's `children` / `icon` /
 * `label` slots are `ReactNode`, and a React node can be a bare string — so
 * upstream's text control writes the string straight into the prop bag and is
 * done. Here those props are `Snippet`, and a string is not assignable to one:
 * without this wrapper, the single most useful knob on most components (the text
 * it renders) would have no control at all.
 *
 * `createRawSnippet` is the public API for building a snippet outside a
 * component's markup, and the only one — a `{#snippet}` block cannot be created
 * per prop name at runtime. It works in both the server and client runtimes, and
 * its contract is that `render` returns exactly **one element**, which is why the
 * text is wrapped in a `<span>`. The span is given `display: contents` so it
 * contributes no box of its own and the text lays out as though it were written
 * directly in the slot.
 *
 * No `setup`, so the snippet is static: a new one is built whenever the text
 * changes, and passing a different snippet re-renders the slot.
 */
export function textSnippet(text: string): Snippet {
	return createRawSnippet(() => ({
		render: () => `<span style="display: contents">${escapeHtml(text)}</span>`
	}));
}
