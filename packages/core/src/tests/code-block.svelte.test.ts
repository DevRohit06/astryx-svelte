/** PORTS: CodeBlock/CodeBlock.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import CodeBlock from '$lib/components/code-block/code-block.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import { dracula } from '$lib/theme/syntax/index.js';
import CodeBlockI18nFixture from './fixtures/code-block-i18n.svelte';

/**
 * Astryx's `CodeBlock/CodeBlock.test.tsx`, ported case for case.
 *
 * Upstream has **22** `it` cases at the **0.5.0** pin, and **16** are here.
 * (This header read "**16** … at v0.3.0. All 16 are ported — nothing is
 * dropped", true at that pin; before that it claimed 13 upstream and 13 here,
 * while upstream had 15 even at v0.2.0.)
 *
 * **The 6 that are not here all landed between v0.3.0 and v0.4.5** — upstream's
 * file is unchanged between v0.4.5 and 0.5.0 — and they are two groups, both
 * about theming surfaces the port has not exposed:
 *
 * - **Two copy-button cases** — `renders the copy button as a themeable target
 *   with a "Copy code" tooltip`, and `keeps the copy button tooltip as "Copy
 *   code" after copying` (the tooltip must not follow the button's transient
 *   "Copied" state).
 * - **A four-case header/title theming block** — `puts astryx-codeblock-header
 *   on the header row when a header shows`, `puts astryx-codeblock-title on the
 *   header title element`, `renders no header targets when there is no header`,
 *   and `exposes the header and title as themeable defineTheme targets`.
 *
 * `CodeBlock` has no `ref` case and no `displayName` case,
 * so the two usual translations do not arise here, and `syntaxTheme` is a real
 * prop in this port (the `theme/syntax/` subsystem landed with it), so the last
 * two cases are direct ports rather than counterparts.
 *
 * `CodeBlock` takes no snippet children, so every case renders the component
 * itself — no probe fixture is needed.
 *
 * Translations (assertions unchanged unless noted):
 * - `render` from `vitest-browser-svelte` v3 is async, so it is always awaited.
 * - `act()` has no counterpart: a `$state` write flushes on a microtask, so
 *   `await tick()` stands in wherever a *negative* assertion has to be made
 *   after a state change might have happened. Without it those assertions would
 *   be vacuous — a regression would not have reached the DOM yet.
 * - `waitFor` becomes `vi.waitFor`, which retries the same way.
 * - Upstream's clipboard stub is **kept**, and matters more here: Chromium does
 *   implement `navigator.clipboard`, but `writeText` needs a permission grant
 *   under Playwright and would otherwise reject, so the component's copied state
 *   would never be reached.
 */

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

// A code sample long enough to exceed the default collapsible threshold (10).
const LONG_CODE = Array.from({ length: 15 }, (_, i) => `const line${i} = ${i};`).join('\n');

let writeText: ReturnType<typeof vi.fn>;

/**
 * Upstream's `getAllByRole('button').find(el => el.hasAttribute('aria-expanded'))`.
 * The collapsible header is the only button carrying `aria-expanded`.
 */
function collapsibleHeader(container: HTMLElement): HTMLElement | undefined {
	const buttons = Array.from(container.querySelectorAll<HTMLElement>('button, [role="button"]'));
	return buttons.find((el) => el.hasAttribute('aria-expanded'));
}

/**
 * Upstream's `screen.getByRole('group')` for the scroll container. A DOM query
 * rather than a role query, because the two inert cases assert *while the
 * region is inert*: Chromium really implements `inert` and drops the subtree
 * from the accessibility tree, so a role locator finds nothing there — where
 * jsdom, which implements none of it, still resolves the role. Same element,
 * same assertions.
 */
function scrollContainer(container: HTMLElement): HTMLElement {
	const el = container.querySelector<HTMLElement>('[role="group"]');
	if (el == null) {
		throw new Error('expected a scrollable code region');
	}
	return el;
}

describe('CodeBlock', () => {
	beforeEach(() => {
		// The browser's Clipboard API needs a permission grant that the test page
		// does not have; substitute a spy, as upstream does for jsdom.
		writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
			writable: true
		});
	});

	afterEach(() => {
		__resetLiveRegionsForTest();
		// Hand the real (permission-gated) clipboard back to the page.
		Reflect.deleteProperty(navigator, 'clipboard');
	});

	it('renders the code', async () => {
		const screen = await render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'javascript' }
		});
		await expect.element(screen.getByText(/const/)).toBeInTheDocument();
	});

	it('makes the scroll container keyboard-focusable', async () => {
		const screen = await render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'javascript' }
		});
		const region = screen.getByRole('group');
		await expect.element(region).toHaveAttribute('tabindex', '0');
		await expect.element(region).toHaveAttribute('aria-label', 'javascript');
	});

	it('labels the scroll region "Code" when no language label is shown', async () => {
		const screen = await render(CodeBlock, {
			props: { code: 'hello', hasLanguageLabel: false }
		});
		const region = screen.getByRole('group');
		await expect.element(region).toHaveAttribute('tabindex', '0');
		await expect.element(region).toHaveAttribute('aria-label', 'Code');
	});

	it('copies code when the copy button is clicked', async () => {
		const screen = await render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'javascript' }
		});
		const copyButton = screen.getByRole('button', { name: 'Copy code', exact: true });
		await userEvent.click(copyButton);
		expect(writeText).toHaveBeenCalledWith('const x = 1;');
	});

	it('announces "Copied" to a polite live region after copying', async () => {
		const screen = await render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'javascript' }
		});
		const copyButton = screen.getByRole('button', { name: 'Copy code', exact: true });
		await userEvent.click(copyButton);
		await vi.waitFor(() => {
			expect(politeRegion()).toHaveTextContent('Copied');
		});
	});

	it('localizes the copy announcement through the i18n catalog', async () => {
		const screen = await render(CodeBlockI18nFixture, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.codeBlock.copied': 'Copié' } },
				code: 'const x = 1;',
				language: 'javascript'
			}
		});
		// The button label and the live-region announcement share the same key.
		await userEvent.click(screen.getByRole('button', { name: 'Copy code', exact: true }));
		await vi.waitFor(() => {
			expect(politeRegion()).toHaveTextContent('Copié');
		});
		await expect
			.element(screen.getByRole('button', { name: 'Copié', exact: true }))
			.toBeInTheDocument();
	});

	it('keeps the copied indicator a full 2s after a rapid re-copy', async () => {
		// Only setTimeout/clearTimeout are faked. The default fake set includes
		// queueMicrotask, which is what Svelte schedules its flush on — faking it
		// stalls mount and unmount. The copied-indicator reset is a `setTimeout`,
		// which is the whole subject of this case.
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const screen = await render(CodeBlock, {
				props: { code: 'const x = 1;', language: 'javascript' }
			});
			// `userEvent.click` drives the browser over a channel that needs real
			// timers; a native `.click()` is the direct equivalent of upstream's
			// `fireEvent.click` and is timer-free.
			(
				screen.getByRole('button', { name: 'Copy code', exact: true }).element() as HTMLElement
			).click();
			// Flush the async clipboard write.
			await flushCopy();
			expect(
				screen.getByRole('button', { name: 'Copied', exact: true }).element()
			).toBeInTheDocument();

			// 1.5s later the user copies again.
			vi.advanceTimersByTime(1500);
			await tick();
			(
				screen.getByRole('button', { name: 'Copied', exact: true }).element() as HTMLElement
			).click();
			await flushCopy();

			// 600ms after the second copy (2.1s after the first): the first
			// click's timer must not have reverted the indicator early.
			vi.advanceTimersByTime(600);
			await tick();
			expect(
				screen.getByRole('button', { name: 'Copied', exact: true }).element()
			).toBeInTheDocument();

			// It resets 2s after the most recent copy.
			vi.advanceTimersByTime(1400);
			await tick();
			expect(
				screen.getByRole('button', { name: 'Copy code', exact: true }).element()
			).toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});

	it('does NOT collapse the block when the copy button is clicked', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		// The collapsible header exposes aria-expanded.
		const header = collapsibleHeader(screen.container);
		expect(header).toBeTruthy();
		expect(header).toHaveAttribute('aria-expanded', 'true');

		const copyButton = screen.getByRole('button', { name: 'Copy code', exact: true });
		await userEvent.click(copyButton);
		// A toggle would only reach the DOM on the next microtask, so flush before
		// asserting it did not happen.
		await tick();

		// Clicking Copy must not toggle the collapsible header.
		expect(header).toHaveAttribute('aria-expanded', 'true');
		expect(writeText).toHaveBeenCalled();
	});

	it('does not nest the copy button inside the collapsible header role="button"', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		const header = collapsibleHeader(screen.container);
		const copyButton = screen.getByRole('button', { name: 'Copy code', exact: true }).element();
		expect(header).toBeTruthy();
		// The copy button must be a sibling, not a descendant of the interactive
		// header — nested interactive controls are invalid ARIA.
		expect(header!.contains(copyButton)).toBe(false);
	});

	it('still toggles collapse when the header itself is clicked', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		const header = collapsibleHeader(screen.container)!;
		expect(header).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(header);
		await expect.element(header).toHaveAttribute('aria-expanded', 'false');
	});

	it('links the collapsible header to its code region via aria-controls', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		const header = collapsibleHeader(screen.container)!;
		const controlsId = header.getAttribute('aria-controls');
		// aria-controls must be present and point at the real code region.
		expect(controlsId).toBeTruthy();
		const region = document.getElementById(controlsId as string);
		expect(region).not.toBeNull();
		// The region contains the scrollable code body (role="group").
		expect(region).toContainElement(screen.getByRole('group').element() as HTMLElement);
	});

	it('keeps aria-controls resolvable when collapsed (region stays mounted)', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		const header = collapsibleHeader(screen.container)!;
		await userEvent.click(header);
		await expect.element(header).toHaveAttribute('aria-expanded', 'false');
		// The code region uses a CSS grid animation to collapse, so it stays in
		// the DOM — aria-controls stays a valid, resolvable reference (unlike a
		// conditionally-mounted region, which would need a conditional attribute).
		const controlsId = header.getAttribute('aria-controls');
		expect(controlsId).toBeTruthy();
		expect(document.getElementById(controlsId as string)).not.toBeNull();
	});

	it('makes the collapsed region inert so the scroll container is unreachable', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		const header = collapsibleHeader(screen.container)!;
		const region = document.getElementById(header.getAttribute('aria-controls') as string)!;
		// Expanded: the region is not inert and the scroll container is reachable.
		expect(region).not.toHaveAttribute('inert');

		await userEvent.click(header);
		await expect.element(header).toHaveAttribute('aria-expanded', 'false');
		// Collapsed: the wrapper is inert, so the keyboard-focusable scroll
		// container (tabindex=0) inside it drops out of the tab order and the
		// accessibility tree instead of remaining an invisible tab stop.
		expect(region).toHaveAttribute('inert');
		expect(scrollContainer(screen.container).closest('[inert]')).toBe(region);
	});

	it('restores focusability of the scroll container after expanding again', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: LONG_CODE,
				language: 'javascript',
				title: 'example',
				isCollapsible: true
			}
		});
		const header = collapsibleHeader(screen.container)!;
		const region = document.getElementById(header.getAttribute('aria-controls') as string)!;
		// Collapse, then expand again.
		await userEvent.click(header);
		await expect.element(header).toHaveAttribute('aria-expanded', 'false');
		expect(region).toHaveAttribute('inert');

		await userEvent.click(header);
		await expect.element(header).toHaveAttribute('aria-expanded', 'true');
		// Expanded again: inert is removed and the scroll container is a
		// keyboard-focusable group once more.
		expect(region).not.toHaveAttribute('inert');
		expect(scrollContainer(screen.container).closest('[inert]')).toBeNull();
		expect(scrollContainer(screen.container)).toHaveAttribute('tabindex', '0');
	});

	it('applies a per-instance syntax theme via the syntaxTheme prop', async () => {
		const screen = await render(CodeBlock, {
			props: {
				code: 'const x = 1;',
				language: 'javascript',
				syntaxTheme: dracula
			}
		});
		const wrapper = screen.container.querySelector('[data-astryx-syntax-theme]');
		expect(wrapper).not.toBeNull();
		expect(wrapper).toHaveAttribute('data-astryx-syntax-theme', 'dracula');
		expect(wrapper!.querySelector('pre')).not.toBeNull();
	});

	it('renders no syntax theme wrapper when syntaxTheme is not set', async () => {
		const screen = await render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'javascript' }
		});
		expect(screen.container.querySelector('[data-astryx-syntax-theme]')).toBeNull();
		expect(screen.container.firstElementChild?.tagName).toBe('PRE');
	});
});

/**
 * Upstream's `await act(async () => {})` after a click: let the awaited clipboard
 * promise resume `handleCopy`, then let Svelte flush the resulting `$state`
 * write. Both are microtasks, which the fake-timer set above deliberately leaves
 * alone.
 */
async function flushCopy(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await tick();
}
