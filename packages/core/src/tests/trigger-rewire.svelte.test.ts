import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { readAnchorNames } from '$lib/components/layer/anchor-name.js';
import HoverCardTriggerSwap from './fixtures/hover-card-trigger-swap.svelte';
import TooltipTriggerSwap from './fixtures/tooltip-trigger-swap.svelte';

/**
 * **These eight cases have no upstream counterpart.** They are not a port and
 * are not counted against `Tooltip.test.tsx` or `HoverCard.test.tsx`, which stay
 * complete at ten and twenty-three in `tooltip.svelte.test.ts` and
 * `hover-card.svelte.test.ts`. They pin a Svelte-specific hazard upstream gets
 * for free, exactly as the four SSR cases in `metadata-list.test.ts` do, and the
 * debt they close is recorded in port/todo.md.
 *
 * The hazard: both components render a `display: contents` wrapper and wire the
 * hook — listeners, anchor name, merged `aria-describedby` — onto its
 * `firstElementChild`. That is upstream's own mechanism, and the reason neither
 * needs `cloneElement`. Upstream re-finds that child on *every render*, but only
 * by accident: `useLayer` returns a bare object literal, so the hook's `ref`
 * identity churns and the layout effect keyed on it tears down and re-runs
 * constantly. React therefore cannot express this bug, and there is no upstream
 * case to translate.
 *
 * Svelte can. `firstElementChild` is not a reactive source, so the plain
 * `$effect` that used to do the lookup tracked only `wrapper` and the two mode
 * flags — and `{#if editing}<input/>{:else}<button/>{/if}` inside the wrapper
 * swapped the element without any of them changing. The whole wiring went to the
 * grave with the outgoing node: the layer stopped opening, it was no longer
 * announced as the trigger's description, and opened another way it had no
 * anchor to resolve `position-anchor` against and pinned to the viewport corner.
 * `internal/first-element-child.svelte.ts` is the fix — a `MutationObserver` on
 * the wrapper keyed on `childList` — and both components call it.
 *
 * Why one shared file rather than cases appended to each component's suite: both
 * of those suites open by stating how many of upstream's cases they hold, and
 * the count is the contract there. Eight rows with no upstream counterpart would
 * corrupt that ledger twice over. The cases also test one thing —
 * `watchFirstElementChild` — through its two consumers, so the reason they exist
 * is stated once here rather than half-stated in two places.
 *
 * The swap is driven by the fixture's own `$state` through an instance export,
 * never by `rerender`; see `tooltip-trigger-swap.svelte` for why `rerender`
 * makes all eight vacuous.
 */

/** The one anchor name a freshly wired trigger carries — the layer's `anchorId`. */
function soleAnchorName(element: HTMLElement): string {
	const names = readAnchorNames(element);
	if (names.length !== 1) {
		throw new Error(`expected exactly one anchor name, got ${JSON.stringify(names)}`);
	}
	return names[0];
}

/**
 * The `position-anchor` the layer resolves against. Read off the element rather
 * than recomputed from `useLayer`'s `--astryx-layer-${id}` formula, so the
 * assertion cannot pass by duplicating the implementation it is checking.
 */
function positionAnchorOf(layer: HTMLElement): string {
	const value = layer.style.getPropertyValue('position-anchor').trim();
	if (!value) {
		throw new Error('expected the layer to declare a position-anchor');
	}
	return value;
}

/** `mouseenter` does not bubble; the listener sits on the element. */
function hover(element: HTMLElement): void {
	element.dispatchEvent(new MouseEvent('mouseenter'));
}

describe('trigger re-wiring when the wrapper’s first element child is swapped', () => {
	describe('Tooltip', () => {
		function layerIn(container: HTMLElement): HTMLElement {
			const el = container.querySelector('[role="tooltip"]');
			if (!(el instanceof HTMLElement)) {
				throw new Error('expected a tooltip layer');
			}
			return el;
		}

		it('moves aria-describedby onto the new trigger element', async () => {
			const screen = await render(TooltipTriggerSwap);
			const layer = layerIn(screen.container);
			const button = screen.getByTestId('button-trigger').element() as HTMLElement;
			expect(button.getAttribute('aria-describedby')).toBe(layer.id);

			screen.component.swap();

			// The *new* element specifically, located by its own test id — not
			// "something in the tree has the attribute", which the outgoing node
			// would have satisfied.
			await vi.waitFor(() => {
				const link = screen.getByTestId('link-trigger').element() as HTMLElement;
				expect(link.getAttribute('aria-describedby')).toBe(layer.id);
			});
		});

		it('moves the hover listeners onto the new trigger element', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(TooltipTriggerSwap, { props: { onOpenChange } });

			screen.component.swap();

			const link = await vi.waitFor(() => {
				const el = screen.getByTestId('link-trigger').element() as HTMLElement;
				expect(el).toBeInTheDocument();
				return el;
			});
			hover(link);

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('cleans up the outgoing trigger element', async () => {
			const screen = await render(TooltipTriggerSwap);
			const button = screen.getByTestId('button-trigger').element() as HTMLElement;
			expect(button).toHaveAttribute('aria-describedby');

			screen.component.swap();

			// `{#if}` detaches the outgoing node, so it is no longer reachable
			// through the tree — but the node object is, and the teardown that runs
			// on it is observable there. It must have given the attribute back.
			await vi.waitFor(() => {
				expect(button.hasAttribute('aria-describedby')).toBe(false);
			});
		});

		it('moves the anchor name onto the new trigger element', async () => {
			const screen = await render(TooltipTriggerSwap);
			const layer = layerIn(screen.container);
			const button = screen.getByTestId('button-trigger').element() as HTMLElement;
			const anchor = positionAnchorOf(layer);
			expect(soleAnchorName(button)).toBe(anchor);

			screen.component.swap();

			// The popover can still resolve `position-anchor`…
			await vi.waitFor(() => {
				const link = screen.getByTestId('link-trigger').element() as HTMLElement;
				expect(readAnchorNames(link)).toContain(anchor);
			});
			// …and the outgoing element no longer claims the same name, which would
			// otherwise leave two elements answering to one anchor.
			expect(readAnchorNames(button)).not.toContain(anchor);
		});
	});

	describe('HoverCard', () => {
		// No `layerIn` helper here, where the Tooltip block above has one:
		// `HoverCard` opts into `lazyMount` (#5039), so a closed card has no layer
		// to find, and every case below reads its wiring off the trigger instead.

		it('moves aria-describedby onto the new trigger element', async () => {
			// Read off the outgoing trigger rather than off the layer. `HoverCard`
			// opts into `useLayer`'s `lazyMount` as of upstream 0.4.2 (#5039), so a
			// closed card has no layer element to take an id from — while the
			// wiring under test, which is the hook's id either way, is on the
			// trigger from the first render.
			const screen = await render(HoverCardTriggerSwap);
			const button = screen.getByTestId('button-trigger').element() as HTMLElement;
			const describedBy = button.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();

			screen.component.swap();

			await vi.waitFor(() => {
				const link = screen.getByTestId('link-trigger').element() as HTMLElement;
				expect(link.getAttribute('aria-describedby')).toBe(describedBy);
			});
		});

		it('moves the hover listeners onto the new trigger element', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(HoverCardTriggerSwap, { props: { onOpenChange } });

			screen.component.swap();

			const link = await vi.waitFor(() => {
				const el = screen.getByTestId('link-trigger').element() as HTMLElement;
				expect(el).toBeInTheDocument();
				return el;
			});
			hover(link);

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('cleans up the outgoing trigger element', async () => {
			const screen = await render(HoverCardTriggerSwap);
			const button = screen.getByTestId('button-trigger').element() as HTMLElement;
			expect(button).toHaveAttribute('aria-describedby');

			screen.component.swap();

			await vi.waitFor(() => {
				expect(button.hasAttribute('aria-describedby')).toBe(false);
			});
		});

		it('moves the anchor name onto the new trigger element', async () => {
			// The anchor is read off the outgoing trigger, not off the layer's
			// `position-anchor` — see the `aria-describedby` case above for why the
			// layer is not there to read. The two are the same string by
			// construction (`useLayer`'s `--astryx-layer-${id}`), and it is the
			// trigger's copy this case is about.
			const screen = await render(HoverCardTriggerSwap);
			const button = screen.getByTestId('button-trigger').element() as HTMLElement;
			const anchor = soleAnchorName(button);

			screen.component.swap();

			await vi.waitFor(() => {
				const link = screen.getByTestId('link-trigger').element() as HTMLElement;
				expect(readAnchorNames(link)).toContain(anchor);
			});
			expect(readAnchorNames(button)).not.toContain(anchor);
		});
	});
});
