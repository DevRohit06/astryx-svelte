import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import ToolbarFixture from './fixtures/toolbar-fixture.svelte';

/**
 * Ported from Astryx's `Toolbar/Toolbar.test.tsx`, all 25 cases.
 *
 * Every case goes through `toolbar-fixture.svelte` — the three content slots are
 * snippets here, and a snippet can only be authored in a template.
 *
 * One case is a **counterpart**, commented where it appears:
 * **`forwards ref to root element`**. Upstream's `ref` goes to the `Section`
 * root; the port has no `ref`, and its rest props reach the inner
 * `role="toolbar"` div (which is where upstream's `{...props}` go too). The
 * attachment therefore lands on the toolbar element rather than the Section
 * wrapper — upstream asserts only `expect.any(HTMLElement)`, which still holds.
 *
 * Runs in the **client** (real Chromium) project: every focus case moves real
 * focus, and the caret-guard case needs a real text input with a real selection.
 */

const cutCopyPaste = ['Cut', 'Copy', 'Paste'];

describe('Toolbar', () => {
	it('renders with toolbar role', async () => {
		const screen = await render(ToolbarFixture, { props: { props: { label: 'Actions' } } });
		await expect.element(screen.getByRole('toolbar')).toBeInTheDocument();
	});

	it('renders aria-label from label prop', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Formatting actions' } }
		});
		await expect
			.element(screen.getByRole('toolbar'))
			.toHaveAttribute('aria-label', 'Formatting actions');
	});

	it('renders startContent slot', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, startTestid: 'start' }
		});
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
	});

	it('renders endContent slot', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, endTestid: 'end' }
		});
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('renders centerContent slot', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, centerTestid: 'center' }
		});
		await expect.element(screen.getByTestId('center')).toBeInTheDocument();
	});

	it('renders all three slots together', async () => {
		const screen = await render(ToolbarFixture, {
			props: {
				props: { label: 'Actions' },
				startTestid: 'start',
				centerTestid: 'center',
				endTestid: 'end'
			}
		});
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
		await expect.element(screen.getByTestId('center')).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();

		// Three-slot layout produces 3 child divs (plus the aria-hidden
		// keyboard-hint popover, which is excluded here as an implementation detail)
		const toolbar = screen.getByRole('toolbar').element();
		expect(toolbar.querySelectorAll(':scope > :not([popover])')).toHaveLength(3);
	});

	it('renders two-slot layout without centerContent', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, startTestid: 'start', endTestid: 'end' }
		});
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();

		const toolbar = screen.getByRole('toolbar').element();
		expect(toolbar.querySelectorAll(':scope > :not([popover])')).toHaveLength(2);
	});

	it('renders start-only layout', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, startTestid: 'start' }
		});
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
		const toolbar = screen.getByRole('toolbar').element();
		expect(toolbar.querySelectorAll(':scope > :not([popover])')).toHaveLength(1);
	});

	it('renders end-only layout', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, endTestid: 'end' }
		});
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
		const toolbar = screen.getByRole('toolbar').element();
		expect(toolbar.querySelectorAll(':scope > :not([popover])')).toHaveLength(1);
	});

	it('sets aria-orientation to horizontal by default', async () => {
		const screen = await render(ToolbarFixture, { props: { props: { label: 'Actions' } } });
		await expect
			.element(screen.getByRole('toolbar'))
			.toHaveAttribute('aria-orientation', 'horizontal');
	});

	it('sets aria-orientation to vertical', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', orientation: 'vertical' } }
		});
		await expect
			.element(screen.getByRole('toolbar'))
			.toHaveAttribute('aria-orientation', 'vertical');
	});

	it('applies size class', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', size: 'sm' } }
		});
		expect(screen.getByRole('toolbar').element().className).toContain('sm');
	});

	it('defaults to md size', async () => {
		const screen = await render(ToolbarFixture, { props: { props: { label: 'Actions' } } });
		expect(screen.getByRole('toolbar').element().className).toContain('md');
	});

	it('applies lg size class', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', size: 'lg' } }
		});
		expect(screen.getByRole('toolbar').element().className).toContain('lg');
	});

	it('forwards an attachment to the toolbar element', async () => {
		// Upstream's `forwards ref to root element`. See the header note: the port
		// has no `ref`, so the attachment travels in the rest props and lands where
		// they do — the `role="toolbar"` div, not the `Section` wrapper.
		const attached = vi.fn();
		await render(ToolbarFixture, {
			props: {
				props: { label: 'Actions', [createAttachmentKey()]: (node: Element) => attached(node) }
			}
		});
		expect(attached).toHaveBeenCalledWith(expect.any(HTMLElement));
	});

	it('passes variant to Section', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', variant: 'muted' } }
		});
		// Section renders with an astryx-section class containing the variant
		const sectionInner = screen.container.querySelector('.astryx-section');
		expect(sectionInner).toBeInTheDocument();
		expect(sectionInner?.className).toContain('muted');
	});

	it('defaults to transparent variant', async () => {
		const screen = await render(ToolbarFixture, { props: { props: { label: 'Actions' } } });
		const sectionInner = screen.container.querySelector('.astryx-section');
		expect(sectionInner).toBeInTheDocument();
		expect(sectionInner?.className).toContain('transparent');
	});

	it('navigates with ArrowRight/ArrowLeft in horizontal orientation', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, startButtons: cutCopyPaste }
		});

		const buttons = Array.from(screen.container.querySelectorAll('button'));
		buttons[0].focus();
		expect(document.activeElement).toBe(buttons[0]);

		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(buttons[1]);

		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(buttons[2]);

		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(buttons[1]);
	});

	it('navigates with ArrowDown/ArrowUp in vertical orientation', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', orientation: 'vertical' }, startButtons: cutCopyPaste }
		});

		const buttons = Array.from(screen.container.querySelectorAll('button'));
		buttons[0].focus();
		expect(document.activeElement).toBe(buttons[0]);

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(buttons[1]);

		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(buttons[0]);
	});

	it('supports Home and End keys', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, startButtons: cutCopyPaste }
		});

		const buttons = Array.from(screen.container.querySelectorAll('button'));
		buttons[1].focus();

		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(buttons[2]);

		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(buttons[0]);
	});

	it('spreads additional HTML attributes to toolbar element', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', 'data-testid': 'my-toolbar' } }
		});
		expect(screen.getByTestId('my-toolbar').element()).toBe(screen.getByRole('toolbar').element());
	});

	it('is a single tab stop — only one item is tabbable (navigation-3)', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions' }, startButtons: cutCopyPaste }
		});
		const buttons = Array.from(screen.container.querySelectorAll('button'));
		const tabbable = buttons.filter((b) => b.getAttribute('tabindex') === '0');
		expect(tabbable).toHaveLength(1);
		expect(buttons[0]).toHaveAttribute('tabindex', '0');
		expect(buttons[1]).toHaveAttribute('tabindex', '-1');
		expect(buttons[2]).toHaveAttribute('tabindex', '-1');
	});

	it('does not steal caret keys from a text input mid-line (navigation-4)', async () => {
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Search' }, hasStartInput: true }
		});
		const inputEl = screen.container.querySelector('input');
		if (!(inputEl instanceof HTMLInputElement)) {
			throw new Error('expected an input');
		}
		inputEl.focus();
		inputEl.setSelectionRange(1, 1); // caret mid-line
		await userEvent.keyboard('{ArrowRight}');
		// Caret movement stays in the input; focus is not stolen by the toolbar.
		expect(document.activeElement).toBe(inputEl);
	});

	it('composes consumer onKeyDown with internal arrow navigation', async () => {
		const onkeydown = vi.fn();
		const screen = await render(ToolbarFixture, {
			props: { props: { label: 'Actions', onkeydown }, startButtons: ['Cut', 'Copy'] }
		});

		const buttons = Array.from(screen.container.querySelectorAll('button'));
		buttons[0].focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(onkeydown).toHaveBeenCalled();
		expect(buttons[1]).toHaveFocus();
	});

	it('respects preventDefault from consumer onKeyDown', async () => {
		const screen = await render(ToolbarFixture, {
			props: {
				props: { label: 'Actions', onkeydown: (e: KeyboardEvent) => e.preventDefault() },
				startButtons: ['Cut', 'Copy']
			}
		});

		const buttons = Array.from(screen.container.querySelectorAll('button'));
		buttons[0].focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(buttons[0]).toHaveFocus();
	});
});
