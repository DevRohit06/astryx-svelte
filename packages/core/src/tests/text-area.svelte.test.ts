import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import TextArea from '$lib/components/text-area/text-area.svelte';
import IconSlotProbe from './fixtures/icon-slot-probe.svelte';
import TextAreaHarness from './fixtures/text-area-harness.svelte';
import TextAreaForm from './fixtures/text-area-form.svelte';
import BindHarness from './fixtures/text-area-bind.svelte';
import { TIMER_BUDGET } from './timer-budget.js';

/**
 * Astryx's `TextArea/TextArea.test.tsx`, ported case for case — **83** upstream
 * cases at the 0.5.2 pin, 83 here, plus one beyond upstream (`supports two-way
 * bind:value`) that pins the `$bindable` decision. **84 `it` in the file.**
 *
 * ## The count, re-derived at the 0.5.2 pin
 *
 * This header read "**82** … at the 0.5.0 pin" and stayed true only until the
 * pin moved: 0.5.1 added the one-case `TextArea theme target names` describe
 * (the deprecated `astryx-textarea` beside the current `astryx-text-area`),
 * ported at the bottom of this file. The same release gave the two painted
 * elements inside the wrapper their own targets — `astryx-text-area-control` on
 * the `<textarea>` and `astryx-text-area-counter` on the counter — and wrote no
 * case for either; neither side asserts them.
 *
 * Before that it read "**78** … at v0.4.1" and 0.4.x had added four `maxLength
 * prop` cases with #4759 — the grapheme-count
 * fix — and all four are ported here, in upstream's positions: `counts
 * user-perceived characters, not code units`, `measures the over-limit state in
 * characters`, `announces zone transitions using character counts`, and `does
 * not flag over-limit while characters fit, even when code units exceed`. They
 * pass against this port unchanged: `text-area.svelte` already counts through
 * `utils/characters.ts`'s `characterCount`, as upstream does.
 *
 * (An earlier header said "62 upstream cases, 62 here". Upstream had 64 at
 * v0.3.0: the top-level `TextArea statusVariant forwarding` block was unported
 * and unnamed. Both of its cases are ported here and both passed on the first
 * run.)
 *
 * ## The 0.4.1 batch (64 → 78)
 *
 * Fourteen cases came with `isReadOnly`, the form-participation fix and the
 * trailing-reserve fix: the `form participation` describe (3), the `isReadOnly`
 * describe (5), two more in `TextArea statusVariant forwarding`, and the two
 * theme-state describes at the bottom of the file (`data-disabled` /
 * `data-readonly` on the root target, 2 each). Two translations, noted at the
 * cases:
 *
 * - the five that read `FormData` go through `text-area-form.svelte`, because a
 *   Svelte test cannot pass a `<form>` as markup children of the component under
 *   test the way upstream's JSX does. Same fixture shape as
 *   `checkbox-input-form.svelte` and `number-input-form.svelte`.
 * - `does not render an on-field icon for statusVariant="detached", …` renders
 *   twice in one case, as upstream does, and `unmount()`s the first — Svelte's
 *   is async, so it is awaited. Its class-set comparison transcribes exactly.
 *
 * 0.3.0 reworked the layout (the textarea spans the container; icons, the
 * status/spinner slot and the counter became absolutely-positioned overlays)
 * and moved the counter's screen-reader announcement off a rendered
 * `aria-live` node onto `useAnnounce`'s persistent regions, zone-gated so it
 * speaks on crossing into "near"/"over" rather than on every keystroke. Five
 * cases came with it; the old `counter has aria-live region for screen reader
 * announcements` was replaced upstream by `does not show the over-limit
 * indicator icon within the limit`, so the count moved 57 → 62.
 *
 * Upstream's `beforeEach` (`:21-44`) shims `showPopover`/`hidePopover` and
 * `:popover-open` because jsdom implements none of them, and its `h = {hidden:
 * true}` exists because a jsdom popover is not "visible" to the accessibility
 * tree. The browser project needs neither: Chromium has the Popover API, so the
 * open state is read with `matches(':popover-open')` — the same finding the
 * `Tooltip` and `Timestamp` ports already recorded. `{hidden: true}` does
 * survive as `getByRole('tooltip', {includeHidden: true})`, since a *closed*
 * popover is `display:none` for real here.
 *
 * `startIcon` is a `Snippet` rather than `ReactNode | IconType` (this port has
 * no `renderIconSlot` — see port/todo.md), so the two cases that pass one go through
 * `icon-slot-probe.svelte`, which renders upstream's `TestIcon` markup verbatim
 * as a snippet. Both assert `querySelector('svg')`, which it satisfies exactly.
 *
 * `text-area-harness.svelte` is upstream's `function Wrapper()` with
 * `useState`: `value` is required and the component is controlled, so the one
 * case that needs the value to follow the keystrokes needs a component to hold
 * the state.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref correctly` (`:102`)** — Svelte has no `ref` prop. Where
 *   `field.svelte.test.ts` had to drop the same case, `TextArea` spreads its
 *   rest props onto the `<textarea>`, so the mechanism a consumer actually uses
 *   — an attachment through the rest props — is available, and it checks more
 *   than upstream's: it receives the element rather than only proving a
 *   callback ran.
 *
 * `calls onChange with value and event when typing` is restated for the
 * `$bindable` decision: upstream's last call is `('i', …)` because React
 * re-asserts a controlled `value=""` onto the DOM between keystrokes, resetting
 * the field; with `value` now `$bindable()` the plain edit path commits
 * `value = newValue` locally, so the field accumulates and the last call is
 * `('Hi', …)`. The optimistic `changeAction` path deliberately does *not* commit
 * `value`, so its revert-on-settle is unaffected — a fact the `WithChangeAction`
 * cases still exercise.
 *
 * Restated, each noted at the case:
 * - `does not call onChange when disabled` and `blocks value changes while
 *   focusable-disabled` — Playwright refuses to click or type into an element
 *   that is `disabled` or `aria-disabled`, which would assert its actionability
 *   heuristic instead of the component.
 * - `keeps the textarea focusable via aria-disabled when a reason is provided`
 *   — vitest-browser's `toBeDisabled` is Playwright's ARIA computation, not
 *   jest-dom's native-attribute one, and they disagree by design here.
 * - the two `click-to-focus` cases and the tooltip hover case — upstream's
 *   `fireEvent.click`/`mouseEnter` target the wrapper itself, which a real
 *   pointer at the wrapper's centre cannot do (the textarea is there), so the
 *   events are dispatched at the wrapper as upstream dispatches them.
 * - the DOM-wide `document.querySelector('svg')` assertions are scoped to the
 *   render container, which is what RTL's freshly-cleaned `document` amounts
 *   to. (Same restatement as `field.svelte.test.ts`.)
 */

function textareaIn(container: HTMLElement): HTMLTextAreaElement {
	const el = container.querySelector('textarea');
	if (!(el instanceof HTMLTextAreaElement)) {
		throw new Error('expected a textarea');
	}
	return el;
}

/** Upstream's `textarea.parentElement!` — the bordered input wrapper. */
function wrapperOf(textarea: HTMLTextAreaElement): HTMLElement {
	const el = textarea.parentElement;
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a wrapper element');
	}
	return el;
}

const noop = (): void => {};

/**
 * The counter announcements go through `useAnnounce`'s persistent regions, as
 * upstream's do since 0.3.0 — not through a rendered `aria-live` node. Same
 * selectors upstream asserts on.
 */
const politeRegion = (): Element | null =>
	document.querySelector('[data-astryx-live-region="polite"]');
const assertiveRegion = (): Element | null =>
	document.querySelector('[data-astryx-live-region="assertive"]');

// The live regions are module-level singletons; reset them so announcements
// from one case don't leak into the next.
beforeEach(() => {
	__resetLiveRegionsForTest();
});

afterEach(() => {
	__resetLiveRegionsForTest();
});

describe('TextArea', () => {
	it('renders with label', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop }
		});
		await expect.element(screen.getByLabelText('Description')).toBeInTheDocument();
	});

	it('renders with placeholder', async () => {
		const screen = await render(TextArea, {
			props: {
				label: 'Description',
				value: '',
				onChange: noop,
				placeholder: 'Enter description'
			}
		});
		await expect.element(screen.getByPlaceholder('Enter description')).toBeInTheDocument();
	});

	it('calls onChange with value and event when typing', async () => {
		const handleChange = vi.fn();
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: handleChange }
		});

		const textarea = screen.getByRole('textbox');
		await userEvent.type(textarea, 'Hi');
		expect(handleChange).toHaveBeenCalledTimes(2);
		// Restated: upstream's last call is `('i', …)`, because React re-asserts
		// the controlled `value=""` onto the DOM between keystrokes so the second
		// lands in an emptied field. With `value` now `$bindable()`, the plain
		// edit path commits `value = newValue` locally, so the field accumulates
		// and the second call carries `'Hi'`. That is the deliberate consequence
		// of the `$bindable` decision — a parent that ignores the update keeps the
		// typed text rather than having it reset — and the substance of the case,
		// that `onChange` fires per keystroke with the field's value plus the
		// event, is asserted unchanged. `changeAction` (the optimistic path) does
		// *not* commit `value`, so its revert-on-settle behaviour is untouched.
		expect(handleChange).toHaveBeenLastCalledWith('Hi', expect.any(Object));
	});

	it('supports two-way bind:value', async () => {
		// Beyond upstream, pinning the `$bindable` decision: a bound parent value
		// tracks typing, and a new value flows back down. React has no `bind:` and
		// no counterpart case; this exists so a regression to a non-bindable
		// `value` — which would silently stop `bind:value` from writing back — goes
		// red rather than passing unnoticed.
		const screen = await render(BindHarness, { props: { initial: 'ab' } });
		const textarea = screen.getByRole('textbox');
		await expect.element(textarea).toHaveValue('ab');

		await userEvent.type(textarea, 'c');
		await expect.element(screen.getByTestId('mirror')).toHaveTextContent('abc');
	});

	it('works with state setter function directly', async () => {
		// Ported rather than dropped as a duplicate of the case above: upstream's
		// point is that `onChange`'s `(value, event)` shape is usable as a plain
		// setter. React's function-updater hazard has no Svelte counterpart, but
		// the assertion transcribes.
		const setValue = vi.fn();
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: setValue }
		});

		const textarea = screen.getByRole('textbox');
		await userEvent.type(textarea, 'A');
		expect(setValue).toHaveBeenCalledWith('A', expect.any(Object));
	});

	it('displays controlled value', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: 'Controlled value', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveValue('Controlled value');
	});

	// Counterpart to upstream's `forwards ref correctly` (`:102`); see the file
	// header. Upstream asserts `expect.any(HTMLTextAreaElement)`; this receives
	// the element itself, so the assertion is the stronger `toBe`.
	it('hands the textarea to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(TextArea, {
			props: {
				label: 'Description',
				value: '',
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(textareaIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Comments', isLabelHidden: true, value: '', onChange: noop }
		});
		const label = screen.getByText('Comments', { exact: true });
		await expect.element(label).toBeInTheDocument();
		// Label should still be accessible
		await expect.element(screen.getByLabelText('Comments')).toBeInTheDocument();
	});

	it('shows label visually by default', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Notes', value: '', onChange: noop }
		});
		const label = screen.getByText('Notes', { exact: true });
		await expect.element(label).toBeVisible();
	});

	it('sets aria-required when isRequired is true', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Feedback', isRequired: true, value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
	});

	it('does not set aria-required when isRequired is false', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Feedback', value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
	});

	it('renders with custom rows', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop, rows: 5 }
		});
		await expect.element(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
	});

	it('renders with default rows of 3', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
	});

	it('is disabled when isDisabled is true', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', isDisabled: true, value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toBeDisabled();
	});

	it('is not disabled by default', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).not.toBeDisabled();
	});

	it('shows aria-busy when isLoading is true', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', isLoading: true, value: '', onChange: noop }
		});
		await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-busy', 'true');
		await expect.element(screen.getByRole('textbox')).not.toBeDisabled();
	});

	it('does not call onChange when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(TextArea, {
			props: { label: 'Description', isDisabled: true, value: '', onChange: handleChange }
		});

		const textarea = textareaIn(screen.container);
		// Restated: upstream types with `user.type`. Playwright's actionability
		// check refuses to type into a natively disabled element at all, which
		// would assert its heuristic rather than the component, so the keystrokes
		// are aimed at the control the only way a browser allows — a focus a
		// disabled element declines, followed by real key events. Nothing reaches
		// it, so nothing calls back and nothing changes.
		textarea.focus();
		expect(document.activeElement).not.toBe(textarea);
		await userEvent.keyboard('Hi');
		expect(handleChange).not.toHaveBeenCalled();
		expect(textarea).toHaveValue('');
	});

	it('renders with startIcon', async () => {
		const screen = await render(IconSlotProbe, {
			props: {
				component: TextArea,
				slot: 'startIcon',
				rest: { label: 'Description', value: '', onChange: noop }
			}
		});
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();
		// Icon should be rendered (as an SVG element)
		const svg = screen.container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('renders without icon wrapper when startIcon is not provided', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop }
		});
		// No SVG should be present
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	describe('status prop', () => {
		it('renders with error status icon', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'error' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders with warning status icon', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'warning' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders with success status icon', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'success' } }
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});

		it('renders status message when provided', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Description',
					value: '',
					onChange: noop,
					status: { type: 'error', message: 'Description is required' }
				}
			});
			await expect
				.element(screen.getByText('Description is required', { exact: true }))
				.toBeInTheDocument();
		});

		it('does not render status message when not provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'error' } }
			});
			expect(screen.getByText(/required/i).query()).toBeNull();
		});

		it('sets aria-invalid when status type is error', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'error' } }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
		});

		it('does not set aria-invalid for warning status', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'warning' } }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
		});

		it('does not set aria-invalid for success status', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, status: { type: 'success' } }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
		});

		it('includes status message in aria-describedby', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Description',
					value: '',
					onChange: noop,
					status: { type: 'error', message: 'Too short' }
				}
			});
			const textarea = textareaIn(screen.container);
			const describedBy = textarea.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();
			// The status message should be reachable via the described-by ID
			const messageElement = screen.getByText('Too short', { exact: true }).element();
			expect(messageElement).toHaveAttribute('id');
			expect(describedBy).toContain(messageElement.id);
		});

		it('shows both the loading spinner and the status icon while busy', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Description',
					value: '',
					onChange: noop,
					isLoading: true,
					status: { type: 'error' }
				}
			});
			// Matches the other inputs: spinner (role="status") and the status icon
			// render side by side in the end slot, not mutually exclusively.
			await expect.element(screen.getByRole('status')).toBeInTheDocument();
			// Status icon svg is also present alongside the spinner.
			expect(screen.container.querySelectorAll('svg').length).toBeGreaterThan(0);
		});
	});

	it('renders tooltip info icon when labelTooltip is provided', async () => {
		const screen = await render(TextArea, {
			props: {
				label: 'Description',
				value: '',
				onChange: noop,
				labelTooltip: 'Enter a detailed description'
			}
		});
		// Info icon should be present
		expect(screen.container.querySelector('svg')).toBeInTheDocument();
	});

	it('does not render tooltip icon when labelTooltip is not provided', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop }
		});
		expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
	});

	it('renders with size="lg"', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop, size: 'lg' }
		});
		await expect.element(screen.getByLabelText('Description')).toBeInTheDocument();
	});

	describe('hasSpellCheck prop', () => {
		it('enables spellcheck by default', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'true');
		});

		it('enables spellcheck when hasSpellCheck is true', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, hasSpellCheck: true }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'true');
		});

		it('disables spellcheck when hasSpellCheck is false', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, hasSpellCheck: false }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false');
		});
	});

	describe('onPaste prop', () => {
		/** Upstream's `fireEvent.paste(textarea, {clipboardData: …})`. */
		function paste(textarea: HTMLTextAreaElement): boolean {
			const clipboardData = new DataTransfer();
			clipboardData.setData('text/plain', 'pasted text');
			return textarea.dispatchEvent(
				new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData })
			);
		}

		it('calls onPaste when content is pasted', async () => {
			const handlePaste = vi.fn();
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, onpaste: handlePaste }
			});

			paste(textareaIn(screen.container));
			expect(handlePaste).toHaveBeenCalledTimes(1);
		});

		it('does not throw when onPaste is not provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop }
			});

			const textarea = textareaIn(screen.container);
			expect(() => {
				paste(textarea);
			}).not.toThrow();
		});
	});

	describe('maxLength prop', () => {
		it('displays character counter when maxLength is provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: 'Hello', onChange: noop, maxLength: 20 }
			});
			await expect.element(screen.getByText('5/20', { exact: true })).toBeInTheDocument();
		});

		it('does not display counter when maxLength is not provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: 'Hello', onChange: noop }
			});
			expect(screen.getByText(/\/\d+/).query()).toBeNull();
		});

		it('updates counter as value changes', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, maxLength: 100 }
			});
			await expect.element(screen.getByText('0/100', { exact: true })).toBeInTheDocument();

			// Upstream's `rerender(<TextArea … value="Hello World" />)`.
			await screen.rerender({
				label: 'Description',
				value: 'Hello World',
				onChange: noop,
				maxLength: 100
			});
			await expect.element(screen.getByText('11/100', { exact: true })).toBeInTheDocument();
		});

		it('does not set native maxLength attribute (counter is visual-only)', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, maxLength: 50 }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('maxlength');
			await expect.element(screen.getByText('0/50', { exact: true })).toBeInTheDocument();
		});

		it('does not set maxLength attribute when not provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('maxlength');
		});

		it('counts user-perceived characters, not code units (#4759)', async () => {
			// Two surrogate-pair emoji: 4 code units, but 2 user-perceived characters.
			const screen = await render(TextArea, {
				props: {
					label: 'Description',
					value: '\u{1F600}\u{1F600}',
					onChange: noop,
					maxLength: 5
				}
			});
			await expect.element(screen.getByText('2/5', { exact: true })).toBeInTheDocument();
		});

		it('measures the over-limit state in characters (#4759)', async () => {
			// Three ZWJ family emoji: 33 code units, 3 user-perceived characters.
			const family = '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}';
			const screen = await render(TextArea, {
				props: {
					label: 'Description',
					value: family.repeat(3),
					onChange: noop,
					maxLength: 2
				}
			});
			await expect.element(screen.getByText('3/2', { exact: true })).toBeInTheDocument();
		});

		it('counter updates as user types (controlled)', async () => {
			const screen = await render(TextAreaHarness, {
				props: { label: 'Description', initialValue: '', maxLength: 50 }
			});
			const textarea = screen.getByRole('textbox');
			await userEvent.type(textarea, 'Hello');
			await expect.element(screen.getByText('5/50', { exact: true })).toBeInTheDocument();
		});

		it('announces remaining characters politely as the value nears the limit', async () => {
			const screen = await render(TextAreaHarness, {
				props: { label: 'Description', initialValue: 'x'.repeat(44), maxLength: 50 }
			});
			// Type one more char to cross into the "near the limit" zone (45/50).
			await userEvent.type(screen.getByRole('textbox'), 'x');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('5 characters remaining');
			});
		});

		it('announces over-limit assertively once the value exceeds the max', async () => {
			const screen = await render(TextAreaHarness, {
				props: { label: 'Description', initialValue: 'x'.repeat(50), maxLength: 50 }
			});
			await userEvent.type(screen.getByRole('textbox'), 'x');
			await vi.waitFor(() => {
				expect(assertiveRegion()).toHaveTextContent('1 character over the limit');
			});
		});

		it('announces zone transitions using character counts (#4759)', async () => {
			const screen = await render(TextAreaHarness, {
				props: { label: 'Description', initialValue: 'x'.repeat(7), maxLength: 10 }
			});
			// Appending two emoji makes 9 characters (11 code units): near the limit
			// with 1 remaining. Code-unit counting would call this over the limit
			// and announce assertively instead.
			//
			// Upstream's `fireEvent.change(textarea, {target: {value}})`; this port
			// binds the native `input` event, which is what React's `onChange` on a
			// textarea *is*, so the assignment plus a bubbling `input` is the same
			// event upstream fires (the `changeValue` pattern `time-input` set).
			const textarea = textareaIn(screen.container);
			textarea.value = 'x'.repeat(7) + '\u{1F600}\u{1F600}';
			textarea.dispatchEvent(new Event('input', { bubbles: true }));

			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('1 character remaining');
			});
			expect(assertiveRegion()).not.toHaveTextContent('over the limit');
		});

		it('does not flag over-limit while characters fit, even when code units exceed (#4759)', async () => {
			// Three emoji: 6 code units but 3 user-perceived characters — within a
			// maxLength of 4, so no error state anywhere.
			const screen = await render(TextArea, {
				props: {
					label: 'Description',
					value: '\u{1F600}'.repeat(3),
					onChange: noop,
					maxLength: 4
				}
			});
			// Upstream reads `counter.querySelector('svg')` off the text node's own
			// element; this port's counter text and its icon are siblings inside the
			// counter wrapper, which is what the two indicator-icon cases below
			// already query.
			const counter = screen.getByText('3/4', { exact: true }).element().closest('div');
			expect(counter?.querySelector('svg')).toBeNull();
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
		});

		it('shows a non-color over-limit indicator icon when exceeded', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: 'x'.repeat(55), onChange: noop, maxLength: 50 }
			});
			// The counter renders a warning icon (a shape cue) alongside the red
			// count, so the over-limit state is not conveyed by color alone.
			const counter = screen.getByText('55/50', { exact: true }).element().closest('div');
			expect(counter?.querySelector('svg')).toBeInTheDocument();
		});

		it('does not show the over-limit indicator icon within the limit', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: 'x'.repeat(45), onChange: noop, maxLength: 50 }
			});
			const counter = screen.getByText('45/50', { exact: true }).element().closest('div');
			expect(counter?.querySelector('svg')).not.toBeInTheDocument();
		});

		it('counter is linked to textarea via aria-describedby', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: 'Hello', onChange: noop, maxLength: 50 }
			});
			const textarea = textareaIn(screen.container);
			const describedBy = textarea.getAttribute('aria-describedby');
			const counter = screen.getByText('5/50', { exact: true }).element();
			expect(counter).toHaveAttribute('id');
			expect(describedBy).toContain(counter.id);
		});

		it('renders the counter inside the input container (same wrapper as textarea)', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: 'Hello', onChange: noop, maxLength: 50 }
			});
			const textarea = textareaIn(screen.container);
			const counter = screen.getByText('5/50', { exact: true }).element();
			// The counter now lives inside the bordered input container as a sibling
			// overlay of the textarea, not below it as an out-of-container element.
			expect(textarea.parentElement).toBe(counter.parentElement);
		});
	});

	describe('hasAutoFocus prop', () => {
		it('sets autofocus attribute when hasAutoFocus is true', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, hasAutoFocus: true }
			});
			await expect.element(screen.getByRole('textbox')).toHaveFocus();
		});

		it('does not set autofocus when hasAutoFocus is false', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop }
			});
			expect(textareaIn(screen.container)).not.toHaveFocus();
		});
	});

	describe('htmlName prop', () => {
		it('sets name attribute when htmlName is provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop, htmlName: 'description' }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
		});

		it('does not set name attribute when htmlName is not provided', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Description', value: '', onChange: noop }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('name');
		});
	});

	// Upstream renders `<form><TextArea …/></form>` as JSX children of `render`.
	// A Svelte test cannot pass markup children to the component under test, so
	// the form lives in `text-area-form.svelte` and the cases reach it through
	// `container.querySelector('form')` — the assertions are upstream's verbatim.
	describe('form participation', () => {
		it('submits the value under htmlName', async () => {
			const screen = await render(TextAreaForm, {
				props: { textArea: { label: 'Notes', htmlName: 'notes', value: 'hello', onChange: noop } }
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('notes')).toBe('hello');
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(TextAreaForm, {
				props: {
					textArea: {
						label: 'Notes',
						htmlName: 'notes',
						value: 'hello',
						onChange: noop,
						isDisabled: true
					}
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});

		// Regression: a disabledMessage swaps the native `disabled` attribute for
		// aria-disabled + readOnly so the reason stays focus-discoverable, but
		// read-only fields still submit — the name has to be withheld too.
		it('is excluded from form data when disabled, even with a disabledMessage', async () => {
			const screen = await render(TextAreaForm, {
				props: {
					textArea: {
						label: 'Notes',
						htmlName: 'notes',
						value: 'hello',
						onChange: noop,
						isDisabled: true,
						disabledMessage: 'Notes are locked while the review is open'
					}
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});

	describe('isReadOnly', () => {
		it('marks the textarea read-only', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Notes', value: 'hello', onChange: noop, isReadOnly: true }
			});
			await expect.element(screen.getByRole('textbox')).toHaveAttribute('readonly');
		});

		it('still submits its value with the form', async () => {
			const screen = await render(TextAreaForm, {
				props: {
					textArea: {
						label: 'Notes',
						htmlName: 'notes',
						value: 'hello',
						onChange: noop,
						isReadOnly: true
					}
				}
			});
			expect(new FormData(screen.container.querySelector('form')!).get('notes')).toBe('hello');
		});

		it('does not call onChange when the user types', async () => {
			const handleChange = vi.fn();
			const screen = await render(TextArea, {
				props: { label: 'Notes', value: 'hello', onChange: handleChange, isReadOnly: true }
			});
			// Ported as upstream writes it — unlike the `isDisabled` cases, nothing
			// here trips Playwright's actionability check: a read-only textarea is
			// neither `disabled` nor `aria-disabled`, so `type` focuses it and sends
			// real keys. Chromium's editor refuses the insert, and the `oninput`
			// guard refuses the callback, so neither layer can mask the other.
			await userEvent.type(screen.getByRole('textbox'), 'xyz');
			expect(handleChange).not.toHaveBeenCalled();
		});

		it('stays focusable and is not disabled', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Notes', value: 'hello', onChange: noop, isReadOnly: true }
			});
			const textarea = screen.getByRole('textbox');
			await expect.element(textarea).not.toBeDisabled();
			await userEvent.tab();
			await expect.element(textarea).toHaveFocus();
		});

		it('lets isDisabled win when both are set', async () => {
			const screen = await render(TextAreaForm, {
				props: {
					textArea: {
						label: 'Notes',
						htmlName: 'notes',
						value: 'hello',
						onChange: noop,
						isReadOnly: true,
						isDisabled: true
					}
				}
			});
			await expect.element(screen.getByRole('textbox')).toBeDisabled();
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});

	describe('click-to-focus', () => {
		it('focuses textarea when clicking the start icon', async () => {
			const screen = await render(IconSlotProbe, {
				props: {
					component: TextArea,
					slot: 'startIcon',
					rest: { label: 'Notes', value: '', onChange: noop }
				}
			});

			const textarea = textareaIn(screen.container);
			const wrapper = wrapperOf(textarea);
			const iconElement = wrapper.querySelector('svg')!;

			// Restated only in how the click is delivered: upstream's
			// `fireEvent.click(iconElement)` sets the icon as the event target, which
			// is the whole point — the container handler must delegate focus from a
			// non-interactive descendant. A real pointer click would have to hit the
			// icon's pixels, and the icon is 1em of an unthemed default glyph.
			iconElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(textarea).toHaveFocus();
		});

		it('focuses textarea when clicking the wrapper padding', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Notes', value: '', onChange: noop }
			});

			const textarea = textareaIn(screen.container);
			const wrapper = wrapperOf(textarea);

			// As above: a real pointer at the wrapper's centre lands on the textarea,
			// which focuses natively and would pass the case without the delegation
			// ever running. Dispatching at the wrapper is upstream's event exactly.
			wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(textarea).toHaveFocus();
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Notes',
					value: '',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const textarea = textareaIn(screen.container);
			const container = wrapperOf(textarea);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip).toHaveTextContent('You need the Editor role');

			// Upstream's `fireEvent.mouseEnter`/`mouseLeave`, dispatched the same way:
			// a real pointer moved to the wrapper's centre would be over the textarea,
			// and `unhover` parks it at the viewport origin — both would assert where
			// Playwright puts the mouse rather than what the wrapper listens for.
			container.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's `popover-open` attribute,
				// which its jsdom shim invents; Chromium has the real thing.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});

			// Gated on the hover-bridge hide timer, so it gets the timer budget —
			// see `timer-budget.ts`.
			container.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			}, TIMER_BUDGET);
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Notes',
					value: '',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('textbox')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Notes',
					value: '',
					onChange: noop,
					disabledMessage: 'You need the Editor role'
				}
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Notes', value: '', onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the textarea focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Notes',
					value: '',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const textarea = screen.getByRole('textbox');
			// Restated: upstream's `not.toBeDisabled()` is jest-dom's, which reads the
			// *native* disabled state only. vitest-browser's matcher of that name is
			// Playwright's ARIA computation, which counts `aria-disabled="true"` as
			// disabled — so it answers "true" on the very attribute the next line
			// requires. Upstream's question is asked directly instead: no native
			// `disabled`, which is what keeps the control in the tab order.
			await expect.element(textarea).not.toHaveAttribute('disabled');
			expect(textareaIn(screen.container).disabled).toBe(false);
			await expect.element(textarea).toHaveAttribute('aria-disabled', 'true');
			await expect.element(textarea).toHaveAttribute('readonly');
		});

		it('links the reason tooltip from the textarea via aria-describedby', async () => {
			const screen = await render(TextArea, {
				props: {
					label: 'Notes',
					value: '',
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const textarea = textareaIn(screen.container);
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(textarea.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks value changes while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(TextArea, {
				props: {
					label: 'Notes',
					value: '',
					onChange,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const textarea = textareaIn(screen.container);
			// Restated: upstream clicks then types. Playwright's actionability check
			// reads `aria-disabled="true"` as "not enabled" and refuses to click at
			// all, which would assert its heuristic instead of the guard. The control
			// *is* focusable — that is the case's premise — so it is focused directly
			// and typed into with real keys.
			textarea.focus();
			expect(document.activeElement).toBe(textarea);
			await userEvent.keyboard('hello');
			expect(onChange).not.toHaveBeenCalled();
			expect(textarea).toHaveValue('');
		});

		it('remains natively disabled when disabled without a reason', async () => {
			const screen = await render(TextArea, {
				props: { label: 'Notes', value: '', onChange: noop, isDisabled: true }
			});
			const textarea = screen.getByRole('textbox');
			await expect.element(textarea).toBeDisabled();
			await expect.element(textarea).not.toHaveAttribute('aria-disabled');
		});
	});
});

describe('TextArea statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(TextArea, {
			props: {
				label: 'Bio',
				value: '',
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
		const screen = await render(TextArea, {
			props: {
				label: 'Bio',
				value: '',
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

	it('reserves trailing space for the on-field icon with the default (attached) status', async () => {
		// Attached renders the on-field status icon, so the textarea must inset its
		// trailing edge to clear it.
		const screen = await render(TextArea, {
			props: {
				label: 'Bio',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Required' }
			}
		});
		// The on-field status glyph renders (in the end slot). Scoped to the render
		// container rather than upstream's `document`, for the reason the header
		// records: RTL's `document` is a freshly-cleaned one, which is what the
		// container amounts to here.
		expect(screen.container.querySelector('.astryx-input-status-icon')).not.toBeNull();
	});

	it('does not render an on-field icon for statusVariant="detached", and does not reserve trailing space for it', async () => {
		// The detached variant suppresses the on-field icon (its glyph lives in the
		// message box below), so the textarea must NOT inset its trailing edge —
		// otherwise the text is pushed in for an icon that never appears.
		const attached = await render(TextArea, {
			props: {
				label: 'Bio',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Required' },
				statusVariant: 'attached'
			}
		});
		const attachedTextarea = textareaIn(attached.container);
		const attachedClasses = new Set(attachedTextarea.className.split(/\s+/));
		// `unmount()` is async in vitest-browser-svelte v3 where upstream's is
		// synchronous; the only change to upstream's case.
		await attached.unmount();

		const detached = await render(TextArea, {
			props: {
				label: 'Bio',
				value: '',
				onChange: noop,
				status: { type: 'error', message: 'Required' },
				statusVariant: 'detached'
			}
		});
		// No on-field icon is rendered for detached. (The detached message box
		// renders its own leading glyph, but that carries
		// `astryx-field-status-icon` — a different target — so this selector sees
		// only the on-field one.)
		expect(detached.container.querySelector('.astryx-input-status-icon')).toBeNull();

		const detachedTextarea = textareaIn(detached.container);
		const detachedClasses = new Set(detachedTextarea.className.split(/\s+/));

		// The attached textarea carries exactly one extra StyleX class over the
		// detached one: the trailing-reserve style. Detached must not carry it, so
		// its class set is a strict subset of attached's.
		for (const cls of detachedClasses) {
			expect(attachedClasses.has(cls)).toBe(true);
		}
		expect(detachedClasses.size).toBeLessThan(attachedClasses.size);
	});
});

describe('TextArea disabled theme state', () => {
	// Reflecting isDisabled on the root theming target lets a theme gate its own
	// hover/border treatment on disabled (data-disabled + a .disabled variant),
	// mirroring how status is reflected — without structural :has() CSS.
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop, isDisabled: true }
		});
		const root = screen.container.querySelector('.astryx-textarea');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Description', value: '', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-textarea');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});

describe('TextArea readonly theme state', () => {
	it('reflects readonly on the root target so themes can gate paint on it', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Notes', value: '', onChange: noop, isReadOnly: true }
		});
		const root = screen.container.querySelector('.astryx-textarea');
		expect(root).toHaveAttribute('data-readonly', 'readonly');
	});

	it('omits data-readonly when editable', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Notes', value: '', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-textarea');
		expect(root).not.toHaveAttribute('data-readonly');
	});
});

describe('TextArea theme target names', () => {
	it('renders the deprecated class beside the current one', async () => {
		const screen = await render(TextArea, {
			props: { label: 'Notes', value: '', onChange: noop }
		});
		const root = screen.container.querySelector('.astryx-text-area');
		expect(root).not.toBeNull();
		expect(root).toHaveClass('astryx-textarea');
	});
});
