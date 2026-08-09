import { untrack } from 'svelte';

/**
 * Keep something wired to a `display: contents` wrapper's **first element
 * child**, re-wiring when that child is replaced.
 *
 * `Tooltip` and `HoverCard` both render such a wrapper and attach to whatever
 * element they find inside it — upstream's own mechanism, and the reason neither
 * needs `cloneElement`. Upstream then re-finds that child on *every render*, but
 * only by accident: `useLayer` returns a bare object literal, so the hook's
 * `ref` identity churns and the layout effect keyed on it tears down and re-runs
 * constantly.
 *
 * There is no value-level dependency to translate that into. `firstElementChild`
 * is not a reactive source, so a Svelte `$effect` keyed on the props sees
 * nothing when `{#if editing}<input/>{:else}<button/>{/if}` swaps the element —
 * and the listeners, the anchor name and the merged `aria-describedby` all go to
 * the grave with the outgoing node. The symptom is severe and silent: the
 * tooltip or card simply stops opening, it is no longer announced as the
 * trigger's description, and if it is opened another way the popover has no
 * anchor to resolve against and pins to the viewport corner.
 *
 * A `MutationObserver` on the wrapper is the counterpart, and it is the device
 * `useListFocus` already established for "React repairs after every commit and
 * Svelte has no after-every-render hook". It is a shared internal rather than
 * duplicated per component — unlike `setTabIndex`, which is duplicated because
 * *upstream* duplicates it, this has no upstream counterpart to mirror, so there
 * is no shape to preserve and one implementation is the honest one.
 *
 * The observer watches `childList` only. That covers the case that matters — the
 * child being replaced — and deliberately not attribute changes, which cannot
 * move which element is first.
 *
 * @param getWrapper the wrapper element, as `bind:this` gives it
 * @param wire called with the current first element child; returns its teardown
 */
export function watchFirstElementChild(
	getWrapper: () => HTMLElement | null | undefined,
	wire: (element: HTMLElement) => (() => void) | void
): void {
	$effect(() => {
		const wrapper = getWrapper();
		if (!wrapper) {
			return;
		}

		let current: HTMLElement | null = null;
		let detach: (() => void) | void;

		// Untracked: this reads whatever `wire` reads, and re-running on those is
		// the enclosing effect's job, not the observer's — the same reason
		// `useOverflow`'s and `useListFocus`'s attachments untrack their bodies.
		const sync = (): void => {
			untrack(() => {
				const first = wrapper.firstElementChild;
				const next = first instanceof HTMLElement ? first : null;
				if (next === current) {
					return;
				}
				detach?.();
				detach = undefined;
				current = next;
				if (next) {
					detach = wire(next);
				}
			});
		};

		sync();

		const observer = new MutationObserver(sync);
		observer.observe(wrapper, { childList: true });

		return () => {
			observer.disconnect();
			detach?.();
		};
	});
}
