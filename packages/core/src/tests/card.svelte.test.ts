import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Card from '$lib/components/card/card.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Card/Card.test.tsx` at the **0.5.0** pin, ported case for case.
 *
 * The count is the contract: upstream declares **5** `it` blocks at this pin,
 * and **5** are here. **Nothing is dropped.** Upstream's suite has no
 * `displayName` case, no `ref` case, no snapshot and no no-JSX construction
 * form, so none of this port's standing drops or counterparts applies —
 * every case is a straight translation.
 *
 * The one thing the language forces: React writes `<Card>Hello</Card>`, and a
 * Svelte case cannot author a snippet, so `slot-probe.svelte` supplies the
 * `children` slot. It renders the text inside a `<span>` and adds nothing to
 * `Card`'s own root, which is what the four class assertions read.
 *
 * `--_card-radius` / `--_card-elevation` / `--_card-ring` are composed exactly
 * as upstream composes them (a single `box-shadow` list reading both private
 * vars), so the `distinct class for each elevation level` case is testing the
 * same mechanism here as there: each tier sets the *variable*, and StyleX gives
 * each variable value its own atomic class.
 */

/** `Card` with `slot-probe` filling `children`, plus the case's own props. */
const cardWith = (text: string, rest: Record<string, unknown> = {}) => ({
	component: Card,
	slot: 'children',
	text,
	rest
});

describe('Card', () => {
	it('renders children', async () => {
		const screen = await render(SlotProbe, { props: cardWith('Hello') });
		await expect.element(screen.getByText('Hello', { exact: true })).toBeInTheDocument();
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const screen = await render(SlotProbe, { props: cardWith('Content') });
		const root = screen.container.firstElementChild!;
		expect(root.className).toContain('astryx-card');
	});

	it('renders transparent variant with variant class', async () => {
		const screen = await render(SlotProbe, {
			props: cardWith('Content', { variant: 'transparent' })
		});
		const root = screen.container.firstElementChild!;
		expect(root.className).toContain('astryx-card');
		expect(root.className).toContain('transparent');
	});

	it('applies a distinct class for each elevation level', async () => {
		const classFor = async (elevation: 'none' | 'low' | 'med' | 'high') => {
			const screen = await render(SlotProbe, { props: cardWith('C', { elevation }) });
			return screen.container.firstElementChild!.className;
		};
		const none = await classFor('none');
		const low = await classFor('low');
		const med = await classFor('med');
		const high = await classFor('high');
		expect(new Set([none, low, med, high]).size).toBe(4);
	});

	it('defaults to flat (elevation none) — same class as explicit none', async () => {
		const { container: defaultContainer } = await render(SlotProbe, { props: cardWith('C') });
		const { container: noneContainer } = await render(SlotProbe, {
			props: cardWith('C', { elevation: 'none' })
		});
		expect(defaultContainer.firstElementChild!.className).toBe(
			noneContainer.firstElementChild!.className
		);
	});
});
