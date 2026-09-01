/** PORTS: FormLayout/FormLayout.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import FormLayout from '$lib/components/form-layout/form-layout.svelte';
import DirectionReader from './fixtures/form-layout-direction.svelte';
import FormLayoutFields from './fixtures/form-layout-fields.svelte';
import FormLayoutNest from './fixtures/form-layout-nest.svelte';
import Harness from './fixtures/form-optionality-harness.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Ported from Astryx's `FormLayout/FormLayout.test.tsx`.
 *
 * **The suite used to be split across two files**, and the split was the reason
 * neither could state a count against upstream: the layout, direction and grid
 * cases lived in `form-and-metadata.svelte.test.ts` beside two other components'
 * suites. That file is gone — its `FieldStatus` block was a duplicate of
 * `field-status.svelte.test.ts` down to the assertions, and its other two blocks
 * belong to the components they test. Both halves are here now, in the order
 * they were written, and `metadata-list.svelte.test.ts` has the third.
 *
 * Not ported: upstream's 3 `matches snapshot for … direction` cases. A snapshot
 * of *our* markup pins our own output against itself; the class oracle already
 * diffs every class we emit against the ones upstream's compiled `dist/`
 * carries, which is the stronger check and the one that would catch a real
 * divergence.
 *
 * Upstream's three `direction` cases are merged into one loop below.
 *
 * Every `defaultOptionality` case goes through
 * `form-optionality-harness.svelte`: upstream renders
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
			await expect
				.element(screen.getByLabelText('Name', { exact: true }))
				.toHaveAttribute('aria-required', 'true');
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
			await expect
				.element(screen.getByLabelText('Name', { exact: true }))
				.not.toHaveAttribute('aria-required');
		});

		it('no layout: an unmarked input is not aria-required (backwards compatible)', async () => {
			const screen = await render(Harness, { props: { mode: 'bare-text-input' } });
			await expect
				.element(screen.getByLabelText('Solo', { exact: true }))
				.not.toHaveAttribute('aria-required');
		});

		it('required default resolves aria-required without native required', async () => {
			const screen = await render(Harness, {
				props: { mode: 'checkbox', optionality: 'required', label: 'Terms' }
			});
			const checkbox = screen.getByRole('checkbox', { name: 'Terms', exact: true });
			// Announced as required (form default)…
			await expect.element(checkbox).toHaveAttribute('aria-required', 'true');
			// …but the native `required` attribute is not switched on by the layout.
			await expect.element(checkbox).not.toHaveAttribute('required');
		});

		it('explicit isRequired still drives native required under a layout', async () => {
			const screen = await render(Harness, {
				props: { mode: 'checkbox', optionality: 'required', isRequired: true, label: 'Consent' }
			});
			const checkbox = screen.getByRole('checkbox', { name: 'Consent', exact: true });
			await expect.element(checkbox).toHaveAttribute('aria-required', 'true');
			await expect.element(checkbox).toHaveAttribute('required');
		});
	});
});

describe('FormLayout', () => {
	const child = (text: string) => ({
		component: FormLayout,
		slot: 'children',
		text,
		testid: 'child'
	});

	it('renders children', async () => {
		const screen = await render(SlotProbe, { props: child('content') });
		expect(screen.container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders a div element', async () => {
		const screen = await render(SlotProbe, {
			props: { ...child('content'), rest: { 'data-testid': 'layout' } }
		});
		expect(screen.container.querySelector('[data-testid="layout"]')!.tagName).toBe('DIV');
	});

	it('hands the root element to an attachment passed through rest props', async () => {
		let element: Element | null = null;
		const screen = await render(SlotProbe, {
			props: {
				...child('content'),
				rest: {
					[createAttachmentKey()]: (node: Element) => {
						element = node;
					}
				}
			}
		});
		expect(element).toBe(screen.container.querySelector('.astryx-form-layout'));
	});

	it('passes data-testid', async () => {
		const screen = await render(SlotProbe, {
			props: { ...child('content'), rest: { 'data-testid': 'my-form' } }
		});
		expect(screen.container.querySelector('[data-testid="my-form"]')).not.toBeNull();
	});

	it('passes through HTML attributes', async () => {
		const screen = await render(SlotProbe, {
			props: { ...child('content'), rest: { 'data-testid': 'layout', id: 'form-1', role: 'group' } }
		});
		const el = screen.container.querySelector('[data-testid="layout"]')!;
		expect(el).toHaveAttribute('id', 'form-1');
		expect(el).toHaveAttribute('role', 'group');
	});

	it('defaults to vertical direction', async () => {
		const screen = await render(FormLayoutNest, { props: { isNested: false } });
		expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
			'vertical'
		);
	});

	for (const direction of ['vertical', 'horizontal', 'horizontal-labels'] as const) {
		it(`provides ${direction} direction context to children`, async () => {
			const screen = await render(FormLayoutNest, { props: { inner: direction } });
			expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
				direction
			);
		});
	}

	it('provides default context when no direction is specified', async () => {
		const screen = await render(DirectionReader);
		// Outside any FormLayout the context default applies, which is upstream's
		// `createContext({direction: 'vertical'})`.
		expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
			'vertical'
		);
	});

	it('supports nesting — inner layout overrides context', async () => {
		const screen = await render(FormLayoutNest, {
			props: { outer: 'vertical', inner: 'horizontal' }
		});
		expect(screen.container.querySelector('[data-testid="direction"]')!.textContent).toBe(
			'horizontal'
		);
	});

	it('renders nested layouts with different elements', async () => {
		const screen = await render(FormLayoutNest, { props: { hasInputs: true } });
		for (const id of ['outer', 'inner', 'outer-child', 'inner-child-1', 'inner-child-2']) {
			expect(screen.container.querySelector(`[data-testid="${id}"]`)).not.toBeNull();
		}
	});

	// ─── Horizontal-labels with real Field children ─────────────────────────

	it('horizontal-labels renders Field children with display:contents', async () => {
		const screen = await render(FormLayoutFields, {
			props: {
				fields: [
					{ label: 'Name', inputID: 'name', inputTestID: 'name-input' },
					{ label: 'Email', inputID: 'email', inputTestID: 'email-input' }
				]
			}
		});

		const layout = screen.getByTestId('layout').element();

		// Labels should be accessible
		await expect.element(screen.getByLabelText('Name')).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Email')).toBeInTheDocument();

		// The label and input wrapper should be direct grid-participating children
		// (via display:contents on the Field wrapper)
		const nameLabel = screen.getByText('Name', { exact: true }).element();
		const emailLabel = screen.getByText('Email', { exact: true }).element();
		expect(nameLabel.tagName).toBe('LABEL');
		expect(emailLabel.tagName).toBe('LABEL');

		// Both fields should be inside the layout
		expect(layout.contains(nameLabel)).toBe(true);
		expect(layout.contains(screen.getByTestId('name-input').element())).toBe(true);
		expect(layout.contains(emailLabel)).toBe(true);
		expect(layout.contains(screen.getByTestId('email-input').element())).toBe(true);
	});

	it('horizontal-labels with Field: label and input wrapper are siblings under display:contents', async () => {
		const screen = await render(FormLayoutFields, {
			props: {
				fields: [
					{
						label: 'Username',
						inputID: 'username',
						fieldTestID: 'username-field',
						inputTestID: 'username-input'
					}
				]
			}
		});

		const field = screen.getByTestId('username-field').element();
		// Field should have display:contents class
		expect(field.className).toContain('horizontalLabels');

		// Field's direct children should be: label alignment div + input wrapper div
		const fieldChildren = Array.from(field.children);
		expect(fieldChildren.length).toBe(2);
		// First child is the label alignment wrapper containing the <label>
		expect(fieldChildren[0].tagName).toBe('DIV');
		expect(fieldChildren[0].querySelector('label')).not.toBeNull();
		// Second child is the input wrapper div
		expect(fieldChildren[1].tagName).toBe('DIV');
		// The input should be inside the wrapper div (column 2)
		expect(fieldChildren[1].contains(screen.getByTestId('username-input').element())).toBe(true);
	});
});
