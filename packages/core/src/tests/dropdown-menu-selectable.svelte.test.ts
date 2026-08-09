import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Selectable from './fixtures/dropdown-menu-selectable.svelte';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuSelectable.test.tsx`, all 9
 * cases (v0.3.0) across its two describe blocks. Nothing is dropped.
 *
 * This suite could not exist until the 0.2.0 pin: the trio it covers
 * (`DropdownMenuCheckboxItem` / `RadioGroup` / `RadioItem`) was the slice the
 * published upstream tarball did not compile, so `dropdown-menu.svelte.test.ts`
 * records it as wholly dropped. 0.2.0's `dist/` ships all three, the class
 * oracle verifies them, and that deferral has retired.
 *
 * Same translations as `dropdown-menu.svelte.test.ts`:
 * - Runs in the **client (real Chromium)** project, so upstream's `beforeEach`
 *   stubbing `showPopover`/`hidePopover`/`:popover-open` is GONE.
 * - `getByRole(…, {hidden: true})` becomes a container `querySelector`: a closed
 *   popover is `display: none` in a real browser.
 * - `user.click` becomes a native `.click()`.
 *
 * The items are compound children, which a Svelte snippet can only author in a
 * template — hence `fixtures/dropdown-menu-selectable.svelte`.
 */

function row(container: HTMLElement, role: string, name: string): HTMLElement {
	const rows = Array.from(container.querySelectorAll<HTMLElement>(`[role="${role}"]`));
	const el = rows.find(
		(r) => r.getAttribute('aria-label') === name || r.textContent?.trim().includes(name)
	);
	if (!el) throw new Error(`no ${role} named "${name}"`);
	return el;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('DropdownMenuCheckboxItem', () => {
	it('renders role menuitemcheckbox and reflects checked state', async () => {
		const screen = await render(Selectable, { props: { scenario: 'checkbox', value: true } });
		(screen.getByRole('button', { name: /View/ }).element() as HTMLElement).click();
		expect(row(screen.container, 'menuitemcheckbox', 'Show archived')).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});

	it('calls onChange with the toggled value on click', async () => {
		const onChangeSpy = vi.fn();
		const screen = await render(Selectable, {
			props: { scenario: 'checkbox', value: false, onChange: onChangeSpy }
		});
		(screen.getByRole('button', { name: /View/ }).element() as HTMLElement).click();
		row(screen.container, 'menuitemcheckbox', 'Show archived').click();
		expect(onChangeSpy).toHaveBeenCalledWith(true);
	});

	it('keeps the composed checkbox decorative (row is the only announced control)', async () => {
		const screen = await render(Selectable, { props: { scenario: 'checkbox', value: true } });
		(screen.getByRole('button', { name: /View/ }).element() as HTMLElement).click();

		// The row owns role="menuitemcheckbox" — it is the single such control.
		expect(screen.container.querySelectorAll('[role="menuitemcheckbox"]')).toHaveLength(1);

		// The composed CheckboxInput is present in the DOM but sits inside an
		// `aria-hidden` + `inert` subtree: it contributes nothing to the row's
		// accessible name and its native <input> is out of the tab order and the
		// accessibility tree, so it is not a second announced/focusable control.
		// RESTATED: upstream notes jsdom does not model inert's a11y removal and so
		// asserts the boundary directly. Chromium *does* enforce inert, so this also
		// asserts the enforced consequence — the input refuses focus.
		const checkboxRow = row(screen.container, 'menuitemcheckbox', 'Show archived');
		const input = checkboxRow.querySelector<HTMLInputElement>('input[type="checkbox"]');
		expect(input).not.toBeNull();
		const marker = input?.closest('[inert]');
		expect(marker).not.toBeNull();
		expect(marker).toHaveAttribute('aria-hidden', 'true');
		input?.focus();
		expect(document.activeElement).not.toBe(input);
	});

	it('does not toggle when disabled', async () => {
		const onChangeSpy = vi.fn();
		const screen = await render(Selectable, {
			props: { scenario: 'checkbox', value: false, onChange: onChangeSpy, isDisabled: true }
		});
		(screen.getByRole('button', { name: /View/ }).element() as HTMLElement).click();
		const item = row(screen.container, 'menuitemcheckbox', 'Show archived');
		expect(item).toHaveAttribute('aria-disabled', 'true');
		item.click();
		expect(onChangeSpy).not.toHaveBeenCalled();
	});
});

describe('DropdownMenuRadioGroup / RadioItem', () => {
	it('renders a named group with radios reflecting the selected value', async () => {
		const screen = await render(Selectable, {
			props: { scenario: 'radioGroup', radioValue: 'newest' }
		});
		(screen.getByRole('button', { name: /Sort/ }).element() as HTMLElement).click();
		expect(row(screen.container, 'menuitemradio', 'Newest')).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(row(screen.container, 'menuitemradio', 'Oldest')).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect(screen.container.querySelector('[role="group"][aria-label="Sort by"]')).toBeTruthy();
	});

	it('exposes a themeable slot on the checked radio dot', async () => {
		const screen = await render(Selectable, {
			props: { scenario: 'radioGroup', radioValue: 'newest' }
		});
		(screen.getByRole('button', { name: /Sort/ }).element() as HTMLElement).click();
		const checked = row(screen.container, 'menuitemradio', 'Newest');
		const dot = checked.querySelector('.astryx-dropdown-menu-radio-dot');
		expect(dot).toBeInTheDocument();
		// Mirrors the radio container's visual props/states for consistent theming.
		expect(dot).toHaveAttribute('data-size', 'md');
		expect(dot).toHaveAttribute('data-checked', 'checked');
		// The unchecked radio has no dot, so no dot slot either.
		const unchecked = row(screen.container, 'menuitemradio', 'Oldest');
		expect(unchecked.querySelector('.astryx-dropdown-menu-radio-dot')).not.toBeInTheDocument();
	});

	it('calls onChange with the selected value', async () => {
		const onChange = vi.fn();
		const screen = await render(Selectable, {
			props: { scenario: 'radioGroup', radioValue: 'newest', onRadioChange: onChange }
		});
		(screen.getByRole('button', { name: /Sort/ }).element() as HTMLElement).click();
		row(screen.container, 'menuitemradio', 'Oldest').click();
		expect(onChange).toHaveBeenCalledWith('oldest');
	});

	it('names the group from the required label prop', async () => {
		const screen = await render(Selectable, {
			props: { scenario: 'radioGroup', radioValue: 'newest' }
		});
		(screen.getByRole('button', { name: /Sort/ }).element() as HTMLElement).click();
		expect(screen.container.querySelector('[role="group"][aria-label="Sort by"]')).toBeTruthy();
	});

	it('throws when a radio item is used outside a group', async () => {
		// Upstream asserts on `render()` throwing synchronously. `render` is async
		// here, so the rejection is awaited instead — the throw itself is the same
		// init-time check, and it still runs before any DOM lands.
		await expect(
			render(Selectable, { props: { scenario: 'radioItemWithoutGroup' } })
		).rejects.toThrow(/DropdownMenuRadioGroup/);
	});
});
