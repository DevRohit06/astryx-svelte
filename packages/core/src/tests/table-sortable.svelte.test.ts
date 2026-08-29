import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { TableColumn } from '$lib/components/table/table-types.js';
import Fixture, { type SortableUser } from './fixtures/table-sortable-plugin-fixture.svelte';
import I18nFixture from './fixtures/table-sortable-i18n.svelte';
import { customSortHeader } from './fixtures/table-plugin-slots.svelte';

/**
 * Astryx's `Table/plugins/sortable/useTableSortable.test.tsx`, ported case for
 * case — **40 of 40** at the 0.5.0 pin, in upstream's order and under its titles (11
 * rendering, 10 interactions, 8 accessibility, 6 edge cases, 2 context-menu, 3
 * i18n). Nothing dropped.
 *
 * (The previous header said "**37 of 37**" and did not list the i18n block.
 * Upstream's `useTableSortable — i18n` describe has 3 cases; all three were
 * unported and unnamed, and all three passed on the first run.)
 *
 * Upstream's `SortableTable` helper is
 * `fixtures/table-sortable-plugin-fixture.svelte`, prop for prop: a hook has to
 * run during component init, so the probe fixture is what `renderHook` and an
 * inline JSX harness are to React.
 *
 * Standing translations:
 *
 * - `render` is async and takes `{ props }`; `rerender` is `screen.rerender`.
 * - `queryByRole(...)` → `getByRole(...).query()`, which is `null` when absent.
 * - `getAllByRole('columnheader')` → a container `querySelectorAll('th')`, since
 *   the cases only ever `.find()` by text and then read an attribute.
 * - `getByText` passes `{ exact: true }`, restoring Testing Library's
 *   whole-string matching over a Vitest locator's substring default.
 * - Upstream's `user.keyboard('{Shift>}') / click / keyboard('{/Shift}')` is
 *   `userEvent.click(el, { modifiers: ['Shift'] })` — the same shift-held click,
 *   spelled the way the Playwright provider spells it.
 * - The context-menu block runs in a **real** Chromium, so upstream's
 *   `beforeEach` stub of `showPopover` / `hidePopover` / `:popover-open` is
 *   gone, along with the `{hidden: true}` its stub forces on every role query —
 *   the same translation `table-context-menu.svelte.test.ts` documents. A closed
 *   menu resolves to no items at all here (the actions getter is only resolved
 *   on open), so `expect.poll` covers the open transition.
 *
 * RESTATED cases carry an inline comment. Two of upstream's assertions cannot
 * survive verbatim: `expect(() => render(…)).not.toThrow()` is vacuous when
 * `render` is async, and "plugin object is referentially stable across renders"
 * has no re-render to observe.
 */

// =============================================================================
// Helpers
// =============================================================================

type Screen = Awaited<ReturnType<typeof render>>;

function headers(screen: Screen): HTMLElement[] {
	return Array.from(screen.container.querySelectorAll<HTMLElement>('th'));
}

function headerWithText(screen: Screen, text: string): HTMLElement | undefined {
	return headers(screen).find((h) => h.textContent?.includes(text));
}

function menuItems(container: HTMLElement, name: string): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
		(item) => item.textContent?.trim() === name
	);
}

function rightClick(el: Element): void {
	el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('useTableSortable', () => {
	describe('rendering', () => {
		it('renders sort icon for sortable columns', async () => {
			const screen = await render(Fixture, { props: {} });

			// Sortable columns should have sort buttons
			await expect
				.element(screen.getByRole('button', { name: /sort by name/i }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: /sort by age/i }))
				.toBeInTheDocument();

			// Non-sortable column should not have a sort button
			expect(screen.getByRole('button', { name: /sort by email/i }).query()).toBeNull();
		});

		it('renders ascending icon when sort state is ascending', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const button = screen.getByRole('button', { name: /sort by name/i });
			await expect.element(button).toBeInTheDocument();
			expect(button.element().getAttribute('aria-label')).toContain('sorted ascending');
		});

		it('renders descending icon when sort state is descending', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'descending' }] }
			});

			const button = screen.getByRole('button', { name: /sort by name/i });
			expect(button.element().getAttribute('aria-label')).toContain('sorted descending');
		});

		it('renders unsorted icon when column is sortable but not in sort state', async () => {
			const screen = await render(Fixture, { props: {} });

			const button = screen.getByRole('button', { name: /sort by name/i });
			expect(button.element().getAttribute('aria-label')).toBe('Sort by Name');
		});

		it('renders no sort UI for columns without sortable config', async () => {
			const screen = await render(Fixture, { props: {} });

			// Email column is not sortable
			expect(screen.getByRole('button', { name: /sort by email/i }).query()).toBeNull();
		});

		it('renders sort button wrapping header content', async () => {
			const screen = await render(Fixture, { props: {} });

			const button = screen.getByRole('button', { name: /sort by name/i }).element();
			expect(button.tagName).toBe('BUTTON');
			expect(button).toHaveAttribute('type', 'button');
			expect(button.textContent).toContain('Name');
		});

		it('renders rank badge in multi-sort mode', async () => {
			const screen = await render(Fixture, {
				props: {
					isMultiSortEnabled: true,
					initialSort: [
						{ sortKey: 'name', direction: 'ascending' },
						{ sortKey: 'age', direction: 'descending' }
					]
				}
			});

			const nameButton = screen.getByRole('button', { name: /sort by name/i }).element();
			const ageButton = screen.getByRole('button', { name: /sort by age/i }).element();

			// Rank badges should be present
			expect(nameButton.textContent).toContain('1');
			expect(ageButton.textContent).toContain('2');
		});

		it('does not render rank badge in single-sort mode', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const nameButton = screen.getByRole('button', { name: /sort by name/i }).element();
			// Should not contain a rank badge — just "Name" text + icon
			expect(nameButton.getAttribute('aria-label')).toBe('Sort by Name, sorted ascending');
		});

		it('renders sort indicators when data is empty', async () => {
			const screen = await render(Fixture, { props: { data: [] } });

			await expect
				.element(screen.getByRole('button', { name: /sort by name/i }))
				.toBeInTheDocument();
		});

		it('uses custom sortKey from column config', async () => {
			const columns: TableColumn<SortableUser>[] = [
				{ key: 'name', header: 'Full Name', sortable: { sortKey: 'lastName' } }
			];

			const screen = await render(Fixture, {
				props: {
					columns,
					initialSort: [{ sortKey: 'lastName', direction: 'ascending' }]
				}
			});

			const button = screen.getByRole('button', { name: /sort by full name/i });
			expect(button.element().getAttribute('aria-label')).toContain('sorted ascending');
		});

		it('uses column key as default sortKey', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const button = screen.getByRole('button', { name: /sort by name/i });
			expect(button.element().getAttribute('aria-label')).toContain('sorted ascending');
		});
	});

	// =========================================================================
	// Interaction Tests
	// =========================================================================

	describe('interactions', () => {
		it('clicking unsorted column calls onSortChange with ascending', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, { props: { onSortChange } });

			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'ascending' }]);
		});

		it('clicking ascending column toggles to descending', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [{ sortKey: 'name', direction: 'ascending' }],
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'descending' }]);
		});

		it('clicking descending column toggles to ascending (allowUnsortedState=false)', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [{ sortKey: 'name', direction: 'descending' }],
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'ascending' }]);
		});

		it('clicking descending column clears sort (allowUnsortedState=true)', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [{ sortKey: 'name', direction: 'descending' }],
					allowUnsortedState: true,
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));

			expect(onSortChange).toHaveBeenCalledWith([]);
		});

		it('clicking different column replaces sort in single-sort mode', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [{ sortKey: 'name', direction: 'ascending' }],
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }));

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'age', direction: 'ascending' }]);
		});

		it('shift+click adds column to multi-sort', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [{ sortKey: 'name', direction: 'ascending' }],
					isMultiSortEnabled: true,
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }), {
				modifiers: ['Shift']
			});

			expect(onSortChange).toHaveBeenCalledWith([
				{ sortKey: 'name', direction: 'ascending' },
				{ sortKey: 'age', direction: 'ascending' }
			]);
		});

		it('shift+click toggles existing column in multi-sort', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [
						{ sortKey: 'name', direction: 'ascending' },
						{ sortKey: 'age', direction: 'ascending' }
					],
					isMultiSortEnabled: true,
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }), {
				modifiers: ['Shift']
			});

			expect(onSortChange).toHaveBeenCalledWith([
				{ sortKey: 'name', direction: 'ascending' },
				{ sortKey: 'age', direction: 'descending' }
			]);
		});

		it('shift+click removes descending column in multi-sort (allowUnsortedState=true)', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [
						{ sortKey: 'name', direction: 'ascending' },
						{ sortKey: 'age', direction: 'descending' }
					],
					isMultiSortEnabled: true,
					allowUnsortedState: true,
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }), {
				modifiers: ['Shift']
			});

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'ascending' }]);
		});

		it('regular click in multi-sort mode replaces entire sort', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, {
				props: {
					initialSort: [
						{ sortKey: 'name', direction: 'ascending' },
						{ sortKey: 'age', direction: 'descending' }
					],
					isMultiSortEnabled: true,
					onSortChange
				}
			});

			await userEvent.click(screen.getByRole('button', { name: /sort by age/i }));

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'age', direction: 'ascending' }]);
		});

		it('clicking non-sortable column header does nothing', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, { props: { onSortChange } });

			// Email column header text should exist but not as a button
			expect(screen.getByRole('button', { name: /sort by email/i }).query()).toBeNull();
			expect(onSortChange).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// Accessibility Tests
	// =========================================================================

	describe('accessibility', () => {
		it('sets aria-sort="ascending" on sorted ascending th', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const nameHeader = headerWithText(screen, 'Name');
			expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
		});

		it('sets aria-sort="descending" on sorted descending th', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'descending' }] }
			});

			const nameHeader = headerWithText(screen, 'Name');
			expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
		});

		it('does not set aria-sort on unsorted columns', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const ageHeader = headerWithText(screen, 'Age');
			expect(ageHeader).not.toHaveAttribute('aria-sort');
		});

		it('does not set aria-sort on non-sortable columns', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			const emailHeader = headerWithText(screen, 'Email');
			expect(emailHeader).not.toHaveAttribute('aria-sort');
		});

		it('sort button has accessible aria-label', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'name', direction: 'ascending' }] }
			});

			await expect
				.element(
					screen.getByRole('button', { name: 'Sort by Name, sorted ascending', exact: true })
				)
				.toBeInTheDocument();
		});

		it('sort button is keyboard accessible (Enter)', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, { props: { onSortChange } });

			const button = screen.getByRole('button', { name: /sort by name/i }).element() as HTMLElement;
			button.focus();
			await userEvent.keyboard('{Enter}');

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'ascending' }]);
		});

		it('sort button is keyboard accessible (Space)', async () => {
			const onSortChange = vi.fn();
			const screen = await render(Fixture, { props: { onSortChange } });

			const button = screen.getByRole('button', { name: /sort by name/i }).element() as HTMLElement;
			button.focus();
			await userEvent.keyboard(' ');

			expect(onSortChange).toHaveBeenCalledWith([{ sortKey: 'name', direction: 'ascending' }]);
		});

		it('multi-sort aria-label includes priority', async () => {
			const screen = await render(Fixture, {
				props: {
					isMultiSortEnabled: true,
					initialSort: [
						{ sortKey: 'name', direction: 'ascending' },
						{ sortKey: 'age', direction: 'descending' }
					]
				}
			});

			await expect
				.element(
					screen.getByRole('button', {
						name: 'Sort by Name, sorted ascending, priority 1 of 2',
						exact: true
					})
				)
				.toBeInTheDocument();
			await expect
				.element(
					screen.getByRole('button', {
						name: 'Sort by Age, sorted descending, priority 2 of 2',
						exact: true
					})
				)
				.toBeInTheDocument();
		});
	});

	// =========================================================================
	// Edge Case Tests
	// =========================================================================

	describe('edge cases', () => {
		// RESTATED. Upstream wraps `render` in `expect(() => …).not.toThrow()`;
		// `render` is async here, so the callback returns a promise and the matcher
		// can never see a rejection — a vacuous assertion under
		// `expect.requireAssertions`. Restated as what the title claims: an
		// unmatched sort key leaves every column unsorted and mounts cleanly.
		it('handles sort state with key not matching any column', async () => {
			const screen = await render(Fixture, {
				props: { initialSort: [{ sortKey: 'nonexistent', direction: 'ascending' }] }
			});

			await expect
				.element(screen.getByRole('button', { name: 'Sort by Name', exact: true }))
				.toBeInTheDocument();
			expect(headers(screen).filter((h) => h.hasAttribute('aria-sort'))).toHaveLength(0);
		});

		it('handles empty sort array', async () => {
			const screen = await render(Fixture, { props: { initialSort: [] } });

			// All sortable columns should show unsorted state
			await expect
				.element(screen.getByRole('button', { name: 'Sort by Name', exact: true }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole('button', { name: 'Sort by Age', exact: true }))
				.toBeInTheDocument();
		});

		// COUNTERPART. Upstream renders a `Capture` component twice and compares
		// the two plugin objects, pinning its `useMemo(…, [])`. A Svelte hook body
		// runs once per component, so there is no second call to compare — the
		// counterpart asks the same question of the thing that *does* re-run: after
		// a prop change and a sort change, the plugin the fixture holds must still
		// be the object the table was given. Rebuilding it (a `$derived` plugin,
		// say) would remount the table and fail here.
		//
		// Upstream's assertion is kept, but on its own it is **unfalsifiable**
		// here: `screen.component` is captured once, `rerender` merges props into
		// the mounted instance rather than remounting, and `captured.plugin` is a
		// getter over a `const` — so both reads resolve to the same binding for any
		// implementation. What a stable plugin has to keep *producing* is
		// observable, and that is asserted alongside: the bound header slot must
		// hand back the same snippet across the transform re-run the sort click
		// forces, or `{@render}` keys onto a new function identity and replaces the
		// sort button instead of updating it. Mutation-checked — swapping
		// `use-table-sortable.ts`'s `createSlotBinder` for a bare `bindSnippet`
		// fails the element-identity assertion and leaves the rest of this suite
		// green. It is the same property `table-plugin-smoke.svelte.test.ts:195`
		// pins in isolation.
		it('plugin object is referentially stable across renders', async () => {
			const screen = await render(Fixture, { props: {} });
			const first = screen.component.captured.plugin;
			const sortButtonBefore = screen.container.querySelector('th button');
			expect(sortButtonBefore).not.toBeNull();

			await screen.rerender({ data: [{ name: 'Cara', age: 41, email: 'c@example.com' }] });
			await userEvent.click(screen.getByRole('button', { name: /sort by name/i }));
			await expect
				.element(
					screen.getByRole('button', { name: 'Sort by Name, sorted ascending', exact: true })
				)
				.toBeInTheDocument();

			expect(screen.component.captured.plugin).toBe(first);
			expect(screen.container.querySelector('th button')).toBe(sortButtonBefore);
		});

		// RESTATED for the same reason as "handles sort state with key not
		// matching any column": the `not.toThrow()` half cannot survive an async
		// `render`. The second assertion is upstream's, unchanged.
		it('works with no sortable columns', async () => {
			const columns: TableColumn<SortableUser>[] = [
				{ key: 'name', header: 'Name' },
				{ key: 'age', header: 'Age' }
			];

			const screen = await render(Fixture, { props: { columns } });

			await expect.element(screen.getByRole('table')).toBeInTheDocument();
			expect(screen.getByRole('button').query()).toBeNull();
		});

		// Upstream's "ReactNode header content" is a snippet header here, handed
		// over from `fixtures/table-plugin-slots.svelte` — a snippet can only be
		// authored in a template.
		it('works with ReactNode header content', async () => {
			const columns: TableColumn<SortableUser>[] = [
				{ key: 'name', header: customSortHeader, sortable: true }
			];

			const screen = await render(Fixture, { props: { columns } });

			await expect
				.element(screen.getByRole('button', { name: /sort by name/i }))
				.toBeInTheDocument();
			await expect.element(screen.getByTestId('custom-header')).toBeInTheDocument();
		});

		it('sort state with multiple entries but isMultiSortEnabled=false', async () => {
			// State is source of truth — renders all entries even in single-sort mode
			// but click behavior is single-sort
			const screen = await render(Fixture, {
				props: {
					isMultiSortEnabled: false,
					initialSort: [
						{ sortKey: 'name', direction: 'ascending' },
						{ sortKey: 'age', direction: 'descending' }
					]
				}
			});

			// Both columns should show their sort state
			const nameButton = screen.getByRole('button', { name: /sort by name/i }).element();
			const ageButton = screen.getByRole('button', { name: /sort by age/i }).element();
			expect(nameButton.getAttribute('aria-label')).toContain('sorted ascending');
			expect(ageButton.getAttribute('aria-label')).toContain('sorted descending');
		});
	});
});

// =============================================================================
// Context-menu actions (colocated with the sortable plugin)
// =============================================================================

describe('useTableSortable — context menu actions', () => {
	it('offers Sort ascending/descending on a sortable header, and Clear sort once sorted', async () => {
		const screen = await render(Fixture, { props: { allowUnsortedState: true } });

		// Unsorted: asc + desc, no "Clear sort".
		rightClick(screen.getByText('Name', { exact: true }).element());
		await expect
			.poll(() => menuItems(screen.container, 'Sort ascending').length)
			.toBeGreaterThan(0);
		expect(menuItems(screen.container, 'Sort descending').length).toBeGreaterThan(0);
		expect(menuItems(screen.container, 'Clear sort')).toHaveLength(0);

		// Apply ascending → "Clear sort" now appears.
		menuItems(screen.container, 'Sort ascending')[0].click();
		await expect.poll(() => menuItems(screen.container, 'Sort ascending')).toHaveLength(0);
		rightClick(screen.getByText('Name', { exact: true }).element());
		await expect.poll(() => menuItems(screen.container, 'Clear sort').length).toBeGreaterThan(0);
	});

	it('resolves fresh actions on each open as sort state changes (lazy getter)', async () => {
		const onSortChange = vi.fn();
		const screen = await render(Fixture, {
			props: { allowUnsortedState: true, onSortChange }
		});

		// Open (unsorted) and pick descending.
		rightClick(screen.getByText('Name', { exact: true }).element());
		await expect
			.poll(() => menuItems(screen.container, 'Sort descending').length)
			.toBeGreaterThan(0);
		menuItems(screen.container, 'Sort descending')[0].click();
		expect(onSortChange).toHaveBeenLastCalledWith([{ sortKey: 'name', direction: 'descending' }]);

		// Re-open: the getter recomputes against the now-descending state, so
		// "Clear sort" is present and clicking it clears — proving the actions are
		// freshly derived on each open, not memoized from the first render.
		await expect.poll(() => menuItems(screen.container, 'Sort descending')).toHaveLength(0);
		rightClick(screen.getByText('Name', { exact: true }).element());
		await expect.poll(() => menuItems(screen.container, 'Clear sort').length).toBeGreaterThan(0);
		menuItems(screen.container, 'Clear sort')[0].click();
		expect(onSortChange).toHaveBeenLastCalledWith([]);
	});
});

// =============================================================================
// i18n (header-button aria-labels route through the catalog)
// =============================================================================

describe('useTableSortable — i18n', () => {
	it('localizes the unsorted sort-by aria-label via @astryx.table.sort.sortBy', async () => {
		const screen = await render(I18nFixture, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.table.sort.sortBy': 'Trier par {label}' } }
			}
		});

		await expect
			.element(screen.getByRole('button', { name: 'Trier par Name', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Trier par Age', exact: true }))
			.toBeInTheDocument();
	});

	it('localizes the multi-sort priority aria-label with ICU number args', async () => {
		const screen = await render(I18nFixture, {
			props: {
				locale: 'fr',
				overrides: {
					fr: {
						'@astryx.table.sort.sortedByWithPriority':
							'Trier par {label}, tri {direction}, priorité {rank, number} sur {total, number}',
						'@astryx.table.sort.direction.ascending': 'croissant',
						'@astryx.table.sort.direction.descending': 'décroissant'
					}
				},
				isMultiSortEnabled: true,
				initialSort: [
					{ sortKey: 'name', direction: 'ascending' },
					{ sortKey: 'age', direction: 'descending' }
				]
			}
		});

		// The overridden direction words deliberately differ from the raw enum
		// values ('ascending'/'descending'), so an implementation interpolating
		// the enum without translating it cannot pass — for either direction.
		await expect
			.element(
				screen.getByRole('button', {
					name: 'Trier par Name, tri croissant, priorité 1 sur 2',
					exact: true
				})
			)
			.toBeInTheDocument();
		await expect
			.element(
				screen.getByRole('button', {
					name: 'Trier par Age, tri décroissant, priorité 2 sur 2',
					exact: true
				})
			)
			.toBeInTheDocument();
	});

	it('localizes the sorted aria-label and direction word via their own keys', async () => {
		const screen = await render(I18nFixture, {
			props: {
				locale: 'fr',
				overrides: {
					fr: {
						'@astryx.table.sort.sortedBy': 'Trié par {label}, {direction}',
						'@astryx.table.sort.direction.ascending': 'croissant'
					}
				},
				initialSort: [{ sortKey: 'name', direction: 'ascending' }]
			}
		});

		// Both the composed template and the direction word resolve through
		// their own catalog keys; 'croissant' differs from the raw enum value,
		// so neither a hardcoded English frame nor raw-enum interpolation passes.
		await expect
			.element(screen.getByRole('button', { name: 'Trié par Name, croissant', exact: true }))
			.toBeInTheDocument();
	});
});
