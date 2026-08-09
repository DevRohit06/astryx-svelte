import { getContext, setContext } from 'svelte';

/**
 * Ids for a rendered README's headings, handed out in document order.
 *
 * ## Why this exists, and why upstream needs nothing like it
 *
 * `PackageStubPage` has to put the ids `parseOutlineFromMarkdown` minted onto
 * the headings `Markdown` renders, so the outline's `#anchor` links resolve.
 * Upstream does it **after** rendering: a callback ref runs during React's
 * commit, walks `querySelectorAll('h1…h6')` and assigns `headingItems[i].id`
 * positionally.
 *
 * That translates to a Svelte attachment almost exactly — and it was written
 * that way first. It fails here for a reason React's docsite does not have:
 * **these pages are prerendered, and SvelteKit validates every `#fragment` link
 * against the HTML it produced.** An id assigned in an effect is not in that
 * HTML, so `pnpm -F docs build` fails with
 * `no element with id="…" exists on /docs/cli`. The check is right: a reader who
 * opens a deep link gets the served document, and the browser resolves the
 * fragment before any of our JavaScript runs.
 *
 * So the id is assigned **during** render instead. The page publishes the id
 * list here; the `components.heading` override takes the next one as it
 * initialises. Both the server pass and the client build create heading
 * components in document order, which is the same ordering upstream's
 * `querySelectorAll` relies on — the ordering assumption is unchanged, only the
 * moment it is applied.
 *
 * The cursor is stateful, so it must not outlive one render of one README.
 * `package-stub-page.svelte` wraps the provider in `{#key body}`: SvelteKit
 * reuses the page component across a `/docs/core` → `/docs/cli` navigation, and
 * without the key the second README's headings would keep drawing from the
 * first one's exhausted cursor.
 */
const HEADING_IDS = Symbol('astryx-docs.markdown-heading-ids');

export interface HeadingIdCursor {
	/** The next id in document order, or `undefined` past the end. */
	take(): string | undefined;
}

/**
 * Called by the provider component, once per rendered README.
 *
 * The ids arrive as a **getter**, on this repo's standing context rule: a
 * context that stores a value snapshots it, and `headingIds` is `$derived` from
 * the README. The key on the provider means it should never actually change
 * under a live cursor — the getter is what makes that a property of the code
 * rather than of the caller remembering.
 */
export function setHeadingIds(ids: () => string[]): void {
	let index = 0;
	setContext<HeadingIdCursor>(HEADING_IDS, {
		take: () => ids()[index++]
	});
}

/**
 * Called by the heading override during its own initialisation. Returns
 * `undefined` outside a README — `Markdown` is a public component and its
 * `heading` override could be reused elsewhere.
 */
export function takeHeadingId(): string | undefined {
	return getContext<HeadingIdCursor | undefined>(HEADING_IDS)?.take();
}
