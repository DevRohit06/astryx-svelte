import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LayoutFixture from './fixtures/layout-fixture.svelte';
import LayoutShell from './fixtures/layout-shell.svelte';

/**
 * Astryx's `Layout/__tests__/childrenAsContent.test.tsx`, ported case for case —
 * **4 upstream `it` declarations at the 0.5.0 pin, 4 here**, in upstream's order and
 * under upstream's titles. Nothing dropped, nothing added.
 *
 * The contract: `<Layout>…</Layout>` treats its children as a shorthand for the
 * `content` slot, so the natural nesting form never renders a blank shell, and
 * an explicit `content` prop wins when both are given.
 *
 * A **client** project file — it renders and walks real DOM.
 *
 * ## Translations, none of them a dropped case
 *
 * **Slots are snippets.** Upstream passes JSX into `content` and between the
 * tags; here both are snippets, so the markup lives in a fixture and the case
 * selects it by prop. `layout-fixture` holds bare `<div>`s (upstream's plain
 * spans), `layout-shell` holds the real slot components. `layout-shell`'s
 * `contentAsChildren` is what moves its `LayoutContent` from the `content` prop
 * to the `children` one — the single difference between the first case and the
 * fourth, which is exactly the difference upstream's two cases are about.
 *
 * **`queryByTestId(...).not.toBeInTheDocument()`.** `layout-fixture`'s slots are
 * unlabelled `<div>`s, so the third case asserts the losing children's text is
 * absent from the container rather than querying a test id. Same question, and
 * it fails the same way if `children` ever rendered alongside `content`.
 */

describe('Layout children-as-content', () => {
	it('renders nested children in the content slot', async () => {
		const screen = await render(LayoutShell, {
			props: { contentAsChildren: true, content: 'Body' }
		});
		await expect.element(screen.getByTestId('body')).toBeInTheDocument();
	});

	it('renders bare children (no LayoutContent wrapper) too', async () => {
		const screen = await render(LayoutFixture, { props: { child: 'Bare' } });
		await expect.element(screen.getByText('Bare')).toBeInTheDocument();
	});

	it('lets an explicit content prop win over children', async () => {
		const screen = await render(LayoutFixture, { props: { content: 'Slot', child: 'Child' } });
		await expect.element(screen.getByText('Slot')).toBeInTheDocument();
		expect(screen.container.textContent).not.toContain('Child');
	});

	it('still supports the canonical slot-only API', async () => {
		const screen = await render(LayoutShell, { props: { content: 'Canonical' } });
		await expect.element(screen.getByTestId('body')).toBeInTheDocument();
	});
});
