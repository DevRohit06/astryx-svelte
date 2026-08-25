import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/form-optionality-harness.svelte';

/**
 * Ported from Astryx's `FormLayout/FormLayout.test.tsx`, **13 of its 30 cases at
 * the 0.5.0 pin** — the whole `defaultOptionality` delta v0.4.5 added.
 *
 * **Upstream's suite is split across two files here, and this is the smaller
 * half.** The other 14 of upstream's 30 are in `form-and-metadata.svelte.test.ts`
 * (upstream's layout, direction and grid cases; its three `direction` cases are
 * merged into one loop there). Between the two files, 27 of upstream's 30 are
 * ported. The only true gap is upstream's 3 `matches snapshot for … direction`
 * cases, dropped with their reason stated in that file. Splitting one upstream
 * suite across two of ours means no count in either file can be stated against
 * upstream's file alone, which is why the split is named in both.
 *
 * (This header read "the other 17 are a pre-existing gap" and "this port had no
 * `FormLayout` suite at all before 0.4.5". Both were false: the sibling file
 * ports 14 of those 17, and the remaining 3 are dropped there with a reason.)
 *
 * Every case goes through `form-optionality-harness.svelte`: upstream renders
 * each arrangement as inline JSX, and children can only be authored in a Svelte
 * template. The context reader is its own component (`optionality-reader.svelte`)
 * because context is read during a component's *init* — `getContext` from inside
 * a snippet runs at render time and throws.
 *
 * Runs in the **client** project: the indicator cases assert rendered label text
 * through `Field`, and the `aria-required` cases read attributes off real
 * controls.
 */

describe('FormLayout', () => {
	describe('defaultOptionality context propagation', () => {
		it('leaves defaultOptionality unset by default', async () => {
			const screen = await render(Harness, { props: { mode: 'reader' } });
			await expect.element(screen.getByTestId('optionality')).toHaveTextContent('unset');
		});

		it('provides defaultOptionality="optional" to children', async () => {
			const screen = await render(Harness, {
				props: { mode: 'reader', optionality: 'optional' }
			});
			await expect.element(screen.getByTestId('optionality')).toHaveTextContent('optional');
		});

		it('provides defaultOptionality="required" to children', async () => {
			const screen = await render(Harness, {
				props: { mode: 'reader', optionality: 'required' }
			});
			await expect.element(screen.getByTestId('optionality')).toHaveTextContent('required');
		});

		it('an inner layout shadows the outer defaultOptionality', async () => {
			const screen = await render(Harness, {
				props: { mode: 'nested-reader', optionality: 'optional', innerOptionality: 'required' }
			});
			await expect.element(screen.getByTestId('optionality')).toHaveTextContent('required');
		});
	});

	// The rule: only the *exception* is marked. A field that restates the form
	// default shows nothing; a deviation shows its indicator.
	describe('defaultOptionality indicator behavior (through Field)', () => {
		it('optional default: only isRequired fields show an indicator', async () => {
			const screen = await render(Harness, {
				props: { mode: 'fields', optionality: 'optional' }
			});
			// Plain + isOptional match the default → nothing shown.
			expect(screen.container.textContent).not.toMatch(/Optional/);
			// isRequired deviates → the required indicator shows.
			expect(screen.container.textContent).toMatch(/Required/);
		});

		it('required default: only isOptional fields show an indicator', async () => {
			const screen = await render(Harness, {
				props: { mode: 'fields', optionality: 'required' }
			});
			// Plain + isRequired match the default → nothing shown.
			expect(screen.container.textContent).not.toMatch(/Required/);
			// isOptional deviates → the optional indicator shows.
			expect(screen.container.textContent).toMatch(/Optional/);
		});

		it('unset default preserves per-field indicators (backwards compatible)', async () => {
			const screen = await render(Harness, { props: { mode: 'fields' } });
			expect(screen.container.textContent).toMatch(/Required/);
			expect(screen.container.textContent).toMatch(/Optional/);
		});
	});

	// The indicator is suppressed for the unmarked majority, so the matching
	// `aria-required` must still be exposed — otherwise a sighted user reads a
	// field as required (form default, no indicator) while a screen reader hears
	// "not required". Native `required` stays bound to the explicit prop so a
	// layout default never switches on browser validation.
	describe('defaultOptionality aria-required resolution', () => {
		it('required default: an unmarked input still exposes aria-required', async () => {
			const screen = await render(Harness, {
				props: { mode: 'text-input', optionality: 'required' }
			});
			await expect.element(screen.getByLabelText('Name')).toHaveAttribute('aria-required', 'true');
		});

		it('required default: an isOptional input is not aria-required', async () => {
			const screen = await render(Harness, {
				props: { mode: 'text-input', optionality: 'required', isOptional: true }
			});
			await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
		});

		it('optional default: an unmarked input is not aria-required', async () => {
			const screen = await render(Harness, {
				props: { mode: 'text-input', optionality: 'optional' }
			});
			await expect.element(screen.getByLabelText('Name')).not.toHaveAttribute('aria-required');
		});

		it('no layout: an unmarked input is not aria-required (backwards compatible)', async () => {
			const screen = await render(Harness, { props: { mode: 'bare-text-input' } });
			await expect.element(screen.getByLabelText('Solo')).not.toHaveAttribute('aria-required');
		});

		it('required default resolves aria-required without native required', async () => {
			const screen = await render(Harness, {
				props: { mode: 'checkbox', optionality: 'required', label: 'Terms' }
			});
			const checkbox = screen.getByRole('checkbox', { name: 'Terms' });
			// Announced as required (form default)…
			await expect.element(checkbox).toHaveAttribute('aria-required', 'true');
			// …but the native `required` attribute is not switched on by the layout.
			await expect.element(checkbox).not.toHaveAttribute('required');
		});

		it('explicit isRequired still drives native required under a layout', async () => {
			const screen = await render(Harness, {
				props: { mode: 'checkbox', optionality: 'required', isRequired: true, label: 'Consent' }
			});
			const checkbox = screen.getByRole('checkbox', { name: 'Consent' });
			await expect.element(checkbox).toHaveAttribute('aria-required', 'true');
			await expect.element(checkbox).toHaveAttribute('required');
		});
	});
});
