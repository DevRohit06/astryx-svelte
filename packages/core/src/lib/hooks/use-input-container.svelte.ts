import {
	useClickableContainer,
	type ClickableContainerResult
} from './use-clickable-container.svelte.js';

/**
 * Focus delegation for input wrappers, ported from Astryx's
 * `hooks/useInputContainer.ts`.
 *
 * Clicking the padding, an adornment icon or a status indicator around an input
 * should focus the input; clicking a nested control (a clear button, a calendar
 * toggle) should not. The second half is entirely `useClickableContainer`'s, so
 * this hook is the first half plus a delegation — as upstream's is.
 *
 * The translation is the one next door: elements instead of `RefObject`s,
 * arriving through a getter so the reads stay live.
 */

/**
 * Input types that should receive `.focus()` when the container is clicked.
 * Other input types (e.g. checkbox, radio, file) use `.click()` instead.
 */
const FOCUS_INPUT_TYPES = new Set([
	'text',
	'password',
	'email',
	'number',
	'search',
	'tel',
	'url',
	'date',
	'datetime-local',
	'month',
	'time',
	'week'
]);

/**
 * `aria-haspopup` values that advertise a control opens a popup on activation.
 * https://www.w3.org/TR/wai-aria-1.2/#aria-haspopup
 */
const HASPOPUP_VALUES = new Set(['true', 'menu', 'listbox', 'tree', 'grid', 'dialog']);

/**
 * Whether an element is a popup trigger — a combobox or any control that
 * advertises `aria-haspopup`. Such controls activate their popup on *click*
 * (e.g. DateInput's `<input type="text" role="combobox" aria-haspopup="dialog">`
 * opens its calendar via `onclick`, with no focus opener). Forwarding a
 * container click to `.focus()` would focus the control but leave the popup
 * closed — so we `.click()` these instead. Plain text inputs (no popup) are
 * unaffected and keep `.focus()`.
 */
function isPopupTrigger(el: HTMLElement): boolean {
	if (el.getAttribute('role') === 'combobox') {
		return true;
	}
	const haspopup = el.getAttribute('aria-haspopup');
	return haspopup != null && HASPOPUP_VALUES.has(haspopup);
}

export interface UseInputContainerOptions {
	/** The outer container/wrapper element, e.g. from `bind:this`. */
	container: HTMLElement | null;
	/** The inner input or textarea element. */
	input: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null;
	/** Whether the input is disabled */
	disabled?: boolean;
}

/**
 * Makes an input container wrapper clickable, delegating focus to the inner
 * input or textarea when the user clicks a non-interactive area.
 *
 * Use inside input wrapper components (TextInput, NumberInput, TimeInput,
 * TextArea, etc.).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let container = $state<HTMLElement | null>(null);
 *   let input = $state<HTMLInputElement | null>(null);
 *   const inputContainer = useInputContainer(() => ({ container, input }));
 * </script>
 *
 * <div bind:this={container} {...inputContainer}>
 *   <Icon icon="search" />
 *   <input bind:this={input} />
 * </div>
 * ```
 */
export function useInputContainer(
	options: () => UseInputContainerOptions
): ClickableContainerResult {
	function onclick(): void {
		const input = options().input;
		if (input == null) {
			return;
		}
		// Popup triggers (combobox / aria-haspopup) activate their popup on
		// *click*, not focus — so check this BEFORE the type check, otherwise a
		// `type="text"` combobox (DateInput) would `.focus()` and never open.
		if (input instanceof HTMLElement && isPopupTrigger(input)) {
			input.click();
		} else if (input instanceof HTMLInputElement && FOCUS_INPUT_TYPES.has(input.type)) {
			input.focus();
		} else if (input instanceof HTMLTextAreaElement) {
			input.focus();
		} else if (input instanceof HTMLElement) {
			input.click();
		} else if ('focus' in input) {
			(input as unknown as { focus: () => void }).focus();
		}
	}

	return useClickableContainer(() => {
		const { container, input, disabled = false } = options();
		return { container, interactive: input, onclick, disabled };
	});
}
