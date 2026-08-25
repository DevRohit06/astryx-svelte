import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Outline from '$lib/components/outline/outline.svelte';
import OutlineFromDomProbe from './fixtures/outline-from-dom-probe.svelte';
import { parseOutlineFromMarkdown } from '$lib/components/outline/parse-outline-from-markdown.js';
import type { OutlineItem } from '$lib/components/outline/types.js';

/**
 * Ported from Astryx's `Outline/Outline.test.tsx` — **all 46 of its `it` cases**
 * at the 0.5.0 pin, across its six describes (3 `parseOutlineFromMarkdown`, 13 `Outline`, 13
 * `Outline keyboard navigation`, 8 `Outline navigate callbacks`, 8 `Outline
 * scroll scoping`, 1 `useOutlineFromDOM`). Nothing is dropped.
 *
 * The `parseOutlineFromMarkdown` describe was held back while that helper waited
 * on `Markdown/parser`; the parser landed with `Markdown`, so the three cases
 * are here unchanged. They are pure and would be at home in the node project —
 * they stay in this file because it is the port of `Outline.test.tsx` and the
 * count is per upstream file. The helper's own suite,
 * `parseOutlineFromMarkdown.test.ts`, is ported separately as
 * `parse-outline-from-markdown.test.ts` in the server project.
 *
 * Runs in the **client** (real Chromium) project: the scroll spy reads
 * `getBoundingClientRect`, `getComputedStyle(...).scrollMarginTop` and live
 * scroll position, and the deferred-indicator case turns on a real `scrollend`
 * event. Upstream's `act()` has no counterpart — a `$state` write flushes on its
 * own and `expect.element` retries.
 *
 * **Three translations recur, all forced by the browser rather than chosen:**
 *
 * 1. **`mockScrollMarginTop` has no counterpart.** Upstream fakes
 *    `scroll-margin-top` at the `getComputedStyle` boundary because jsdom's
 *    cssstyle never resolves the property, so an inline style can't be read
 *    back. Chromium resolves it, so the headings simply *declare* it —
 *    `heading.style.scrollMarginTop = '8px'` — which tests the same read through
 *    the real CSSOM instead of around it.
 * 2. **The document-height pin is explicit here.** `resolveActiveId`
 *    short-circuits to the last item when the scroll root is at its bottom, and
 *    a short test page reads as "at bottom" in both runtimes. Upstream pins
 *    `scrollHeight` in one case and the three later describes inherit it by
 *    leakage — `Object.defineProperty` on `document.documentElement` is not a spy
 *    and `restoreAllMocks` never undoes it. Relying on that ordering would make a
 *    case pass for a reason it does not state, so each describe pins it itself.
 * 3. **`scrollContainerRef` is a getter**, not a `RefObject` — the settled
 *    translation for a ref-valued option, so `{current: pane}` becomes
 *    `() => pane`.
 */

const items: OutlineItem[] = [
	{ id: 'intro', label: 'Introduction', level: 2 },
	{ id: 'install', label: 'Installation', level: 3 },
	{ id: 'api', label: 'API', level: 3 }
];

/**
 * Upstream's scroll-spy cases assume the page is **not** scrolled to the bottom
 * — `resolveActiveId` returns the last item when it is, short-circuiting the
 * per-heading walk. jsdom reports a 0-height document, so upstream pins
 * `scrollHeight` to 4000; a real Chromium test page is short enough to read as
 * "at bottom" too, so the same pin is needed here and for the same reason.
 */
function pinDocumentHeight(value = 4000): void {
	Object.defineProperty(document.documentElement, 'scrollHeight', {
		value,
		configurable: true
	});
}

/**
 * Mount real heading elements for `items` so navigation has scroll targets.
 * Returns a cleanup that removes them.
 */
function mountHeadings(ids: string[] = items.map((item) => item.id)): () => void {
	const headings = ids.map((id) => {
		const heading = document.createElement('h2');
		heading.id = id;
		document.body.appendChild(heading);
		return heading;
	});
	return () => {
		for (const heading of headings) {
			heading.remove();
		}
	};
}

/** The heading elements for `items`, in order. Call after {@link mountHeadings}. */
function headingsOf(): HTMLElement[] {
	return items.map((item) => document.getElementById(item.id) as HTMLElement);
}

/**
 * `tabindex` across the outline's links, in DOM order. Takes what
 * `locator.elements()` returns rather than `HTMLElement[]` — the locator cannot
 * know a role query only ever matches anchors.
 */
function tabIndexes(links: Element[]): (string | null)[] {
	return links.map((link) => link.getAttribute('tabindex'));
}

describe('parseOutlineFromMarkdown', () => {
	it('extracts headings with generated ids', () => {
		expect(parseOutlineFromMarkdown('# Intro\n\n## Getting Started')).toEqual([
			{ id: 'intro', label: 'Intro', level: 1 },
			{ id: 'getting-started', label: 'Getting Started', level: 2 }
		]);
	});

	it('uses rendered inline text and ignores fenced code headings', () => {
		expect(
			parseOutlineFromMarkdown('## **Install** `@astryxdesign/core`\n\n```\n# Not a heading\n```')
		).toEqual([
			{
				id: 'install-astryxdesign-core',
				label: 'Install @astryxdesign/core',
				level: 2
			}
		]);
	});

	it('deduplicates generated ids', () => {
		expect(parseOutlineFromMarkdown('## Usage\n## Usage\n## Usage')).toEqual([
			{ id: 'usage', label: 'Usage', level: 2 },
			{ id: 'usage-1', label: 'Usage', level: 2 },
			{ id: 'usage-2', label: 'Usage', level: 2 }
		]);
	});
});

describe('Outline', () => {
	beforeEach(() => {
		Element.prototype.scrollIntoView = vi.fn();
		pinDocumentHeight();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders a labelled nav with anchor links', async () => {
		const screen = await render(Outline, { props: { items, label: 'On this page' } });
		await expect
			.element(screen.getByRole('navigation', { name: 'On this page', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('link', { name: 'Introduction', exact: true }))
			.toHaveAttribute('href', '#intro');
	});

	it('uses the default accessible label', async () => {
		const screen = await render(Outline, { props: { items } });
		await expect
			.element(screen.getByRole('navigation', { name: 'Table of contents', exact: true }))
			.toBeInTheDocument();
	});

	it('marks the controlled active item with aria-current', async () => {
		const screen = await render(Outline, { props: { items, activeId: 'install' } });
		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');
		await expect
			.element(screen.getByRole('link', { name: 'Introduction', exact: true }))
			.not.toHaveAttribute('aria-current');
	});

	it('smooth-scrolls and defers the indicator until the scroll settles when uncontrolled', async () => {
		const user = userEvent.setup();
		const target = document.createElement('h2');
		target.id = 'install';
		document.body.appendChild(target);
		const onActiveIdChange = vi.fn();

		const screen = await render(Outline, { props: { items, onActiveIdChange } });
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		expect(target.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start'
		});
		// Uncontrolled: the indicator is deferred during the programmatic scroll,
		// so it has not moved to the clicked item yet.
		expect(
			screen
				.getByRole('link', { name: 'Installation', exact: true })
				.element()
				.getAttribute('aria-current')
		).not.toBe('location');

		// When the scroll settles, the indicator lands on the clicked item.
		window.dispatchEvent(new Event('scrollend'));
		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');
		expect(onActiveIdChange).toHaveBeenCalledWith('install');

		document.body.removeChild(target);
	});

	it('reports active id on click when controlled', async () => {
		const user = userEvent.setup();
		const target = document.createElement('h2');
		target.id = 'install';
		document.body.appendChild(target);
		const onActiveIdChange = vi.fn();

		const screen = await render(Outline, {
			props: { items, activeId: 'intro', onActiveIdChange }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		expect(target.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start'
		});
		// Controlled: there is no built-in scroll-spy, so the consumer owns the
		// active state and must be notified on click.
		expect(onActiveIdChange).toHaveBeenCalledWith('install');

		document.body.removeChild(target);
	});

	it('applies stable root and item class names', async () => {
		const screen = await render(Outline, {
			props: { items, 'data-testid': 'outline', activeId: 'api' }
		});
		expect(screen.getByTestId('outline').element().className).toContain('astryx-outline');
		const api = screen.getByRole('link', { name: 'API', exact: true }).element();
		expect(api.className).toContain('astryx-outline-item');
		expect(api.className).toContain('active');
		expect(api.className).toContain('level-3');
	});

	it('renders with density="compact"', async () => {
		const screen = await render(Outline, {
			props: { items, density: 'compact', 'data-testid': 'outline-compact' }
		});
		expect(screen.getByTestId('outline-compact').element().className).toContain('compact');
	});

	it('renders with density="default" by default', async () => {
		const screen = await render(Outline, {
			props: { items, 'data-testid': 'outline-default' }
		});
		expect(screen.getByTestId('outline-default').element().className).toContain('default');
	});

	it('renders the sliding indicator track', async () => {
		const screen = await render(Outline, { props: { items, activeId: 'intro' } });
		// Track is present as an aria-hidden div
		const track = screen.container.querySelector('[aria-hidden="true"]');
		expect(track).not.toBeNull();
	});

	it('renders the indicator unconditionally (CSS anchor positioning handles visibility)', async () => {
		const screen = await render(Outline, { props: { items, activeId: 'intro' } });
		const indicator = screen.container.querySelector<HTMLElement>('.astryx-outline-indicator');
		expect(indicator).not.toBeNull();
		// No inline top/height styles — positioning is CSS-driven
		expect(indicator!.style.top).toBe('');
		expect(indicator!.style.height).toBe('');
	});

	it('renders the active anchor before the indicator for CSS anchor positioning', async () => {
		const screen = await render(Outline, { props: { items, activeId: 'intro' } });
		const activeLink = screen.getByRole('link', { name: 'Introduction', exact: true }).element();
		const indicator = screen.container.querySelector('.astryx-outline-indicator');

		expect(indicator).not.toBeNull();
		expect(
			activeLink.compareDocumentPosition(indicator!) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	it('preserves the legacy controlled API (items + activeId + onActiveIdChange)', async () => {
		// Regression guard: the pre-refresh public API must keep working unchanged.
		const onActiveIdChange = vi.fn();
		const screen = await render(Outline, {
			props: { items, activeId: 'intro', onActiveIdChange }
		});

		await expect
			.element(screen.getByRole('link', { name: 'Introduction', exact: true }))
			.toHaveAttribute('aria-current', 'location');

		// Controlled active id is driven entirely by the prop. Upstream's `rerender`
		// is a props write here — `render` returns the component instance, and a
		// `$props` update flushes on its own.
		await screen.rerender({ items, activeId: 'api', onActiveIdChange });

		await expect
			.element(screen.getByRole('link', { name: 'API', exact: true }))
			.toHaveAttribute('aria-current', 'location');
		await expect
			.element(screen.getByRole('link', { name: 'Introduction', exact: true }))
			.not.toHaveAttribute('aria-current');
	});

	it('updates uncontrolled active id from scroll position', async () => {
		const intro = document.createElement('h2');
		intro.id = 'intro';
		const install = document.createElement('h3');
		install.id = 'install';
		const api = document.createElement('h3');
		api.id = 'api';
		document.body.append(intro, install, api);

		// Not at the bottom of the page.
		pinDocumentHeight();

		// intro + install have scrolled above the activation line (top <= 0);
		// api is still below it, so install is the last passed heading.
		vi.spyOn(intro, 'getBoundingClientRect').mockReturnValue({ top: -200 } as DOMRect);
		vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: -10 } as DOMRect);
		vi.spyOn(api, 'getBoundingClientRect').mockReturnValue({ top: 400 } as DOMRect);

		const onActiveIdChange = vi.fn();
		// The hook resolves the active id from scroll position on mount.
		const screen = await render(Outline, { props: { items, onActiveIdChange } });

		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');
		expect(onActiveIdChange).toHaveBeenCalledWith('install');

		document.body.removeChild(intro);
		document.body.removeChild(install);
		document.body.removeChild(api);
	});
});

describe('Outline keyboard navigation', () => {
	beforeEach(() => {
		Element.prototype.scrollIntoView = vi.fn();
		pinDocumentHeight();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('exposes a single tab stop (roving tabindex) instead of one per heading', async () => {
		const screen = await render(Outline, { props: { items } });
		const links = screen.getByRole('link').elements();

		// A 40-heading TOC must not cost 40 Tab presses: exactly one link is in
		// the page tab order, the rest are reachable with arrow keys.
		await vi.waitFor(() => {
			expect(tabIndexes(links)).toEqual(['0', '-1', '-1']);
		});
	});

	it('seats the tab stop on the active heading, not always the first', async () => {
		// WAI-ARIA roving tabindex: the single tab stop belongs on the *current*
		// item. Tabbing into a TOC while reading section 3 must land on section 3,
		// not send the reader back to section 1.
		const screen = await render(Outline, { props: { items, activeId: 'api' } });
		const links = screen.getByRole('link').elements();

		await vi.waitFor(() => {
			expect(tabIndexes(links)).toEqual(['-1', '-1', '0']);
		});
	});

	it('moves the tab stop as the active heading changes', async () => {
		const screen = await render(Outline, { props: { items, activeId: 'intro' } });
		await vi.waitFor(() => {
			expect(tabIndexes(screen.getByRole('link').elements())).toEqual(['0', '-1', '-1']);
		});

		// Scroll-spy advances the active section: the tab stop must follow it.
		await screen.rerender({ items, activeId: 'install' });
		await vi.waitFor(() => {
			expect(tabIndexes(screen.getByRole('link').elements())).toEqual(['-1', '0', '-1']);
		});
	});

	it('does not yank the tab stop away from the item the user arrowed to', async () => {
		const user = userEvent.setup();
		const screen = await render(Outline, { props: { items, activeId: 'intro' } });
		const links = screen.getByRole('link').elements();

		// User arrow-keys down to `api` and keeps focus there.
		links[0].focus();
		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(links[2]).toHaveFocus();
		expect(links[2]).toHaveAttribute('tabindex', '0');

		// Scroll-spy moves the active section underneath them. Focus is still
		// inside the list, so the tab stop must stay where the user put it.
		await screen.rerender({ items, activeId: 'install' });
		expect(links[2]).toHaveAttribute('tabindex', '0');
		expect(links[1]).toHaveAttribute('tabindex', '-1');
	});

	it('moves focus with ArrowDown / ArrowUp', async () => {
		const user = userEvent.setup();
		const screen = await render(Outline, { props: { items } });
		const [intro, install] = screen.getByRole('link').elements();

		intro.focus();
		await user.keyboard('{ArrowDown}');
		expect(install).toHaveFocus();
		expect(install).toHaveAttribute('tabindex', '0');
		expect(intro).toHaveAttribute('tabindex', '-1');

		await user.keyboard('{ArrowUp}');
		expect(intro).toHaveFocus();
	});

	it('jumps to first / last with Home / End', async () => {
		const user = userEvent.setup();
		const screen = await render(Outline, { props: { items } });
		const links = screen.getByRole('link').elements();

		links[0].focus();
		await user.keyboard('{End}');
		expect(links[2]).toHaveFocus();

		await user.keyboard('{Home}');
		expect(links[0]).toHaveFocus();
	});

	it('activates the focused link with Space', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();

		const screen = await render(Outline, { props: { items, onNavigateStart } });
		const install = screen.getByRole('link').elements()[1];
		install.focus();
		await user.keyboard(' ');

		expect(onNavigateStart).toHaveBeenCalledWith('install');
		expect(document.getElementById('install')!.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start'
		});

		cleanup();
	});

	it('activates the focused link with Enter', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();

		const screen = await render(Outline, { props: { items, onNavigateStart } });
		screen.getByRole('link').elements()[2].focus();
		await user.keyboard('{Enter}');

		expect(onNavigateStart).toHaveBeenCalledWith('api');
		cleanup();
	});

	it('leaves modifier chords to the browser (Cmd/Ctrl + Space is not activation)', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();

		const screen = await render(Outline, { props: { items, onNavigateStart } });
		screen.getByRole('link').elements()[1].focus();
		await user.keyboard('{Meta>} {/Meta}');

		expect(onNavigateStart).not.toHaveBeenCalled();
		cleanup();
	});

	it('does not treat its own Space activation as a manual scroll', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, { props: { items, onNavigateEnd } });
		screen.getByRole('link').elements()[1].focus();
		await user.keyboard(' ');

		// Space is one of the keys that normally scroll the page, and the settle
		// watcher listens on window — so the very keydown that started this
		// navigation would bubble up and cancel it. Because we preventDefault it,
		// no scroll can happen and the navigation must survive.
		expect(onNavigateEnd).not.toHaveBeenCalled();

		window.dispatchEvent(new Event('scrollend'));
		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');
		expect(onNavigateEnd).toHaveBeenCalledTimes(1);

		cleanup();
	});

	it('does not treat arrow-key roving focus as a manual scroll', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, { props: { items, onNavigateEnd } });
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		// Arrow keys inside the outline move focus; they are prevented, so they do
		// not scroll the page and must not cancel the in-flight navigation.
		await user.keyboard('{ArrowDown}');
		expect(onNavigateEnd).not.toHaveBeenCalled();

		cleanup();
	});

	it('does not steal Tab from the page', async () => {
		const user = userEvent.setup();
		const screen = await render(Outline, { props: { items } });
		// Upstream renders a sibling `<button>` in the same fragment. `render`
		// mounts into its own container, so the equivalent DOM relationship is a
		// button appended to `body` *after* that container — same tab order, no
		// fixture needed for one case.
		const after = document.createElement('button');
		after.type = 'button';
		after.textContent = 'After';
		document.body.appendChild(after);

		screen.getByRole('link').elements()[0].focus();
		await user.tab();

		// The non-tabbable links are skipped, so one Tab leaves the whole outline.
		expect(after).toHaveFocus();
		after.remove();
	});

	it('keeps a single tab stop with one item, and none with zero items', async () => {
		const screen = await render(Outline, {
			props: { items: [{ id: 'only', label: 'Only', level: 2 }] }
		});
		await vi.waitFor(() => {
			expect(screen.getByRole('link').elements()[0]).toHaveAttribute('tabindex', '0');
		});

		await screen.rerender({ items: [] });
		await vi.waitFor(() => {
			expect(screen.getByRole('link').elements()).toHaveLength(0);
		});
	});
});

describe('Outline navigate callbacks', () => {
	beforeEach(() => {
		Element.prototype.scrollIntoView = vi.fn();
		pinDocumentHeight();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('fires onNavigateStart on click and onNavigateEnd when the scroll settles', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, {
			props: { items, onNavigateStart, onNavigateEnd }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		expect(onNavigateStart).toHaveBeenCalledWith('install');
		// Still scrolling — arrival has not happened yet.
		expect(onNavigateEnd).not.toHaveBeenCalled();

		window.dispatchEvent(new Event('scrollend'));
		expect(onNavigateEnd).toHaveBeenCalledTimes(1);
		expect(onNavigateEnd).toHaveBeenCalledWith('install');

		cleanup();
	});

	it('fires the callbacks in controlled mode too', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, {
			props: { items, activeId: 'intro', onNavigateStart, onNavigateEnd }
		});
		await user.click(screen.getByRole('link', { name: 'API', exact: true }).element());

		expect(onNavigateStart).toHaveBeenCalledWith('api');
		window.dispatchEvent(new Event('scrollend'));
		expect(onNavigateEnd).toHaveBeenCalledTimes(1);
		expect(onNavigateEnd).toHaveBeenCalledWith('api');

		cleanup();
	});

	it('falls back to a settle timeout when scrollend never fires', async () => {
		// Only setTimeout/clearTimeout are faked: the default fake set includes
		// queueMicrotask, which is what Svelte schedules its flush on, and faking
		// that stalls mount. The settle fallback is a `setTimeout`, which is the
		// whole subject of this case. A native `.click()` replaces
		// `userEvent.click` for the same reason `code-block` does — driving the
		// browser needs real timers.
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const cleanup = mountHeadings();
			const onNavigateEnd = vi.fn();

			const screen = await render(Outline, { props: { items, onNavigateEnd } });
			(
				screen.getByRole('link', { name: 'Installation', exact: true }).element() as HTMLElement
			).click();

			expect(onNavigateEnd).not.toHaveBeenCalled();
			vi.advanceTimersByTime(2000);
			expect(onNavigateEnd).toHaveBeenCalledTimes(1);
			expect(onNavigateEnd).toHaveBeenCalledWith('install');

			cleanup();
		} finally {
			vi.useRealTimers();
		}
	});

	it('fires onNavigateEnd exactly once when scrollend AND the fallback both elapse', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const cleanup = mountHeadings();
			const onNavigateEnd = vi.fn();

			const screen = await render(Outline, { props: { items, onNavigateEnd } });
			(
				screen.getByRole('link', { name: 'Installation', exact: true }).element() as HTMLElement
			).click();

			// Reduced motion turns the smooth scroll into an instant jump: scrollend
			// arrives immediately. The fallback timer must not fire a second time.
			window.dispatchEvent(new Event('scrollend'));
			window.dispatchEvent(new Event('scrollend'));
			vi.advanceTimersByTime(5000);
			expect(onNavigateEnd).toHaveBeenCalledTimes(1);
			expect(onNavigateEnd).toHaveBeenCalledWith('install');

			cleanup();
		} finally {
			vi.useRealTimers();
		}
	});

	it('still fires onNavigateEnd once when a manual scroll interrupts the jump', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, {
			props: { items, onNavigateStart, onNavigateEnd }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());
		expect(onNavigateStart).toHaveBeenCalledTimes(1);

		window.dispatchEvent(new Event('wheel'));

		// Every onNavigateStart is balanced by exactly one onNavigateEnd, so a
		// consumer's "navigating" state can never leak.
		expect(onNavigateEnd).toHaveBeenCalledTimes(1);
		expect(onNavigateEnd).toHaveBeenCalledWith('install');

		cleanup();
	});

	it('does not fire callbacks when the target heading is missing', async () => {
		const user = userEvent.setup();
		const onNavigateStart = vi.fn();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, {
			props: { items, onNavigateStart, onNavigateEnd }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		expect(onNavigateStart).not.toHaveBeenCalled();
		expect(onNavigateEnd).not.toHaveBeenCalled();

		window.location.hash = '';
	});

	it('leaves a missing target to the browser instead of deadening the link', async () => {
		const user = userEvent.setup();
		window.location.hash = '';

		const screen = await render(Outline, { props: { items } });
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		// The heading is not in the DOM (lazily-rendered or virtualized content).
		// We own the scroll only when we have something to scroll to; with no
		// target we must NOT preventDefault, or the anchor becomes a total no-op.
		// The browser's native fragment navigation still updates the URL, so a
		// later render / deep link can still resolve it.
		expect(window.location.hash).toBe('#install');

		window.location.hash = '';
	});

	it('does not fire callbacks for a modified (Cmd) click', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();

		const screen = await render(Outline, { props: { items, onNavigateStart } });
		await user.keyboard('{Meta>}');
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());
		await user.keyboard('{/Meta}');

		expect(onNavigateStart).not.toHaveBeenCalled();
		cleanup();
	});
});

describe('Outline scroll scoping', () => {
	beforeEach(() => {
		Element.prototype.scrollIntoView = vi.fn();
		// The offset path drives the scroll through these rather than
		// `scrollIntoView`; spying keeps the real implementations restorable.
		vi.spyOn(Element.prototype, 'scrollBy').mockImplementation(() => {});
		vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
		pinDocumentHeight();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('hasScrollOnClick={false} skips the scroll but still navigates', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateStart = vi.fn();
		const onNavigateEnd = vi.fn();

		const screen = await render(Outline, {
			props: { items, hasScrollOnClick: false, onNavigateStart, onNavigateEnd }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		const target = document.getElementById('install') as HTMLElement;
		expect(target.scrollIntoView).not.toHaveBeenCalled();
		// The consumer owns scrolling; they still learn where to go.
		expect(onNavigateStart).toHaveBeenCalledWith('install');
		// There is nothing to scroll, so nothing to wait for: onNavigateEnd must
		// resolve immediately rather than waiting out the settle timeout — an
		// arrival effect paired with onNavigateEnd would otherwise land ~1.2s late
		// for no reason.
		expect(onNavigateEnd).toHaveBeenCalledWith('install');
		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');

		cleanup();
	});

	it('offset shifts the activation line for a fixed header', async () => {
		const cleanup = mountHeadings();
		const [intro, install, api] = headingsOf();

		pinDocumentHeight();
		vi.spyOn(intro, 'getBoundingClientRect').mockReturnValue({ top: -200 } as DOMRect);
		// `install` sits 40px below the viewport top — under a 64px fixed header,
		// so it should already be active once `offset={64}` is declared.
		vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: 40 } as DOMRect);
		vi.spyOn(api, 'getBoundingClientRect').mockReturnValue({ top: 400 } as DOMRect);

		const screen = await render(Outline, { props: { items } });
		// Without offset the activation line is the viewport top: `install` (top:40)
		// has not reached it, so `intro` stays active.
		await expect
			.element(screen.getByRole('link', { name: 'Introduction', exact: true }))
			.toHaveAttribute('aria-current', 'location');

		await screen.rerender({ items, offset: 64 });
		window.dispatchEvent(new Event('resize'));
		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');

		cleanup();
	});

	it('lands the heading below a fixed header instead of underneath it', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const install = document.getElementById('install') as HTMLElement;

		// The heading sits 400px down the page and asks for 8px of breathing room
		// below whatever is above it. Chromium resolves a declared
		// `scroll-margin-top`, so it is set for real rather than faked at the
		// `getComputedStyle` boundary the way upstream must.
		vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: 400 } as DOMRect);
		install.style.scrollMarginTop = '8px';

		const screen = await render(Outline, { props: { items, offset: 48 } });
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		// A 48px fixed header covers the top of the scroll root, so the heading
		// must come to rest at 48 (header) + 8 (its own scroll-margin-top) = 56px
		// — NOT at 8px, which would park it underneath the header, invisible.
		// scrollIntoView cannot know about the header, so it must not be used here.
		expect(window.scrollBy).toHaveBeenCalledWith({
			top: 400 - 56,
			behavior: 'smooth'
		});
		expect(install.scrollIntoView).not.toHaveBeenCalled();

		cleanup();
	});

	it('lands the heading below a fixed header inside a scoped container', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const install = document.getElementById('install') as HTMLElement;

		const pane = document.createElement('div');
		document.body.appendChild(pane);
		vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
		vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: 500 } as DOMRect);

		const screen = await render(Outline, {
			props: { items, scrollContainerRef: () => pane, offset: 48 }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		// Measured from the pane's own top (100), not the viewport's.
		expect(pane.scrollBy).toHaveBeenCalledWith({
			top: 500 - (100 + 48),
			behavior: 'smooth'
		});
		expect(window.scrollBy).not.toHaveBeenCalled();

		cleanup();
		pane.remove();
	});

	it('keeps the CSS-native scrollIntoView path when offset is 0', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();

		const screen = await render(Outline, { props: { items } });
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		// No fixed header to compensate for: let the browser honor
		// scroll-margin-top itself rather than doing the math in JS.
		const install = document.getElementById('install') as HTMLElement;
		expect(install.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start'
		});
		expect(window.scrollBy).not.toHaveBeenCalled();

		cleanup();
	});

	it('composes offset with the heading own scroll-margin-top for activation', async () => {
		const cleanup = mountHeadings();
		const [intro, install, api] = headingsOf();

		pinDocumentHeight();
		// Every heading declares 8px of scroll-margin-top; the header is 48px.
		// The activation line is therefore 48 + 8 = 56px (+1px tolerance).
		for (const heading of [intro, install, api]) {
			heading.style.scrollMarginTop = '8px';
		}
		vi.spyOn(intro, 'getBoundingClientRect').mockReturnValue({ top: -200 } as DOMRect);
		// 50 < 56: `install` has crossed the composed line, so it is active.
		vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: 50 } as DOMRect);
		// 60 > 56: `api` has NOT crossed it. If offset and scroll-margin-top were
		// double-counted (96px) this would wrongly activate.
		vi.spyOn(api, 'getBoundingClientRect').mockReturnValue({ top: 60 } as DOMRect);

		const screen = await render(Outline, { props: { items, offset: 48 } });

		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');
		await expect
			.element(screen.getByRole('link', { name: 'API', exact: true }))
			.not.toHaveAttribute('aria-current');

		cleanup();
	});

	it('scrollContainerRef scopes tracking to a custom scroll container', async () => {
		const cleanup = mountHeadings();
		const [intro, install, api] = headingsOf();

		// A split-pane / modal scroll container. It is deliberately NOT a
		// scrollable ancestor of the Outline, so the auto-detect heuristic would
		// fall back to the window — the exact case that leaves a TOC's highlight
		// stuck today. Scoping must use this element's box as the activation line.
		const pane = document.createElement('div');
		document.body.appendChild(pane);
		vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue({ top: 300 } as DOMRect);
		Object.defineProperty(pane, 'scrollTop', { value: 0, configurable: true });
		Object.defineProperty(pane, 'clientHeight', { value: 500, configurable: true });
		Object.defineProperty(pane, 'scrollHeight', { value: 4000, configurable: true });

		// Relative to the pane's top (300), intro and install have passed; api not.
		// Relative to the viewport (0) all three would have passed, which would
		// make `api` active — so this asserts the pane really is the scroll root.
		vi.spyOn(intro, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
		vi.spyOn(install, 'getBoundingClientRect').mockReturnValue({ top: 250 } as DOMRect);
		vi.spyOn(api, 'getBoundingClientRect').mockReturnValue({ top: 600 } as DOMRect);

		const screen = await render(Outline, {
			props: { items, scrollContainerRef: () => pane }
		});

		await expect
			.element(screen.getByRole('link', { name: 'Installation', exact: true }))
			.toHaveAttribute('aria-current', 'location');

		pane.remove();
		cleanup();
	});

	it('settles a scoped navigation on the container scrollend, not the window', async () => {
		const user = userEvent.setup();
		const cleanup = mountHeadings();
		const onNavigateEnd = vi.fn();

		const pane = document.createElement('div');
		document.body.appendChild(pane);

		const screen = await render(Outline, {
			props: { items, scrollContainerRef: () => pane, onNavigateEnd }
		});
		await user.click(screen.getByRole('link', { name: 'Installation', exact: true }).element());

		// A window scrollend must NOT settle a container-scoped navigation.
		window.dispatchEvent(new Event('scrollend'));
		expect(onNavigateEnd).not.toHaveBeenCalled();

		pane.dispatchEvent(new Event('scrollend'));
		expect(onNavigateEnd).toHaveBeenCalledTimes(1);
		expect(onNavigateEnd).toHaveBeenCalledWith('install');

		pane.remove();
		cleanup();
	});
});

describe('useOutlineFromDOM', () => {
	it('collects headings from DOM container', async () => {
		const screen = await render(OutlineFromDomProbe);
		await expect.element(screen.getByText('2:intro:Intro|3:details:Details')).toBeInTheDocument();
	});
});
