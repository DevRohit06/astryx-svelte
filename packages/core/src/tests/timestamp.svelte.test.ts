import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Timestamp from '$lib/components/timestamp/timestamp.svelte';
import { formatTooltipLines } from '$lib/components/timestamp/tooltip-entries.js';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import TimestampI18nProbe from './fixtures/timestamp-i18n-probe.svelte';
import { whenWired } from './trigger-wiring.js';

/**
 * Astryx v0.3.0's `Timestamp/Timestamp.test.tsx`, ported case for case — 69
 * upstream declarations (34 directly in `describe('Timestamp')`, 8 in
 * `describe('relative_short format')`, 5 in
 * `describe('hover card keyboard reachability')`, 3 in
 * `describe('default hover card (no tooltipEntries)')`, 17 in
 * `describe('tooltipEntries copyable hover card')` and 2 in
 * `describe('one formatter behind both surfaces')`), 69 here, none dropped. The
 * `it.each` over the eight shared formats expands to 8, so the file runs 76.
 *
 * ## What 0.3.0 changed
 *
 * The read-only Tooltip hover surface is gone. Every timestamp that shows a
 * hover surface now renders `TimestampHoverCard` — a `HoverCard` whose layer is
 * a `role="dialog"` named by `@astryx.timestamp.detailsLabel` ("Timestamp
 * details") — and the surface is the same copyable card whether or not
 * `tooltipEntries` is configured. Three upstream cases moved with it, and this
 * port moves with upstream:
 *
 * - `leaves the default tooltip as a single unwrapped line` is **replaced** by
 *   `renders the unified copyable card with a single default absolute row`.
 *   There is no longer a bare-string default: with no entries the card is one
 *   `<dd>` carrying the full absolute time plus one copy button.
 * - `describes an absolute-format timestamp with its tooltip` is **dropped** —
 *   upstream deleted it in 0.3.0. (It asserted `aria-describedby` on the
 *   `<time>`; the anchor `HoverCard` wires is the `Text` wrapper, so the
 *   linkage it pinned no longer names that element on either side.)
 * - `leaves no tooltip and no description when hasTooltip is false` is
 *   **merged** into `stays inert when hasTooltip is false even with entries
 *   configured` (upstream's rename of `still honors hasTooltip={false} when
 *   entries are configured`), which now carries all four of its assertions.
 *
 * ## Stubs
 *
 * Upstream's three jsdom stubs — `showPopover`/`hidePopover` and the
 * `:focus-visible` `matches` override — stay gone: real Chromium implements the
 * Popover API and derives focus-visible itself, and dropping the `matches`
 * override makes the focus case *stronger* than upstream's, since it has to
 * actually tab.
 *
 * Upstream's **clipboard stub is kept**, and matters more here than under
 * jsdom: Chromium does implement `navigator.clipboard`, but `writeText` needs a
 * permission grant the Playwright test page does not have, so the real call
 * rejects and the component's copied state would never be reached. Same
 * arrangement `code-block.svelte.test.ts` documents.
 *
 * ## Recurring translations
 *
 * - A closed popover is `display: none` in a real browser, so the card layer is
 *   located with a `querySelector` on the render container rather than
 *   `getByRole('dialog', {hidden: true})` — the idiom `hover-card`'s and
 *   `use-layer`'s suites already use. For the same reason
 *   `getByRole('button', {name: 'Copied', hidden: true})` becomes an
 *   `aria-label` assertion on the card's button: accname computation returns
 *   `''` for a hidden element, and `aria-label` *is* the icon-only button's
 *   accessible name.
 * - Upstream's `queryAllByRole('tooltip', {hidden: true})` filtered by
 *   `/^(Copy|Copied)$/` becomes {@link nonCopyTooltipsIn}: the copy button
 *   carries its own `role="tooltip"` layer, which is not the hover surface.
 *   Upstream makes that assertion *before* awaiting the card; here it is made
 *   after, which is strictly stronger — at the earlier moment neither surface
 *   has mounted yet.
 * - `waitFor` becomes `vi.waitFor`, and `fireEvent.click` a native `.click()`
 *   (`userEvent.click` needs a visible target; the card's button is inside a
 *   closed popover).
 * - `act()` has no counterpart: a `$state` write flushes on its own and
 *   `expect.element` retries.
 * - The hover card mounts through `{#await import(…)}`, upstream's `lazy` +
 *   `Suspense`. The module is warmed in `beforeAll` exactly as upstream warms
 *   its chunk, and every *negative* card assertion goes through
 *   {@link settleCardImport} so it cannot pass merely by being made too early.
 *
 * `forwards ref` gets a counterpart rather than a transcription: upstream's
 * `ref` lands on the `<time>`, and this port has no public seam onto that
 * element — `...rest` reaches the `<Text>` wrapper instead (the closed-prop-root
 * discrepancy `TODO.md` records for this component). The case asserts the seam
 * this port actually has.
 */

/** A fixed instant that lands on a different calendar day in Tokyo. */
const VALUE = '2026-02-19T17:00:00Z';

function tsIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[data-testid="ts"]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a timestamp element');
	}
	return el;
}

/**
 * The hover card's popover layer. `[role="dialog"]` and not `[role="tooltip"]`:
 * the copy button renders a tooltip layer of its own inside the card, so a
 * tooltip query would now find that instead of the surface under test.
 */
function cardIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="dialog"]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a hover card layer');
	}
	return el;
}

/** Waits for the lazily-imported hover card to mount, then returns its layer. */
async function awaitCard(container: HTMLElement): Promise<HTMLElement> {
	await vi.waitFor(() => cardIn(container));
	return cardIn(container);
}

/**
 * Upstream's
 * `queryAllByRole('tooltip', {hidden: true}).filter(el => !/^(Copy|Copied)$/…)`:
 * every read-only tooltip layer that is *not* a copy button's own hint.
 */
function nonCopyTooltipsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="tooltip"]')).filter(
		(el) => !/^(Copy|Copied)$/.test(el.textContent?.trim() ?? '')
	);
}

/**
 * Upstream's `getByText(…, {selector: '[role="tooltip"] *, [role="tooltip"]'})`
 * as a container query — the visible text of every tooltip layer present.
 */
function tooltipTextsIn(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="tooltip"]')).map(
		(el) => el.textContent?.trim() ?? ''
	);
}

function copyButtonIn(card: HTMLElement): HTMLButtonElement {
	const el = card.querySelector('button');
	if (!(el instanceof HTMLButtonElement)) {
		throw new Error('expected a copy button');
	}
	return el;
}

/**
 * The element `HoverCard` actually wires. It attaches to the first *element*
 * child of its `display: contents` wrapper, which here is `Text`'s span — the
 * `<time>`'s parent — not the `<time>` itself.
 */
function triggerFor(time: HTMLElement): HTMLElement {
	const el = time.parentElement;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a wired trigger');
	}
	return el;
}

/**
 * Lets the (pre-warmed) `{#await import('./timestamp-hover-card.svelte')}`
 * settle. A card asserted *absent* in the same tick as the render would read as
 * absent even under a regression that does mount one — the pending branch
 * renders the bare `<time>` either way. A macrotask drains the microtask queue
 * the cached `import()` and Svelte's flush both live on.
 */
async function settleCardImport(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Intl output carries narrow no-break spaces; compare on normalised runs. */
function normalize(value: string): string {
	return value.replace(/\s+/g, ' ');
}

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

let writeText: ReturnType<typeof vi.fn>;

/**
 * Upstream's `Object.defineProperty(navigator, 'clipboard', …)`. Kept for the
 * reason the header gives: `writeText` is permission-gated under Playwright.
 */
function stubClipboard(): void {
	writeText = vi.fn().mockResolvedValue(undefined);
	Object.defineProperty(navigator, 'clipboard', {
		value: { writeText },
		configurable: true,
		writable: true
	});
}

function restoreClipboard(): void {
	// Hand the real (permission-gated) clipboard back to the page.
	Reflect.deleteProperty(navigator, 'clipboard');
}

describe('Timestamp', () => {
	// The hover card is loaded lazily (`{#await import(…)}`, upstream's `lazy` +
	// `Suspense`), so its chunk resolves asynchronously the first time a card
	// renders. Warm the module cache once up front so the card queries never race
	// the cold import's resolution against `vi.waitFor`'s default timeout.
	beforeAll(async () => {
		await import('$lib/components/timestamp/timestamp-hover-card.svelte');
	});

	beforeEach(() => {
		// Only the clock and the live-update interval are faked. Upstream fakes
		// everything, which it can afford under jsdom; here `setTimeout`, rAF and
		// the microtask queue drive the lazily-imported hover card, the layer's own
		// effects and `userEvent`, and replacing them stalls all three.
		vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
		vi.setSystemTime(new Date('2026-03-25T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders a <time> element with ISO datetime attribute', async () => {
		const screen = await render(Timestamp, {
			props: { value: '2026-03-25T10:00:00Z', format: 'date_time', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		expect(el.tagName).toBe('TIME');
		expect(el.getAttribute('datetime')).toBe('2026-03-25T10:00:00.000Z');
	});

	it('renders relative format for recent times', async () => {
		const twoHoursAgo = Date.now() / 1000 - 7200;
		const screen = await render(Timestamp, {
			props: { value: twoHoursAgo, format: 'relative' }
		});
		await expect.element(screen.getByText('2 hours ago')).toBeInTheDocument();
	});

	it('does not round a tier up past its own boundary', async () => {
		// Just under each threshold the count must stay within the tier, e.g.
		// 59.98 minutes is "59 minutes ago", never "60 minutes ago".
		const screen = await render(Timestamp, {
			props: { value: Date.now() / 1000 - 3599, format: 'relative' }
		});
		await expect.element(screen.getByText('59 minutes ago')).toBeInTheDocument();

		await screen.rerender({ value: Date.now() / 1000 - 86399, format: 'relative' });
		await expect.element(screen.getByText('23 hours ago')).toBeInTheDocument();

		await screen.rerender({ value: Date.now() / 1000 - 2591999, format: 'relative' });
		await expect.element(screen.getByText('29 days ago')).toBeInTheDocument();

		// Same guarantee on the future side.
		await screen.rerender({ value: Date.now() / 1000 + 3599, format: 'relative' });
		await expect.element(screen.getByText('in 59 minutes')).toBeInTheDocument();
	});

	it('renders "now" for very recent times', async () => {
		const fiveSecondsAgo = Date.now() / 1000 - 5;
		const screen = await render(Timestamp, {
			props: { value: fiveSecondsAgo, format: 'relative' }
		});
		await expect.element(screen.getByText('now')).toBeInTheDocument();
	});

	it('renders "now" for the current instant (not a future phrase)', async () => {
		// A value equal to "right now". Because the internal `now` baseline is
		// captured at render time, it can lag the value by a fraction of a second,
		// producing a tiny negative delta that must not be treated as the future.
		const screen = await render(Timestamp, {
			props: { value: Date.now() / 1000, format: 'relative' }
		});
		expect(screen.container.textContent).not.toMatch(/^in /);
		await expect.element(screen.getByText('now')).toBeInTheDocument();
	});

	it('renders "now" for a value a hair in the future (clock skew)', async () => {
		// Real-world clock / captured-now skew can make a current-ish value land a
		// fraction of a second in the future relative to the component's internal
		// `now`. This must read as the present ("now"), never "in a few seconds".
		const aHairInTheFuture = Date.now() / 1000 + 0.6;
		const screen = await render(Timestamp, {
			props: { value: aHairInTheFuture, format: 'relative' }
		});
		expect(screen.container.textContent).not.toMatch(/^in /);
		await expect.element(screen.getByText('now')).toBeInTheDocument();
	});

	it('renders "yesterday" for times ~1 day ago', async () => {
		const yesterday = Date.now() / 1000 - 100000;
		const screen = await render(Timestamp, {
			props: { value: yesterday, format: 'relative' }
		});
		await expect.element(screen.getByText('yesterday')).toBeInTheDocument();
	});

	// --- relative_short format ---

	describe('relative_short format', () => {
		it('renders "now" for very recent times', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 5, format: 'relative_short' }
			});
			await expect.element(screen.getByText('now')).toBeInTheDocument();
		});

		it('abbreviates each past tier (s/m/h/d/mo/y)', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 30, format: 'relative_short' }
			});
			await expect.element(screen.getByText('30s ago')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 - 5 * 60, format: 'relative_short' });
			await expect.element(screen.getByText('5m ago')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 - 2 * 3600, format: 'relative_short' });
			await expect.element(screen.getByText('2h ago')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 - 3 * 86400, format: 'relative_short' });
			await expect.element(screen.getByText('3d ago')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 - 90 * 86400, format: 'relative_short' });
			await expect.element(screen.getByText('3mo ago')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 - 730 * 86400, format: 'relative_short' });
			await expect.element(screen.getByText('2y ago')).toBeInTheDocument();
		});

		it('uses "mo" for months so it never collides with "m" (minutes)', async () => {
			// 45 days → months tier. A bare "m" here would be indistinguishable from
			// the minutes unit, so months must render as "mo".
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 45 * 86400, format: 'relative_short' }
			});
			await expect.element(screen.getByText('1mo ago')).toBeInTheDocument();
		});

		it('renders a single day as "1d ago" (no "yesterday" idiom in short form)', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 100000, format: 'relative_short' }
			});
			await expect.element(screen.getByText('1d ago')).toBeInTheDocument();
		});

		it('renders future times with the "in" prefix and abbreviated units', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 + 5 * 60, format: 'relative_short' }
			});
			await expect.element(screen.getByText('in 5m')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 + 2 * 3600, format: 'relative_short' });
			await expect.element(screen.getByText('in 2h')).toBeInTheDocument();
		});

		it('does not round a tier up past its own boundary', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3599, format: 'relative_short' }
			});
			await expect.element(screen.getByText('59m ago')).toBeInTheDocument();

			await screen.rerender({ value: Date.now() / 1000 - 86399, format: 'relative_short' });
			await expect.element(screen.getByText('23h ago')).toBeInTheDocument();
		});

		it('treats a hair in the future as "now" (clock skew)', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 + 2, format: 'relative_short' }
			});
			await expect.element(screen.getByText('now')).toBeInTheDocument();
		});

		it('keeps the full absolute date as the accessible name', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 2 * 3600, format: 'relative_short' }
			});
			const el = screen.getByText('2h ago').element();
			// Same a11y contract as the long relative form: the visible short label
			// is backed by the full absolute date for screen readers.
			expect(el).toHaveAttribute('aria-label');
			expect(el.getAttribute('aria-label')).not.toBe('2h ago');
		});
	});

	// --- Standard display formats ---

	it('renders date format', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'date', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		expect(el.textContent).toContain('2026');
		// Should not contain time
		expect(el.textContent).not.toContain(':');
	});

	it('renders date_weekday format with a weekday prefix', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'date_weekday', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		// Includes the year and a leading weekday abbreviation, no time portion.
		expect(el.textContent).toContain('2026');
		expect(el.textContent).not.toContain(':');
		// en-US short weekday for 2026-02-19 is "Thu"; assert a weekday word is
		// present without over-fitting the exact locale punctuation.
		expect(el.textContent).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
	});

	it('renders date_long format with a full month name', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'date_long', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		// Long-month shape: full month name, year, no time portion.
		expect(el.textContent).toContain('February');
		expect(el.textContent).toContain('2026');
		expect(el.textContent).not.toContain(':');
	});

	it('renders date_time format', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'date_time', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		expect(el.textContent).toContain('2026');
		// Should contain a colon for the time portion
		expect(el.textContent).toContain(':');
	});

	it('renders time format', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'time', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		// Should contain time but not year
		expect(el.textContent).toContain(':');
		expect(el.textContent).not.toContain('2026');
	});

	// --- System formats ---

	it('renders system_date format', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'system_date', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).textContent).toMatch(/2026-02-\d{2}/);
	});

	it('renders system_date_time format', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'system_date_time', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).textContent).toMatch(/2026-02-\d{2} \d{2}:\d{2}:\d{2}/);
	});

	it('renders system_time format', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'system_time', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
	});

	it('renders unix_seconds format as whole epoch seconds (zone-independent)', async () => {
		// 2026-02-19T17:00:00Z is 1771520400 seconds since the epoch. The value is
		// absolute, so it is the same regardless of the viewer's zone.
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'unix_seconds', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).textContent).toBe('1771520400');
	});

	it('renders unix_seconds from a Unix-seconds value input unchanged', async () => {
		const screen = await render(Timestamp, {
			props: { value: 1771520400, format: 'unix_seconds', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).textContent).toBe('1771520400');
	});

	// --- Auto format ---

	it('auto format uses relative for recent times', async () => {
		const oneHourAgo = Date.now() / 1000 - 3600;
		const screen = await render(Timestamp, { props: { value: oneHourAgo, format: 'auto' } });
		await expect.element(screen.getByText('1 hour ago')).toBeInTheDocument();
	});

	it('auto format uses date_time for old times', async () => {
		const screen = await render(Timestamp, {
			props: { value: '2026-01-01T12:00:00Z', format: 'auto', 'data-testid': 'ts' }
		});
		const el = tsIn(screen.container);
		expect(el.textContent).toContain('2026');
		expect(el.textContent).not.toContain('ago');
	});

	// --- Accessibility ---

	it('sets aria-label with full absolute time in relative mode', async () => {
		const oneHourAgo = Date.now() / 1000 - 3600;
		const screen = await render(Timestamp, {
			props: {
				value: oneHourAgo,
				format: 'relative',
				hasTooltip: false,
				'data-testid': 'ts'
			}
		});
		const el = tsIn(screen.container);
		expect(el.getAttribute('aria-label')).toBeTruthy();
		expect(el.getAttribute('aria-label')).toContain('2026');
	});

	it('does not set aria-label in non-relative mode', async () => {
		const screen = await render(Timestamp, {
			props: { value: VALUE, format: 'date_time', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).getAttribute('aria-label')).toBeNull();
	});

	// --- Input handling ---

	it('accepts Unix timestamp in seconds', async () => {
		const screen = await render(Timestamp, {
			props: { value: 1740000000, format: 'date', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).getAttribute('datetime')).toBeTruthy();
	});

	it('accepts ISO string', async () => {
		const screen = await render(Timestamp, {
			props: { value: '2026-03-25T10:00:00Z', format: 'date_time', 'data-testid': 'ts' }
		});
		expect(tsIn(screen.container).getAttribute('datetime')).toBe('2026-03-25T10:00:00.000Z');
	});

	// --- Live updates ---

	it('live updates relative time', async () => {
		const now = Date.now() / 1000;
		const screen = await render(Timestamp, {
			props: { value: now - 5, format: 'relative', isLive: true }
		});
		await expect.element(screen.getByText('now')).toBeInTheDocument();

		// No `act()` counterpart is needed: the interval's `$state` write flushes
		// on its own and `expect.element` retries until the text lands.
		vi.advanceTimersByTime(30_000);
		await expect.element(screen.getByText('35 seconds ago')).toBeInTheDocument();
	});

	// --- Ref ---

	it('forwards ref', async () => {
		// Counterpart, not a transcription — see the file header. Upstream's `ref`
		// lands on the `<time>`; this port's only seam is `...rest`, which reaches
		// the `<Text>` wrapper, so that is the element an attachment receives.
		const attached = vi.fn();
		const key = createAttachmentKey();
		await render(Timestamp, {
			props: {
				value: '2026-03-25T10:00:00Z',
				format: 'date_time',
				[key]: (node: Element) => {
					attached(node);
				}
			}
		});
		expect(attached).toHaveBeenCalledTimes(1);
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
	});

	// --- Test ID ---

	it('spreads data-testid', async () => {
		const screen = await render(Timestamp, {
			props: { value: '2026-03-25T10:00:00Z', format: 'date_time', 'data-testid': 'my-timestamp' }
		});
		await expect.element(screen.getByTestId('my-timestamp')).toBeInTheDocument();
	});

	// --- Future dates ---

	it('handles future dates in relative mode', async () => {
		const oneHourFromNow = Date.now() / 1000 + 3600;
		const screen = await render(Timestamp, {
			props: { value: oneHourFromNow, format: 'relative' }
		});
		await expect.element(screen.getByText('in 1 hour')).toBeInTheDocument();
	});

	it('renders "now" for a value a few seconds in the future (clock skew)', async () => {
		// Beyond the sub-second render lag but still within the skew tolerance: a
		// value ~20s ahead of our clock is almost always skew (the value's clock
		// running fast), not a genuine future event, so it should read as the
		// present rather than "in a few seconds".
		const twentySecondsFromNow = Date.now() / 1000 + 20;
		const screen = await render(Timestamp, {
			props: { value: twentySecondsFromNow, format: 'relative' }
		});
		expect(screen.container.textContent).not.toMatch(/^in /);
		await expect.element(screen.getByText('now')).toBeInTheDocument();
	});

	it('renders a genuine near-future time beyond the skew tolerance', async () => {
		// Past the skew window — this is a real upcoming time, not clock drift.
		const fortyFiveSecondsFromNow = Date.now() / 1000 + 45;
		const screen = await render(Timestamp, {
			props: { value: fortyFiveSecondsFromNow, format: 'relative' }
		});
		await expect.element(screen.getByText('in a few seconds')).toBeInTheDocument();
	});

	// --- Long-ago relative ---

	it('renders months ago for dates older than 30 days', async () => {
		const threeMonthsAgo = Date.now() / 1000 - 90 * 86400;
		const screen = await render(Timestamp, {
			props: { value: threeMonthsAgo, format: 'relative' }
		});
		await expect.element(screen.getByText('3 months ago')).toBeInTheDocument();
	});

	it('renders years ago for dates older than 365 days', async () => {
		const twoYearsAgo = Date.now() / 1000 - 730 * 86400;
		const screen = await render(Timestamp, {
			props: { value: twoYearsAgo, format: 'relative' }
		});
		await expect.element(screen.getByText('2 years ago')).toBeInTheDocument();
	});

	// --- Auto threshold ---

	it('respects custom autoThreshold', async () => {
		const twoHoursAgo = Date.now() / 1000 - 7200;
		const screen = await render(Timestamp, {
			props: { value: twoHoursAgo, format: 'auto', autoThreshold: 3600 }
		});
		const el = screen.container.querySelector('time');
		expect(el?.textContent).not.toContain('ago');
	});

	// --- Invalid values ---

	it('renders nothing instead of crashing on an unparseable string value', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const screen = await render(Timestamp, {
				props: { value: 'not-a-date', 'data-testid': 'ts' }
			});
			expect(screen.container.querySelector('time')).toBeNull();
			await vi.waitFor(() => {
				expect(warn).toHaveBeenCalledWith(expect.stringContaining('could not parse value'));
			});
		} finally {
			warn.mockRestore();
		}
	});

	it('renders nothing instead of crashing on a NaN value', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const screen = await render(Timestamp, {
				props: { value: NaN, 'data-testid': 'ts' }
			});
			expect(screen.container.querySelector('time')).toBeNull();
		} finally {
			warn.mockRestore();
		}
	});

	// --- Hover card keyboard reachability (WCAG 1.4.13 / 2.1.1) ---

	describe('hover card keyboard reachability', () => {
		// Real timers: the card is lazily imported and its layer schedules on
		// `setTimeout`, and the outer `beforeEach` installs fake ones. Upstream
		// needs the same escape hatch.
		beforeEach(() => {
			vi.useRealTimers();
		});

		it('makes the <time> element focusable while the hover card is attached', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3600, format: 'relative', 'data-testid': 'ts' }
			});
			await expect.element(screen.getByTestId('ts')).toHaveAttribute('tabindex', '0');
		});

		it('shows the hover card when the timestamp receives keyboard focus', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3600, format: 'relative', 'data-testid': 'ts' }
			});
			// The card layer mounts and carries the full absolute time (the same
			// string as the aria-label) as its single default copyable row.
			const card = await awaitCard(screen.container);
			// Re-read the `<time>` only now: `{#await}`'s pending branch — the
			// `Suspense` fallback — renders a `<time>` of its own, and the `:then`
			// branch replaces it with a new node inside the card's wrapper. Upstream
			// never sees that swap, because a `React.lazy` whose promise is already
			// resolved (its `beforeAll` warms it) renders without suspending at all.
			const el = tsIn(screen.container);
			expect(normalize(card.textContent ?? '')).toContain(
				normalize(el.getAttribute('aria-label') ?? '\0')
			);

			// The layer having mounted does not mean the trigger is wired — those
			// are separate effects, and focusing an unwired trigger shows nothing.
			await whenWired(triggerFor(el));

			// Reset the sequential-navigation starting point. Earlier cases in this
			// file focus elements that are then unmounted, which leaves Chromium's
			// starting point on a detached node — tabbing from there moves focus
			// nowhere, and `document.activeElement` still reads `<body>`, so the
			// state is invisible without this.
			document.body.tabIndex = -1;
			document.body.focus();

			// Tab onto the timestamp — the only tab stop in the document (the card's
			// copy button lives inside a closed, `display: none` popover).
			await userEvent.tab();
			expect(el).toHaveFocus();

			await vi.waitFor(() => {
				expect(cardIn(screen.container).matches(':popover-open')).toBe(true);
			});
		});

		it('does not add a tab stop when the hover card is disabled', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: Date.now() / 1000 - 3600,
					format: 'relative',
					hasTooltip: false,
					'data-testid': 'ts'
				}
			});
			await expect.element(screen.getByTestId('ts')).not.toHaveAttribute('tabindex');
		});

		it('does not add a tab stop for absolute formats (no hover card)', async () => {
			const screen = await render(Timestamp, {
				props: { value: VALUE, format: 'date_time', 'data-testid': 'ts' }
			});
			await expect.element(screen.getByTestId('ts')).not.toHaveAttribute('tabindex');
		});

		it('keeps the full absolute aria-label while the hover card is attached', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3600, format: 'relative', 'data-testid': 'ts' }
			});
			const label = tsIn(screen.container).getAttribute('aria-label');
			expect(label).toBeTruthy();
			// The label is the full absolute string, not the relative text.
			expect(label).not.toContain('ago');
		});
	});

	// --- Default hover card (no tooltipEntries) ---

	describe('default hover card (no tooltipEntries)', () => {
		beforeEach(() => {
			vi.useRealTimers();
			stubClipboard();
		});

		afterEach(() => {
			restoreClipboard();
			__resetLiveRegionsForTest();
		});

		it('renders the unified copyable card with a single default absolute row', async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3600, format: 'relative', 'data-testid': 'ts' }
			});
			const card = await awaitCard(screen.container);
			// With no entries the hover surface is still the copyable card — one
			// surface, one styling — never the old read-only tooltip. (The copy
			// button carries its own small "Copy" tooltip; that is not the hover
			// surface, so exclude it.)
			expect(nonCopyTooltipsIn(screen.container)).toHaveLength(0);
			// The default card is the named details card, exactly as the configured
			// one is.
			expect(card).toHaveAttribute('aria-label', 'Timestamp details');
			// Exactly one row, carrying the full absolute time (the same string as
			// the aria-label) with its own copy button.
			expect(card.querySelectorAll('dd')).toHaveLength(1);
			expect(card.querySelectorAll('button')).toHaveLength(1);

			expect(normalize(card.textContent ?? '')).toContain(
				normalize(tsIn(screen.container).getAttribute('aria-label') ?? '\0')
			);
		});

		it("copies the default absolute row's value", async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3600, format: 'relative' }
			});
			const card = await awaitCard(screen.container);
			const rowValue = card.querySelector('dd')?.textContent ?? '';
			expect(rowValue).toBeTruthy();
			copyButtonIn(card).click();
			expect(writeText).toHaveBeenCalledWith(rowValue);
			// Let the async copy resolve and flip the button into its copied state.
			// `getByRole('button', {name: 'Copied'})` → the aria-label, which is the
			// icon-only button's accessible name; see the header.
			await vi.waitFor(() => {
				expect(copyButtonIn(card)).toHaveAttribute('aria-label', 'Copied');
			});
		});

		it("shows a 'Copy' tooltip on the copy button, flipping to 'Copied' after a copy", async () => {
			const screen = await render(Timestamp, {
				props: { value: Date.now() / 1000 - 3600, format: 'relative' }
			});
			const card = await awaitCard(screen.container);
			const button = copyButtonIn(card);
			// The visible tooltip content defaults to the short imperative 'Copy'
			// (the full "Copy <value>" string stays the button's aria-label).
			await vi.waitFor(() => {
				expect(tooltipTextsIn(screen.container)).toContain('Copy');
			});
			button.click();
			// After a successful copy the tooltip content flips to 'Copied' in step
			// with the icon/aria-label.
			await vi.waitFor(() => {
				expect(tooltipTextsIn(screen.container)).toContain('Copied');
			});
		});
	});

	// --- Multi-zone / multi-format copyable hover card (tooltipEntries) ---

	describe('tooltipEntries copyable hover card', () => {
		beforeEach(() => {
			vi.useRealTimers();
			stubClipboard();
		});

		afterEach(() => {
			restoreClipboard();
			__resetLiveRegionsForTest();
		});

		it('presents configured entries as a named card, not a read-only tooltip', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					tooltipEntries: [{ label: 'Local' }, { timezoneID: 'UTC', label: 'UTC' }]
				}
			});
			const card = await awaitCard(screen.container);
			// Entries present — the surface is the interactive card, never the
			// lightweight read-only tooltip. (The copy button's own "Copy" tooltip
			// is not the hover surface, so exclude it.)
			expect(nonCopyTooltipsIn(screen.container)).toHaveLength(0);
			expect(card).toHaveAttribute('aria-label', 'Timestamp details');
		});

		it('renders one row per configured entry, read-only by default', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					tooltipEntries: [
						{ label: 'Local' },
						{ timezoneID: 'UTC', label: 'UTC' },
						{ timezoneID: 'Asia/Tokyo', label: 'Tokyo' }
					]
				}
			});
			const card = await awaitCard(screen.container);
			await vi.waitFor(() => {
				expect(card.querySelectorAll('dd')).toHaveLength(3);
			});
			// Entries are read-only unless they opt in, so no copy buttons and no
			// trailing action column are rendered.
			expect(card.querySelectorAll('button')).toHaveLength(0);
			expect(card.textContent).toContain('Local');
			expect(card.textContent).toContain('UTC');
			expect(card.textContent).toContain('Tokyo');
		});

		it('renders a copy button only on rows that opt into isCopyable', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					tooltipEntries: [
						{ label: 'Local' },
						{ timezoneID: 'UTC', label: 'UTC' },
						{
							timezoneID: 'UTC',
							format: 'system_date_time',
							label: 'ISO',
							isCopyable: true
						}
					]
				}
			});
			const card = await awaitCard(screen.container);
			// Three rows, but only the opted-in row carries a copy button.
			await vi.waitFor(() => {
				expect(card.querySelectorAll('dd')).toHaveLength(3);
			});
			expect(card.querySelectorAll('button')).toHaveLength(1);
		});

		it('renders each entry in the time zone it names', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					tooltipEntries: [
						{ timezoneID: 'UTC', format: 'system_date_time', label: 'UTC' },
						{ timezoneID: 'Asia/Tokyo', format: 'system_date_time', label: 'Tokyo' }
					]
				}
			});
			const card = await awaitCard(screen.container);
			// Machine formats are locale- and host-timezone-independent, so these
			// hold on any developer machine and on CI.
			await vi.waitFor(() => {
				const values = Array.from(card.querySelectorAll('dd')).map((el) => el.textContent);
				expect(values).toEqual(['2026-02-19 17:00:00', '2026-02-20 02:00:00']);
			});
		});

		it("copies an opted-in row's value and flips the button to the copied state", async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					tooltipEntries: [
						{
							label: 'ISO',
							format: 'system_date_time',
							timezoneID: 'UTC',
							isCopyable: true
						}
					]
				}
			});
			const card = await awaitCard(screen.container);
			const [rowValue] = Array.from(card.querySelectorAll('dd')).map((el) => el.textContent ?? '');

			copyButtonIn(card).click();
			expect(writeText).toHaveBeenCalledWith(rowValue);

			// The button announces and flips its icon/label to the copied state.
			await vi.waitFor(() => {
				expect(copyButtonIn(card)).toHaveAttribute('aria-label', 'Copied');
			});
		});

		it('announces the copy to a polite live region through the i18n catalog', async () => {
			// The provider takes a snippet for its children, so upstream's inline
			// wrapper becomes `timestamp-i18n-probe.svelte`.
			const screen = await render(TimestampI18nProbe, {
				props: {
					locale: 'fr',
					overrides: { fr: { '@astryx.timestamp.copied': 'Copié' } },
					value: VALUE,
					format: 'relative',
					tooltipEntries: [{ timezoneID: 'UTC', label: 'UTC', isCopyable: true }]
				}
			});
			const card = await awaitCard(screen.container);
			copyButtonIn(card).click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Copié');
			});
		});

		it('shows the card for absolute formats once entries are configured', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'date_time',
					tooltipEntries: [{ timezoneID: 'UTC', label: 'UTC' }],
					'data-testid': 'ts'
				}
			});
			// Without entries an absolute format has no hover surface at all;
			// configuring entries must not be silently ignored.
			const card = await awaitCard(screen.container);
			await vi.waitFor(() => {
				expect(card.textContent).toContain('UTC');
			});
			// ...and the anchor becomes keyboard-reachable, as it is for relative.
			expect(tsIn(screen.container)).toHaveAttribute('tabindex', '0');
		});

		it('treats an empty entry list exactly like no configuration', async () => {
			const screen = await render(Timestamp, {
				props: { value: VALUE, format: 'date_time', tooltipEntries: [], 'data-testid': 'ts' }
			});
			await settleCardImport();
			// An empty array is not a way to configure the card — with no lines to
			// show, an absolute format stays surface-less (no tab stop, no card).
			expect(tsIn(screen.container)).not.toHaveAttribute('tabindex');
			expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
		});

		it('stays inert when hasTooltip is false even with entries configured', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					hasTooltip: false,
					tooltipEntries: [{ timezoneID: 'UTC', label: 'UTC' }],
					'data-testid': 'ts'
				}
			});
			await settleCardImport();
			// hasTooltip stays the on/off switch: false suppresses the surface even
			// when entries would otherwise upgrade it to the card.
			expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
			expect(nonCopyTooltipsIn(screen.container)).toHaveLength(0);
			expect(tsIn(screen.container)).not.toHaveAttribute('tabindex');
			// No orphaned reference pointing at a card that was never rendered.
			expect(tsIn(screen.container).getAttribute('aria-describedby')).toBeNull();
		});

		it('leaves the accessible name unchanged when entries are configured', async () => {
			const value = Date.now() / 1000 - 3600;
			const first = await render(Timestamp, {
				props: { value, format: 'relative', 'data-testid': 'ts' }
			});
			const before = tsIn(first.container).getAttribute('aria-label');
			first.unmount();

			const second = await render(Timestamp, {
				props: {
					value,
					format: 'relative',
					tooltipEntries: [{ timezoneID: 'UTC', label: 'UTC' }],
					'data-testid': 'ts'
				}
			});
			// The accessible name stays the canonical absolute time in the viewer's
			// own zone; the extra zones reach assistive tech through the card, not
			// by being stuffed into the name.
			expect(tsIn(second.container).getAttribute('aria-label')).toBe(before);
		});

		it('does not add an accessible name to absolute formats with entries', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'date_time',
					tooltipEntries: [{ timezoneID: 'UTC' }],
					'data-testid': 'ts'
				}
			});
			expect(tsIn(screen.container).getAttribute('aria-label')).toBeNull();
		});

		it('renders nothing for an unparseable value even with entries', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const screen = await render(Timestamp, {
					props: {
						value: 'not-a-date',
						tooltipEntries: [{ timezoneID: 'UTC', label: 'UTC' }]
					}
				});
				await settleCardImport();
				// The invalid-value bail-out runs before any hover-surface work, so
				// there is no half-rendered card anchored to nothing.
				expect(screen.container.querySelector('time')).toBeNull();
				expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
			} finally {
				warn.mockRestore();
			}
		});

		it('shows configured entries when auto resolves to an absolute format', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'auto',
					autoThreshold: 0,
					tooltipEntries: [{ timezoneID: 'UTC', format: 'system_date_time', label: 'UTC' }],
					'data-testid': 'ts'
				}
			});
			// autoThreshold={0} forces the absolute branch regardless of the clock.
			const card = await awaitCard(screen.container);
			await vi.waitFor(() => {
				expect(card.textContent).toContain('2026-02-19 17:00:00');
			});
			expect(tsIn(screen.container)).toHaveAttribute('tabindex', '0');
		});

		it('accepts a unix-seconds value alongside entries', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: Date.parse(VALUE) / 1000,
					format: 'relative',
					tooltipEntries: [{ timezoneID: 'UTC', format: 'system_date_time', label: 'UTC' }]
				}
			});
			const card = await awaitCard(screen.container);
			await vi.waitFor(() => {
				expect(card.textContent).toContain('2026-02-19 17:00:00');
			});
		});

		it('pairs exactly one label cell with one value cell per entry', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'relative',
					tooltipEntries: [
						{ timezoneID: 'UTC', label: 'UTC' },
						{ timezoneID: 'Asia/Tokyo' },
						{ timezoneID: 'Europe/London', label: 'London' }
					]
				}
			});
			const card = await awaitCard(screen.container);
			// An unlabeled entry still emits its label cell, so the grid stays
			// aligned and the <dl> stays valid markup.
			await vi.waitFor(() => {
				expect(card.querySelectorAll('dt')).toHaveLength(3);
			});
			expect(card.querySelectorAll('dd')).toHaveLength(3);
			expect(card.querySelectorAll('dt')[1].textContent).toBe('');
		});

		it('gives the tab stop back when entries are removed', async () => {
			const screen = await render(Timestamp, {
				props: {
					value: VALUE,
					format: 'date_time',
					tooltipEntries: [{ timezoneID: 'UTC' }],
					'data-testid': 'ts'
				}
			});
			await expect.element(screen.getByTestId('ts')).toHaveAttribute('tabindex', '0');

			// `rerender` merges: a key left out keeps its previous value, where
			// upstream's `rerender` re-renders a whole new element. `undefined` is
			// what "the prop is not passed" means to `$props()`, so it is what
			// removing it looks like here.
			await screen.rerender({
				value: VALUE,
				format: 'date_time',
				tooltipEntries: undefined,
				'data-testid': 'ts'
			});
			// The surface is driven purely by entry presence, so dropping the prop
			// must also drop the tab stop rather than stranding one.
			await expect.element(screen.getByTestId('ts')).not.toHaveAttribute('tabindex');
		});

		it('does not crash on an unknown time zone', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const screen = await render(Timestamp, {
					props: {
						value: VALUE,
						format: 'relative',
						tooltipEntries: [
							{ timezoneID: 'Not/AZone', format: 'system_date_time' },
							{ timezoneID: 'UTC', format: 'system_date_time' }
						]
					}
				});
				const card = await awaitCard(screen.container);
				await vi.waitFor(() => {
					const values = Array.from(card.querySelectorAll('dd')).map((el) => el.textContent);
					expect(values).toHaveLength(2);
					expect(values[1]).toBe('2026-02-19 17:00:00');
				});
				expect(warn).toHaveBeenCalledWith(expect.stringContaining('Not/AZone'));
			} finally {
				warn.mockRestore();
			}
		});
	});

	describe('one formatter behind both surfaces', () => {
		// The rendered text and a card line are two views of the same instant.
		// They are meant to come from one formatter parameterized by zone, not two
		// that happen to agree: a format added or reshaped on one surface and not
		// the other is a silent drift, invisible until someone compares them.
		// These assertions compare the two surfaces directly, so re-forking either
		// one fails here. Locale- and timezone-agnostic: nothing is pinned to a
		// literal, only the two paths to each other.
		const SHARED_FORMATS = [
			'date',
			'date_long',
			'date_weekday',
			'date_time',
			'time',
			'system_date',
			'system_date_time',
			'system_time'
		] as const;

		it.each(SHARED_FORMATS)(
			'renders %s identically as text and as a zone-less tooltip line',
			async (format) => {
				const screen = await render(Timestamp, {
					props: { value: VALUE, format, hasTooltip: false, 'data-testid': 'ts' }
				});
				const [line] = formatTooltipLines(new Date(VALUE), [{ format }]);
				expect(line.value).toBe(tsIn(screen.container).textContent);
			}
		);

		it('renders the full style identically as the aria-label and as a line', async () => {
			// 'full' is the one member with no visible-text counterpart — it backs
			// the accessible name of a relative timestamp and the card's default
			// line. Those two must not drift apart either.
			const screen = await render(Timestamp, {
				props: { value: VALUE, format: 'relative', hasTooltip: false, 'data-testid': 'ts' }
			});
			const [line] = formatTooltipLines(new Date(VALUE), [{ format: 'full' }]);
			expect(line.value).toBe(tsIn(screen.container).getAttribute('aria-label'));
		});
	});
});
