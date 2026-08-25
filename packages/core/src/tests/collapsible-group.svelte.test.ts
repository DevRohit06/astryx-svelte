import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import CollapsibleProbe from './fixtures/collapsible-probe.svelte';
import CollapsibleGroupProbe from './fixtures/collapsible-group-probe.svelte';
import CollapsibleNestedProbe from './fixtures/collapsible-nested-probe.svelte';
import CollapsibleNestedGroupProbe from './fixtures/collapsible-nested-group-probe.svelte';

/**
 * Astryx's `Collapsible/CollapsibleGroup.test.tsx`, ported case for case.
 *
 * Upstream has **34** `it` cases at the **0.5.0** pin: 9 in a standalone `Collapsible` describe, then a
 * `CollapsibleGroup` describe (1 direct + single/multiple/controlled/defaultValue/
 * standalone-vs-group/accessibility/dividers sub-blocks). All 34 are ported here;
 * none dropped.
 *
 * `Collapsible.children` / `CollapsibleGroup`'s child collapsibles are `Snippet`s
 * that cannot be authored in a `.ts` test, so standalone cases render through
 * `collapsible-probe.svelte` (body via `body`), group cases through
 * `collapsible-group-probe.svelte` (items via an array), and the two nested-DOM
 * cases through `collapsible-nested-probe.svelte` / `collapsible-nested-group-probe.svelte`.
 *
 * Content collapses via a `display:none` class — children stay MOUNTED — so
 * visibility is asserted with `toBeVisible` (upstream's assertion, unchanged).
 * Controlled cases pass `value`/`isOpen` as plain props with a non-committing
 * `onChange`/`onOpenChange` spy and drive the change with `rerender` (upstream's
 * `rerender`). `.element()` is cast to `HTMLElement` before DOM-only methods.
 *
 * Translation (noted at its case):
 * - `forwards ref to the wrapper in divider mode` — COUNTERPART. There is no `ref`
 *   prop; an attachment through the rest props reaches the wrapper div and receives
 *   it, asserted `=== the .astryx-collapsible-group element` (upstream's
 *   `ref.current === wrapper`).
 */

/** The `.astryx-collapsible` root of the item whose trigger matches `button`. */
function itemRoot(button: HTMLElement): HTMLElement {
	const root = button.closest('.astryx-collapsible');
	expect(root).not.toBeNull();
	return root as HTMLElement;
}

// =============================================================================
// Collapsible — standalone behavior
// =============================================================================

describe('Collapsible', () => {
	it('renders trigger and children', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'My Trigger', body: 'Content' }
		});
		await expect.element(screen.getByText('My Trigger')).toBeInTheDocument();
		await expect.element(screen.getByText('Content')).toBeInTheDocument();
	});

	it('starts open by default', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Details', body: 'Visible content' }
		});

		const trigger = screen.getByRole('button', { name: /Details/ });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Visible content')).toBeVisible();
	});

	it('toggles content on click', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Details', body: 'Collapsible content' }
		});

		const trigger = screen.getByRole('button', { name: /Details/ });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Collapsible content')).toBeVisible();

		// Click to collapse
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByText('Collapsible content')).not.toBeVisible();

		// Click to expand
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Collapsible content')).toBeVisible();
	});

	it('starts collapsed when defaultIsOpen is false', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Details', body: 'Hidden content', defaultIsOpen: false }
		});

		const trigger = screen.getByRole('button', { name: /Details/ });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByText('Hidden content')).not.toBeVisible();
	});

	it('links the trigger to its content region via aria-controls', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Details', body: 'Region content' }
		});

		const trigger = screen.getByRole('button', { name: /Details/ }).element() as HTMLElement;
		const controlsId = trigger.getAttribute('aria-controls');
		// aria-controls must be present and point at the real content region.
		expect(controlsId).toBeTruthy();
		const region = document.getElementById(controlsId as string);
		expect(region).not.toBeNull();
		expect((region as HTMLElement).contains(screen.getByText('Region content').element())).toBe(
			true
		);
	});

	it('respects controlled isOpen/onOpenChange', async () => {
		const onOpenChange = vi.fn();

		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Controlled', body: 'Controlled content', isOpen: true, onOpenChange }
		});

		const trigger = screen.getByRole('button', { name: /Controlled/ });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Controlled content')).toBeVisible();

		// Click should call onOpenChange, not change internal state
		await userEvent.click(trigger);
		expect(onOpenChange).toHaveBeenCalledWith(false);

		// Rerender with isOpen=false to actually close
		await screen.rerender({
			trigger: 'Controlled',
			body: 'Controlled content',
			isOpen: false,
			onOpenChange
		});
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByText('Controlled content')).not.toBeVisible();
	});

	it('self-toggles in uncontrolled mode even when onOpenChange is supplied', async () => {
		// Regression: passing onOpenChange without isOpen must NOT make the
		// component behave as controlled. Internal state should still drive
		// visibility, and the callback should fire in addition.
		const onOpenChange = vi.fn();
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Uncontrolled', body: 'Uncontrolled content', onOpenChange }
		});

		const trigger = screen.getByRole('button', { name: /Uncontrolled/ });
		// Starts open (defaultIsOpen defaults to true).
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Uncontrolled content')).toBeVisible();

		// Click collapses via internal state AND notifies.
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(screen.getByText('Uncontrolled content')).not.toBeVisible();
		expect(onOpenChange).toHaveBeenNthCalledWith(1, false);

		// Click again re-expands — proving the component isn't stuck.
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Uncontrolled content')).toBeVisible();
		expect(onOpenChange).toHaveBeenNthCalledWith(2, true);
	});

	it('renders chevron indicator', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'With Chevron', body: 'Content' }
		});

		const trigger = screen.getByRole('button', { name: /With Chevron/ }).element() as HTMLElement;
		const svg = trigger.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(svg).toHaveAttribute('aria-hidden');
	});

	it('activates via keyboard (Enter and Space)', async () => {
		const screen = await render(CollapsibleProbe, {
			props: { trigger: 'Keyboard', body: 'Content' }
		});

		const trigger = screen.getByRole('button', { name: /Keyboard/ });
		(trigger.element() as HTMLElement).focus();

		// Enter key
		await userEvent.keyboard('{Enter}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		// Space key
		await userEvent.keyboard(' ');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});
});

// =============================================================================
// CollapsibleGroup — coordination context
// =============================================================================

describe('CollapsibleGroup', () => {
	it('renders children without wrapper DOM', async () => {
		const screen = await render(CollapsibleGroupProbe, {
			props: { items: [{ trigger: 'Item 1', value: '1', body: 'Content 1' }] }
		});

		await expect.element(screen.getByText('Content 1')).toBeInTheDocument();
	});

	describe('single mode', () => {
		it('only allows one item open at a time', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'a',
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' },
						{ trigger: 'Item C', value: 'c', body: 'Content C' }
					]
				}
			});

			// A starts open
			await expect.element(screen.getByText('Content A')).toBeVisible();
			await expect.element(screen.getByText('Content B')).not.toBeVisible();
			await expect.element(screen.getByText('Content C')).not.toBeVisible();

			// Open B — A should close
			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
			await expect.element(screen.getByText('Content C')).not.toBeVisible();

			// Open C — B should close
			await userEvent.click(screen.getByRole('button', { name: /Item C/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).not.toBeVisible();
			await expect.element(screen.getByText('Content C')).toBeVisible();
		});

		it('closes the open item when clicking it again', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'a',
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			await expect.element(screen.getByText('Content A')).toBeVisible();
			await userEvent.click(screen.getByRole('button', { name: /Item A/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
		});
	});

	describe('multiple mode', () => {
		it('allows multiple items to be open simultaneously', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'multiple',
					defaultValue: ['a'],
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			await expect.element(screen.getByText('Content A')).toBeVisible();
			await expect.element(screen.getByText('Content B')).not.toBeVisible();

			// Open B — A should stay open
			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			await expect.element(screen.getByText('Content A')).toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();

			// Close A — B should stay open
			await userEvent.click(screen.getByRole('button', { name: /Item A/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});
	});

	describe('controlled mode', () => {
		it('respects value and onChange', async () => {
			const onChange = vi.fn();

			const items = [
				{ trigger: 'Item A', value: 'a', body: 'Content A' },
				{ trigger: 'Item B', value: 'b', body: 'Content B' }
			];
			const screen = await render(CollapsibleGroupProbe, {
				props: { type: 'single', value: 'a', onChange, items }
			});

			await expect.element(screen.getByText('Content A')).toBeVisible();
			await expect.element(screen.getByText('Content B')).not.toBeVisible();

			// Click B — should call onChange
			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			expect(onChange).toHaveBeenCalledWith('b');

			// Rerender with new value
			await screen.rerender({ type: 'single', value: 'b', onChange, items });
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});
	});

	describe('defaultValue', () => {
		it('opens the specified item by default', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					defaultValue: 'b',
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});

		it('opens multiple items by default in multiple mode', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'multiple',
					defaultValue: ['a', 'c'],
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' },
						{ trigger: 'Item C', value: 'c', body: 'Content C' }
					]
				}
			});

			await expect.element(screen.getByText('Content A')).toBeVisible();
			await expect.element(screen.getByText('Content B')).not.toBeVisible();
			await expect.element(screen.getByText('Content C')).toBeVisible();
		});
	});

	describe('standalone vs group', () => {
		it('collapsible inside group defers to group context', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'a',
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			// Opening B should close A (group coordinates)
			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});

		it('collapsible outside group manages its own state', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'Standalone', body: 'Standalone content' }
			});

			const trigger = screen.getByRole('button', { name: /Standalone/ });
			await expect.element(screen.getByText('Standalone content')).toBeVisible();

			await userEvent.click(trigger);
			await expect.element(screen.getByText('Standalone content')).not.toBeVisible();

			await userEvent.click(trigger);
			await expect.element(screen.getByText('Standalone content')).toBeVisible();
		});
	});

	describe('accessibility', () => {
		it('sets aria-expanded on triggers', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'a',
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			await expect
				.element(screen.getByRole('button', { name: /Item A/ }))
				.toHaveAttribute('aria-expanded', 'true');
			await expect
				.element(screen.getByRole('button', { name: /Item B/ }))
				.toHaveAttribute('aria-expanded', 'false');
		});

		it('supports keyboard activation', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			const trigger = screen.getByRole('button', { name: /Item A/ });
			(trigger.element() as HTMLElement).focus();
			await userEvent.keyboard('{Enter}');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('dividers', () => {
		it('renders no wrapper DOM by default and with hasDividers={false}', async () => {
			const items = [{ trigger: 'Item A', value: 'a', body: 'Content A' }];
			const screen = await render(CollapsibleGroupProbe, { props: { items } });
			expect(screen.container.querySelector('.astryx-collapsible-group')).toBeNull();

			await screen.rerender({ hasDividers: false, items });
			expect(screen.container.querySelector('.astryx-collapsible-group')).toBeNull();
		});

		it('renders a wrapper with default density when dividers are enabled', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					hasDividers: true,
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			const wrapper = screen.container.querySelector('.astryx-collapsible-group');
			expect(wrapper).not.toBeNull();
			// Divided groups default to balanced density
			expect(wrapper).toHaveAttribute('data-density', 'balanced');
			const a = itemRoot(screen.getByRole('button', { name: /Item A/ }).element() as HTMLElement);
			const b = itemRoot(screen.getByRole('button', { name: /Item B/ }).element() as HTMLElement);
			expect((wrapper as HTMLElement).contains(a)).toBe(true);
			expect((wrapper as HTMLElement).contains(b)).toBe(true);
		});

		it('reflects density on each item when dividers are enabled', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					hasDividers: true,
					density: 'compact',
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			const item = itemRoot(
				screen.getByRole('button', { name: /Item A/ }).element() as HTMLElement
			);
			expect(item).toHaveAttribute('data-density', 'compact');
		});

		it('does not reflect divider chrome on items without dividers', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: { items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }] }
			});

			const item = itemRoot(
				screen.getByRole('button', { name: /Item A/ }).element() as HTMLElement
			);
			expect(item).not.toHaveAttribute('data-density');
		});

		it('applies density without dividers (and without a wrapper)', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					density: 'spacious',
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			expect(screen.container.querySelector('.astryx-collapsible-group')).toBeNull();
			const item = itemRoot(
				screen.getByRole('button', { name: /Item A/ }).element() as HTMLElement
			);
			expect(item).toHaveAttribute('data-density', 'spacious');
		});

		it('does not leak divider chrome into nested collapsibles', async () => {
			const screen = await render(CollapsibleNestedProbe, { props: { defaultValue: 'outer' } });

			const outer = itemRoot(
				screen.getByRole('button', { name: /Outer/ }).element() as HTMLElement
			);
			const nested = itemRoot(
				screen.getByRole('button', { name: /Nested/ }).element() as HTMLElement
			);
			expect(outer).toHaveAttribute('data-density', 'balanced');
			expect(nested).not.toHaveAttribute('data-density');
		});

		it('keeps group coordination working with dividers enabled', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					hasDividers: true,
					defaultValue: 'a',
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A' },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			await expect.element(screen.getByText('Content A')).toBeVisible();
			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});

		it('applies xstyle/className/style to the wrapper in divider mode', async () => {
			// Upstream passes `className`; our equivalent prop is `class`.
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					hasDividers: true,
					class: 'custom-class',
					'data-testid': 'group',
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			const wrapper = screen.container.querySelector('.astryx-collapsible-group');
			expect(wrapper).toHaveClass('custom-class');
			expect(wrapper).toHaveAttribute('data-testid', 'group');
		});

		// Counterpart to upstream's `forwards ref to the wrapper in divider mode`;
		// an attachment through the rest props reaches the wrapper div and receives it.
		it('forwards ref to the wrapper in divider mode', async () => {
			const attached = vi.fn();
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					hasDividers: true,
					[createAttachmentKey()]: attached,
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			const wrapper = screen.container.querySelector('.astryx-collapsible-group');
			expect(attached).toHaveBeenCalledOnce();
			expect(attached.mock.calls[0][0]).toBe(wrapper);
		});

		it('explicit density overrides the divider default', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					hasDividers: true,
					density: 'spacious',
					items: [{ trigger: 'Item A', value: 'a', body: 'Content A' }]
				}
			});

			const wrapper = screen.container.querySelector('.astryx-collapsible-group');
			expect(wrapper).toHaveAttribute('data-density', 'spacious');
			const item = itemRoot(
				screen.getByRole('button', { name: /Item A/ }).element() as HTMLElement
			);
			expect(item).toHaveAttribute('data-density', 'spacious');
		});

		it('tolerates interleaved non-Collapsible children', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					hasDividers: true,
					defaultValue: 'a',
					items: [
						{ trigger: 'Item A', value: 'a', body: 'Content A', separatorAfter: true },
						{ trigger: 'Item B', value: 'b', body: 'Content B' }
					]
				}
			});

			await expect.element(screen.getByTestId('separator')).toBeInTheDocument();
			const a = itemRoot(screen.getByRole('button', { name: /Item A/ }).element() as HTMLElement);
			const b = itemRoot(screen.getByRole('button', { name: /Item B/ }).element() as HTMLElement);
			expect(a).toHaveAttribute('data-density', 'balanced');
			expect(b).toHaveAttribute('data-density', 'balanced');
			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});

		it('lets a nested group define its own chrome instead of inheriting', async () => {
			const screen = await render(CollapsibleNestedGroupProbe);

			const outer = itemRoot(
				screen.getByRole('button', { name: /Outer/ }).element() as HTMLElement
			);
			const innerDivided = itemRoot(
				screen.getByRole('button', { name: /Inner divided/ }).element() as HTMLElement
			);
			const innerPlain = itemRoot(
				screen.getByRole('button', { name: /Inner plain/ }).element() as HTMLElement
			);
			expect(outer).toHaveAttribute('data-density', 'balanced');
			expect(innerDivided).toHaveAttribute('data-density', 'compact');
			expect(innerPlain).not.toHaveAttribute('data-density');
		});

		it('keeps controlled coordination and onChange shape with dividers', async () => {
			const onChange = vi.fn();
			const items = [
				{ trigger: 'Item A', value: 'a', body: 'Content A' },
				{ trigger: 'Item B', value: 'b', body: 'Content B' }
			];
			const screen = await render(CollapsibleGroupProbe, {
				props: { type: 'single', hasDividers: true, value: 'a', onChange, items }
			});

			await userEvent.click(screen.getByRole('button', { name: /Item B/ }));
			expect(onChange).toHaveBeenCalledWith('b');
			// Controlled: nothing opens until the parent passes the new value
			await expect.element(screen.getByText('Content B')).not.toBeVisible();

			await screen.rerender({ type: 'single', hasDividers: true, value: 'b', onChange, items });
			await expect.element(screen.getByText('Content A')).not.toBeVisible();
			await expect.element(screen.getByText('Content B')).toBeVisible();
		});

		it('renders standalone Collapsible without any group chrome', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'Alone', body: 'Standalone content' }
			});

			const item = itemRoot(screen.getByRole('button', { name: /Alone/ }).element() as HTMLElement);
			expect(item).not.toHaveAttribute('data-density');
			expect(item.querySelector('.astryx-collapsible-group')).toBeNull();
		});
	});
});
