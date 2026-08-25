import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SelectableCard from '$lib/components/selectable-card/selectable-card.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `SelectableCard/SelectableCard.test.tsx`, ported case for case —
 * **all 15 of upstream's 15** at the 0.5.0 pin. Upstream has no `displayName` and no
 * `ref` case, so nothing is dropped.
 *
 * The 4 newest are 0.3.0's Enter-toggles group. The last 2 are upstream's nested
 * `describe('elevation')` pair, which arrived with 0.1.9's `elevation` prop and
 * had never been brought across; a header saying so is not the same as covering
 * them, so they are ported here (both passed on the first run). An older header
 * still claimed "all 9 upstream `it()`s" while counting only the top level.
 *
 * `SelectableCard` composes `Card` and renders a visually-hidden
 * `<input type="checkbox">` inside it. The checkbox is the accessible surface —
 * `role="checkbox"` (implicit), name from `aria-label={label}`, state from
 * `checked={isSelected}`, `disabled={isDisabled}`. The card `<div>` itself has
 * no role and no tabindex, so every "checkbox" assertion targets that input, as
 * upstream's `getByRole('checkbox', {name})` does. The input is only *visually*
 * hidden (an sr-only clip, not `display:none`), so it stays in the a11y tree and
 * `getByRole` reaches it — the same pattern the ported `Switch` suite relies on.
 *
 * Children are a `Snippet` here, so upstream's inline `<span>Content</span>` is
 * supplied through the shared `slot-probe`, which fills the named `children`
 * slot with a `<span>{text}</span>`.
 *
 * Two click cases are restated in *delivery only* — the assertions are
 * upstream's verbatim — each commented at its site:
 *  - the enabled "card surface is clicked" cases dispatch a bubbling `click` on
 *    the surface `<span>` so `event.target` is the surface (not a nested
 *    interactive element), which is exactly the path upstream's
 *    `fireEvent.click(getByText('Content'))` drives and which the card's
 *    `useClickableContainer` delegate inspects via its interactive-ancestor walk.
 *  - the "checkbox itself is clicked" case uses the checkbox's native `.click()`
 *    so the browser performs the real toggle + `change` the component listens on.
 *  - the disabled surface case uses the surface element's native `.click()`; the
 *    card wires no `onclick` when `isDisabled`, so nothing reaches `onChange`.
 */

/** Upstream's `fireEvent.keyDown(el, {key})` — a real bubbling keydown here. */
function pressKey(element: Element, key: string): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** Renders a `SelectableCard` with its `children` slot filled by `text`. */
function renderCard(
	rest: Record<string, unknown>,
	text = 'Content'
): Promise<Awaited<ReturnType<typeof render>>> {
	return render(SlotProbe, {
		props: { component: SelectableCard, slot: 'children', text, rest }
	});
}

describe('SelectableCard', () => {
	it('renders children', async () => {
		const screen = await renderCard(
			{ label: 'Test', isSelected: false, onChange: () => {} },
			'Card content'
		);
		await expect.element(screen.getByText('Card content', { exact: true })).toBeInTheDocument();
	});

	it('renders a hidden checkbox', async () => {
		const screen = await renderCard({ label: 'Test', isSelected: false, onChange: () => {} });
		await expect
			.element(screen.getByRole('checkbox', { name: 'Test', exact: true }))
			.toBeInTheDocument();
	});

	it('checkbox reflects isSelected=true as checked', async () => {
		const screen = await renderCard({ label: 'Plan A', isSelected: true, onChange: () => {} });
		await expect
			.element(screen.getByRole('checkbox', { name: 'Plan A', exact: true }))
			.toBeChecked();
	});

	it('checkbox reflects isSelected=false as unchecked', async () => {
		const screen = await renderCard({ label: 'Plan B', isSelected: false, onChange: () => {} });
		await expect
			.element(screen.getByRole('checkbox', { name: 'Plan B', exact: true }))
			.not.toBeChecked();
	});

	it('calls onChange with true when card surface is clicked (unselected)', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({ label: 'Test', isSelected: false, onChange: handleChange });
		// Restated in delivery: a bubbling `click` dispatched on the surface `<span>`
		// so `event.target` is the surface — upstream's `fireEvent.click(getByText())`.
		const surface = screen.getByText('Content', { exact: true }).element();
		surface.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		expect(handleChange).toHaveBeenCalledWith(true);
	});

	it('calls onChange with false when card surface is clicked (selected)', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({ label: 'Test', isSelected: true, onChange: handleChange });
		const surface = screen.getByText('Content', { exact: true }).element();
		surface.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		expect(handleChange).toHaveBeenCalledWith(false);
	});

	it('calls onChange when checkbox itself is clicked', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({ label: 'Test', isSelected: false, onChange: handleChange });
		// The checkbox's native `.click()` performs the real toggle + `change` the
		// component's `onchange` listens on; the bubbled click reaches the card's
		// delegate but bails on the interactive-ancestor walk, so `onChange` fires once.
		const checkbox = screen
			.getByRole('checkbox', { name: 'Test', exact: true })
			.element() as HTMLInputElement;
		checkbox.click();
		expect(handleChange).toHaveBeenCalledWith(true);
	});

	it('disabled checkbox is disabled', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({
			label: 'Disabled',
			isSelected: false,
			onChange: handleChange,
			isDisabled: true
		});
		await expect
			.element(screen.getByRole('checkbox', { name: 'Disabled', exact: true }))
			.toBeDisabled();
	});

	it('does not call onChange when disabled card is clicked', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({
			label: 'Disabled',
			isSelected: false,
			onChange: handleChange,
			isDisabled: true
		});
		// The card wires no `onclick` when disabled; the surface's native `.click()`
		// bubbles but finds no handler, so the guard holds and nothing calls back.
		(screen.getByText('Content', { exact: true }).element() as HTMLElement).click();
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('calls onChange with true when Enter is pressed on the checkbox (unselected)', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({ label: 'Test', isSelected: false, onChange: handleChange });
		pressKey(screen.getByRole('checkbox', { name: 'Test', exact: true }).element(), 'Enter');
		expect(handleChange).toHaveBeenCalledWith(true);
	});

	it('calls onChange with false when Enter is pressed on the checkbox (selected)', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({ label: 'Test', isSelected: true, onChange: handleChange });
		pressKey(screen.getByRole('checkbox', { name: 'Test', exact: true }).element(), 'Enter');
		expect(handleChange).toHaveBeenCalledWith(false);
	});

	it('does not toggle on Enter when disabled', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({
			label: 'Disabled',
			isSelected: false,
			onChange: handleChange,
			isDisabled: true
		});
		pressKey(screen.getByRole('checkbox', { name: 'Disabled', exact: true }).element(), 'Enter');
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('toggles exactly once on Space (native), not doubled by the Enter handler', async () => {
		const handleChange = vi.fn();
		const screen = await renderCard({ label: 'Test', isSelected: false, onChange: handleChange });
		const checkbox = screen
			.getByRole('checkbox', { name: 'Test', exact: true })
			.element() as HTMLInputElement;
		// Space activates the native checkbox, firing a single change event.
		checkbox.click();
		pressKey(checkbox, ' ');
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledWith(true);
	});

	describe('elevation', () => {
		const noop = (): void => {};

		it('forwards a distinct elevation class to the card for each level', async () => {
			const classFor = async (elevation: 'none' | 'low' | 'med' | 'high'): Promise<string> => {
				const screen = await renderCard({
					label: 'Card',
					isSelected: false,
					onChange: noop,
					elevation
				});
				return screen.container.firstElementChild!.className;
			};
			const classes = new Set([
				await classFor('none'),
				await classFor('low'),
				await classFor('med'),
				await classFor('high')
			]);
			expect(classes.size).toBe(4);
		});

		it('still varies elevation while selected (ring composes with elevation)', async () => {
			const selectedClassFor = async (elevation: 'none' | 'med'): Promise<string> => {
				const screen = await renderCard({
					label: 'Card',
					isSelected: true,
					onChange: noop,
					elevation
				});
				return screen.container.firstElementChild!.className;
			};
			// A selected card at 'med' must differ from a selected card at 'none' —
			// proving the selection ring does not clobber the elevation shadow.
			expect(await selectedClassFor('med')).not.toBe(await selectedClassFor('none'));
		});
	});
});
