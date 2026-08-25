import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditableToolbar from './fixtures/list-focus-editable-toolbar.svelte';
import HorizontalMenu from './fixtures/list-focus-horizontal-menu.svelte';
import InputToolbar from './fixtures/list-focus-input-toolbar.svelte';
import Menu from './fixtures/list-focus-menu.svelte';
import NestedMenu from './fixtures/list-focus-nested-menu.svelte';
import NestedMenuWithInnerProbe from './fixtures/list-focus-nested-menu-inner-probe.svelte';
import Toolbar from './fixtures/list-focus-toolbar.svelte';

/**
 * Ported from Astryx's `hooks/useListFocus.test.tsx` — **31 of its 34 cases at
 * the 0.5.0 pin**.
 *
 * The 3 not here are the whole `useListFocus Escape` describe: `leaves Escape to
 * the host when no onEscape is supplied`, `consumes Escape and runs onEscape
 * when one is supplied`, `still consumes arrow keys with no onEscape (page-scroll
 * suppression)`. They are portable — `use-list-focus` declares and calls
 * `onEscape` — so this is coverage debt. (The header read "all 31 of upstream's
 * 31 at v0.3.0"; the version bumps invalidated it.)
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "all twenty-two cases", which its own file
 * contradicted twice over: the file ran **23**, and upstream has **31**. The
 * eight absences — the whole `RTL auto-detection` and `boundarySelector (nested
 * lists)` describes — have since been ported, closing the file. They needed
 * three new fixtures, each a direct transcription of an upstream component:
 * `list-focus-horizontal-menu` (`HorizontalMenu`),
 * `list-focus-nested-menu` (`NestedMenu`) and
 * `list-focus-nested-menu-inner-probe` (`NestedMenuWithInnerProbe`). The two
 * `ownsEvent` cases keep upstream's mechanism exactly: the probe input's own
 * keydown handler writes the boolean onto `data-owns` and the assertion reads
 * the DOM. `getAllByRole('menu')[0]` becomes `getByRole('menu').elements()[0]`.
 *
 * `fireEvent.keyDown(container, {key})` becomes a dispatched `KeyboardEvent`,
 * and every assertion is upstream's unchanged. Two details are worth naming:
 *
 * Upstream's `.focus()` calls go through `screen.getByTestId(x).focus()`; a
 * locator is not an element here, so the fixtures' elements are reached with
 * `.element()` and focused directly — the same DOM call.
 *
 * The caret-guard suite runs in a **real browser** rather than jsdom, which
 * makes it strictly stronger: `setSelectionRange`, `isContentEditable` and
 * `window.getSelection()` are the real implementations, and the contenteditable
 * case in particular exercises the `isContentEditable` branch that jsdom would
 * have fallen out of into the `[contenteditable]` ancestor fallback.
 */

function keyDown(element: Element, init: KeyboardEventInit): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
}

describe('useListFocus disabled-item skipping', () => {
	it('ArrowDown skips a disabled item instead of stalling on it', async () => {
		const screen = await render(Menu, { props: { disabledLabels: ['Two'] } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('One').element().focus();

		keyDown(menu, { key: 'ArrowDown' });
		// Should skip disabled "Two" and land on "Three".
		await expect.element(screen.getByTestId('Three')).toHaveFocus();
	});

	it('ArrowUp skips a disabled item', async () => {
		const screen = await render(Menu, { props: { disabledLabels: ['Three'] } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('Four').element().focus();

		keyDown(menu, { key: 'ArrowUp' });
		// Should skip disabled "Three" and land on "Two".
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});

	it('does not freeze at a leading disabled item (regression: menus-4)', async () => {
		const screen = await render(Menu, { props: { disabledLabels: ['One'] } });
		const menu = screen.getByRole('menu').element();
		// Focus starts nowhere; ArrowDown should reach the first ENABLED item.
		keyDown(menu, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});

	it('wraps past a disabled item at the end', async () => {
		const screen = await render(Menu, { props: { disabledLabels: ['Four'], wrap: true } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('Three').element().focus();

		keyDown(menu, { key: 'ArrowDown' });
		// "Four" is disabled, wrap to "One".
		await expect.element(screen.getByTestId('One')).toHaveFocus();
	});

	it('does not wrap when wrap is false', async () => {
		const screen = await render(Menu, { props: { disabledLabels: ['Four'], wrap: false } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('Three').element().focus();

		keyDown(menu, { key: 'ArrowDown' });
		// "Four" disabled, no wrap -> focus stays on "Three".
		await expect.element(screen.getByTestId('Three')).toHaveFocus();
	});

	it('Home focuses the first enabled item, End the last enabled item', async () => {
		const screen = await render(Menu, { props: { disabledLabels: ['One', 'Four'] } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('Two').element().focus();

		keyDown(menu, { key: 'End' });
		await expect.element(screen.getByTestId('Three')).toHaveFocus();

		keyDown(menu, { key: 'Home' });
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});
});

// ---------------------------------------------------------------------------
// Roving-tabindex mode + composite navigation behaviors.
// These exercise the opt-in `hasRovingTabIndex`, `isRtl`, `orientation: 'both'`,
// `hasCaretGuard`, and shortcut-passthrough behaviors.
// ---------------------------------------------------------------------------

describe('useListFocus roving tabindex (hasRovingTabIndex)', () => {
	it('stamps a single tab stop (first enabled item is tabbable)', async () => {
		const screen = await render(Toolbar);
		await expect.element(screen.getByTestId('A')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('B')).toHaveAttribute('tabindex', '-1');
		await expect.element(screen.getByTestId('C')).toHaveAttribute('tabindex', '-1');
	});

	it('promotes the first ENABLED item when the first is disabled (repair)', async () => {
		const screen = await render(Toolbar, { props: { disabledLabels: ['A'] } });
		await expect.element(screen.getByTestId('B')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('A')).toHaveAttribute('tabindex', '-1');
	});

	it('ArrowRight moves the tab stop to the next enabled item', async () => {
		const screen = await render(Toolbar);
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('A').element().focus();
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('B')).toHaveFocus();
		await expect.element(screen.getByTestId('B')).toHaveAttribute('tabindex', '0');
		await expect.element(screen.getByTestId('A')).toHaveAttribute('tabindex', '-1');
	});

	it('ArrowRight skips a disabled item', async () => {
		const screen = await render(Toolbar, { props: { disabledLabels: ['B'] } });
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('A').element().focus();
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('C')).toHaveFocus();
	});

	it('wraps at the end by default', async () => {
		const screen = await render(Toolbar);
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('C').element().focus();
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('A')).toHaveFocus();
	});

	it('does not wrap when wrap=false', async () => {
		const screen = await render(Toolbar, { props: { wrap: false } });
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('C').element().focus();
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('C')).toHaveFocus();
	});

	it('Home/End jump to first/last enabled items', async () => {
		const screen = await render(Toolbar);
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('B').element().focus();
		keyDown(toolbar, { key: 'End' });
		await expect.element(screen.getByTestId('C')).toHaveFocus();
		keyDown(toolbar, { key: 'Home' });
		await expect.element(screen.getByTestId('A')).toHaveFocus();
	});

	it('flips ArrowLeft/ArrowRight under RTL', async () => {
		const screen = await render(Toolbar, { props: { isRtl: true } });
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('A').element().focus();
		// In RTL, ArrowLeft is "forward".
		keyDown(toolbar, { key: 'ArrowLeft' });
		await expect.element(screen.getByTestId('B')).toHaveFocus();
	});

	it('orientation "both" navigates with all four arrows', async () => {
		const screen = await render(Toolbar, { props: { orientation: 'both' } });
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('A').element().focus();
		keyDown(toolbar, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('B')).toHaveFocus();
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('C')).toHaveFocus();
	});

	it('vertical orientation ignores horizontal arrows', async () => {
		const screen = await render(Toolbar, { props: { orientation: 'vertical' } });
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('A').element().focus();
		keyDown(toolbar, { key: 'ArrowDown' });
		await expect.element(screen.getByTestId('B')).toHaveFocus();
		keyDown(toolbar, { key: 'ArrowRight' });
		// ArrowRight is inert in vertical mode.
		await expect.element(screen.getByTestId('B')).toHaveFocus();
	});

	it('does not manage tabindex when hasRovingTabIndex is off', async () => {
		const screen = await render(Toolbar, { props: { hasRovingTabIndex: false } });
		// No tabindex stamped — the buttons keep their intrinsic tab order.
		await expect.element(screen.getByTestId('A')).not.toHaveAttribute('tabindex');
		await expect.element(screen.getByTestId('B')).not.toHaveAttribute('tabindex');
	});
});

describe('useListFocus caret-boundary guard (hasCaretGuard, navigation-4)', () => {
	function getField(screen: Awaited<ReturnType<typeof render>>): HTMLInputElement {
		const el = screen.getByTestId('field').element();
		if (!(el instanceof HTMLInputElement)) {
			throw new Error('expected an input');
		}
		return el;
	}

	it('does not steal ArrowRight from a text input mid-line', async () => {
		const screen = await render(InputToolbar);
		const toolbar = screen.getByRole('toolbar').element();
		const field = getField(screen);
		field.focus();
		field.setSelectionRange(1, 1); // caret in the middle of "hello"
		keyDown(toolbar, { key: 'ArrowRight' });
		// Focus stays in the input; caret movement is left to the browser.
		await expect.element(screen.getByTestId('field')).toHaveFocus();
	});

	it('steals ArrowRight when the caret is at the end of the input', async () => {
		const screen = await render(InputToolbar);
		const toolbar = screen.getByRole('toolbar').element();
		const field = getField(screen);
		field.focus();
		field.setSelectionRange(5, 5); // caret at end of "hello"
		keyDown(toolbar, { key: 'ArrowRight' });
		// Now the composite navigates to the next item.
		await expect.element(screen.getByTestId('after')).toHaveFocus();
	});

	it('does not steal an arrow key when the input has a selection', async () => {
		const screen = await render(InputToolbar);
		const toolbar = screen.getByRole('toolbar').element();
		const field = getField(screen);
		field.focus();
		field.setSelectionRange(0, 5); // whole value selected
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('field')).toHaveFocus();
	});

	it('steals the key from a text input when hasCaretGuard is off', async () => {
		const screen = await render(InputToolbar, { props: { hasCaretGuard: false } });
		const toolbar = screen.getByRole('toolbar').element();
		const field = getField(screen);
		field.focus();
		field.setSelectionRange(1, 1); // caret mid-line, but no caret guard
		keyDown(toolbar, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('after')).toHaveFocus();
	});
});

describe('useListFocus caret-boundary guard: contenteditable (navigation-4)', () => {
	it('does not steal arrow keys from a non-empty contenteditable', async () => {
		const screen = await render(EditableToolbar);
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('composer').element().focus();
		keyDown(toolbar, { key: 'ArrowRight' });
		// Focus stays in the editor; list navigation must not hijack the arrow.
		await expect.element(screen.getByTestId('composer')).toHaveFocus();
		keyDown(toolbar, { key: 'ArrowLeft' });
		await expect.element(screen.getByTestId('composer')).toHaveFocus();
	});
});

describe('useListFocus shortcut passthrough', () => {
	it('passes browser shortcut chords (Cmd/Ctrl/Alt) through', async () => {
		const screen = await render(Toolbar);
		const toolbar = screen.getByRole('toolbar').element();
		screen.getByTestId('A').element().focus();
		keyDown(toolbar, { key: 'ArrowRight', metaKey: true });
		// Focus should not move on a modified chord.
		await expect.element(screen.getByTestId('A')).toHaveFocus();
	});
});

describe('useListFocus RTL auto-detection (WCAG 1.3.2)', () => {
	it('auto-detects dir="rtl": ArrowLeft moves to the next item', async () => {
		const screen = await render(HorizontalMenu, { props: { dir: 'rtl' } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('One').element().focus();
		keyDown(menu, { key: 'ArrowLeft' });
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});

	it('auto-detects dir="rtl": ArrowRight moves to the previous item', async () => {
		const screen = await render(HorizontalMenu, { props: { dir: 'rtl' } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('Two').element().focus();
		keyDown(menu, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('One')).toHaveFocus();
	});

	it('stays LTR without a direction: ArrowRight moves to the next item', async () => {
		const screen = await render(HorizontalMenu);
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('One').element().focus();
		keyDown(menu, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});

	it('explicit isRtl={false} overrides a dir="rtl" container', async () => {
		const screen = await render(HorizontalMenu, { props: { dir: 'rtl', isRtl: false } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('One').element().focus();
		keyDown(menu, { key: 'ArrowRight' });
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});

	it('explicit isRtl={true} flips arrows without a dir attribute', async () => {
		const screen = await render(HorizontalMenu, { props: { isRtl: true } });
		const menu = screen.getByRole('menu').element();
		screen.getByTestId('One').element().focus();
		keyDown(menu, { key: 'ArrowLeft' });
		await expect.element(screen.getByTestId('Two')).toHaveFocus();
	});
});

describe('useListFocus boundarySelector (nested lists)', () => {
	it("ArrowDown skips over a nested list's items to the next own item", async () => {
		const screen = await render(NestedMenu);
		// Upstream's `getAllByRole('menu')[0]` — the outer list.
		const menu = screen.getByRole('menu').elements()[0]!;
		screen.getByTestId('Outer2').element().focus();
		keyDown(menu, { key: 'ArrowDown' });
		// Lands on Outer3, not Inner1 (which is inside the nested menu).
		await expect.element(screen.getByTestId('Outer3')).toHaveFocus();
	});

	it('ownsEvent is true for an event originating at this level', async () => {
		const screen = await render(NestedMenu);
		const ownProbe = screen.getByTestId('probe-owns');
		keyDown(ownProbe.element(), { key: 'ArrowDown' });
		await expect.element(ownProbe).toHaveAttribute('data-owns', 'true');
	});

	it('ownsEvent is false for an event from inside a nested list', async () => {
		const screen = await render(NestedMenuWithInnerProbe);
		const innerProbe = screen.getByTestId('inner-probe');
		keyDown(innerProbe.element(), { key: 'ArrowDown' });
		await expect.element(innerProbe).toHaveAttribute('data-owns', 'false');
	});
});
