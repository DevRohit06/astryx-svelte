/** PORTS: ComplexSelector/ComplexSelector.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ComplexSelector from '$lib/components/complex-selector/complex-selector.svelte';
import CloseFixture from './fixtures/complex-selector-close.svelte';
import FruitFixture, { type FruitValue } from './fixtures/complex-selector-fruit.svelte';
import ShellFixture from './fixtures/complex-selector-shell.svelte';

/**
 * Astryx's `ComplexSelector/ComplexSelector.test.tsx`, ported case for case —
 * **all 12 upstream cases at the 0.5.0 pin**, none dropped and none added. There is no
 * ref-callback and no `displayName` case in the file, so nothing is React-only.
 *
 * (At v0.4.2 this was 6. The six added at 0.4.5 cover the `ghost` variant, the
 * `startIcon` slot, `alignment`, and the imperative handle — including the
 * re-open guard, which is the one with a real failure behind it: light dismiss
 * fires on pointerdown and the trigger's click lands after, so without the guard
 * the pair reads as close-then-open and the surface never shuts.)
 *
 * Runs in the **client (real Chromium)** project, for the reason
 * `selector.svelte.test.ts` and `popover.svelte.test.ts` do: the popup opens
 * through the native Popover API and the focus restore needs real focus.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited.
 * - `userEvent` comes from `vitest/browser`.
 * - Upstream's `h = {hidden: true}` companion is **gone**. It exists because
 *   jsdom leaves a stubbed popover `display: none`, so every node inside it is
 *   hidden from the accessibility tree. Chromium opens the popover for real, so
 *   the grid cells and the `Done` button are genuinely visible once the trigger
 *   has been clicked, and asking for hidden nodes would query for the opposite
 *   of what the assertion is about.
 * - `waitFor` is `vi.waitFor`.
 * - The two stateful content shapes go through a fixture
 *   (`complex-selector-fruit.svelte`, `complex-selector-close.svelte`): the
 *   content is a parameterised snippet and a snippet has to be declared in
 *   markup, so a case cannot author one inline the way upstream authors JSX.
 *   The popup-target block's content is inert (`<button>Done</button>`, wired to
 *   nothing), so it is built with `createRawSnippet` instead — the same node
 *   tree, authored in the case that needs it, which is what lets the
 *   `contentXstyle` case vary a prop the fixtures do not expose.
 * - `document.querySelector` becomes `screen.container.querySelector`. The
 *   popover layer renders inline in the component tree here rather than through
 *   a portal, so the container is the tighter scope for the same node.
 *
 * Upstream's `handleRef` + `React.createRef<ComplexSelectorHandle>()` becomes
 * `bind:this`: the component instance *is* the handle here, exposed through
 * `complex-selector-shell.svelte`'s `handle()` instance export. Same four
 * methods, same contract — see `SideNav`'s `getCollapseState()` for the
 * precedent.
 *
 * `act()` has no counterpart and is not needed here: upstream never reaches for
 * it in this file, a `$state` write flushes on its own, and `expect.element`
 * retries.
 */

const APPLE_RIPE: FruitValue = { fruit: 'Apple', ripeness: 'Ripe' };

/** Upstream's inline `{() => <button type="button">Done</button>}` content. */
const doneContent = createRawSnippet(() => ({
	render: () => '<button type="button">Done</button>'
}));

describe('ComplexSelector', () => {
	it('renders custom content with value and commits through onChange', async () => {
		const onChange = vi.fn();

		const screen = await render(FruitFixture, {
			props: { value: APPLE_RIPE, onChange }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend', exact: true }));
		await userEvent.click(screen.getByRole('gridcell', { name: 'Banana Juicy', exact: true }));

		expect(onChange).toHaveBeenCalledWith({ fruit: 'Banana', ripeness: 'Juicy' });
		await expect
			.element(screen.getByRole('button', { name: 'Fruit blend', exact: true }))
			.toHaveAttribute('aria-expanded', 'false');
	});

	it('gives the popup clearance on both block edges, not just the leading one (#4803)', async () => {
		const screen = await render(FruitFixture, {
			props: { value: APPLE_RIPE, onChange: () => {} }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend', exact: true }));
		const popup = screen.container.querySelector('[popover]') as HTMLElement;
		expect(popup).not.toBeNull();
		// Both edges, not just the leading one: the trailing edge is what faces
		// the trigger when the same popup opens upward (placement="above") or is
		// flipped by position-try-fallbacks. `<PopoverLayer offset>` sets both from
		// the resolved placement, through StyleX's `offsetBlock` **function
		// style** — which compiles to a pair of `--x-marginBlock*` custom
		// properties in the element's own `style` attribute. Reading those is
		// upstream's assertion unchanged, and it is also the assertion that
		// survives: a computed `margin-block-start` would be the *resolved* gap,
		// which anchor positioning is free to collapse before the popup has been
		// laid out.
		const blockStart = popup.style.getPropertyValue('--x-marginBlockStart');
		expect(blockStart).not.toBe('');
		expect(popup.style.getPropertyValue('--x-marginBlockEnd')).toBe(blockStart);
	});

	it('runs changeAction through the provided onChange helper', async () => {
		const onChange = vi.fn();
		const changeAction = vi.fn();

		const screen = await render(FruitFixture, {
			props: { value: APPLE_RIPE, onChange, changeAction }
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend', exact: true }));
		await userEvent.click(screen.getByRole('gridcell', { name: 'Banana Crisp', exact: true }));

		expect(onChange).toHaveBeenCalledWith({ fruit: 'Banana', ripeness: 'Crisp' });
		await vi.waitFor(() => {
			expect(changeAction).toHaveBeenCalledWith({
				fruit: 'Banana',
				ripeness: 'Crisp'
			});
		});
	});

	it('passes a close helper to composed content', async () => {
		const screen = await render(CloseFixture);

		const trigger = screen.getByRole('button', { name: 'Fruit blend', exact: true });
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		await userEvent.click(screen.getByRole('button', { name: 'Done', exact: true }));
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});

describe('ComplexSelector popup theme target', () => {
	it('puts astryx-complex-selector-popup on the surface that paints, not the content box', async () => {
		const screen = await render(ComplexSelector, {
			props: {
				label: 'Fruit blend',
				value: 'Apple',
				triggerLabel: 'Apple',
				children: doneContent
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend', exact: true }));

		const popup = screen.container.querySelector('.astryx-complex-selector-popup') as HTMLElement;
		expect(popup).not.toBeNull();

		// The surface is the element usePopover renders: it carries the dialog
		// role and the shared surface class, and the component's content box —
		// the one with the padding and the scroll — sits INSIDE it. A target on
		// that inner box cannot paint the popup's background or radius, which is
		// what a theme reaches for this class to do.
		expect(popup).toHaveAttribute('role', 'dialog');
		expect(popup).toHaveClass('astryx-popover-surface');
		expect(popup.querySelector('[id]')).not.toBeNull();
		expect(popup).toContainElement(
			screen.getByRole('button', { name: 'Done', exact: true }).element() as HTMLElement
		);

		// And it is not the bare positioning layer either.
		const layer = screen.container.querySelector('[popover]') as HTMLElement;
		expect(popup).not.toBe(layer);
		expect(layer.contains(popup)).toBe(true);
	});

	it('keeps the target when the consumer also passes contentXstyle', async () => {
		const screen = await render(ComplexSelector, {
			props: {
				label: 'Fruit blend',
				value: 'Apple',
				triggerLabel: 'Apple',
				contentXstyle: {},
				children: doneContent
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit blend', exact: true }));

		expect(screen.container.querySelector('.astryx-complex-selector-popup')).not.toBeNull();
	});
	describe('trigger shell', () => {
		it('defaults to md and reflects explicit trigger sizes', async () => {
			const sizeOf = async (size?: 'sm' | 'md' | 'lg') => {
				const screen = await render(ShellFixture, {
					props: { label: 'Fruit blend', value: 'Apple', size }
				});
				return screen.container
					.querySelector('.astryx-complex-selector')
					?.getAttribute('data-size');
			};
			expect(await sizeOf()).toBe('md');
			expect(await sizeOf('sm')).toBe('sm');
			expect(await sizeOf('lg')).toBe('lg');
		});

		it('renders a ghost toolbar trigger with a start icon', async () => {
			const screen = await render(ShellFixture, {
				props: {
					label: 'View options',
					value: ['name'],
					variant: 'ghost',
					startIcon: 'viewColumns',
					status: { type: 'warning', message: 'Unsaved changes' },
					'data-testid': 'view-options'
				}
			});
			expect(
				screen.container.querySelector('.astryx-complex-selector')?.getAttribute('data-variant')
			).toBe('ghost');
			// A ghost trigger has no field border to hang an attached bubble off.
			expect(
				screen.container.querySelector('.astryx-field-status')?.getAttribute('data-variant')
			).toBe('detached');
			// The start icon plus the chevron.
			expect(
				screen.container.querySelector('[data-testid="view-options"]')!.querySelectorAll('svg')
			).toHaveLength(2);
		});

		it('supports end-aligned popup positioning', async () => {
			const screen = await render(ShellFixture, { props: { alignment: 'end' } });
			const popover = screen.container.querySelector('[popover]');
			// Read back through `getAttribute`, so this is the browser's normalised
			// form of the declaration, not the string the layer wrote.
			expect(popover?.getAttribute('style')).toContain(
				'position-area: self-block-end span-self-inline-start'
			);
		});
	});

	describe('imperative handle', () => {
		it('exposes imperative open, close, toggle, and isOpen via bind:this', async () => {
			const screen = await render(ShellFixture);
			const handle = screen.component.handle()!;
			const trigger = screen.getByRole('button', { name: 'View options', exact: true });

			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(handle.isOpen()).toBe(false);

			handle.open();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
			expect(handle.isOpen()).toBe(true);

			handle.close();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(handle.isOpen()).toBe(false);

			handle.toggle();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

			handle.toggle();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('does not open via the imperative handle when disabled', async () => {
			const screen = await render(ShellFixture, { props: { isDisabled: true } });
			const handle = screen.component.handle()!;
			const trigger = screen.getByRole('button', { name: 'View options', exact: true });

			handle.open();
			handle.toggle();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(handle.isOpen()).toBe(false);
		});

		it('does not reopen from the trigger click that follows light dismiss', async () => {
			const screen = await render(ShellFixture);
			const handle = screen.component.handle()!;
			const trigger = screen.getByRole('button', { name: 'View options', exact: true });

			await userEvent.click(trigger);
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

			// Upstream synthesises the dismiss with `fireEvent` because jsdom has no
			// Popover API. Chromium has one, so this drives the interaction that
			// actually produces the bug: clicking the *trigger* of an open popover
			// light-dismisses it on pointerdown, and the trigger's own click lands
			// after. Without the guard that pair reads as close-then-open and the
			// surface never shuts — which is the whole point of the case.
			await userEvent.click(trigger);
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(handle.isOpen()).toBe(false);
		});
	});
});
