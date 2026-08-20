import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import DateRangeInput from '$lib/components/date-range-input/date-range-input.svelte';
import type { DateRangePreset } from '$lib/components/date-range-input/date-range-input.svelte';
import Icon from '$lib/components/icon/icon.svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
// `DateRange` comes from its declaration site. Upstream re-exports it from
// `DateRangeInput.tsx` too, but a type re-export inside a `<script module>`
// trips `no-import-assign`, so the root barrel names it from here instead — see
// `calendar.svelte`. Same declaration, same published surface.
import type { DateRange } from '$lib/utils/date-types.js';

/**
 * Astryx's `DateRangeInput/DateRangeInput.test.tsx`, ported case for case —
 * **47** upstream cases at v0.4.5 (19 directly in `describe('DateRangeInput')`,
 * 5 in `describe('hasClear')`, 2 in `describe('presets')`, 8 in
 * `describe('disabledMessage')`, 2 + a nested 3-case `describe('weekStartsOn')`
 * in `describe('DateRangeInput statusVariant forwarding')`, 4 in
 * `describe('DateRangeInput icon theme targets')`, 2 in
 * `describe('DateRangeInput disabled theme state')` and 2 in
 * `describe('DateRangeInput range-span forwarding')`), **all 47 here**. There is
 * no `displayName` case, no snapshot and no no-JSX construction form in the
 * file, so nothing is React-only except the ref case, which gets a counterpart.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "34 upstream cases … 34 here, none dropped".
 * Upstream had **40** at v0.3.0. The `DateRangeInput statusVariant forwarding`
 * block and the four-case `DateRangeInput icon theme targets` block have both
 * been ported since, closing the file at that tag. The last of those four swaps
 * upstream's `generateThemeTestCSS` for this port's `generateThemeCss` — both
 * return the flat stylesheet string, and it is the substitution
 * `multi-selector` and `selector` already made.
 *
 * ## v0.4.1 (#4876, #4900)
 *
 * Upstream grew five cases and amended two:
 *
 * - `describe('weekStartsOn')` (3), nested inside `DateRangeInput statusVariant
 *   forwarding` exactly where upstream puts it, however odd that reads.
 * - `describe('DateRangeInput disabled theme state')` (2), for the root's new
 *   `data-disabled`/`disabled` reflection.
 * - `renders astryx-date-range-input-clear-icon on the clear glyph` was renamed
 *   to `renders astryx-input-clear-icon (plus the legacy alias) on the clear
 *   glyph` and gained the shared-target assertion, and `renders the default
 *   icons (secondary color, sm size) byte-identically` was renamed to `routes
 *   the clear glyph through the shared clear button (default look unchanged)`
 *   with its filter list updated. Both are upstream's amended text, verbatim.
 *
 * ## v0.4.5 (the count, re-derived at the current pin)
 *
 * This header read "**45** … at v0.4.1" and stayed true only until the pin
 * moved. 0.4.x added the two-case `describe('DateRangeInput range-span
 * forwarding')` block, and both are ported at the foot of this file. They pass
 * against this port unchanged — `maxRangeSpan` already reaches `Calendar` and
 * already gates the presets — with two deliveries restated where a real browser
 * cannot do what jsdom does; see the comments at the block and at the case.
 *
 * Upstream's `openAndReadWeekdays` carries a comment about jsdom role queries
 * skipping the top layer. That constraint does not exist here — Chromium's
 * popover content is queryable — but the helper still reads the columnheaders
 * off the container directly, which is upstream's assertion unchanged.
 *
 * Upstream imports `getButton`/`queryButton` from `__tests__/fastRoleQueries`
 * instead of `getByRole('button', {name})` purely for jsdom speed — its own
 * header says the closed popover keeps ~85 accessible-name computations alive
 * and that this suite took 34s for 34 tests before the helper existed. That is
 * a jsdom cost, not a semantic one: the helper "keeps RTL's exact name
 * algorithm" and only relaxes visibility filtering (its candidates come from
 * `queryAllByRole('button', {hidden: true})`). A real browser computes those
 * names natively, so every `getButton(x)` here is `getByRole('button', {name:
 * x})`, plus `{includeHidden: true}` wherever the target lives inside the
 * *closed* popover — which is the one place the helper's `hidden: true` is
 * load-bearing. The popover content really is mounted here too: `Layer` renders
 * its children unconditionally into a `popover` element, so a closed popover is
 * `display: none` rather than unmounted, exactly as upstream's is.
 *
 * The helper's other trade-off — "first match wins, no tree-wide uniqueness
 * check" — never bites, because every case that uses the loose `/Range/` passes
 * `value={null}`, so the clear button (`aria-label="Clear Range"`, the only
 * other button whose name contains "Range") is not rendered at all. Playwright's
 * strict mode would catch it if that stopped being true.
 *
 * Upstream's `disabledMessage` `beforeEach` (`:367-374`) shims
 * `showPopover`/`hidePopover` because jsdom implements neither, and its
 * `h = {hidden: true}` exists because a jsdom popover is not "visible" to the
 * accessibility tree. The browser project needs neither: Chromium has the real
 * Popover API, so the open state is read with `matches(':popover-open')` and
 * `{hidden: true}` survives as `{includeHidden: true}`. This is the arrangement
 * `number-input`, `file-input` and `time-input` already set for the same block.
 *
 * `changeAction` never appears in the upstream file, so nothing here exercises
 * `createOptimistic` (`internal/optimistic.svelte.ts`); `pagination.svelte.test.ts`
 * is where that pattern is tested. No case clicks a day cell either, so the
 * `Calendar` inside the popover is only ever asserted on for *not* being in the
 * way.
 *
 * No case pins the clock. `formatRangeDisplay` drops the year only when the
 * whole range sits inside the current year — but the sole display-text case
 * asserts `/Mar/`, `/15/` and `/22/` against a March 15–22 range, and both
 * branches ("Mar 15 – Mar 22" and "Mar 15, 2026 – Mar 22, 2026") satisfy all
 * three. Faking `Date` to pin a branch would add a hazard the assertions cannot
 * see.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref to trigger button` (`:67`)** — Svelte has no `ref` prop and
 *   this port omits it. The seam a consumer actually uses is an attachment
 *   through the rest props, and it checks more than upstream's: it receives the
 *   element rather than only proving a callback ran.
 *
 * Restated, each noted at the case:
 * - `getByText(...)` carries `{exact: true}` throughout. Playwright's text
 *   engine is substring and case-insensitive by default, which would make
 *   `getByText('Range')` also match the trigger's "Select date range".
 * - the `disabledMessage` hover case — upstream's `fireEvent.mouseEnter`/
 *   `mouseLeave` target the wrapper div, which a real pointer at that element's
 *   centre cannot do (the trigger fills it), so the events are dispatched where
 *   upstream dispatches them.
 * - `keeps the trigger focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, not
 *   jest-dom's native-attribute one, and they disagree by design on exactly the
 *   `aria-disabled` this case requires.
 * - `blocks activation while focusable-disabled` — Playwright refuses to click
 *   an `aria-disabled` element at all, which would assert its actionability
 *   heuristic rather than the component's guard.
 */

const noop = (): void => {};

const range: DateRange = { start: '2026-03-15', end: '2026-03-22' };

/** The `render()` result, for helpers that need both locators and container. */
type Screen = Awaited<ReturnType<typeof render>>;

describe('DateRangeInput', () => {
	it('renders with label', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Date range', value: null, onChange: noop }
		});
		// Restated: `{exact: true}`, since Playwright's text engine is substring
		// and case-insensitive — "Date range" would otherwise also match the
		// trigger's "Select date range".
		await expect.element(screen.getByText('Date range', { exact: true })).toBeInTheDocument();
	});

	it('renders placeholder when value is null', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		await expect
			.element(screen.getByText('Select date range', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders custom placeholder', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop, placeholder: 'Pick dates' }
		});
		await expect.element(screen.getByText('Pick dates', { exact: true })).toBeInTheDocument();
	});

	it('displays formatted range when value is set', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: range, onChange: noop, hasClear: false }
		});
		const trigger = screen.getByRole('button', { name: /Range:/ }).element();
		expect(trigger.textContent).toMatch(/Mar/);
		expect(trigger.textContent).toMatch(/15/);
		expect(trigger.textContent).toMatch(/22/);
	});

	// Counterpart to upstream's `forwards ref to trigger button` (`:67`); see the
	// file header. Upstream's `ref` lands on the trigger button while this port's
	// rest props land on the wrapper `<div>` — an asymmetry the component itself
	// records — so the assertion is written against the trigger's parent, which
	// names the same element upstream's ref is adjacent to. Upstream asserts
	// `expect.any(HTMLButtonElement)`; this receives the element itself, so the
	// assertion is the stronger `toBe`.
	it('hands the trigger wrapper to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Range',
				value: null,
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		const trigger = screen.getByRole('button', { name: /Range:/ }).element();
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(trigger.parentElement);
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', isLabelHidden: true, value: null, onChange: noop }
		});
		await expect.element(screen.getByText('Range', { exact: true })).toBeInTheDocument();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', isRequired: true, value: null, onChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: /Range/ }))
			.toHaveAttribute('aria-required', 'true');
	});

	it('does not set aria-required when isRequired is false', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: /Range/ }))
			.not.toHaveAttribute('aria-required');
	});

	it('disables trigger when isDisabled is true', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', isDisabled: true, value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('button', { name: /Range/ })).toBeDisabled();
	});

	it('is not disabled by default', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('button', { name: /Range/ })).not.toBeDisabled();
	});

	it('trigger has aria-haspopup="dialog"', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: /Range/ }))
			.toHaveAttribute('aria-haspopup', 'dialog');
	});

	it('trigger has aria-expanded=false by default', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: /Range/ }))
			.toHaveAttribute('aria-expanded', 'false');
	});

	it('renders status icon for error status', async () => {
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Range',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Required' }
			}
		});
		await expect
			.element(screen.getByRole('button', { name: /Range/ }))
			.toHaveAttribute('aria-invalid', 'true');
	});

	it('does not set aria-invalid for warning status', async () => {
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Range',
				value: null,
				onChange: noop,
				status: { type: 'warning', message: 'Watch out' }
			}
		});
		await expect
			.element(screen.getByRole('button', { name: /Range/ }))
			.not.toHaveAttribute('aria-invalid');
	});

	it('renders description', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', description: 'Pick a date range', value: null, onChange: noop }
		});
		await expect
			.element(screen.getByText('Pick a date range', { exact: true }))
			.toBeInTheDocument();
	});

	it('links status message via aria-describedby', async () => {
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Range',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Please select dates' }
			}
		});
		const trigger = screen.getByRole('button', { name: /Range/ }).element();
		const describedBy = trigger.getAttribute('aria-describedby')!;
		const ids = describedBy.split(' ');
		const found = ids.some((id) => {
			const el = document.getElementById(id);
			return el?.textContent?.includes('Please select dates');
		});
		expect(found).toBe(true);
	});

	it('calendar icon button is present', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('button', { name: 'Open calendar' })).toBeInTheDocument();
	});

	it('calendar icon button is disabled when isDisabled', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', isDisabled: true, value: null, onChange: noop }
		});
		await expect.element(screen.getByRole('button', { name: 'Open calendar' })).toBeDisabled();
	});

	it('renders with size="lg"', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Date range', value: null, onChange: noop, size: 'lg' }
		});
		await expect.element(screen.getByText('Date range', { exact: true })).toBeInTheDocument();
	});

	describe('hasClear', () => {
		it('shows clear button when hasClear is true and value exists', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: range, onChange: noop, hasClear: true }
			});
			await expect.element(screen.getByRole('button', { name: 'Clear Range' })).toBeInTheDocument();
		});

		it('does not show clear button when value is null', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, hasClear: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Range' }).query()).toBeNull();
		});

		it('does not show clear button when hasClear is false', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: range, onChange: noop, hasClear: false }
			});
			expect(screen.getByRole('button', { name: 'Clear Range' }).query()).toBeNull();
		});

		it('does not show clear button when disabled', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: range,
					onChange: noop,
					hasClear: true,
					isDisabled: true
				}
			});
			expect(screen.getByRole('button', { name: 'Clear Range' }).query()).toBeNull();
		});

		it('calls onChange with null when clear is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: range, onChange, hasClear: true }
			});

			await userEvent.click(screen.getByRole('button', { name: 'Clear Range' }));
			expect(onChange).toHaveBeenCalledWith(null);
		});
	});

	describe('presets', () => {
		const presets: ReadonlyArray<DateRangePreset> = [
			{
				label: 'Last 7 days',
				getRange: (): DateRange => ({ start: '2026-03-01', end: '2026-03-07' })
			},
			{
				label: 'This month',
				getRange: (): DateRange => ({ start: '2026-03-01', end: '2026-03-31' })
			}
		];

		it('renders presets as a labeled group of buttons, not a listbox (forms-5)', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, presets }
			});
			// The preset sidebar is a group of action buttons — not a listbox of
			// options (which would announce a Tab-navigable listbox it isn't).
			expect(screen.getByRole('listbox', { includeHidden: true }).query()).toBeNull();
			expect(
				screen.getByRole('group', { name: 'Preset date ranges', includeHidden: true }).element()
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: 'Last 7 days', includeHidden: true }).element()
			).toBeInTheDocument();
		});

		it('marks the applied preset with aria-current, not aria-selected', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: { start: '2026-03-01', end: '2026-03-07' },
					onChange: noop,
					presets
				}
			});
			const active = screen
				.getByRole('button', { name: 'Last 7 days', includeHidden: true })
				.element();
			expect(active).toHaveAttribute('aria-current', 'true');
			expect(active).not.toHaveAttribute('aria-selected');
			const inactive = screen
				.getByRole('button', { name: 'This month', includeHidden: true })
				.element();
			expect(inactive).not.toHaveAttribute('aria-current');
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const trigger = screen.getByRole('button', { name: /Range:/ }).element();
			const container = trigger.parentElement as HTMLElement;
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip).toHaveTextContent('You need the Editor role');

			// Upstream's `fireEvent.mouseEnter`/`mouseLeave`, dispatched the same way:
			// a real pointer moved to the wrapper's centre would be over the trigger,
			// and `unhover` parks it at the viewport origin — both would assert where
			// Playwright puts the mouse rather than what the wrapper listens for.
			container.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's `popover-open` attribute,
				// which its jsdom shim invents; Chromium has the real thing.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});

			container.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('button', { name: /Range:/ })).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: null,
					onChange: noop,
					disabledMessage: 'You need the Editor role'
				}
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the trigger focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const trigger = screen.getByRole('button', { name: /Range:/ });
			// Restated: upstream's `not.toBeDisabled()` is jest-dom's, which reads the
			// *native* disabled state only. vitest-browser's matcher of that name is
			// Playwright's ARIA computation, which counts `aria-disabled="true"` as
			// disabled — so it answers "true" on the very attribute the next line
			// requires. Upstream's question is asked directly instead: no native
			// `disabled`, which is what keeps the control in the tab order.
			await expect.element(trigger).not.toHaveAttribute('disabled');
			expect((trigger.element() as HTMLButtonElement).disabled).toBe(false);
			await expect.element(trigger).toHaveAttribute('aria-disabled', 'true');
		});

		it('links the reason tooltip from the trigger via aria-describedby', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const trigger = screen.getByRole('button', { name: /Range:/ }).element();
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks activation while focusable-disabled', async () => {
			const screen = await render(DateRangeInput, {
				props: {
					label: 'Range',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const trigger = screen.getByRole('button', { name: /Range:/ }).element() as HTMLElement;
			// Restated in how the click is delivered: Playwright's actionability check
			// reads `aria-disabled="true"` as "not enabled" and refuses to click at
			// all, which would assert its heuristic instead of the guard. Upstream's
			// click event is dispatched directly; the keyboard half is real, since the
			// control *is* focusable — that is the case's premise.
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(trigger).toHaveAttribute('aria-expanded', 'false');

			trigger.focus();
			await userEvent.keyboard('{Enter}');
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, isDisabled: true }
			});
			const trigger = screen.getByRole('button', { name: /Range:/ });
			await expect.element(trigger).toBeDisabled();
			await expect.element(trigger).not.toHaveAttribute('aria-disabled');
		});
	});
});

describe('DateRangeInput statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Range',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Range',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Required' },
				statusVariant: 'detached'
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});

	describe('weekStartsOn', () => {
		// Upstream's helper takes the container because jsdom's role queries skip
		// the top layer. Chromium's do not, but the columnheaders are still read
		// off the container directly — upstream's assertion unchanged. The click
		// is `userEvent`'s rather than a synthetic `fireEvent.click`, which is what
		// the rest of this file already does.
		const openAndReadWeekdays = async (screen: Screen): Promise<(string | null)[]> => {
			await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
			return Array.from(screen.container.querySelectorAll('[role="columnheader"]'))
				.slice(0, 7)
				.map((h) => h.textContent);
		};

		it('defaults to a Sunday-first week', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop }
			});
			expect(await openAndReadWeekdays(screen)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
		});

		it('forwards a numeric weekStartsOn to the calendar', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, weekStartsOn: 1 }
			});
			expect(await openAndReadWeekdays(screen)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
		});

		it('accepts a three-letter day name', async () => {
			const screen = await render(DateRangeInput, {
				props: { label: 'Range', value: null, onChange: noop, weekStartsOn: 'mon' }
			});
			expect(await openAndReadWeekdays(screen)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
		});
	});
});

describe('DateRangeInput icon theme targets', () => {
	// Resolve a glyph span (the astryx-icon element) inside a given button,
	// independent of the theme target class.
	const iconIn = (button: HTMLElement): HTMLElement => {
		const icon = button.querySelector('.astryx-icon');
		if (icon == null) {
			throw new Error('icon not found');
		}
		return icon as HTMLElement;
	};

	it('renders astryx-input-clear-icon (plus the legacy alias) on the clear glyph', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: range, onChange: noop, hasClear: true }
		});
		// The canonical target lands on the icon element itself (not the button),
		// so a theme can restyle just this glyph (color, size, hover) via
		// defineTheme — a button-level target could not reach the icon's own
		// color/size. The original per-component name rides along for a
		// deprecation window.
		const clearLoc = screen.getByRole('button', { name: 'Clear Range' });
		await expect.element(clearLoc).toBeInTheDocument();
		const icon = iconIn(clearLoc.element() as HTMLElement);
		expect(icon).toHaveClass('astryx-input-clear-icon');
		expect(icon).toHaveClass('astryx-date-range-input-clear-icon');
		expect(icon).toHaveClass('astryx-icon');
	});

	it('renders astryx-date-range-input-toggle-icon on the calendar-toggle glyph, reflecting state', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		const toggleLoc = screen.getByRole('button', { name: 'Open calendar' });
		await expect.element(toggleLoc).toBeInTheDocument();
		const icon = iconIn(toggleLoc.element() as HTMLElement);
		expect(icon).toHaveClass('astryx-date-range-input-toggle-icon');
		expect(icon).toHaveClass('astryx-icon');
		// Closed by default → data-state="collapsed".
		expect(icon).toHaveAttribute('data-state', 'collapsed');
	});

	it('routes the clear glyph through the shared clear button (default look unchanged)', async () => {
		// Default-look guard for the clear affordance. It now composes the shared
		// InputClearButton (a ghost Button with a secondary/sm glyph), so aside
		// from its target classes the glyph matches a standalone `secondary`/`sm`
		// close icon — the default clear look is defined once, in InputClearButton.
		// (The calendar-toggle glyph is covered separately.)
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: range, onChange: noop, hasClear: true }
		});
		const clearLoc = screen.getByRole('button', { name: 'Clear Range' });
		await expect.element(clearLoc).toBeInTheDocument();
		const clearIcon = iconIn(clearLoc.element() as HTMLElement);

		const clearRefScreen = await render(Icon, {
			props: { icon: 'close', size: 'sm', color: 'secondary' }
		});
		const clearRefIcon = clearRefScreen.container.querySelector('.astryx-icon') as HTMLElement;

		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter(
					(c) => c !== 'astryx-input-clear-icon' && c !== 'astryx-date-range-input-clear-icon'
				)
				.sort();

		expect(styleClasses(clearIcon)).toEqual(styleClasses(clearRefIcon));
	});

	it('exposes the icon targets so a theme reaches icon color, size, and hover', () => {
		// The DOM-class assertions above (targets land on the icon elements) plus
		// this generation assertion (the theme emits same-element icon rules in
		// `@layer astryx-theme`) together prove the seam: a same-element theme rule
		// wins over the icon's own base-layer color/size. `generateThemeCss` is
		// this port's counterpart to upstream's `generateThemeTestCSS` — both
		// return the flat stylesheet string.
		const theme = defineTheme({
			name: 'date-range-input-icon-test',
			components: {
				'date-range-input-clear-icon': {
					base: {
						width: '12px',
						height: '12px',
						fontSize: '12px',
						color: 'var(--color-icon-secondary)',
						':hover': { color: 'var(--color-icon-primary)' }
					}
				},
				'date-range-input-toggle-icon': {
					base: { width: '14px', height: '14px', fontSize: '14px' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-date-range-input-clear-icon');
		expect(css).toContain('.astryx-date-range-input-toggle-icon');
		expect(css).toContain(':hover');
		expect(css).toContain('12px');
		expect(css).toContain('14px');
	});
});

describe('DateRangeInput disabled theme state', () => {
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-date-range-input');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Range', value: null, onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-date-range-input');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});

describe('DateRangeInput range-span forwarding', () => {
	// Pin "today" so the popover opens on a known month and the day buttons we
	// query are guaranteed to render.
	//
	// Only `Date` is faked. Vitest's default `toFake` set includes
	// `queueMicrotask`, which is what Svelte schedules its flushes on — faking it
	// stalls mount and unmount, so a suite fakes exactly what the case is about
	// (`long-press` records the same rule).
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	// Upstream reaches day buttons by their machine-readable `data-date` (ISO)
	// attribute rather than by role, because jsdom keeps them in the DOM but role
	// queries skip a stubbed popover. The attribute query carries over unchanged;
	// it is scoped to the render container, since the popover layer renders inline
	// in the component tree here rather than through a portal.
	const dayButton = (container: HTMLElement, iso: string): HTMLButtonElement | null =>
		container.querySelector<HTMLButtonElement>(`button[data-date="${iso}"]`);

	it('forwards maxRangeSpan so the window caps after a start is picked', async () => {
		const screen = await render(DateRangeInput, {
			props: { label: 'Reporting period', value: null, onChange: noop, maxRangeSpan: 7 }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));

		// Before a start is picked, a far-off day is selectable.
		expect(dayButton(screen.container, '2026-01-20')).not.toBeDisabled();

		await userEvent.click(dayButton(screen.container, '2026-01-10') as HTMLButtonElement);

		// A 7-day window spans start ± 6 days: Jan 16 is the edge, Jan 17 is out.
		expect(dayButton(screen.container, '2026-01-16')).not.toBeDisabled();
		expect(dayButton(screen.container, '2026-01-17')).toBeDisabled();
	});

	it('disables a preset whose range violates the span cap', async () => {
		const presets: ReadonlyArray<DateRangePreset> = [
			{
				label: 'Last 3 days',
				getRange: (): DateRange => ({ start: '2026-01-08', end: '2026-01-10' })
			},
			{
				label: 'Last 30 days',
				getRange: (): DateRange => ({ start: '2025-12-12', end: '2026-01-10' })
			}
		];
		const handleChange = vi.fn();
		const screen = await render(DateRangeInput, {
			props: {
				label: 'Reporting period',
				value: null,
				onChange: handleChange,
				maxRangeSpan: 7,
				presets
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));

		// The 3-day preset fits the 7-day cap; the 30-day preset can't be committed.
		const withinCap = screen.getByRole('button', { name: 'Last 3 days' }).element();
		const overCap = screen.getByRole('button', { name: 'Last 30 days' }).element() as HTMLElement;
		expect(withinCap).not.toBeDisabled();
		expect(overCap).toBeDisabled();

		// Restated delivery only; the assertion is upstream's unchanged. Upstream's
		// `fireEvent.click` FORCE-dispatches a synthetic event that a browser would
		// never deliver, and React's own `shouldPreventMouseEvent` is what swallows
		// it. Doing that here would assert Svelte's delegation internals instead of
		// the component, so the click goes through `HTMLElement.click()` — the UA's
		// own activation path, which per spec does not fire on an actually-disabled
		// control. Playwright's `userEvent.click` is not an option either: it
		// refuses a disabled element and would assert its actionability heuristic.
		overCap.click();
		expect(handleChange).not.toHaveBeenCalled();
	});
});
