/** PORTS: PowerSearch/PowerSearchEditPopover.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/power-search-harness.svelte';
import EditPopoverProbe from './fixtures/power-search-edit-popover-probe.svelte';
import type { PowerSearchConfig, PowerSearchFilter } from '$lib/components/power-search/types.js';

/**
 * Astryx's `PowerSearch/PowerSearchEditPopover.test.tsx` at the **0.5.0** pin —
 * **9 upstream cases** (4 in `describe('PowerSearch')`, 5 in
 * `describe('narrow-width layout (#4761)')`), **3 here**, in upstream's order
 * with upstream's titles.
 *
 * **The 6 that are not here split two ways:**
 *
 * - **The whole 5-case `narrow-width layout (#4761)` describe, added at
 *   0.5.0** — the popover root establishing the container the collapse query
 *   measures, the filter chip row wrapping below the collapse width instead of
 *   overflowing, the operator cell capped at the row width, nested sub-filter
 *   rows wrapping instead of overflowing on one line, and the edit popover
 *   layer yielding to viewports narrower than its 400px floor. Every one is a
 *   container-query/layout assertion, so they need the `.stylex.ts` side of the
 *   change ported before the cases can mean anything.
 * - **`does not save/close on a composing Enter while typing a filter value
 *   (#4828)`**, the fourth case in `describe('PowerSearch')`. This one predates
 *   0.5.0 — upstream already had 4 here at v0.4.5, so this header's "3 upstream
 *   cases … 3 here" was false at that pin too. It is portable now:
 *   `power-search-edit-popover.svelte` calls `isImeKeyEvent` in its keydown
 *   handler, so the guard the case asserts is in place.
 *
 * (This header read "**3 upstream cases** at v0.3.0 … 3 here. Nothing dropped,
 * nothing added". It said "**2** … 2 here" before that, which was wrong too.)
 *
 * (The previous header said "**2 upstream cases** … **2 here**". Upstream has
 * three: `does not save/close edit popover when Enter is consumed by child
 * listbox option selection` was unported and unnamed. It is ported here — via
 * `fixtures/power-search-edit-popover-probe.svelte`, upstream's
 * `MultiSelectHarness` — and it passed on the first run.)
 *
 * The first two cases exist to pin one thing: `PowerSearchEditPopover` seeds
 * `partialFilter` from its prop **once** and never re-syncs, so the only reset
 * mechanism is a remount — upstream's `key={popoverKey}`, this port's
 * `{#key popoverKey}` in `power-search.svelte`. The second case is the
 * *same index, different filter* variant that an index-only key would miss.
 *
 * ## Why there is no `requestAnimationFrame` stub here
 *
 * Upstream stubs `requestAnimationFrame` into an array and calls `flushRAF()`
 * after each interaction. It has to: jsdom's rAF is either absent or wired to a
 * timer, and `PowerSearch.setPopoverState` schedules `popover.show()` +
 * `tokenizer.blur()` inside one, while `PowerSearchEditPopover`'s mount
 * autofocus schedules another.
 *
 * This suite runs in real Chromium, where both frames fire on their own — a
 * stub would only be able to *delay* them. So the flush becomes a wait, and the
 * thing waited for is the state the flush produces: the edit popover actually
 * being `:popover-open`. That is strictly stronger than upstream's flush, which
 * only proves the callbacks ran.
 *
 * The two frames stay correctly ordered without any help, and the order
 * matters: `PowerSearch`'s rAF is registered synchronously inside
 * `setPopoverState`, before the popover's content has even mounted, so
 * `popover.show()` always runs before the child effect's focus frame. A stub
 * that flushed them in one pass would hide that.
 *
 * Upstream's `beforeAll` stubs for `ResizeObserver`, `showPopover`/
 * `hidePopover` and `:popover-open` are GONE for the same reason every other
 * ported browser suite drops them — Chromium implements all four natively, and
 * `:popover-open` is what the assertions here read.
 *
 * ## The one RESTATED helper
 *
 * `getEditPopoverText` is upstream's, plus one step: it removes nested
 * `[popover]` subtrees before reading `textContent`.
 *
 * Without that step **the `Status` and `Priority` assertions are vacuous on
 * both sides**. The field `Selector` renders its full option list into the DOM
 * unconditionally (so does upstream's — `Selector.tsx` calls `renderOptions()`
 * inside `popover.render` with no open guard), and that list is a `[popover]`
 * element *nested inside* the edit popover. Measured, while editing the
 * **status** filter, the edit popover's raw `textContent` is:
 *
 *     "Field  Status  Status  Priority  Operator  is  is  Value
 *      Delete  Cancel  Apply"
 *
 * — 'Priority' is already there, from the field list. So both
 * `toContain('Status')` and `toContain('Priority')` hold no matter which filter
 * the popover is actually showing. (`toContain('equals')` does carry weight
 * unstripped: the *operator* list is scoped to the selected field, so 'equals'
 * appears only once the field really is 'priority'.)
 *
 * Stripping the nested lists leaves the two `Selector` *triggers* — which
 * render the selected option's label — plus the footer:
 *
 *     "Field  Status  Operator  is  Value  Delete  Cancel  Apply"
 *
 * so upstream's assertions survive verbatim and all three become load-bearing.
 * That measurement is itself the mutation check: while the popover is showing
 * the status filter, the stripped text contains neither 'Priority' nor
 * 'equals', so state left stale across the switch fails the second-open
 * assertions rather than sliding past them.
 *
 * ## Other mechanical translations
 *
 * - `render` is async — always awaited; upstream's `Harness` becomes
 *   `fixtures/power-search-harness.svelte`.
 * - `fireEvent.click(el)` becomes the element's own `.click()`. That is what a
 *   dispatched click is, and it skips the Playwright actionability checks
 *   upstream's synthetic dispatch never runs.
 * - `act()` has no counterpart — a `$state` write flushes on its own, and
 *   `vi.waitFor` retries.
 * - `screen.queryByText(x)` becomes `screen.getByText(x).query()`.
 * - `getByText` carries `{exact: true}`: Playwright's text engine is substring
 *   by default, and 'Status: is' is a prefix of the token's full text.
 */

// =============================================================================
// Test infrastructure
// =============================================================================

const testConfig: PowerSearchConfig = {
	name: 'test',
	fields: [
		{
			key: 'status',
			label: 'Status',
			operators: [{ key: 'is', label: 'is', value: { type: 'string' } }]
		},
		{
			key: 'priority',
			label: 'Priority',
			operators: [{ key: 'equals', label: 'equals', value: { type: 'string' } }]
		}
	]
};

/** The edit popover — the `[popover]` that contains the Cancel/Apply buttons. */
function editPopoverIn(container: HTMLElement): HTMLElement | null {
	const buttons = container.querySelectorAll('button');
	for (const btn of buttons) {
		if (btn.textContent?.trim() === 'Cancel') {
			return btn.closest('[popover]');
		}
	}
	return null;
}

function getEditPopoverText(container: HTMLElement): string {
	const popover = editPopoverIn(container);
	if (!popover) {
		return '';
	}
	// RESTATED — see the file header. The nested `[popover]`s are the two
	// `Selector` option lists, which name every field regardless of which one is
	// selected; leaving them in makes every assertion below vacuous.
	const clone = popover.cloneNode(true) as HTMLElement;
	for (const nested of clone.querySelectorAll('[popover]')) {
		nested.remove();
	}
	return clone.textContent ?? '';
}

/** Upstream's `fireEvent.click(el)`. */
function click(el: Element): void {
	(el as HTMLElement).click();
}

/** Upstream's `act(() => {fireEvent.click(el); flushRAF();})`. */
async function clickAndOpenPopover(el: Element, container: HTMLElement): Promise<void> {
	click(el);
	await vi.waitFor(() => {
		expect(editPopoverIn(container)?.matches(':popover-open')).toBe(true);
	});
}

/** Upstream's `act(() => {fireEvent.click(el); flushRAF();})` for a close. */
async function clickAndClosePopover(el: Element, container: HTMLElement): Promise<void> {
	click(el);
	await vi.waitFor(() => {
		expect(editPopoverIn(container)).toBeNull();
	});
}

// =============================================================================
// Tests
// =============================================================================

describe('PowerSearch', () => {
	it('edit popover resets state when switching between filter tokens', async () => {
		const filters: PowerSearchFilter[] = [
			{ field: 'status', operator: 'is', value: { type: 'string', value: 'open' } },
			{
				field: 'priority',
				operator: 'equals',
				value: { type: 'string', value: 'high' }
			}
		];

		const screen = await render(Harness, {
			props: { config: testConfig, initialFilters: filters }
		});
		const container = screen.container;

		// Both filter tokens should be rendered
		const statusToken = screen.getByText('Status: is', { exact: true });
		const priorityToken = screen.getByText('Priority: equals', { exact: true });

		// Click the status token to open its edit popover
		await clickAndOpenPopover(statusToken.element(), container);

		// The edit popover should show "Status" as the selected field
		expect(getEditPopoverText(container)).toContain('Status');

		// Close the popover
		await clickAndClosePopover(screen.getByText('Cancel', { exact: true }).element(), container);

		// Click the priority token
		await clickAndOpenPopover(priorityToken.element(), container);

		// The edit popover should now show "Priority", not stale "Status"
		const popoverText = getEditPopoverText(container);
		expect(popoverText).toContain('Priority');
		expect(popoverText).toContain('equals');
	});

	it('edit popover shows correct filter after removing a preceding filter', async () => {
		const filters: PowerSearchFilter[] = [
			{ field: 'status', operator: 'is', value: { type: 'string', value: 'open' } },
			{
				field: 'priority',
				operator: 'equals',
				value: { type: 'string', value: 'high' }
			}
		];

		const screen = await render(Harness, {
			props: { config: testConfig, initialFilters: filters }
		});
		const container = screen.container;

		// Click the status token (index 0) to edit it
		await clickAndOpenPopover(screen.getByText('Status: is', { exact: true }).element(), container);

		// Delete the status filter via the Delete button in the popover
		await clickAndClosePopover(screen.getByText('Delete', { exact: true }).element(), container);

		// Now only the priority filter remains (shifted to index 0)
		expect(screen.getByText('Status: is', { exact: true }).query()).toBeNull();
		const priorityToken = screen.getByText('Priority: equals', { exact: true });

		// Click the priority token (now at index 0 — same index as the deleted filter)
		await clickAndOpenPopover(priorityToken.element(), container);

		// The edit popover should show "Priority", not stale "Status"
		const popoverText = getEditPopoverText(container);
		expect(popoverText).toContain('Priority');
		expect(popoverText).toContain('equals');
	});

	it('does not save/close edit popover when Enter is consumed by child listbox option selection', async () => {
		const multiConfig: PowerSearchConfig = {
			name: 'test-multi',
			fields: [
				{
					key: 'status',
					label: 'Status',
					operators: [
						{
							key: 'any_of',
							label: 'is any of',
							value: {
								type: 'enum_list',
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

		const onSave = vi.fn();
		const onCancel = vi.fn();

		const screen = await render(EditPopoverProbe, {
			props: {
				config: multiConfig,
				filter: {
					field: 'status',
					operator: 'any_of',
					value: { type: 'enum_list', value: ['open'] }
				},
				mode: 'edit',
				onSave,
				onCancel
			}
		});

		const input = screen.container.querySelector('input');
		expect(input).not.toBeNull();

		// Fire an Enter event that has been defaultPrevented (e.g. child typeahead option selection)
		const enterEvent = new KeyboardEvent('keydown', {
			key: 'Enter',
			bubbles: true,
			cancelable: true
		});
		enterEvent.preventDefault();

		input?.dispatchEvent(enterEvent);

		// onSave should NOT be called because the event was already consumed (defaultPrevented)
		expect(onSave).not.toHaveBeenCalled();
	});
});
