import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DateInput from '$lib/components/date-input/date-input.svelte';
import DateRangeInput from '$lib/components/date-range-input/date-range-input.svelte';
import FileInput from '$lib/components/file-input/file-input.svelte';
import NumberInput from '$lib/components/number-input/number-input.svelte';
import TextArea from '$lib/components/text-area/text-area.svelte';
import TextInput from '$lib/components/text-input/text-input.svelte';
import TimeInput from '$lib/components/time-input/time-input.svelte';
import type { FieldStatusVariant } from '$lib/components/field-status/field-status.stylex.js';

/**
 * Ported from Astryx's `hooks/useInputStatusIcon.test.tsx` — **6 of its 7 `it(`
 * lines at the 0.5.0 pin, 27 collected runs against upstream's 28** (7 inputs ×
 * 3 variants = 21, plus 2 from the `['attached','tooltip']` loop, plus 4
 * standalone here where upstream has 5), in upstream's order and with its
 * assertions intact.
 *
 * Unported: `useInputStatusIcon — no dangling aria-describedby (WCAG 1.3.1)` →
 * `keeps the tooltip status button interactive inside a non-interactive trailing
 * slot`. It is portable and would pass — `use-input-status-icon.stylex.ts`
 * already sets the `pointerEvents: 'auto'` escape hatch it asserts. (The header
 * read "27 upstream runs from its 6 `it(` lines … nothing dropped".)
 *
 * Client (real Chromium) project, and it has to be: the tooltip variant's
 * `aria-describedby` target is a popover element that `useLayer` attaches with
 * an attachment, and the whole point of the suite is that the id resolves *in
 * the document*.
 *
 * Standing translations:
 *
 * - Upstream's `INPUTS` array holds `(variant) => ReactElement` factories. Each
 *   component takes different props here, so the entry is a `render` thunk
 *   instead — the arrangement `input-status-hover-guard` already uses for a
 *   heterogeneous component list. The seven components and their upstream prop
 *   values (`value={undefined}` / `null` / `''`) are carried across unchanged.
 * - `screen.getByRole('tooltip', {hidden: true})` becomes
 *   `getByRole('tooltip', {includeHidden: true})`, and `queryByRole(...)`
 *   becomes the same locator's `.query()`. A *closed* popover is `display:none`
 *   in a real browser, so it is out of the accessibility tree — the same move
 *   the `Avatar` and `DateInput` suites record.
 * - `expect(x).not.toBeInTheDocument()` on a query that returns `null` becomes
 *   `expect(locator.query()).toBeNull()`, since a locator query has no element
 *   to hand the matcher.
 *
 * On the shared helper being vacuous when nothing is described: it is, and
 * `expect.requireAssertions` is what covers it. Each of the 21 matrix cases has
 * the helper as its *only* source of assertions, so a component that stopped
 * emitting `aria-describedby` entirely would fail the case outright ("expected
 * at least one assertion") rather than pass a sweep over an empty list — which
 * is the protection a hand-written count guard would have bought, without the
 * guard. The 23rd case is the one render that legitimately describes nothing,
 * and it carries its own `toBeNull()` assertion; see the note at that case.
 */

const noop = (): void => {};

/**
 * Every id referenced by an aria-describedby must resolve to an element in the
 * document (WCAG 1.3.1) — a described-by pointing at a non-rendered node is a
 * dangling reference. The tooltip variant is the interesting case: it swaps the
 * message box for a tooltip layer, so the referenced ids change per variant.
 */
function expectNoDanglingDescribedBy(root: HTMLElement): void {
	for (const el of Array.from(root.querySelectorAll('[aria-describedby]'))) {
		const value = el.getAttribute('aria-describedby') ?? '';
		for (const id of value.split(/\s+/).filter(Boolean)) {
			expect(
				document.getElementById(id),
				`dangling aria-describedby id "${id}" on <${el.tagName.toLowerCase()}>`
			).not.toBeNull();
		}
	}
}

const VARIANTS: FieldStatusVariant[] = ['attached', 'detached', 'tooltip'];

const status = { type: 'error' as const, message: 'Message' };

const INPUTS: [string, (variant: FieldStatusVariant) => Promise<{ container: HTMLElement }>][] = [
	[
		'TextInput',
		(v) =>
			render(TextInput, {
				props: { label: 'Field', value: '', onChange: noop, status, statusVariant: v }
			})
	],
	[
		'TextArea',
		(v) =>
			render(TextArea, {
				props: { label: 'Field', value: '', onChange: noop, status, statusVariant: v }
			})
	],
	[
		'NumberInput',
		(v) =>
			render(NumberInput, {
				props: { label: 'Field', value: undefined, onChange: noop, status, statusVariant: v }
			})
	],
	[
		'DateInput',
		(v) =>
			render(DateInput, {
				props: { label: 'Field', value: undefined, onChange: noop, status, statusVariant: v }
			})
	],
	[
		'DateRangeInput',
		(v) =>
			render(DateRangeInput, {
				props: { label: 'Field', value: null, onChange: noop, status, statusVariant: v }
			})
	],
	[
		'TimeInput',
		(v) =>
			render(TimeInput, {
				props: { label: 'Field', value: undefined, onChange: noop, status, statusVariant: v }
			})
	],
	[
		'FileInput',
		(v) =>
			render(FileInput, {
				props: { label: 'Field', value: null, onChange: noop, status, statusVariant: v }
			})
	]
];

describe('useInputStatusIcon — no dangling aria-describedby (WCAG 1.3.1)', () => {
	for (const [name, make] of INPUTS) {
		for (const variant of VARIANTS) {
			it(`${name} / statusVariant="${variant}"`, async () => {
				const { container } = await make(variant);
				expectNoDanglingDescribedBy(container);
			});
		}
	}

	it('tooltip variant links the input to the rendered tooltip element', async () => {
		const screen = await render(TextInput, {
			props: {
				label: 'Field',
				value: '',
				onChange: noop,
				status,
				statusVariant: 'tooltip'
			}
		});
		const input = screen.getByRole('textbox').element();
		const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
		expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
	});

	it('does not render a tooltip (or reference one) when there is no message', async () => {
		// No message → the tooltip variant renders no tooltip layer and no
		// described-by should point at a non-existent status element.
		const screen = await render(TextInput, {
			props: {
				label: 'Field',
				value: '',
				onChange: noop,
				status: { type: 'error' },
				statusVariant: 'tooltip'
			}
		});
		expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		// Verified rather than assumed: with no message this render carries no
		// `aria-describedby` at all, so the sweep below iterates nothing. That is
		// the strongest form of "references no tooltip", and the `toBeNull()` above
		// is what makes the case non-vacuous under `expect.requireAssertions`.
		expect(screen.container.querySelectorAll('[aria-describedby]')).toHaveLength(0);
		expectNoDanglingDescribedBy(screen.container);
	});
});

describe('useInputStatusIcon — input-status-icon theme target', () => {
	// The stable theme target lands on the on-field status glyph itself, so a
	// theme can restyle (e.g. resize) just this icon via `defineTheme`. It is
	// rendered by the attached and tooltip variants; detached suppresses the
	// on-field icon in favour of the detached message box's leading glyph.
	const getStatusIcon = (root: HTMLElement): HTMLElement => {
		const icon = root.querySelector('.astryx-input-status-icon');
		if (icon == null) {
			throw new Error('status icon not found');
		}
		return icon as HTMLElement;
	};

	for (const variant of ['attached', 'tooltip'] as const) {
		it(`renders the target on the on-field icon (statusVariant="${variant}")`, async () => {
			const { container } = await render(TextInput, {
				props: {
					label: 'Field',
					value: '',
					onChange: noop,
					status: { type: 'warning', message: 'Message' },
					statusVariant: variant
				}
			});
			const icon = getStatusIcon(container);
			expect(icon).toHaveClass('astryx-input-status-icon');
			expect(icon).toHaveClass('astryx-icon');
			expect(icon).toHaveAttribute('data-size', 'md');
			expect(icon).toHaveAttribute('data-status', 'warning');
		});
	}

	it('reflects the status type per status', async () => {
		const { container } = await render(TextInput, {
			props: {
				label: 'Field',
				value: '',
				onChange: noop,
				status: { type: 'success', message: 'Message' },
				statusVariant: 'attached'
			}
		});
		expect(getStatusIcon(container)).toHaveAttribute('data-status', 'success');
	});

	it('does not render the on-field target for the detached variant', async () => {
		const { container } = await render(TextInput, {
			props: {
				label: 'Field',
				value: '',
				onChange: noop,
				status,
				statusVariant: 'detached'
			}
		});
		expect(container.querySelector('.astryx-input-status-icon')).toBeNull();
	});
});
