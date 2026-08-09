import type { Attachment } from 'svelte/attachments';
import { observeResize, unobserveResize } from '../internal/shared-resize-observer.js';

/**
 * Scroll-edge overflow tracking, ported from Astryx's
 * `hooks/useScrollOverflow.ts`.
 *
 * Observes a horizontally scrollable container and reports whether content
 * overflows at the start, the end, or at all — what a Carousel needs for its
 * fade edges and its scroll-button disabled states.
 *
 * Upstream returns a **ref callback**, and this port has an exact counterpart:
 * an attachment has the same attach/replace/detach lifecycle, so the body of
 * `scrollRef` becomes the attachment and its teardown becomes the attachment's
 * return. That also absorbs upstream's separate unmount `useEffect`, which
 * exists only because a ref callback has nowhere to put final cleanup.
 *
 * One thing simply disappears: upstream's `setState(prev => …)` compares the
 * three flags and returns `prev` unchanged to avoid a re-render. Assigning an
 * unchanged value to `$state` is already a no-op, so the comparison has no work
 * left to do.
 */

export interface ScrollOverflowState {
	/** Content overflows the start (left in LTR, right in RTL) */
	readonly overflowStart: boolean;
	/** Content overflows the end (right in LTR, left in RTL) */
	readonly overflowEnd: boolean;
	/** Whether the container has any overflow at all */
	readonly hasOverflow: boolean;
}

export interface ScrollOverflow extends ScrollOverflowState {
	/** Attach to the scroll container with `{@attach overflow.attach}`. */
	readonly attach: Attachment<HTMLElement>;
}

/**
 * Tracks scroll overflow state for a horizontally scrollable container.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const overflow = useScrollOverflow();
 * </script>
 *
 * <div {@attach overflow.attach} style="overflow-x: auto">…</div>
 * {#if overflow.overflowStart}<span class="fade-start"></span>{/if}
 * ```
 */
export function useScrollOverflow(): ScrollOverflow {
	let overflowStart = $state(false);
	let overflowEnd = $state(false);
	let hasOverflow = $state(false);

	function measure(element: HTMLElement): void {
		const tolerance = 1;
		const { scrollLeft, scrollWidth, clientWidth } = element;
		const maxScroll = scrollWidth - clientWidth;

		overflowStart = Math.abs(scrollLeft) > tolerance;
		overflowEnd = Math.abs(scrollLeft) < maxScroll - tolerance;
		hasOverflow = scrollWidth > clientWidth + tolerance;
	}

	const attach: Attachment<HTMLElement> = (element) => {
		const onScroll = () => measure(element);

		element.addEventListener('scroll', onScroll, { passive: true });
		// observeResize fires once on registration, so this covers the initial
		// measurement as well as later resizes.
		observeResize(element, onScroll);

		return () => {
			unobserveResize(element);
			element.removeEventListener('scroll', onScroll);
		};
	};

	return {
		get overflowStart() {
			return overflowStart;
		},
		get overflowEnd() {
			return overflowEnd;
		},
		get hasOverflow() {
			return hasOverflow;
		},
		attach
	};
}
