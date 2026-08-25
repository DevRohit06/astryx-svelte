import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import CollapsibleProbe from './fixtures/collapsible-probe.svelte';
import CollapsibleGroupProbe from './fixtures/collapsible-group-probe.svelte';

/**
 * Astryx's `Collapsible/Collapsible.test.tsx`, ported case for case.
 *
 * Upstream at the **0.5.0** pin has **36** `it` cases across seven describe
 * blocks (8 structure, 7 uncontrolled, 4 controlled, 6 disabled, 3
 * prop-forwarding, 4 single-group, 2 multiple-group, 2 presentation). **35 are
 * ported here; 1 is dropped** (`exposes a displayName for devtools`, below).
 * Upstream's file is unchanged between v0.3.0 — where this header last stated
 * the count — and 0.5.0, so the 36 and the block breakdown carry over intact.
 *
 * (The previous header said "**35** … 7 structure … 34 ported, 1 dropped". The
 * structure block has 8: `renders the stable astryx-collapsible-trigger class on
 * the trigger button` was unported and unnamed. It is ported here and passed on
 * the first run.)
 *
 * Because `Collapsible`'s `children` is a `Snippet` and cannot be authored in a
 * `.ts` test, every standalone case renders through `collapsible-probe.svelte`
 * (body described by `body`/`childTestId` props) and every group case through
 * `collapsible-group-probe.svelte` (items described by an array). See those files.
 *
 * `act()` has no counterpart — a `$state` write flushes on its own and
 * `expect.element` retries. `render` is async (`vitest-browser-svelte` v3), so it
 * is always awaited. `.element()` is cast to `HTMLElement` before DOM-only methods
 * (svelte-check requirement).
 *
 * Translations (each noted at its case, assertions unchanged where possible):
 * - `exposes a displayName for devtools` — DROPPED. Svelte has no `displayName`
 *   surface; `Context` keeps its name private. Named per the count contract.
 * - `forwards a ref to the root element` — COUNTERPART. There is no `ref` prop here;
 *   the way a consumer reaches the root is an attachment travelling through the rest
 *   props. It receives the element (asserted `instanceof HTMLDivElement`, matching
 *   upstream's `expect.any(HTMLDivElement)`), which is strictly more than proving a
 *   callback ran.
 */

/**
 * Resolves the content region a trigger controls via aria-controls, so tests
 * assert the real disclosure linkage rather than guessing at DOM structure.
 */
function contentFor(trigger: HTMLElement): HTMLElement {
	const id = trigger.getAttribute('aria-controls');
	expect(id).toBeTruthy();
	const el = document.getElementById(id as string);
	expect(el).not.toBeNull();
	return el as HTMLElement;
}

describe('Collapsible', () => {
	describe('structure and rendering', () => {
		it('renders the trigger content inside a button', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'Details', body: 'Body' }
			});
			const button = screen.getByRole('button');
			await expect.element(button).toHaveTextContent('Details');
			expect((button.element() as HTMLElement).tagName).toBe('BUTTON');
		});

		it('renders the trigger button with an explicit type="button"', async () => {
			// Prevents implicit form submission when used inside a <form>.
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'c' } });
			await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'button');
		});

		it('renders children inside the controlled content region', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'Section', childTestId: 'child', body: 'Hello' }
			});
			const button = screen.getByRole('button').element() as HTMLElement;
			const content = contentFor(button);
			expect(content.contains(screen.getByTestId('child').element())).toBe(true);
		});

		it('links the trigger to its content via aria-controls', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			const button = screen.getByRole('button').element() as HTMLElement;
			const content = contentFor(button);
			expect(button.getAttribute('aria-controls')).toBe(content.id);
		});

		it('renders the stable astryx-collapsible class on the root', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'c', 'data-testid': 'root' }
			});
			await expect.element(screen.getByTestId('root')).toHaveClass('astryx-collapsible');
		});

		it('renders the stable astryx-collapsible-trigger class on the trigger button', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'c' } });
			await expect.element(screen.getByRole('button')).toHaveClass('astryx-collapsible-trigger');
		});

		it('renders the stable astryx-collapsible-content class on the content area', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'c' } });
			const button = screen.getByRole('button').element() as HTMLElement;
			const content = contentFor(button);
			expect(content).toHaveClass('astryx-collapsible-content');
		});

		it('renders a ReactNode trigger, not just a string', async () => {
			const screen = await render(CollapsibleProbe, { props: { richTrigger: true, body: 'c' } });
			await expect.element(screen.getByTestId('rich')).toBeInTheDocument();
		});
	});

	describe('uncontrolled open state', () => {
		it('is open by default (aria-expanded="true")', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			await expect.element(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
		});

		it('honors defaultIsOpen={false} (starts collapsed)', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', defaultIsOpen: false }
			});
			await expect.element(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
		});

		it('toggles open/closed when the trigger is clicked', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			const button = screen.getByRole('button');

			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
			await userEvent.click(button);
			await expect.element(button).toHaveAttribute('aria-expanded', 'false');
			await userEvent.click(button);
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		});

		it('opens a default-collapsed instance on click', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', defaultIsOpen: false }
			});
			const button = screen.getByRole('button');
			await userEvent.click(button);
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		});

		it('toggles via keyboard activation (Enter and Space)', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			const button = screen.getByRole('button');
			const buttonEl = button.element() as HTMLElement;

			buttonEl.focus();
			await expect.element(button).toHaveFocus();

			await userEvent.keyboard('{Enter}');
			await expect.element(button).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard(' ');
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		});

		it('hides the content region (display:none) only when collapsed', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			const button = screen.getByRole('button');
			const content = contentFor(button.element() as HTMLElement);

			// Open: not display:none.
			await expect.element(content).not.toHaveStyle({ display: 'none' });
			await userEvent.click(button);
			// Collapsed: hidden via the contentHidden style.
			await expect.element(content).toHaveStyle({ display: 'none' });
		});

		it('rotates the chevron indicator between open and closed states', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			const button = screen.getByRole('button');
			// The chevron lives in the last span of the trigger button.
			const chevron = (button.element() as HTMLElement).querySelectorAll('span')[1];
			const openClass = chevron.getAttribute('class');

			await userEvent.click(button);
			await expect.element(button).toHaveAttribute('aria-expanded', 'false');
			const closedClass = chevron.getAttribute('class');
			expect(closedClass).not.toEqual(openClass);
		});
	});

	describe('controlled open state', () => {
		it('reflects the isOpen prop', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isOpen: false }
			});
			await expect.element(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');

			await screen.rerender({ trigger: 'T', body: 'Body', isOpen: true });
			await expect.element(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
		});

		it('calls onOpenChange with the negated state on click', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isOpen: false, onOpenChange }
			});
			await userEvent.click(screen.getByRole('button'));
			expect(onOpenChange).toHaveBeenCalledTimes(1);
			expect(onOpenChange).toHaveBeenCalledWith(true);
		});

		it('does not self-update when controlled without onOpenChange', async () => {
			// A controlled instance is driven entirely by the isOpen prop; a click
			// must not flip the visual state on its own.
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isOpen: false }
			});
			const button = screen.getByRole('button');
			await userEvent.click(button);
			await expect.element(button).toHaveAttribute('aria-expanded', 'false');
		});

		it('stays put until the parent updates isOpen', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isOpen: false, onOpenChange }
			});
			const button = screen.getByRole('button');
			await userEvent.click(button);
			// Still closed — parent hasn't re-rendered with the new value yet.
			await expect.element(button).toHaveAttribute('aria-expanded', 'false');

			await screen.rerender({ trigger: 'T', body: 'Body', isOpen: true, onOpenChange });
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('disabled state', () => {
		it('marks the trigger aria-disabled and drops it from the tab order', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isDisabled: true }
			});
			const button = screen.getByRole('button');
			await expect.element(button).toHaveAttribute('aria-disabled', 'true');
			await expect.element(button).toHaveAttribute('tabindex', '-1');
			// Never the native disabled attribute — it stays focusable/perceivable.
			// RESTATED: upstream asserts `not.toBeDisabled()`. In this browser project
			// jest-dom's `toBeDisabled` treats `aria-disabled="true"` as disabled
			// (React's does not), so it would assert the matcher's heuristic rather
			// than the component. The title's real claim — no *native* disabled
			// attribute — is checked directly, which is what upstream meant.
			await expect.element(button).not.toHaveAttribute('disabled');
		});

		it('is enabled by default (no aria-disabled, stays in tab order)', async () => {
			const screen = await render(CollapsibleProbe, { props: { trigger: 'T', body: 'Body' } });
			const button = screen.getByRole('button');
			await expect.element(button).not.toHaveAttribute('aria-disabled');
			await expect.element(button).not.toHaveAttribute('tabindex', '-1');
		});

		it('does not toggle when the trigger is clicked while disabled', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isDisabled: true, defaultIsOpen: true }
			});
			const button = screen.getByRole('button');
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
			// aria-disabled makes Playwright's actionability refuse a userEvent.click,
			// which would assert the heuristic rather than the component's guard; the
			// click is delivered natively (upstream's fireEvent.click) so handleToggle
			// still runs and hits the isDisabled guard.
			(button.element() as HTMLElement).click();
			await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		});

		it('does not fire onOpenChange while disabled', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isDisabled: true, onOpenChange }
			});
			(screen.getByRole('button').element() as HTMLElement).click();
			expect(onOpenChange).not.toHaveBeenCalled();
		});

		it('does not collapse an already-open item — content stays visible', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'Body', isDisabled: true, defaultIsOpen: true }
			});
			const content = contentFor(screen.getByRole('button').element() as HTMLElement);
			await expect.element(content).not.toHaveStyle({ display: 'none' });
		});

		it('does not toggle its group item when disabled', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					items: [
						{ trigger: 'A', value: 'a', body: 'Body A', isDisabled: true },
						{ trigger: 'B', value: 'b', body: 'Body B' }
					]
				}
			});
			const triggerA = screen.getByRole('button', { name: /A/ });
			(triggerA.element() as HTMLElement).click();
			await expect.element(triggerA).toHaveAttribute('aria-expanded', 'false');
		});
	});

	describe('prop forwarding', () => {
		// Counterpart to upstream's `forwards a ref to the root element`; see the
		// file header. An attachment through the rest props is how a consumer reaches
		// the root here, and it receives the element rather than only proving a call.
		it('forwards a ref to the root element', async () => {
			const attached = vi.fn();
			await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'c', [createAttachmentKey()]: attached }
			});
			expect(attached).toHaveBeenCalledOnce();
			expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
		});

		it('passes through data-testid and other DOM props to the root', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'T', body: 'c', 'data-testid': 'root', 'data-custom': 'x' }
			});
			await expect.element(screen.getByTestId('root')).toHaveAttribute('data-custom', 'x');
		});

		// DROPPED: `exposes a displayName for devtools`. Svelte has no displayName
		// surface; there is nothing to assert. Named per the count contract.
	});

	describe('inside CollapsibleGroup (single mode)', () => {
		it('opens the item matching defaultValue and closes the rest', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'b',
					items: [
						{ trigger: 'A', value: 'a', body: 'Body A' },
						{ trigger: 'B', value: 'b', body: 'Body B' }
					]
				}
			});
			const a = screen.getByRole('button', { name: /A/ });
			const b = screen.getByRole('button', { name: /B/ });
			await expect.element(a).toHaveAttribute('aria-expanded', 'false');
			await expect.element(b).toHaveAttribute('aria-expanded', 'true');
		});

		it('opening one item closes the previously open item', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'a',
					items: [
						{ trigger: 'A', value: 'a', body: 'Body A' },
						{ trigger: 'B', value: 'b', body: 'Body B' }
					]
				}
			});
			const a = screen.getByRole('button', { name: /A/ });
			const b = screen.getByRole('button', { name: /B/ });
			await expect.element(a).toHaveAttribute('aria-expanded', 'true');

			await userEvent.click(b);
			await expect.element(a).toHaveAttribute('aria-expanded', 'false');
			await expect.element(b).toHaveAttribute('aria-expanded', 'true');
		});

		it('clicking the open item closes it (single mode allows all-closed)', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					defaultValue: 'a',
					items: [{ trigger: 'A', value: 'a', body: 'Body A' }]
				}
			});
			const a = screen.getByRole('button');
			await userEvent.click(a);
			await expect.element(a).toHaveAttribute('aria-expanded', 'false');
		});

		it('fires the group onChange with the newly opened value', async () => {
			const onChange = vi.fn();
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					onChange,
					items: [{ trigger: 'A', value: 'a', body: 'Body A' }]
				}
			});
			await userEvent.click(screen.getByRole('button'));
			expect(onChange).toHaveBeenCalledWith('a');
		});
	});

	describe('inside CollapsibleGroup (multiple mode)', () => {
		it('allows several items open at once', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'multiple',
					defaultValue: ['a'],
					items: [
						{ trigger: 'A', value: 'a', body: 'Body A' },
						{ trigger: 'B', value: 'b', body: 'Body B' }
					]
				}
			});
			const a = screen.getByRole('button', { name: /A/ });
			const b = screen.getByRole('button', { name: /B/ });
			await expect.element(a).toHaveAttribute('aria-expanded', 'true');
			await expect.element(b).toHaveAttribute('aria-expanded', 'false');

			await userEvent.click(b);
			// Opening B does not close A in multiple mode.
			await expect.element(a).toHaveAttribute('aria-expanded', 'true');
			await expect.element(b).toHaveAttribute('aria-expanded', 'true');
		});

		it('fires onChange with the full array of open values', async () => {
			const onChange = vi.fn();
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'multiple',
					defaultValue: ['a'],
					onChange,
					items: [
						{ trigger: 'A', value: 'a', body: 'Body A' },
						{ trigger: 'B', value: 'b', body: 'Body B' }
					]
				}
			});
			await userEvent.click(screen.getByRole('button', { name: /B/ }));
			expect(onChange).toHaveBeenCalledWith(['a', 'b']);
		});
	});

	describe('group presentation (dividers + density)', () => {
		it('reflects group density as a data attribute on items when dividers are enabled', async () => {
			const screen = await render(CollapsibleGroupProbe, {
				props: {
					type: 'single',
					hasDividers: true,
					density: 'compact',
					items: [{ trigger: 'A', value: 'a', body: 'Body A', 'data-testid': 'item-a' }]
				}
			});
			await expect.element(screen.getByTestId('item-a')).toHaveAttribute('data-density', 'compact');
		});

		it('omits density data attribute when standalone (no group)', async () => {
			const screen = await render(CollapsibleProbe, {
				props: { trigger: 'A', body: 'Body', 'data-testid': 'item' }
			});
			await expect.element(screen.getByTestId('item')).not.toHaveAttribute('data-density');
		});
	});
});
