import type { OutlineItem } from './types.js';

/**
 * Builds outline items from the `h1`–`h6` elements inside a DOM container,
 * ported from Astryx's `Outline/useOutlineFromDOM.ts`.
 *
 * Upstream returns a plain `OutlineItem[]`; an array cannot stay live across a
 * Svelte component's lifetime, so the result comes back as an object whose
 * `items` is a `$state` read — the same split `useMediaQuery`/`useImageMode`
 * already make, and the reason `OutlineFromDOMState` has no upstream
 * counterpart name.
 *
 * The container arrives as a **getter** rather than upstream's `RefObject`, so
 * a `bind:this` that lands after this call still reaches the observer.
 */

function collectOutlineItems(container: HTMLElement | null): OutlineItem[] {
	if (container == null) {
		return [];
	}

	return Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6'))
		.map((heading) => {
			const level = Number(heading.tagName.slice(1));
			const label = heading.textContent?.trim() ?? '';
			return {
				id: heading.id,
				label,
				level
			};
		})
		.filter((item) => item.id !== '' && item.label !== '');
}

export interface OutlineFromDOMState {
	/** The collected headings, in document order. */
	readonly items: OutlineItem[];
}

/** Build outline items from h1-h6 elements inside a DOM container. */
export function useOutlineFromDOM(container: () => HTMLElement | null): OutlineFromDOMState {
	// Upstream seeds `useState(() => collectOutlineItems(containerRef.current))`,
	// which on a client mount is `null` anyway — the ref is not attached until
	// after the first render — so the initial value is `[]` on both sides, and on
	// the server this hook contributes nothing either way.
	let items = $state<OutlineItem[]>([]);

	$effect(() => {
		const el = container();
		items = collectOutlineItems(el);

		if (el == null || typeof MutationObserver === 'undefined') {
			return;
		}

		const observer = new MutationObserver(() => {
			items = collectOutlineItems(el);
		});
		observer.observe(el, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ['id']
		});

		return () => {
			observer.disconnect();
		};
	});

	return {
		get items() {
			return items;
		}
	};
}
