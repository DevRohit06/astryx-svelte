import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import DateInput from '$lib/components/date-input/date-input.svelte';
import type { ISODateString } from '$lib/utils/date-types.js';
import {
	hasEditableDateSegments,
	resetDateSegmentProbe
} from '$lib/components/date-input/native-date-segments.js';
import DateInputI18n from './fixtures/date-input-i18n.svelte';

/**
 * Astryx's `DateInput/NativeDateField.test.tsx`, ported case for case — **all
 * 34 of upstream's 34** at the **v0.5.2** pin (`describe('DateInput
 * nativePicker')`, measured off the checkout, not quoted from a prior header).
 * Nothing is dropped: the file has no `displayName` case, no snapshot, no
 * no-JSX construction form, and its one React-only surface (`ref`) gets a
 * counterpart rather than a drop.
 *
 * ## Project
 *
 * Client (real Chromium). Every case renders through `DateInput` with the
 * pointer stubbed, so `date-input.svelte`'s surface selection is exercised too;
 * `nativePicker` defaults to `'touch'`, so a coarse pointer alone gets the
 * native control. Four cases assert on CSS the engine has to resolve, which is
 * the other reason this cannot be a node file.
 *
 * ## The engine probe: a stylesheet, not a module mock
 *
 * Upstream's harness is a `vi.mock('./nativeDateSegments')` whose
 * `segmentState.editable` is `null` by default, so "every other test in this
 * file exercises the shipping path: jsdom lays nothing out, so the probe
 * reports `'unknown'` and the coarse pointer resolves it to picker-only."
 *
 * A module mock is the wrong instrument here for two reasons. The client
 * project's setup file imports the whole `$lib` barrel before any test file
 * runs, so `native-date-segments.js` is already resolved and a hoisted mock
 * would have to invalidate it transitively — the reason `toast-viewport`
 * observes its sink rather than mocking `useAnnounce`. And it is unnecessary:
 * the probe is pure DOM measurement, so the environment it measures can be set
 * directly.
 *
 * - **`'unknown'` (upstream's default, and this file's)** — `pinProbeWidth()`
 *   installs a stylesheet pinning the throwaway probe input's width with
 *   `!important`, which beats the probe's own inline `width:auto`. Neither
 *   pseudo can then move the box, `probeEngine()` returns `'unknown'`, and the
 *   pointer breaks the tie. That is the *documented* fallback state — it is
 *   what Firefox reports, and `native-date-segments.ts` says so — reached by
 *   making the measurement impossible rather than by faking its answer.
 * - **`'segmented'` (upstream's `segmentState.editable = true`)** —
 *   `useEditableSegments()` removes the pin and drops the cache. Real Chromium
 *   then answers `'segmented'` on its own, because Blink really does draw
 *   `<input type="date">` as typable `mm`/`dd`/`yyyy` fields. This is *stronger*
 *   than upstream's stub: the three "editable segments" cases run against the
 *   real probe on a real engine rather than a hardcoded `true`.
 *
 * ## Stubs kept, and one deliberately dropped
 *
 * `matchMedia` is upstream's `stubPointer` verbatim and is load-bearing: it is
 * what selects the surface. `showPicker` is stubbed on the element in the two
 * toggle cases exactly as upstream does — and it matters *more* here, because
 * Chromium implements a real `showPicker()` that would raise an actual OS
 * picker mid-test.
 *
 * Upstream's `ResizeObserver` stub is **dropped**, and that is not a relaxation.
 * jsdom ships no `ResizeObserver`, so upstream needs a no-op to keep the
 * `nativePicker="never"` case (the only one reaching Astryx's touch picker)
 * from throwing. Chromium ships a real one, and `MonthScroller` *needs* it:
 * a no-op would leave `paneSize` at 0, mount no pane at all, and the case would
 * then pass for the wrong reason. The real observer is what keeps that case
 * honest about which surface it got.
 *
 * ## Restated, each noted at the case
 *
 * - every `fireEvent.change(input, {target: {value}})` — vitest-browser has no
 *   `fireEvent`. `changeValue()` assigns the value and dispatches the native
 *   `input` **and** `change` events, which is what a real edit fires and what
 *   this port binds. Case 10 is the one that turns on it.
 * - `fireEvent.focus` / `fireEvent.blur` — replaced by real `focus()` / `blur()`
 *   calls. Upstream dispatches a synthetic event without moving focus; a real
 *   browser can move it, and `does not write to the control while it has focus`
 *   is about a control that genuinely has it.
 * - `survives a browser that refuses showPicker` — upstream's
 *   `expect(() => fireEvent.click(…)).not.toThrow()` cannot transcribe: the
 *   throw happens inside an event handler, where it would surface as an
 *   *uncaught* error rather than propagating out of the dispatch. A `window`
 *   `error` listener is the counterpart, and it checks the same thing the title
 *   claims.
 * - `hides the engine's own text under the overlay` — upstream's
 *   `toContain('color: transparent')` cannot transcribe *as a literal*:
 *   lightningcss lowers `transparent` to `rgba(0, 0, 0, 0)` for `color`, a
 *   property it understands, while leaving `-webkit-text-fill-color` alone. The
 *   declaration is the same one; only its spelling in the emitted sheet differs,
 *   and the assertion is anchored on the rule's opening brace so it cannot be
 *   satisfied by the `background-color: rgba(0, 0, 0, 0)` sitting in the same
 *   filtered text — which is exactly how a naive `toContain` would go vacuous.
 * - `keeps the field labelled, required-marked, and ref-forwarded` — the `ref`
 *   third is a **counterpart**: Svelte has no `ref` prop, so the seam a consumer
 *   actually uses is an attachment through `...rest`, which
 *   `native-date-field.svelte` spreads onto the wrapper `<div>` (upstream's
 *   `DateInput` spreads rest onto the wrapper too). It receives the element
 *   rather than only proving a callback ran.
 *
 * ## `rulesFor` descends into `@layer`
 *
 * Upstream's helper does one top-level pass over `document.styleSheets`. This
 * port emits its atomic CSS inside `@layer` blocks, and the compiled sheet is on
 * a browser-test page twice (Vite injects it for the module graph
 * `setup-stylex.ts` imports, and that file appends its own copy). The walk is
 * therefore recursive and de-duplicated by rule text — never loosened, since
 * both halves would otherwise change what a `toContain` means.
 *
 * ## `formats in the provider locale` was the case that found the defect
 *
 * It failed when this file landed. Upstream's `NativeDateField.tsx` calls
 * `useLocale()` and threads the result into `formatSharedDate(…, locale)` and
 * `parseDateInput(…, locale)` (`NativeDateField.tsx:255`, `:335`, `:369`),
 * where this port's `formatSharedDate`/`plainDateFormat`/`parseDateInput` took
 * no locale argument at all and formatted with the runtime default — so an
 * `InternationalizationProvider` locale reached the date text on none of the
 * three DateInput surfaces. Both helpers now carry upstream's `locale`
 * parameter with its `'en'` default, and every call site in the date family
 * threads it, so the case passes as upstream wrote it.
 */

const noop = (): void => {};

const iso = (value: string): ISODateString => value as ISODateString;

/** Playwright's locators are substring/case-insensitive; RTL's are exact. */
const exact = { exact: true } as const;

const HOVER_CAPABLE = /\(\s*hover\s*:\s*hover\s*\)/;

/** Point `(pointer: coarse)` at a touch or mouse device. Upstream's, verbatim. */
function stubPointer(isCoarse: boolean): void {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: /pointer:\s*coarse/.test(query)
			? isCoarse
			: /pointer:\s*fine/.test(query)
				? !isCoarse
				: HOVER_CAPABLE.test(query),
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	}));
}

/**
 * The stylesheet that makes the engine probe unmeasurable — see the header.
 * `!important` beats the probe element's own inline `width:auto`, so padding
 * either pseudo cannot move the box and `probeEngine()` lands on `'unknown'`,
 * the same answer jsdom gives upstream and Firefox gives in the wild.
 */
let probePin: HTMLStyleElement | null = null;

function pinProbeWidth(): void {
	const style = document.createElement('style');
	style.textContent =
		'input[data-astryx-date-probe]{width:50px !important;' +
		'min-width:50px !important;max-width:50px !important}';
	document.head.append(style);
	probePin = style;
}

/**
 * Upstream's `segmentState.editable = true`: let the real probe run against
 * real Chromium, which draws editable segments and reports `'segmented'`.
 */
function useEditableSegments(): void {
	probePin?.remove();
	probePin = null;
	resetDateSegmentProbe();
}

function getInput(container: HTMLElement): HTMLInputElement {
	const input = container.querySelector('input');
	if (!input) {
		throw new Error('DateInput rendered no input element');
	}
	return input;
}

/** Every rule on the page, descending into `@layer` and de-duplicated. */
function allRules(): string[] {
	const out: string[] = [];
	const walk = (list: CSSRuleList): void => {
		for (const rule of Array.from(list)) {
			const nested = (rule as CSSGroupingRule).cssRules;
			if (nested && !(rule as CSSStyleRule).selectorText) {
				walk(nested);
			} else {
				out.push(rule.cssText);
			}
		}
	};
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			walk(sheet.cssRules);
		} catch {
			// A cross-origin sheet throws on `cssRules`; upstream swallows it too.
		}
	}
	return [...new Set(out)];
}

/** The CSS rules that apply to an element, for the paint-level assertions. */
function rulesFor(el: Element): string {
	const classes = new Set(el.className.split(/\s+/).filter(Boolean));
	return allRules()
		.filter((text) => [...classes].some((cls) => text.includes(`.${cls}`)))
		.join(' ');
}

/**
 * Upstream's `fireEvent.change(input, {target: {value}})`.
 *
 * Both native events are dispatched, because both are what a real edit fires
 * and both are bound here: this port has no synthetic layer to route around, so
 * upstream's React `onChange` plus hand-attached `input`/`change` listeners are
 * simply `oninput` and `onchange`. Case 10 is the one that turns on it.
 */
async function changeValue(input: HTMLInputElement, value: string): Promise<void> {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	input.dispatchEvent(new Event('change', { bubbles: true }));
	await tick();
}

async function focusInput(input: HTMLInputElement): Promise<void> {
	input.focus();
	await tick();
}

async function blurInput(input: HTMLInputElement): Promise<void> {
	input.blur();
	await tick();
}

beforeEach(() => {
	pinProbeWidth();
	resetDateSegmentProbe();
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	probePin?.remove();
	probePin = null;
	resetDateSegmentProbe();
});

describe('DateInput nativePicker', () => {
	// ===========================================================================
	// Which surface renders
	// ===========================================================================

	it('renders the native control on touch by default', async () => {
		stubPointer(true);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });

		expect(getInput(screen.container)).toHaveAttribute('type', 'date');
	});

	it('keeps the calendar popover on a mouse-driven device', async () => {
		stubPointer(false);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });

		const input = getInput(screen.container);
		expect(input).toHaveAttribute('type', 'text');
		expect(input).toHaveAttribute('role', 'combobox');
	});

	it('falls back to Astryx’s touch picker when told never', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', nativePicker: 'never', onChange: noop }
		});

		const input = getInput(screen.container);
		expect(input).toHaveAttribute('type', 'text');
		expect(input).toHaveAttribute('role', 'combobox');
	});

	it('uses the native control on a mouse device when told always', async () => {
		stubPointer(false);
		const screen = await render(DateInput, {
			props: { label: 'Date', nativePicker: 'always', onChange: noop }
		});

		expect(getInput(screen.container)).toHaveAttribute('type', 'date');
	});

	it('drops the popup ARIA the other surfaces carry', async () => {
		// There is no in-page popup to describe: the OS draws the picker.
		stubPointer(true);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });

		const input = getInput(screen.container);
		expect(input).not.toHaveAttribute('role', 'combobox');
		expect(input).not.toHaveAttribute('aria-expanded');
		expect(input).not.toHaveAttribute('aria-haspopup');
	});

	// ===========================================================================
	// Value round-trip
	// ===========================================================================

	it('keeps the control’s own value ISO', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), format: 'date_long', onChange: noop }
		});

		// ISO is the only form the control accepts, and what the picker reads and
		// writes; `format` rides on the overlay instead.
		expect(getInput(screen.container)).toHaveValue('2026-01-25');
		await expect.element(screen.getByText('January 25, 2026', exact)).toBeInTheDocument();
	});

	it('fires onChange with the ISO date the control reports', async () => {
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, { props: { label: 'Date', onChange } });

		await changeValue(getInput(screen.container), '2026-03-21');

		expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-03-21');
	});

	it('fires onChange with undefined when the control is emptied', async () => {
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-03-21'), onChange }
		});

		await changeValue(getInput(screen.container), '');

		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it('commits an edit React’s synthetic change does not see', async () => {
		// The iOS failure, reproduced. Upstream carries a React `onChange` AND a
		// pair of hand-attached `input`/`change` listeners because React's
		// synthetic change never runs for the picker's edits: React then
		// re-renders and writes its stale value back over the picker's.
		//
		// There is no synthetic layer here to route around — `oninput` IS the
		// native event — so the transcription is upstream's body verbatim, minus
		// the value-tracker trick that only React needs: the native `input` event
		// alone has to commit the edit.
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-03-21'), onChange }
		});

		const input = getInput(screen.container);
		input.value = '2026-03-09';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await tick();

		expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-03-09');
	});

	it('fires one change when both commit paths see the same edit', async () => {
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-03-21'), onChange }
		});

		// `changeValue` dispatches `input` *and* `change`: this port's two commit
		// paths, standing in for upstream's synthetic-plus-native pair.
		await changeValue(getInput(screen.container), '2026-03-09');

		expect(onChange).toHaveBeenCalledExactlyOnceWith('2026-03-09');
	});

	it('does not write to the control while it has focus', async () => {
		// The iOS bug this guards: while the picker sheet is open, ANY
		// programmatic write to the field detaches the sheet from it, and the
		// user's pick silently stops reaching the input.
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-03-21'), onChange: noop }
		});
		const input = getInput(screen.container);

		await focusInput(input);
		await screen.rerender({ label: 'Date', value: iso('2026-12-25'), onChange: noop });

		expect(input).toHaveValue('2026-03-21');
	});

	it('applies an external value once the control loses focus', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-03-21'), onChange: noop }
		});
		const input = getInput(screen.container);

		await focusInput(input);
		await screen.rerender({ label: 'Date', value: iso('2026-12-25'), onChange: noop });
		await blurInput(input);

		expect(input).toHaveValue('2026-12-25');
	});

	// ===========================================================================
	// Constraints
	// ===========================================================================

	it('forwards min and max to the native control', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				min: iso('2026-01-01'),
				max: iso('2026-12-31'),
				onChange: noop
			}
		});

		const input = getInput(screen.container);
		expect(input).toHaveAttribute('min', '2026-01-01');
		expect(input).toHaveAttribute('max', '2026-12-31');
	});

	it('refuses an out-of-range date and announces it', async () => {
		// iOS does not enforce min/max in its picker — it lets the user land on
		// any date — so the refusal has to happen here.
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				min: iso('2026-03-10'),
				max: iso('2026-03-20'),
				value: iso('2026-03-15'),
				onChange
			}
		});

		await changeValue(getInput(screen.container), '2026-03-25');

		expect(onChange).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid date');
		expect(getInput(screen.container)).toHaveAttribute('aria-invalid', 'true');
	});

	it('refuses a date dateConstraints rejects', async () => {
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				// 2026-03-22 is a Sunday.
				dateConstraints: [(date: Date) => date.getDay() !== 0],
				value: iso('2026-03-23'),
				onChange
			}
		});

		await changeValue(getInput(screen.container), '2026-03-22');

		expect(onChange).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid date');
	});

	it('drops the rejection once the field reverts', async () => {
		// The refused date is reverted the moment focus leaves, so the field is
		// showing a valid date again. Marking that date invalid would be a lie
		// about data the user never chose.
		stubPointer(true);
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				dateConstraints: [(date: Date) => date.getDay() !== 0],
				value: iso('2026-03-23'),
				onChange: noop
			}
		});

		const input = getInput(screen.container);
		await focusInput(input);
		await changeValue(input, '2026-03-22');
		expect(input).toHaveAttribute('aria-invalid', 'true');

		await blurInput(input);

		expect(input).toHaveValue('2026-03-23');
		expect(input).not.toHaveAttribute('aria-invalid');
		expect(screen.getByRole('alert').element()).toHaveTextContent('');
	});

	// ===========================================================================
	// The text overlay: format, placeholder, paint
	// ===========================================================================

	it('honours every named format', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), format: 'date', onChange: noop }
		});
		await expect.element(screen.getByText('Jan 25, 2026', exact)).toBeInTheDocument();

		await screen.rerender({
			label: 'Date',
			value: iso('2026-01-25'),
			format: 'date_weekday',
			onChange: noop
		});

		await expect.element(screen.getByText('Sun, Jan 25, 2026', exact)).toBeInTheDocument();
	});

	it('honours a function format', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				value: iso('2026-01-25'),
				format: (value: ISODateString) => `ships ${value}`,
				onChange: noop
			}
		});

		await expect.element(screen.getByText('ships 2026-01-25', exact)).toBeInTheDocument();
	});

	it('formats in the provider locale', async () => {
		// A provider's `children` is a snippet and cannot be written inline in a
		// `render()` props object, so this goes through the existing
		// `date-input-i18n.svelte` fixture — the same provider, the same prop.
		stubPointer(true);
		const screen = await render(DateInputI18n, {
			props: { locale: 'de-DE', label: 'Date', value: iso('2026-03-21'), onChange: noop }
		});

		await expect.element(screen.getByText('21. März 2026', exact)).toBeInTheDocument();
		expect(getInput(screen.container)).toHaveValue('2026-03-21');
	});

	it('keeps painting the value while the picker is open', async () => {
		// The OS picker has no segments to reveal, so `format` holds throughout.
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
		});

		await focusInput(getInput(screen.container));

		await expect.element(screen.getByText('January 25, 2026', exact)).toBeInTheDocument();
	});

	it('shows the placeholder when empty, and drops it when filled', async () => {
		stubPointer(true);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });
		await expect.element(screen.getByText('Select a date', exact)).toBeInTheDocument();

		await screen.rerender({ label: 'Date', value: iso('2026-01-25'), onChange: noop });

		expect(screen.getByText('Select a date', exact).query()).toBeNull();
	});

	it('keeps the overlay out of the accessibility tree', async () => {
		// The input still holds the value and carries the label, so announcing
		// the overlay too would double-speak.
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
		});

		await expect
			.element(screen.getByText('January 25, 2026', exact))
			.toHaveAttribute('aria-hidden', 'true');
	});

	it('hides the engine’s own text under the overlay', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
		});

		const rules = rulesFor(getInput(screen.container));
		// One transparent colour covers Chromium's `::-webkit-datetime-edit` and
		// Firefox's plain text; `-webkit-text-fill-color` is what wins in WebKit.
		//
		// Upstream writes `toContain('color: transparent')`. Restated: lightningcss
		// lowers `transparent` to `rgba(0, 0, 0, 0)` for `color`, which it
		// understands, and leaves `-webkit-text-fill-color` untouched. Anchoring on
		// the opening brace keeps this from being satisfied by the wrapper's
		// `background-color: rgba(0, 0, 0, 0)`, which sits in the same filtered
		// text — a bare substring here would be vacuous.
		expect(rules).toContain('{ color: rgba(0, 0, 0, 0); }');
		expect(rules).toContain('-webkit-text-fill-color: transparent');
	});

	it('bounds the overlay so a long date cannot paint past it', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-09-30'), hasClear: true, onChange: noop }
		});

		const rules = rulesFor(screen.getByText('September 30, 2026', exact).element());
		// Without the end inset the overlay is shrink-to-fit and a long date runs
		// over the clear button — measured 24px across it on an iPhone.
		expect(rules).toContain('inset-inline-end: 0');
		// `text-overflow` only applies to a BLOCK container: on a flex one a
		// too-long date hard-clips mid-glyph instead (measured identical to
		// `text-overflow: clip` in WebKit and Chromium). Centring then comes from
		// the line box, so the overlay must carry the input's own leading.
		expect(rules).toContain('display: block');
		expect(rules).toContain('text-overflow: ellipsis');
		expect(rules).toContain('line-height: var(--text-body-leading)');
	});

	// ===========================================================================
	// Toggle, clear, disabled
	// ===========================================================================

	it('asks the browser for its picker from the toggle button', async () => {
		stubPointer(true);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });

		const input = getInput(screen.container);
		const showPicker = vi.fn();
		// Chromium implements a real picker; attach one so the call is observable
		// and no OS surface is raised mid-test. (jsdom implements none at all,
		// which is upstream's reason for the same line.)
		input.showPicker = showPicker;

		(screen.getByLabelText('Open calendar', exact).element() as HTMLElement).click();
		await tick();

		expect(showPicker).toHaveBeenCalledTimes(1);
		expect(input).toHaveFocus();
	});

	it('survives a browser that refuses showPicker', async () => {
		// Chrome throws NotAllowedError without transient user activation, and
		// iOS implements no showPicker for type=date at all. Focus is the
		// fallback, and on iOS it is the whole mechanism.
		stubPointer(true);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });

		const input = getInput(screen.container);
		input.showPicker = () => {
			throw new DOMException('not allowed', 'NotAllowedError');
		};

		// Restated: upstream's `expect(() => fireEvent.click(…)).not.toThrow()`
		// has no transcription, because a throw inside a listener surfaces as an
		// uncaught error rather than propagating out of `dispatchEvent`. The
		// window `error` listener catches exactly that.
		const errors: ErrorEvent[] = [];
		const record = (event: ErrorEvent): void => {
			errors.push(event);
		};
		window.addEventListener('error', record);
		try {
			(screen.getByLabelText('Open calendar', exact).element() as HTMLElement).click();
			await tick();
		} finally {
			window.removeEventListener('error', record);
		}

		expect(errors).toEqual([]);
		expect(input).toHaveFocus();
	});

	it('clears the value without taking focus back', async () => {
		// Focusing a date control is what raises the OS picker, so reclaiming
		// focus would pop the wheel the clear tap just dismissed.
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-03-21'), hasClear: true, onChange }
		});

		(screen.getByLabelText('Clear Date', exact).element() as HTMLElement).click();
		await tick();

		expect(onChange).toHaveBeenCalledWith(undefined);
		expect(getInput(screen.container)).not.toHaveFocus();
	});

	it('disables the control and its toggle when isDisabled', async () => {
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', isDisabled: true, onChange: noop }
		});

		expect(getInput(screen.container)).toBeDisabled();
		expect(screen.getByLabelText('Open calendar', exact).element()).toBeDisabled();
	});

	it('ignores a change while disabled', async () => {
		stubPointer(true);
		const onChange = vi.fn();
		const screen = await render(DateInput, {
			props: {
				label: 'Date',
				isDisabled: true,
				disabledMessage: 'Ask an editor',
				onChange
			}
		});

		// With a disabledMessage the field stays focusable via aria-disabled, so
		// the mutation guard is what has to hold.
		await changeValue(getInput(screen.container), '2026-03-21');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('keeps the field labelled, required-marked, and ref-forwarded', async () => {
		stubPointer(true);
		// Counterpart for upstream's `ref`: Svelte has no `ref` prop, so the seam
		// a consumer uses is an attachment spread through `...rest`, which this
		// surface puts on the wrapper `<div>` exactly as upstream's `DateInput`
		// does. It checks more than upstream's — it receives the element rather
		// than only proving a callback ran.
		const attached: HTMLElement[] = [];
		const attach = (node: HTMLElement): void => {
			attached.push(node);
		};
		const screen = await render(DateInput, {
			props: {
				label: 'Event date',
				isRequired: true,
				onChange: noop,
				[createAttachmentKey()]: attach
			} as never
		});

		const input = screen.getByLabelText(/Event date/);
		await expect.element(input).toHaveAttribute('type', 'date');
		await expect.element(input).toHaveAttribute('aria-required', 'true');
		expect(attached[0]).toBeInstanceOf(HTMLDivElement);
	});

	// ===========================================================================
	// Engines that draw editable segments
	//
	// Chrome's touch simulator, a Windows tablet and a ChromeOS convertible all
	// render `<input type="date">` as typable fields while reporting a coarse
	// pointer. See $lib/components/date-input/native-date-segments.ts.
	// ===========================================================================

	it('reveals the engine’s own segments while an editable control has focus', async () => {
		// Measured in Chrome: with the overlay up, typing paints nothing but a
		// selection highlight drifting across the placeholder.
		useEditableSegments();
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
		});

		await expect.element(screen.getByText('January 25, 2026', exact)).toBeInTheDocument();

		await focusInput(getInput(screen.container));

		expect(screen.getByText('January 25, 2026', exact).query()).toBeNull();
		// `-webkit-text-fill-color` is what wins inside a date control, and
		// unlike a bare `color:` cannot be confused with the wrapper's
		// `background-color: transparent`.
		expect(rulesFor(getInput(screen.container))).not.toContain(
			'-webkit-text-fill-color: transparent'
		);
	});

	it('paints the formatted date again once the segments lose focus', async () => {
		useEditableSegments();
		stubPointer(true);
		const screen = await render(DateInput, {
			props: { label: 'Date', value: iso('2026-01-25'), onChange: noop }
		});

		await focusInput(getInput(screen.container));
		await blurInput(getInput(screen.container));

		await expect.element(screen.getByText('January 25, 2026', exact)).toBeInTheDocument();
		expect(rulesFor(getInput(screen.container))).toContain('-webkit-text-fill-color: transparent');
	});

	it('stands aside for the engine’s placeholder while empty and focused', async () => {
		// `mm/dd/yyyy` says which order to type in, which ours cannot.
		useEditableSegments();
		stubPointer(true);
		const screen = await render(DateInput, { props: { label: 'Date', onChange: noop } });

		await expect.element(screen.getByText('Select a date', exact)).toBeInTheDocument();

		await focusInput(getInput(screen.container));

		expect(screen.getByText('Select a date', exact).query()).toBeNull();
	});

	it('resolves an unprobeable engine with the pointer', () => {
		// The probe stylesheet installed in `beforeEach` pins the throwaway
		// probe's width, so neither pseudo can be measured — the same answer
		// Firefox gives, which exposes neither, and the same one jsdom gives
		// upstream by laying nothing out.
		resetDateSegmentProbe();

		expect(hasEditableDateSegments(true)).toBe(false);
		expect(hasEditableDateSegments(false)).toBe(true);
	});
});
