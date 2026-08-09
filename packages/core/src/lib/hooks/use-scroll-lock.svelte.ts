/**
 * Body scroll lock, ported from Astryx's `hooks/useScrollLock.ts`.
 *
 * A near-transcription: upstream's `useEffect(..., [isLocked])` becomes one
 * `$effect`, its early return becomes the same early return, and its returned
 * teardown becomes the effect's. The only translation is the argument — a
 * getter rather than a value, so reading it inside the effect registers the
 * dependency that upstream spells out in its dependency list.
 *
 * Pinning the body with `position: fixed` (rather than
 * `overscroll-behavior: contain`) is upstream's, and deliberate: iOS Safari
 * scrolls the body behind a modal regardless of `overscroll-behavior`.
 */

/**
 * Locks body scroll while `isLocked` returns true, restoring the previous
 * inline styles and scroll position when it stops.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let isOpen = $state(false);
 *   useScrollLock(() => isOpen);
 * </script>
 * ```
 */
export function useScrollLock(isLocked: () => boolean): void {
	$effect(() => {
		if (!isLocked()) {
			return;
		}

		const scrollX = window.scrollX;
		const scrollY = window.scrollY;
		const { body } = document;
		const prevOverflow = body.style.overflow;
		const prevPosition = body.style.position;
		const prevTop = body.style.top;
		const prevLeft = body.style.left;
		const prevRight = body.style.right;

		body.style.overflow = 'hidden';
		body.style.position = 'fixed';
		body.style.top = `-${scrollY}px`;
		body.style.left = '0';
		body.style.right = '0';

		return () => {
			body.style.overflow = prevOverflow;
			body.style.position = prevPosition;
			body.style.top = prevTop;
			body.style.left = prevLeft;
			body.style.right = prevRight;
			window.scrollTo(scrollX, scrollY);
		};
	});
}
