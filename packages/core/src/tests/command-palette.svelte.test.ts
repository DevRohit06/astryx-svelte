/** PORTS: CommandPalette/CommandPalette.test.tsx */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/command-palette-probe.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import { createStaticSource } from '$lib/components/typeahead/create-static-source.js';
import type { SearchSource, SearchableItem } from '$lib/components/typeahead/types.js';

/**
 * Ported from Astryx's `CommandPalette/CommandPalette.test.tsx` — **19 of its 21
 * `it` cases at the 0.5.0 pin**: 14 of upstream's 16 top-level cases plus the
 * whole five-case `screen reader announcements` describe. There is no
 * `displayName` case and no snapshot in the file.
 *
 * The 2 not here are both top-level race guards, portable against source that
 * already implements them: `discards a search response that resolves after the
 * palette closed` and `does not move the highlight while typing in the search
 * input`. (The header read "all 19 … none dropped" while upstream held 21.)
 *
 * Runs in the **client** (real Chromium) project. Upstream's
 * `showModal`/`close` `vi.fn` mock is reproduced exactly as the `Dialog` and
 * `Lightbox` suites reproduce it, and for the same two reasons: it strips the
 * real top-layer side effects, and a closed `<dialog>` stays queryable.
 *
 * Two query shifts, both following the earlier client suites: a closed
 * `<dialog>` is `display: none`, so upstream's `getByRole('dialog', {hidden:
 * true})` becomes a `container.querySelector`; and every case that types drives
 * it with `userEvent.fill` where upstream uses `fireEvent.change`.
 *
 * The five announcement cases read the shared polite live region through
 * upstream's own `[data-astryx-live-region="polite"]` selector, with
 * `__resetLiveRegionsForTest()` in `beforeEach` exactly as upstream has it. The
 * region auto-clears ~2s after announcing, so each assertion is a short
 * `vi.waitFor` rather than a long settle.
 */

const simpleSource = createStaticSource([
	{ id: 'home', label: 'Home' },
	{ id: 'settings', label: 'Settings' }
]);

const groupedSource = createStaticSource([
	{ id: 'home', label: 'Home', auxiliaryData: { group: 'Navigation' } },
	{ id: 'save', label: 'Save', auxiliaryData: { group: 'Actions' } }
]);

const emptySource = createStaticSource([]);

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
	// The live regions are module-level singletons; reset them so
	// announcements from one test don't leak into the next.
	__resetLiveRegionsForTest();
});

afterEach(() => {
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
	__resetLiveRegionsForTest();
});

describe('CommandPalette', () => {
	it('renders when isOpen is true', async () => {
		const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('does not show content when isOpen is false', async () => {
		const screen = await render(Probe, { props: { isOpen: false, searchSource: simpleSource } });
		const dialog = screen.container.querySelector('dialog');
		expect(dialog).not.toBeNull();
		expect(dialog).not.toHaveAttribute('open');
	});

	it('has correct aria-label', async () => {
		const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
		await expect
			.element(screen.getByRole('dialog'))
			.toHaveAttribute('aria-label', 'Command palette');
	});

	it('supports custom label', async () => {
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: simpleSource, label: 'Quick search' }
		});
		await expect.element(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Quick search');
	});

	it('renders default input and footer when not provided', async () => {
		const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
		await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
		await expect.element(screen.getByText(/Navigate/)).toBeInTheDocument();
	});

	it('renders custom input and footer slots', async () => {
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: simpleSource, hasCustomSlots: true }
		});
		await expect.element(screen.getByTestId('input-slot')).toBeInTheDocument();
		await expect.element(screen.getByTestId('footer-slot')).toBeInTheDocument();
	});

	it('default renders items from searchSource bootstrap', async () => {
		const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
		await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Settings', { exact: true })).toBeInTheDocument();
	});

	it('auto-groups items by auxiliaryData.group', async () => {
		const screen = await render(Probe, { props: { isOpen: true, searchSource: groupedSource } });
		// The group headings are `aria-hidden`, so they are read off the DOM rather
		// than through a text query — the assertion is upstream's either way.
		await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Save', { exact: true })).toBeInTheDocument();
		const headings = [...screen.container.querySelectorAll('[role="group"]')].map((group) =>
			group.getAttribute('aria-label')
		);
		expect(headings).toEqual(['Navigation', 'Actions']);
	});

	it('uses renderItem for custom item content', async () => {
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: simpleSource, renderMode: 'uppercase' }
		});
		await expect.element(screen.getByText('HOME', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('SETTINGS', { exact: true })).toBeInTheDocument();
	});

	it('passes isSelected=true to renderItem for the selected value', async () => {
		const screen = await render(Probe, {
			props: {
				isOpen: true,
				searchSource: simpleSource,
				value: 'home',
				renderMode: 'selected'
			}
		});
		await expect.element(screen.getByText('checked-Home', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Settings', { exact: true })).toBeInTheDocument();
	});

	it('shows emptyBootstrapText when bootstrap returns nothing', async () => {
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: emptySource, emptyBootstrapText: 'Nothing to show' }
		});
		await expect.element(screen.getByText('Nothing to show', { exact: true })).toBeInTheDocument();
	});

	it('shows default emptyBootstrapText when not provided', async () => {
		const screen = await render(Probe, { props: { isOpen: true, searchSource: emptySource } });
		await expect.element(screen.getByText('Type to search', { exact: true })).toBeInTheDocument();
	});

	it('calls onOpenChange(false) when Escape is pressed', async () => {
		const handleOpenChange = vi.fn();
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: simpleSource, onOpenChange: handleOpenChange }
		});
		const dialog = screen.getByRole('dialog').element();
		dialog.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
		);
		expect(handleOpenChange).toHaveBeenCalledWith(false);
	});

	it('keeps the empty state mounted while a no-result search is pending', async () => {
		const user = userEvent.setup();
		// A source whose searches resolve only when we release them, so we can
		// observe the render output while a search is in flight.
		const resolvers: ((items: SearchableItem[]) => void)[] = [];
		const source: SearchSource = {
			bootstrap: () => [],
			async search(): Promise<SearchableItem[]> {
				return new Promise<SearchableItem[]>((resolve) => {
					resolvers.push(resolve);
				});
			}
		};

		const screen = await render(Probe, {
			props: {
				isOpen: true,
				searchSource: source,
				emptyBootstrapText: 'Type to search',
				emptySearchText: 'No results'
			}
		});

		const input = screen.getByRole('combobox').element() as HTMLInputElement;

		// First search: commits an empty result for query "z".
		await user.fill(input, 'z');
		await vi.waitFor(() => expect(resolvers).toHaveLength(1));
		resolvers[0]([]);
		await expect.element(screen.getByText('No results', { exact: true })).toBeInTheDocument();

		// Second keystroke while already empty: the empty state must remain in the
		// DOM for the whole pending window — no unmount/remount flash.
		await user.fill(input, 'zz');
		expect(screen.container.textContent).toContain('No results');
		await vi.waitFor(() => expect(resolvers.length).toBeGreaterThanOrEqual(2));
		expect(screen.container.textContent).toContain('No results');
		resolvers[resolvers.length - 1]([]);
		await expect.element(screen.getByText('No results', { exact: true })).toBeInTheDocument();
	});

	describe('screen reader announcements', () => {
		const politeRegion = () => document.querySelector('[data-astryx-live-region="polite"]');

		it('announces the result count politely after typing a query', async () => {
			const user = userEvent.setup();
			const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
			await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
			// "e" matches both Home and Settings.
			await user.fill(screen.getByRole('combobox').element(), 'e');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('2 results');
			});
		});

		it('announces the singular form when one item matches', async () => {
			const user = userEvent.setup();
			const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
			await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
			// "set" matches only Settings. Anchored so it cannot pass on "1 results".
			await user.fill(screen.getByRole('combobox').element(), 'set');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent(/^1 result$/);
			});
		});

		it('announces the empty state with the query when nothing matches', async () => {
			const user = userEvent.setup();
			const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
			await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
			await user.fill(screen.getByRole('combobox').element(), 'zzz');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('No results for zzz');
			});
		});

		it('announces loading politely while a search is in flight', async () => {
			const user = userEvent.setup();
			// A source whose searches never resolve, so the palette stays busy and
			// only the loading announcement can reach the live region.
			const source: SearchSource = {
				bootstrap: () => [],
				async search(): Promise<SearchableItem[]> {
					return new Promise<SearchableItem[]>(() => {});
				}
			};
			const screen = await render(Probe, { props: { isOpen: true, searchSource: source } });
			await user.fill(screen.getByRole('combobox').element(), 'z');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Loading');
			});
		});

		it('does not announce on initial open (bootstrap)', async () => {
			const screen = await render(Probe, { props: { isOpen: true, searchSource: simpleSource } });
			await expect.element(screen.getByText('Home', { exact: true })).toBeInTheDocument();
			// Let any pending live-region rAF write land before asserting silence.
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(politeRegion()?.textContent ?? '').toBe('');
		});
	});
});
