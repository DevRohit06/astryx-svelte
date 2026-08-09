import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import NumberInput from '$lib/components/number-input/number-input.svelte';

/**
 * Regression tests with **no upstream counterpart**, and none is possible: the
 * failure is an artefact of how Svelte writes a controlled `value` onto an
 * element that also carries a spread, and React cannot reproduce it.
 *
 * React writes a controlled input's DOM value only when the node disagrees —
 * `updateInput` does `if (node.value != value) node.value = …`. A number field
 * in `badInput` (the user has typed `1e`, `2-`, `3+`, …) reports
 * `value === ''` while still showing the raw text, so React compares `'' != ''`,
 * declines to write, and the user goes on to type `5` and gets `1e5`.
 *
 * Svelte carries the same guard in `set_value` — but only for an element with no
 * spread. `NumberInput`'s `<input>` carries `{...rest}` (test-pinned: rest props
 * must reach the input), which routes *every* attribute through
 * `set_attributes`, whose guard compares against the previously **rendered**
 * string and then assigns `element.value` unconditionally
 * (`svelte/src/internal/client/dom/elements/attributes.js`). Previously rendered
 * `'1'`, now `''` → it writes `el.value = ''`, and assigning to a bad-input
 * number field wipes the editor. Typing `1e5` ended as `5`, and `onChange` fired
 * `(1)` then `(5)` where upstream fires `(1)` then `(100000)`.
 *
 * The fix is an attachment that reproduces React's condition, plus a server-only
 * `value` spread so SSR still emits the attribute React emits. The guard
 * deliberately does **not** live in `handleInputChange`: `hasClear`'s
 * commit-null-on-blur depends on `pendingInput` genuinely becoming `''` for a
 * bad-input field, so short-circuiting there would break a different contract.
 *
 * **The ported suite structurally cannot catch this.** All 67 cases in
 * `number-input.svelte.test.ts` drive the input with values that parse, or with
 * a single empty string — none types a partial exponent, because upstream has no
 * reason to: React's guard makes it a non-event there.
 *
 * The generalisable rule, worth remembering beyond this component: **an element
 * that carries a spread loses Svelte's compare-against-the-DOM guard on
 * `value`.** `TextInput` has the identical shape and is immune only because text
 * fields have no bad-input state.
 *
 * Found by the idiom audit during the batch-5 (`NumberInput`) port.
 *
 * **Mutation-checked**: restoring `value={displayValue}` as an ordinary attribute
 * on the `<input>` (and dropping the attachment) fails both cases — the field
 * reads `'5'` rather than `'1e5'`, and `onChange` receives `5` rather than
 * `100000`.
 */

function inputOf(container: HTMLElement): HTMLInputElement {
	return container.querySelector('input[type="number"]') as HTMLInputElement;
}

/** Type a character the way a user does, so the field's own editor state updates. */
async function typeChar(el: HTMLInputElement, char: string): Promise<void> {
	el.focus();
	// `insertText` on the live selection is what a real keypress does; setting
	// `.value` directly would itself clear a bad-input field.
	document.execCommand('insertText', false, char);
	el.dispatchEvent(new Event('input', { bubbles: true }));
	await tick();
}

describe('NumberInput controlled value under a spread', () => {
	it('does not erase a partially-typed exponent', async () => {
		let value: number | null = null;
		const screen = await render(NumberInput, {
			label: 'Quantity',
			get value() {
				return value;
			},
			onChange: (v: number | null) => {
				value = v;
			}
		});

		const el = inputOf(screen.container);

		await typeChar(el, '1');
		expect(el.value).toBe('1');

		// `e` puts the field into badInput: `value` reports '' while the editor
		// still holds `1e`. Nothing may write to `el.value` here.
		await typeChar(el, 'e');
		expect(el.validity.badInput).toBe(true);

		await typeChar(el, '5');
		expect(el.validity.badInput).toBe(false);
		expect(el.value).toBe('1e5');
	});

	it('reports the exponent, not the trailing digit, to onChange', async () => {
		let value: number | null = null;
		const onChange = vi.fn((v: number | null) => {
			value = v;
		});
		const screen = await render(NumberInput, {
			label: 'Quantity',
			get value() {
				return value;
			},
			onChange
		});

		const el = inputOf(screen.container);
		await typeChar(el, '1');
		await typeChar(el, 'e');
		await typeChar(el, '5');

		expect(onChange.mock.calls.map((c) => c[0])).toEqual([1, 100000]);
	});
});
