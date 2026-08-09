import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BaseTypeahead from '$lib/components/typeahead/base-typeahead.svelte';
import type { SearchSource, SearchableItem } from '$lib/components/typeahead/types.js';

/**
 * **No upstream counterpart, and the bar for that is met here.**
 *
 * Upstream's `Typeahead.test.tsx` has exactly one case for `BaseTypeahead`'s
 * scroll effect — *scrolls the highlighted option into view during arrow
 * navigation* — and it is already ported verbatim in `typeahead.svelte.test.ts`.
 * It cannot have a case for what this file asserts, because the hazard does not
 * exist in React.
 *
 * `useEffect` takes a **declared** dependency array, so the deps are the same
 * whichever branch the body takes; upstream's effect can early-return above
 * `results.length` and still re-run when `results` changes. `$effect` tracks
 * reads **dynamically**: a read that only happens after an early return is not
 * tracked on the runs that bail, so the effect quietly narrows its own
 * dependency set and stops re-running. Batch 18's fix hoists all three reads
 * above the guard for that reason, and adds the `results` read the third clause
 * needs.
 *
 * The observable consequence is a virtual cursor that stops following the list:
 * when a new search returns a different set but the highlight stays on index 0 —
 * the common case, since `performSearch` writes `highlightedIndex = 0` — nothing
 * else in the dependency set moves, so `results.length` is the *only* thing that
 * can re-fire the effect and scroll the new first row into view.
 *
 * The ported suite structurally cannot catch it: every one of its cases drives
 * the highlight with arrow keys, which changes `highlightedIndex` and therefore
 * re-fires the effect through a dependency the buggy version still had.
 *
 * Mutation-checked: deleting `const count = results.length;` from the effect in
 * `base-typeahead.svelte` (and the `index >= count` clause that reads it) fails
 * both cases below.
 *
 * ## One case declined, and why
 *
 * The brief also asked for *no scroll when `highlightedIndex >= results.length`*.
 * There is no honest way to write it. That state is unreachable through the
 * component's public surface — every path that shrinks `results`
 * (`performSearch`, `performBootstrap`, the empty-query branch, `handleSelect`)
 * rewrites `highlightedIndex` in the same synchronous batch, so no effect run
 * ever observes the pair — and it is unobservable even if it were forced: the
 * `{#each results}` block renders exactly one option per result, so the id for an
 * out-of-range index matches nothing and `getElementById(...)?.scrollIntoView?.()`
 * is already a no-op without the clause. A case would have to fabricate an
 * element the component does not own, and would then be testing the fixture.
 * The clause is upstream's, is transcribed faithfully, and stays untested.
 */

const alpha: SearchableItem[] = [
	{ id: 'a1', label: 'Alpha one' },
	{ id: 'a2', label: 'Alpha two' },
	{ id: 'a3', label: 'Alpha three' }
];

/** Query → results, so a case can pick the *length* of the next replacement. */
const byQuery: Record<string, SearchableItem[]> = {
	aa: alpha,
	bb: [{ id: 'b1', label: 'Beta one' }],
	cc: [
		{ id: 'c1', label: 'Gamma one' },
		{ id: 'c2', label: 'Gamma two' },
		{ id: 'c3', label: 'Gamma three' }
	]
};

const searchSource: SearchSource = {
	search: (query: string) => byQuery[query] ?? [],
	bootstrap: () => alpha
};

/**
 * Upstream's `fireEvent.change(input, {target: {value}})`, as
 * `typeahead.svelte.test.ts` spells it.
 *
 * It must be a single input event carrying the whole new value, not
 * `userEvent.fill`: filling clears first, and the empty-query branch hides the
 * popover, which would re-fire the effect through `popover.isOpen` and hide the
 * very dependency these cases are about.
 */
function setQuery(input: HTMLInputElement, value: string): void {
	const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

function comboboxIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="combobox"]');
	if (!(el instanceof HTMLInputElement)) throw new Error('expected a role="combobox" input');
	return el;
}

let restoreScrollIntoView: (() => void) | null = null;

/** Upstream's `Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', …)`. */
function spyOnScrollIntoView(): ReturnType<typeof vi.fn> {
	const spy = vi.fn();
	const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
	Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
		configurable: true,
		value: spy
	});
	restoreScrollIntoView = () => {
		if (original) {
			Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', original);
		}
	};
	return spy;
}

afterEach(() => {
	restoreScrollIntoView?.();
	restoreScrollIntoView = null;
});

describe('BaseTypeahead scroll effect dependencies', () => {
	it('re-scrolls when results are replaced by a different-length list', async () => {
		const scrollIntoView = spyOnScrollIntoView();
		const screen = await render(BaseTypeahead, {
			props: { searchSource, value: null, onChange: () => {}, debounceMs: 0 }
		});
		const input = comboboxIn(screen.container);

		setQuery(input, 'aa');
		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
			expect(screen.container.querySelectorAll('[role="option"]')).toHaveLength(3);
		});

		scrollIntoView.mockClear();

		// The popover stays open and `performSearch` writes `highlightedIndex = 0`
		// over a 0 that is already there — so neither of the other two reads in the
		// effect changes, and `results.length` is the only thing left that can make
		// it run.
		setQuery(input, 'bb');
		await vi.waitFor(() => {
			expect(screen.container.querySelectorAll('[role="option"]')).toHaveLength(1);
		});
		expect(input).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-option-0$/));

		await vi.waitFor(() => {
			expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
		});
	});

	it('re-scrolls when results are replaced by a same-length list', async () => {
		// Pins a deliberate divergence rather than a requirement, and the source
		// comment says so: `results` is `$state.raw`, so reading `.length`
		// subscribes to the whole-array signal and a same-length replacement
		// re-runs the effect where React's `results.length` dep would not. It is
		// harmless — `scrollIntoView({block: 'nearest'})` is idempotent, a no-op
		// when the row is already visible, and writes nothing the effect reads.
		// The case is here as a tripwire: making `results` fine-grained would flip
		// this and is worth having to notice.
		const scrollIntoView = spyOnScrollIntoView();
		const screen = await render(BaseTypeahead, {
			props: { searchSource, value: null, onChange: () => {}, debounceMs: 0 }
		});
		const input = comboboxIn(screen.container);

		setQuery(input, 'aa');
		await vi.waitFor(() => {
			expect(screen.container).toHaveTextContent('Alpha one');
		});

		scrollIntoView.mockClear();

		setQuery(input, 'cc');
		await vi.waitFor(() => {
			expect(screen.container).toHaveTextContent('Gamma one');
		});

		await vi.waitFor(() => {
			expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
		});
	});
});
