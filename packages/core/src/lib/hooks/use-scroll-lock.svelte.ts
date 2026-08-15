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
 *
 * **The counter and the snapshot are module state, not per-caller state**
 * (#4788), and that is the whole of the 0.4.x change. Each caller used to
 * snapshot the body's inline styles for itself, which is correct only while
 * exactly one lock exists. With two — a Dialog that opens a Drawer, say — the
 * second caller snapshots the body *already pinned* by the first, so its
 * "previous" values are `hidden`/`fixed`/`-480px`. Whichever unlocks first then
 * restores those, and the page is left pinned with no lock holding it, or
 * scrolled to the wrong offset. Counting locks and keeping one snapshot from
 * the FIRST of them is what makes nesting safe: only the transition through
 * zero touches the body.
 */

interface ScrollLockSnapshot {
	scrollX: number;
	scrollY: number;
	overflow: string;
	position: string;
	top: string;
	left: string;
	right: string;
}

let lockCount = 0;
let originalBodyState: ScrollLockSnapshot | null = null;

/**
 * Locks body scroll while `isLocked` returns true, restoring the previous
 * inline styles and scroll position when the last lock is released.
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

		const { body } = document;

		if (lockCount === 0) {
			const scrollX = window.scrollX;
			const scrollY = window.scrollY;

			originalBodyState = {
				scrollX,
				scrollY,
				overflow: body.style.overflow,
				position: body.style.position,
				top: body.style.top,
				left: body.style.left,
				right: body.style.right
			};

			body.style.overflow = 'hidden';
			body.style.position = 'fixed';
			body.style.top = `-${scrollY}px`;
			body.style.left = '0';
			body.style.right = '0';
		}

		lockCount += 1;

		return () => {
			lockCount -= 1;

			if (lockCount !== 0 || originalBodyState == null) {
				return;
			}

			const state = originalBodyState;
			originalBodyState = null;

			body.style.overflow = state.overflow;
			body.style.position = state.position;
			body.style.top = state.top;
			body.style.left = state.left;
			body.style.right = state.right;
			window.scrollTo(state.scrollX, state.scrollY);
		};
	});
}
