import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import Divider from '$lib/components/divider/divider.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Ported from Astryx's `Divider/Divider.test.tsx`, all sixteen cases at the 0.5.0
 * pin.
 *
 * The suite had no counterpart here until 17c, which is what made it worth
 * porting rather than recording: the batch gives `Divider` its `aria-labelledby`
 * naming, and five of upstream's cases are about exactly that.
 *
 * Two restatements, both the repo's standing ones:
 *
 * - `forwards ref correctly` becomes the attachment counterpart — `Divider`
 *   rest-spreads onto its root `<div>`, so an attachment in the rest props
 *   reaches the same element upstream's `ref` does.
 * - the `ReactNode` label cases go through `slot-probe.svelte`, since a snippet
 *   can only be authored in a template. The probe renders a `<span>` with the
 *   given text, which is what both cases assert against.
 */

describe('Divider', () => {
	it('renders horizontal by default', async () => {
		const screen = await render(Divider, { props: { 'data-testid': 'divider' } });
		const element = screen.getByTestId('divider');
		await expect.element(element).toBeInTheDocument();
		await expect.element(element).toHaveAttribute('role', 'separator');
		await expect.element(element).toHaveAttribute('aria-orientation', 'horizontal');
		// Without label, should have 1 child (single line)
		expect(Array.from(element.element().children).length).toBe(1);
	});

	it('renders vertical when specified', async () => {
		const screen = await render(Divider, {
			props: { orientation: 'vertical', 'data-testid': 'divider' }
		});
		await expect
			.element(screen.getByTestId('divider'))
			.toHaveAttribute('aria-orientation', 'vertical');
	});

	it('renders with label', async () => {
		const screen = await render(Divider, { props: { label: 'Section' } });
		await expect.element(screen.getByText('Section')).toBeInTheDocument();
	});

	it('renders label centered with lines on both sides', async () => {
		const screen = await render(Divider, {
			props: { label: 'Center', 'data-testid': 'divider' }
		});
		const divider = screen.getByTestId('divider');
		await expect.element(divider).toBeInTheDocument();
		await expect.element(screen.getByText('Center')).toBeInTheDocument();
		// Should have 3 children: line, label, line
		expect(Array.from(divider.element().children).length).toBe(3);
	});

	it('applies isFullBleed styles', async () => {
		const screen = await render(Divider, {
			props: { isFullBleed: true, 'data-testid': 'divider' }
		});
		// isFullBleed is applied via stylex, we verify component renders without error
		await expect.element(screen.getByTestId('divider')).toBeInTheDocument();
	});

	it('applies subtle variant by default', async () => {
		const screen = await render(Divider, { props: { 'data-testid': 'divider' } });
		await expect.element(screen.getByTestId('divider')).toBeInTheDocument();
	});

	it('applies strong variant when specified', async () => {
		const screen = await render(Divider, {
			props: { variant: 'strong', 'data-testid': 'divider' }
		});
		await expect.element(screen.getByTestId('divider')).toBeInTheDocument();
	});

	it('forwards an attachment to the root element', async () => {
		// Upstream's `forwards ref correctly`.
		const attached = vi.fn();
		const screen = await render(Divider, {
			props: { [createAttachmentKey()]: (node: Element) => attached(node) }
		});
		expect(attached).toHaveBeenCalledWith(screen.container.firstElementChild);
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLDivElement);
	});

	it('passes through additional props', async () => {
		const screen = await render(Divider, {
			props: { 'data-testid': 'divider', 'aria-label': 'Content separator' }
		});
		await expect
			.element(screen.getByTestId('divider'))
			.toHaveAttribute('aria-label', 'Content separator');
	});

	it('renders with a snippet as label', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Divider,
				slot: 'label',
				text: 'Custom',
				testid: 'custom-label',
				rest: { 'data-testid': 'divider' }
			}
		});
		await expect.element(screen.getByTestId('custom-label')).toBeInTheDocument();
	});

	it('renders vertical divider with label', async () => {
		const screen = await render(Divider, {
			props: { orientation: 'vertical', label: 'Vertical', 'data-testid': 'divider' }
		});
		await expect
			.element(screen.getByTestId('divider'))
			.toHaveAttribute('aria-orientation', 'vertical');
		await expect.element(screen.getByText('Vertical')).toBeInTheDocument();
	});

	it('exposes the label as the accessible name of the separator', async () => {
		const screen = await render(Divider, {
			props: { label: 'Section', 'data-testid': 'divider' }
		});
		const divider = screen.getByTestId('divider');
		await expect.element(divider).toHaveAttribute('aria-labelledby');
		await expect.element(divider).toHaveAccessibleName('Section');
	});

	it('names the separator from a snippet label via aria-labelledby', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Divider,
				slot: 'label',
				text: 'Custom',
				rest: { 'data-testid': 'divider' }
			}
		});
		await expect.element(screen.getByTestId('divider')).toHaveAccessibleName('Custom');
	});

	it('does not set aria-labelledby without a label', async () => {
		const screen = await render(Divider, { props: { 'data-testid': 'divider' } });
		await expect.element(screen.getByTestId('divider')).not.toHaveAttribute('aria-labelledby');
	});

	it('prefers an explicit aria-label over the rendered label', async () => {
		const screen = await render(Divider, {
			props: { label: 'Section', 'aria-label': 'Custom name', 'data-testid': 'divider' }
		});
		const divider = screen.getByTestId('divider');
		await expect.element(divider).toHaveAccessibleName('Custom name');
		await expect.element(divider).not.toHaveAttribute('aria-labelledby');
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const screen = await render(Divider, {
			props: { variant: 'strong', orientation: 'vertical', 'data-testid': 'divider' }
		});
		const root = screen.getByTestId('divider').element();
		expect(root.className).toContain('astryx-divider');
		expect(root.className).toContain('strong');
		expect(root.className).toContain('vertical');
	});
});
