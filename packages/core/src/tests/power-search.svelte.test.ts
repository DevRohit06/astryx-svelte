import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PowerSearch from '$lib/components/power-search/power-search.svelte';
import Harness from './fixtures/power-search-harness.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import type { PowerSearchConfig } from '$lib/components/power-search/types.js';

/**
 * Astryx's `PowerSearch/PowerSearch.test.tsx`, ported case for case — **32
 * upstream cases at the 0.5.0 pin**, **21 here**, in upstream's order and under
 * upstream's describe names. There is no `displayName` case in the file.
 *
 * The 21 that are here are the whole of upstream's suite as it stood at v0.3.0:
 * 2 at the top of `describe('PowerSearch')` plus four nested describes
 * (`startIcon` 2, `paste behavior` 2, `disabledMessage` 8, `result count
 * announcements` 5), then the top-level `PowerSearch statusVariant forwarding`
 * (2).
 *
 * **The 11 that are not here are three whole describes, all added at 0.5.0**,
 * and they are one change — menu sizing, capping and grouping:
 *
 * - **`maxOperatorMenuItems`** (1) — `caps entity suggestions after selecting a
 *   field`.
 * - **`field menu sizing`** (6) — every field shown in a normal list while
 *   browsing, an extreme list capped at the 1,000-row browsing ceiling, ranked
 *   results capped while typing, ranked results capped at `maxSearchResults`,
 *   `maxSearchResults` *not* applied while browsing, and `menuWidth` applied to
 *   the main field menu.
 * - **`field menu grouping`** (3) — ungrouped fields rendered before named
 *   sections, keyboard navigation kept flat across section boundaries, and
 *   ranked results kept flat while typing.
 *
 * The same release put the matching gap in two sibling files:
 * `power-search-value-editor.svelte.test.ts` (`maxMenuItems`, 3) and
 * `use-power-search-source.svelte.test.ts` (`typed-result cap` plus two
 * grouping cases, 4).
 *
 * **All eleven are a component gap, not only a test gap.** `power-search.svelte`
 * declares `menuWidth` and `maxOperatorMenuItems` but reads neither — it carries
 * a "Two dead props, kept because upstream publishes them" note saying
 * *"upstream never destructures either"*, and **that reason expired at 0.5.0**:
 * upstream now destructures both and threads them into the menus
 * (`PowerSearch.tsx` passes `maxMenuItems={maxOperatorMenuItems}` and
 * `menuWidth={menuWidth}`). `maxSearchResults` is not declared here at all,
 * where upstream defaults it and hands it to `usePowerSearchSource`. Wire the
 * three props through before writing any of the eleven cases.
 *
 * (This header read "**21** upstream cases at v0.3.0 … 21 here. Nothing
 * dropped, nothing added", true at that pin. It said "**17** … 17 here" before
 * that, which was wrong.)
 *
 * (The previous header said "**17 upstream cases** … **17 here**" and listed
 * only three nested describes. The `startIcon` pair and the whole `PowerSearch
 * statusVariant forwarding` block were unported and unnamed; all four are ported
 * here and all four passed on the first run.)
 *
 * Runs in the **client (real Chromium)** project. Upstream's `beforeAll`/
 * `afterAll` stubs for `ResizeObserver`, `showPopover`/`hidePopover` and
 * `:popover-open` are therefore GONE — Chromium implements all four natively —
 * the removal every ported browser suite in this repo makes. Its `afterEach`
 * `__resetLiveRegionsForTest()` **stays**, and matters more here: the live
 * regions are singletons appended to `<body>`, so a count announced by one case
 * would otherwise still be sitting there for the next.
 *
 * ## Two cases change mechanism (counterparts, not translations)
 *
 * - **`forwards ref to the root element`.** This port omits every `ref` prop.
 *   Unlike `Calendar` and `Tokenizer`, `PowerSearch` also spreads no rest props
 *   onto its root — `xstyle`/`class`/`style`/`data-testid` all go to the
 *   `Tokenizer`, exactly as upstream's do — so there is no attachment channel
 *   either. What upstream's ref observes that *is* observable here is the root
 *   element's identity, so both of upstream's assertions are kept and run
 *   against `container.firstElementChild`.
 * - **`exposes typeahead focus through handleRef`.** `handleRef` +
 *   `useImperativeHandle` became the instance exports `focusTypeahead()` /
 *   `blurTypeahead()`, reached through `bind:this` — the `Tokenizer`/`SideNav`/
 *   `Calendar` arrangement. `render(...).component` is that same instance, so
 *   the call is `screen.component.focusTypeahead()` and upstream's assertion is
 *   unchanged.
 *
 * ## Environment hazards this suite pays for explicitly
 *
 * - **`render()`'s query helpers bind to `document.body`**, which is where
 *   `useAnnounce`'s live regions live too. `PowerSearch` renders its
 *   `resultCount` *visibly* as well, so a bare `getByText('5 results')` would
 *   match both the visible span and the live region and blow up strict mode.
 *   Every result-count assertion therefore queries the region directly, as
 *   upstream's `politeRegion()` does.
 * - **Playwright refuses to act on an `aria-disabled` element**, where
 *   user-event in jsdom fires regardless. The two `disabledMessage` pointer
 *   cases dispatch `mouseenter`/`mouseleave` natively for that reason (the
 *   translation `tokenizer.svelte.test.ts` settled), and `blocks input while
 *   focusable-disabled` keeps upstream's own `focus()` + `keyboard()` because
 *   `fill`/`type` is not an available substitute — the input is `readonly` and
 *   Playwright will not write into a non-editable element.
 * - **The browser locale is pinned to `en-US`** by `vite.config.ts`, which is
 *   what keeps `@astryx.powersearch.resultCount`'s ICU `{count, number}` from
 *   formatting against the host machine's locale.
 *
 * ## Other mechanical translations
 *
 * - `render` is async — always awaited; `rerender` is `screen.rerender`.
 * - `act()` has no counterpart — a `$state` write flushes on its own, and
 *   `waitFor` becomes `vi.waitFor` / `expect.element`, which retry.
 * - `user.paste(x)` becomes `userEvent.fill(input, x)`: the driver has no paste
 *   primitive, and `fill` produces the same single-input-event value change the
 *   component sees. Marked RESTATED at both sites, as in
 *   `tokenizer.svelte.test.ts` and `typeahead.svelte.test.ts`.
 * - `getAllByRole('option', {hidden: true})` becomes
 *   `getByRole('option', {includeHidden: true}).elements()`. Checked by hand
 *   that the two arrays `pasting produces same results as typing` compares are
 *   non-empty (2 options for `Stat`), since two empty arrays would satisfy
 *   upstream's `toEqual` without testing anything.
 * - `getByText` carries `{exact: true}` wherever the sought string is a prefix
 *   of another rendered one; Playwright's text engine is substring by default.
 */

// =============================================================================
// Test infrastructure
// =============================================================================

// Reset the singleton live regions between tests so result-count
// announcements from one test don't leak into the next.
afterEach(() => {
	__resetLiveRegionsForTest();
	vi.restoreAllMocks();
});

function comboboxIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="combobox"]');
	if (!(el instanceof HTMLInputElement)) throw new Error('expected a role="combobox" input');
	return el;
}

function tooltipIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="tooltip"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="tooltip" element');
	return el;
}

function groupIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="group"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="group" element');
	return el;
}

/** Upstream's `await new Promise(r => setTimeout(r, 50))`. */
function settle(ms = 50): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Fixtures
// =============================================================================

const config: PowerSearchConfig = {
	name: 'TestSearch',
	fields: [
		{
			key: 'title',
			label: 'Title',
			defaultOperator: 'contains',
			operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
		},
		{
			key: 'status',
			label: 'Status',
			defaultOperator: 'is',
			operators: [
				{
					key: 'is',
					label: 'is',
					value: {
						type: 'enum',
						values: [
							{ value: 'open', label: 'Open' },
							{ value: 'closed', label: 'Closed' }
						]
					}
				}
			]
		}
	]
};

// =============================================================================
// Tests
// =============================================================================

describe('PowerSearch', () => {
	// COUNTERPART for upstream's ref case — see the file header. Both of
	// upstream's assertions are kept; only the way the element is reached
	// changes.
	it('forwards ref to the root element', async () => {
		const screen = await render(PowerSearch, {
			props: { config, filters: [], onChange: () => {} }
		});
		const root = screen.container.firstElementChild;
		expect(root).toBeInstanceOf(HTMLDivElement);
		expect(root).toHaveClass('astryx-power-search');
	});

	// COUNTERPART: `handleRef` is not a prop here. `focusTypeahead` is an
	// instance export, and `render(...).component` is the instance `bind:this`
	// would give.
	it('exposes typeahead focus through handleRef', async () => {
		const screen = await render(PowerSearch, {
			props: { config, filters: [], onChange: () => {} }
		});

		screen.component.focusTypeahead();

		await expect.element(screen.getByRole('combobox')).toHaveFocus();
	});

	describe('startIcon', () => {
		it('does not render a start icon when omitted', async () => {
			await render(PowerSearch, { props: { config, filters: [], onChange: () => {} } });
			expect(document.querySelector('svg')).toBeNull();
		});

		it('forwards startIcon to the internal Tokenizer', async () => {
			// `startIcon` is `IconName | Snippet` here where upstream types it
			// `ReactNode`, so upstream's inline `<TestIcon data-testid="start-icon" />`
			// is authored through the shared slot probe.
			const screen = await render(SlotProbe, {
				props: {
					component: PowerSearch,
					slot: 'startIcon',
					text: '*',
					testid: 'start-icon',
					rest: { config, filters: [], onChange: () => {} }
				}
			});
			await expect.element(screen.getByTestId('start-icon')).toBeInTheDocument();
		});
	});

	describe('paste behavior', () => {
		it('pasting a field name shows matching field suggestions', async () => {
			const screen = await render(Harness, { props: { config } });

			const input = comboboxIn(screen.container);
			await userEvent.click(input);
			// RESTATED: the driver has no paste primitive; `fill` produces the same
			// single-input-event value change a paste does, which is what the
			// component sees.
			await userEvent.fill(input, 'Tit');
			await settle();

			await expect.element(screen.getByText('Title', { exact: true })).toBeInTheDocument();
		});

		it('pasting produces same results as typing', async () => {
			const screen = await render(Harness, { props: { config } });

			// Paste "Stat"
			const input1 = comboboxIn(screen.container);
			await userEvent.click(input1);
			// RESTATED as the case above.
			await userEvent.fill(input1, 'Stat');
			await settle();

			const pasteResults = screen
				.getByRole('option', { includeHidden: true })
				.elements()
				.map((el) => el.textContent);

			await screen.unmount();

			// Type "Stat"
			const screen2 = await render(Harness, { props: { config } });
			const input2 = comboboxIn(screen2.container);
			await userEvent.click(input2);
			await userEvent.type(input2, 'Stat');
			await settle();

			const typeResults = screen2
				.getByRole('option', { includeHidden: true })
				.elements()
				.map((el) => el.textContent);

			expect(pasteResults).toEqual(typeResults);
		});
	});

	describe('disabledMessage', () => {
		function renderSearch(props?: { onChange?: () => void }) {
			return render(PowerSearch, {
				props: {
					config,
					filters: [],
					onChange: props?.onChange ?? (() => {}),
					isDisabled: true,
					disabledMessage: 'You need edit access to search'
				}
			});
		}

		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await renderSearch();
			const tooltip = tooltipIn(screen.container);
			expect(tooltip).toHaveTextContent('You need edit access to search');
			const wrapper = groupIn(screen.container);
			// RESTATED mechanism: Playwright refuses to hover an `aria-disabled`
			// element, so the pointer events are dispatched natively — which is what
			// upstream's `fireEvent.mouseEnter` does anyway.
			wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			await vi.waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
			wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
			await vi.waitFor(() => expect(tooltip.matches(':popover-open')).toBe(false));
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await renderSearch();
			const tooltip = tooltipIn(screen.container);
			await userEvent.tab();
			expect(document.activeElement).toBe(comboboxIn(screen.container));
			await vi.waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(PowerSearch, {
				props: {
					config,
					filters: [],
					onChange: () => {},
					disabledMessage: 'You need edit access to search'
				}
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(PowerSearch, {
				props: { config, filters: [], onChange: () => {}, isDisabled: true }
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
			const screen = await renderSearch();
			const input = comboboxIn(screen.container);
			// RESTATED: `not.toBeDisabled()` here is Playwright's ARIA computation,
			// which counts `aria-disabled` and would report this input as disabled.
			// The native attribute is what upstream asserts the absence of.
			expect(input).not.toHaveAttribute('disabled');
			expect(input).toHaveAttribute('aria-disabled', 'true');
		});

		it('links the reason tooltip via aria-describedby', async () => {
			const screen = await renderSearch();
			const input = comboboxIn(screen.container);
			const tooltip = tooltipIn(screen.container);
			expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks input while focusable-disabled', async () => {
			const screen = await renderSearch();
			const input = comboboxIn(screen.container);
			// PORTED verbatim — upstream focuses and presses keys too. Noted only
			// because `fill`/`type` is not an available substitute: the input is
			// `readonly` and Playwright refuses to write into a non-editable element.
			input.focus();
			await userEvent.keyboard('open');
			expect(input.value).toBe('');
		});

		it('keeps the input natively disabled when disabled without a reason', async () => {
			const screen = await render(PowerSearch, {
				props: { config, filters: [], onChange: () => {}, isDisabled: true }
			});
			expect(comboboxIn(screen.container)).toBeDisabled();
		});
	});

	describe('result count announcements', () => {
		const politeRegion = () => document.querySelector('[data-astryx-live-region="polite"]');

		it('announces the result count to a polite live region when it changes', async () => {
			const screen = await render(PowerSearch, {
				props: { config, filters: [], onChange: () => {}, resultCount: 0 }
			});
			await screen.rerender({ resultCount: 5 });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('5 results');
			});
		});

		it('announces "1 result" (singular) for a single match', async () => {
			const screen = await render(PowerSearch, {
				props: { config, filters: [], onChange: () => {}, resultCount: 0 }
			});
			await screen.rerender({ resultCount: 1 });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('1 result');
			});
			expect(politeRegion()?.textContent).not.toMatch(/results/);
		});

		it('announces a string result count verbatim', async () => {
			const screen = await render(PowerSearch, {
				props: { config, filters: [], onChange: () => {}, resultCount: '0 items' }
			});
			await screen.rerender({ resultCount: 'Showing 1.2k matches' });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Showing 1.2k matches');
			});
		});

		it('does not announce the result count present on initial mount', async () => {
			await render(PowerSearch, {
				props: { config, filters: [], onChange: () => {}, resultCount: 42 }
			});
			// Flush effects and any pending live-region rAF writes.
			await settle();
			expect(politeRegion()?.textContent ?? '').not.toContain('42');
		});

		it('leaves Typeahead dropdown announcements intact and stays silent when no resultCount is set', async () => {
			const screen = await render(Harness, { props: { config } });
			const input = comboboxIn(screen.container);
			await userEvent.click(input);
			await userEvent.type(input, 'Status');
			// BaseTypeahead announces the dropdown suggestion count; PowerSearch adds
			// no result-count announcement because resultCount is unset.
			await vi.waitFor(() => {
				expect(politeRegion()?.textContent).toMatch(/\d+ results?/);
			});
		});
	});
});

describe('PowerSearch statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(PowerSearch, {
			props: {
				config,
				filters: [],
				onChange: () => {},
				status: { type: 'error', message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(PowerSearch, {
			props: {
				config,
				filters: [],
				onChange: () => {},
				status: { type: 'error', message: 'Required' },
				statusVariant: 'detached'
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});
});
