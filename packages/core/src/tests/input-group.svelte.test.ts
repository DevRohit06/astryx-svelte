/** PORTS: InputGroup/InputGroup.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InputGroupProbe from './fixtures/input-group-probe.svelte';

/**
 * Astryx's `InputGroup/InputGroup.test.tsx`, ported case for case — **18
 * upstream cases at the 0.5.0 pin, 18 here**.
 *
 * The children are member controls and addons, which a test file cannot author
 * as a Svelte snippet; `input-group-probe.svelte` renders them, selecting the
 * arrangement by a `variant` prop and forwarding every `InputGroup` prop through
 * `...rest`. `InputGroupText` supplies the addons and `TextInput` — now a real
 * `InputGroup` member that drops its own `Field` and borrows the group's label —
 * supplies the control, exactly as upstream's `$`/Amount pair does.
 *
 * Six cases (4–9) exercised members this port did not yet have — `Typeahead`,
 * `NumberInput`, `DateInput`, `Selector`, `MultiSelector`. Each was kept as a
 * named `it.skip` citing the missing component rather than dropped or faked: the
 * count is the contract, and inventing a stand-in upstream never used would test
 * the port's imagination instead of the port. **All six are now restored** —
 * batch 5 `NumberInput`, batch 6 `Selector` and `Typeahead`, batch 7
 * `MultiSelector`, and batch 12 the two `DateInput` cases (6 and 9), which were
 * the last. There are no skips left in this file.
 *
 * Restated, noted at the case:
 * - `renders with different sizes` (`:367`) — upstream's `rerender` becomes
 *   `screen.rerender`, and the two `size` values are driven through the probe's
 *   forwarded props.
 */

describe('InputGroup', () => {
	it('names the group via the label element (forms-14)', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'currency', label: 'Price' }
		});

		// The group is named by the field label via aria-labelledby (not a
		// duplicated aria-label). The label is rendered as a <span> (not a literal
		// <label>, which can't name a group) and carries no orphaned htmlFor.
		const groupLoc = screen.getByRole('group', { name: 'Price', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		expect(group).not.toHaveAttribute('aria-label');
		const label = screen.getByText('Price', { exact: true }).element();
		expect(label.tagName).toBe('SPAN');
		expect(label.closest('label')).toBeNull();
		expect(label).not.toHaveAttribute('for');
		expect(group.getAttribute('aria-labelledby')).toBe(label.id);
	});

	it('associates group description and status through aria-describedby', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'currency',
				label: 'Price',
				description: 'Enter the amount in USD',
				status: { type: 'error', message: 'Price is required' }
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Price', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const describedBy = group.getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
		expect(describedBy!.split(' ')).toHaveLength(2);
		expect(describedBy).toContain(
			screen.getByText('Enter the amount in USD', { exact: true }).element().id
		);
		expect(describedBy).toContain(
			screen.getByText('Price is required', { exact: true }).element().id
		);
	});

	it('labels grouped TextInput from the group and inner input labels', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'currency',
				label: 'Price',
				description: 'Enter the amount in USD',
				status: { type: 'error', message: 'Price is required' }
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Price', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const groupLabelID = group.getAttribute('aria-labelledby');
		const describedBy = group.getAttribute('aria-describedby');
		const input = screen.getByRole('textbox', { name: 'Price Amount', exact: true }).element();
		const labelledByIDs = input.getAttribute('aria-labelledby')?.split(' ') ?? [];

		expect(labelledByIDs).toHaveLength(2);
		expect(labelledByIDs[0]).toBe(groupLabelID);
		expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Amount');
		expect(input).not.toHaveAttribute('aria-label');
		expect(input).toHaveAttribute('aria-describedby', describedBy!);
	});

	// Case 4. Restored in batch 6, when `Typeahead` landed.
	it('labels grouped Typeahead from the group and inner input labels', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'typeahead',
				label: 'Favorite fruit',
				description: 'Pick one fruit'
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Favorite fruit', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const groupLabelID = group.getAttribute('aria-labelledby');
		const describedBy = group.getAttribute('aria-describedby');
		const input = screen
			.getByRole('combobox', { name: 'Favorite fruit Selection', exact: true })
			.element();
		const labelledByIDs = input.getAttribute('aria-labelledby')?.split(' ') ?? [];

		expect(labelledByIDs).toHaveLength(2);
		expect(labelledByIDs[0]).toBe(groupLabelID);
		expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Selection');
		expect(input).not.toHaveAttribute('aria-label');
		expect(input).toHaveAttribute('aria-describedby', describedBy!);
		expect(screen.container.querySelectorAll('.astryx-field')).toHaveLength(1);
	});

	// Case 5. Restored in batch 5, when `NumberInput` landed.
	it('labels grouped NumberInput from the group and inner input labels', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'number',
				label: 'Budget',
				description: 'Whole dollars only'
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Budget', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const groupLabelID = group.getAttribute('aria-labelledby');
		const describedBy = group.getAttribute('aria-describedby');
		const input = screen.getByRole('spinbutton', { name: 'Budget Amount', exact: true }).element();
		const labelledByIDs = input.getAttribute('aria-labelledby')?.split(' ') ?? [];

		expect(labelledByIDs).toHaveLength(2);
		expect(labelledByIDs[0]).toBe(groupLabelID);
		expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Amount');
		expect(input).not.toHaveAttribute('aria-label');
		expect(input).toHaveAttribute('aria-describedby', describedBy!);
	});

	// Case 6. Restored in batch 12, when `DateInput` landed.
	it('labels grouped DateInput from the group and inner input labels', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'date',
				label: 'Deadline',
				description: 'Use business days'
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Deadline', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const groupLabelID = group.getAttribute('aria-labelledby');
		const input = screen.getByRole('combobox', { name: 'Deadline Date', exact: true }).element();
		const labelledByIDs = input.getAttribute('aria-labelledby')?.split(' ') ?? [];

		expect(labelledByIDs).toHaveLength(2);
		expect(labelledByIDs[0]).toBe(groupLabelID);
		expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Date');
		expect(input).toHaveAttribute('aria-haspopup', 'dialog');
		expect(input).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby')!);
	});

	// Case 7. Restored in batch 6, when `Selector` landed.
	it('labels grouped Selector from the group and selector labels', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'selector',
				label: 'Destination',
				description: 'Where alerts are sent'
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Destination', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const groupLabelID = group.getAttribute('aria-labelledby');
		const describedBy = group.getAttribute('aria-describedby');
		const trigger = screen
			.getByRole('combobox', { name: 'Destination Channel', exact: true })
			.element();
		const labelledByIDs = trigger.getAttribute('aria-labelledby')?.split(' ') ?? [];

		expect(labelledByIDs).toHaveLength(2);
		expect(labelledByIDs[0]).toBe(groupLabelID);
		expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Channel');
		expect(trigger).not.toHaveAttribute('aria-label');
		expect(trigger).toHaveAttribute('aria-describedby', describedBy!);
	});

	// Case 8. Restored in batch 7, when `MultiSelector` landed.
	it('labels grouped MultiSelector from the group and selector labels', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'multi-selector',
				label: 'Destinations',
				description: 'Where alerts are sent'
			}
		});

		const groupLoc = screen.getByRole('group', { name: 'Destinations', exact: true });
		await expect.element(groupLoc).toBeInTheDocument();
		const group = groupLoc.element();
		const groupLabelID = group.getAttribute('aria-labelledby');
		const describedBy = group.getAttribute('aria-describedby');
		const trigger = screen
			.getByRole('combobox', { name: 'Destinations Channels', exact: true })
			.element();
		const labelledByIDs = trigger.getAttribute('aria-labelledby')?.split(' ') ?? [];

		expect(labelledByIDs).toHaveLength(2);
		expect(labelledByIDs[0]).toBe(groupLabelID);
		expect(document.getElementById(labelledByIDs[1]!)).toHaveTextContent('Channels');
		expect(trigger).not.toHaveAttribute('aria-label');
		expect(trigger).toHaveAttribute('aria-describedby', describedBy!);
	});

	// Case 9. Restored in batch 12, when `DateInput` landed.
	it('keeps grouped DateInput calendar button and popover semantics', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'date', label: 'Deadline' }
		});

		await expect
			.element(screen.getByRole('button', { name: 'Open calendar', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('combobox', { name: 'Deadline Date', exact: true }))
			.toHaveAttribute('aria-expanded', 'false');
	});

	it('renders the visible label', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'plain', label: 'Price' }
		});
		await expect.element(screen.getByText('Price', { exact: true })).toBeInTheDocument();
	});

	it('renders addon text', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'currency', label: 'Price' }
		});
		await expect.element(screen.getByText('$', { exact: true })).toBeInTheDocument();
	});

	it('renders the input', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'plain', label: 'Price' }
		});
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('renders prefix and suffix addons', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'url', label: 'Website' }
		});
		await expect.element(screen.getByText('https://', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('.com', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('applies data-testid', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'plain', label: 'Price', 'data-testid': 'price-group' }
		});
		await expect.element(screen.getByTestId('price-group')).toBeInTheDocument();
	});

	it('renders description text', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'plain', label: 'Price', description: 'Enter the price in USD' }
		});
		await expect
			.element(screen.getByText('Enter the price in USD', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders status message', async () => {
		const screen = await render(InputGroupProbe, {
			props: {
				variant: 'plain',
				label: 'Price',
				status: { type: 'error', message: 'Price is required' }
			}
		});
		await expect
			.element(screen.getByText('Price is required', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders with hidden label', async () => {
		const screen = await render(InputGroupProbe, {
			props: { variant: 'plain', label: 'Price', isLabelHidden: true }
		});
		await expect.element(screen.getByText('Price', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByRole('group')).toBeInTheDocument();
	});

	it('renders with different sizes', async () => {
		// Restated: upstream's `rerender(<InputGroup … size="lg">)` becomes
		// `screen.rerender`, driving the two sizes through the probe's props.
		const screen = await render(InputGroupProbe, {
			props: { variant: 'plain', label: 'Price', size: 'sm' }
		});
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();

		await screen.rerender({ variant: 'plain', label: 'Price', size: 'lg' });
		await expect.element(screen.getByRole('textbox')).toBeInTheDocument();
	});
});
