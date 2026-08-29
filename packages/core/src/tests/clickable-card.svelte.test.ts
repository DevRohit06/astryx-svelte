import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClickableCard from '$lib/components/clickable-card/clickable-card.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import ClickableCardNestedButton from './fixtures/clickable-card-nested-button.svelte';

/**
 * Astryx's `ClickableCard/ClickableCard.test.tsx`, ported case for case — all
 * **11** upstream `it()`s at the 0.5.0 pin, 11 here. None dropped: upstream has no
 * `displayName` and no `ref` case.
 *
 * (The previous header said "all 9 upstream `it()`s, 9 here". It was counting
 * only the top level and missed upstream's nested `describe('elevation')` pair,
 * which arrived with 0.1.9's `elevation` prop. Both are ported here and both
 * passed on the first run.)
 *
 * `ClickableCard` composes `Card` and renders a visually-hidden control inside
 * it: a `<button type="button">` for action (`onclick`) cards, or an `<a href>`
 * for link (`href`) cards. That control is the accessible surface —
 * `getByRole('button', {name})` / `getByRole('link', {name})`, name from
 * `aria-label={label}`. The card `<div>` itself has no role and no tabindex, so
 * every role assertion targets the hidden control, exactly as upstream's
 * `getByRole('button'|'link', {name})` does. The control is only *visually*
 * hidden (an sr-only clip, not `display:none`), so it stays in the a11y tree and
 * `getByRole` reaches it — the same pattern the ported `SelectableCard` suite
 * relies on.
 *
 * Children are a `Snippet` here, so upstream's inline `<span>Content</span>` is
 * supplied through the shared `slot-probe`, which fills the named `children`
 * slot with a `<span>{text}</span>`. The one case with a nested interactive
 * `<button>` in the children uses a dedicated fixture instead, since a snippet
 * carrying a real `<button>` with its own handler can only be authored in a
 * template.
 *
 * Two click cases are restated in *delivery only* — the assertions are
 * upstream's verbatim — each commented at its site: the surface click dispatches
 * a bubbling `click` on the surface element so `event.target` is the surface
 * (not a nested interactive), which is exactly the path upstream's
 * `fireEvent.click(getByText(...))` drives and which the card's
 * `useClickableContainer` delegate inspects via its interactive-ancestor walk.
 */

/** Renders a `ClickableCard` with its `children` slot filled by `text`. */
function renderCard(
	rest: Record<string, unknown>,
	text = 'Content'
): Promise<Awaited<ReturnType<typeof render>>> {
	return render(SlotProbe, {
		props: { component: ClickableCard, slot: 'children', text, rest }
	});
}

describe('ClickableCard', () => {
	it('renders children', async () => {
		const screen = await renderCard({ label: 'Test card', onclick: () => {} }, 'Card content');
		await expect.element(screen.getByText('Card content', { exact: true })).toBeInTheDocument();
	});

	it('renders a hidden button for onClick cards', async () => {
		const screen = await renderCard({ label: 'Test card', onclick: () => {} });
		await expect
			.element(screen.getByRole('button', { name: 'Test card', exact: true }))
			.toBeInTheDocument();
	});

	it('renders a hidden link for href cards', async () => {
		const screen = await renderCard({ label: 'Nav card', href: '/settings' });
		const link = screen.getByRole('link', { name: 'Nav card', exact: true });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('href', '/settings');
	});

	it('calls onClick when card surface is clicked', async () => {
		const handleClick = vi.fn();
		const screen = await renderCard({ label: 'Test card', onclick: handleClick });
		// Restated in delivery: a bubbling `click` dispatched on the surface `<span>`
		// so `event.target` is the surface — upstream's `fireEvent.click(getByText())`.
		const surface = screen.getByText('Content', { exact: true }).element() as HTMLElement;
		surface.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('does NOT call onClick when a nested button is clicked', async () => {
		const handleCardClick = vi.fn();
		const handleButtonClick = vi.fn();
		const screen = await render(ClickableCardNestedButton, {
			props: { onCardClick: handleCardClick, onButtonClick: handleButtonClick }
		});
		// Click the nested `<button>` (a real interactive descendant). Its own
		// handler fires; the bubbled click reaches the card's delegate but bails on
		// the interactive-ancestor walk, so the card's onclick never fires.
		const nested = screen.getByText('Nested', { exact: true }).element() as HTMLElement;
		nested.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		expect(handleButtonClick).toHaveBeenCalledTimes(1);
		// Card's onClick should NOT fire because click was on a nested interactive.
		expect(handleCardClick).not.toHaveBeenCalled();
	});

	it('hidden button has correct aria-label', async () => {
		const screen = await renderCard({ label: 'Settings card', onclick: () => {} });
		await expect
			.element(screen.getByRole('button', { name: 'Settings card', exact: true }))
			.toHaveAttribute('aria-label', 'Settings card');
	});

	it('hidden link passes target attribute', async () => {
		const screen = await renderCard({
			label: 'External',
			href: 'https://example.com',
			target: '_blank'
		});
		await expect
			.element(screen.getByRole('link', { name: 'External', exact: true }))
			.toHaveAttribute('target', '_blank');
	});

	it('disabled button is disabled', async () => {
		const handleClick = vi.fn();
		const screen = await renderCard({ label: 'Disabled', onclick: handleClick, isDisabled: true });
		await expect
			.element(screen.getByRole('button', { name: 'Disabled', exact: true }))
			.toBeDisabled();
	});

	it('disabled link has aria-disabled', async () => {
		const screen = await renderCard({
			label: 'Disabled link',
			href: '/settings',
			isDisabled: true
		});
		await expect
			.element(screen.getByRole('link', { name: 'Disabled link', exact: true }))
			.toHaveAttribute('aria-disabled', 'true');
	});

	describe('elevation', () => {
		it('forwards a distinct elevation class to the card for each level', async () => {
			const classFor = async (elevation: 'none' | 'low' | 'med' | 'high'): Promise<string> => {
				const screen = await renderCard({ label: 'Card', elevation });
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

		it('defaults to flat (elevation none)', async () => {
			const def = await renderCard({ label: 'Card' });
			const none = await renderCard({ label: 'Card', elevation: 'none' });
			expect(def.container.firstElementChild!.className).toBe(
				none.container.firstElementChild!.className
			);
		});
	});
});
