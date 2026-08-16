import { userEvent } from 'vitest/browser';

/**
 * Move the real pointer off the fixture, and leave it there.
 *
 * Hover-menu suites need this and it is not incidental. `setup-stylex` parks
 * Playwright's physical cursor at the viewport's top-right corner, which is
 * inside any full-width nav row a fixture renders there. Chromium re-hit-tests
 * hover after every render, so the row receives `mouseenter` with no interaction
 * at all — a menu with `showDelay: 0` opens on its own, and, worse, *reopens the
 * instant a test closes it*, which reads exactly like a broken dismiss.
 *
 * Hovering a throwaway element moves the real cursor to it; removing the element
 * leaves the cursor over bare `document.body`. `absolute` at a large offset
 * rather than `fixed` at the bottom edge, for the reason `setup-stylex` records:
 * a tall test iframe puts a `fixed; bottom: 0` element outside the visible
 * window, where Playwright refuses to hover it.
 *
 * `side-nav.svelte.test.ts`'s `openMenu` is where this technique was first
 * written down; this is that helper, shared.
 */
export async function parkPointer(): Promise<void> {
	const spot = document.createElement('div');
	spot.style.cssText = 'position:absolute;top:400px;left:0;width:4px;height:4px;z-index:2147483647';
	document.body.append(spot);
	try {
		await userEvent.hover(spot);
	} finally {
		spot.remove();
	}
}
