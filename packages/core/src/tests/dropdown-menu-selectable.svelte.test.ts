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

	it('keeps the checkbox indicator decorative (row is the only announced control)', async () => {
		const screen = await render(Selectable, { props: { scenario: 'checkbox', value: true } });
		(screen.getByRole('button', { name: /View/ }).element() as HTMLElement).click();

		// The row owns role="menuitemcheckbox" — it is the single such control.
		expect(screen.container.querySelectorAll('[role="menuitemcheckbox"]')).toHaveLength(1);

		// The visual is the shared checkbox indicator: aria-hidden, with no nested
		// native <input>, so the row is the only announced/focusable control. 0.4.1
		// replaced the composed CheckboxInput — and with it the `inert` subtree the
		// nested input used to need — with the indicator drawn directly on the row.
		const checkboxRow = row(screen.container, 'menuitemcheckbox', 'Show archived');
		expect(checkboxRow.querySelector('input[type="checkbox"]')).toBeNull();
		// The shared checkbox target, directly on the row — no wrapper, and no
		// menu-specific target added for it.
		const marker = checkboxRow.querySelector('.astryx-checkbox');
		expect(marker).toBeInTheDocument();
		expect(marker).toHaveAttribute('aria-hidden', 'true');
		expect(marker).toHaveAttribute('data-checked', 'checked');
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

	it('renders the shared radio indicator in the menu marker', async () => {
		const screen = await render(Selectable, {
			props: { scenario: 'radioGroup', radioValue: 'newest' }
		});
		(screen.getByRole('button', { name: /Sort/ }).element() as HTMLElement).click();
		const checked = row(screen.container, 'menuitemradio', 'Newest');
		// The menu's target and the shared radio target land on the SAME painted
		// circle, so menu radios and RadioList radios theme together and a theme
		// never has to reach through a wrapper.
		const box = checked.querySelector('.astryx-dropdown-menu-radio');
		expect(box).toHaveClass('astryx-radio');
		expect(box).toHaveAttribute('data-size', 'md');
		expect(box).toHaveAttribute('data-checked', 'checked');
		// `astryx-radio-dot` is the legacy name `radio-indicator-dot` still emits.
		// The menu-specific `dropdown-menu-radio-dot` was removed at 0.4.1 — that
		// removal is what `rename-dropdown-menu-radio-dot-target` migrates, and
		// this file was asserting the removed class until now.
		expect(box?.querySelector('.astryx-radio-dot')).toBeInTheDocument();

		// The unchecked radio still draws its circle, without the dot.
		const unchecked = row(screen.container, 'menuitemradio', 'Oldest');
		const uncheckedIndicator = unchecked.querySelector('.astryx-radio');
		expect(uncheckedIndicator).toBeInTheDocument();
		expect(uncheckedIndicator).not.toHaveAttribute('data-checked');
		expect(uncheckedIndicator?.querySelector('.astryx-radio-dot')).not.toBeInTheDocument();
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
