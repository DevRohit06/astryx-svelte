import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import VisuallyHiddenProbe from './fixtures/visually-hidden-probe.svelte';

/**
 * Astryx's `VisuallyHidden/VisuallyHidden.test.tsx` at the **0.5.0** pin, ported case
 * for case.
 *
 * The count is the contract: upstream declares **7** `it` blocks at this pin,
 * and **7** are here. **Nothing is dropped.** Upstream's suite has no
 * `displayName` case, no no-JSX construction form and no snapshot, so none of
 * this port's standing reasons to drop a case arises.
 *
 * **One counterpart and two restatements. None of the three is a dropped case:**
 *
 * - `forwards a ref to the rendered element` becomes the attachment a consumer
 *   passes through the rest props. Svelte has no `ref`; the attachment receives
 *   the element itself, so both of upstream's assertions survive — that it is
 *   an `HTMLElement`, and that its `textContent` is `'Ref target'`.
 * - `children` is a `Snippet` here and can only be authored in a template, so
 *   `visually-hidden-probe.svelte` supplies it. Case 7 builds the whole
 *   `<button>` upstream writes inline for the same reason.
 * - `applies the clip styles that hide it visually` keeps both of upstream's
 *   assertions verbatim. Only upstream's *comment* no longer holds: this runs
 *   in real Chromium with the StyleX sheet applied, where jsdom left it
 *   unapplied. The assertion is about the class attribute either way, and the
 *   clip block itself is the class oracle's job
 *   (`scripts/compare-upstream-classes.mjs`), not a test's.
 *
 * Runs in the **client** (real Chromium) project.
 */

describe('VisuallyHidden', () => {
	it('renders its children in the accessibility tree', async () => {
		const screen = await render(VisuallyHiddenProbe, { props: { text: 'Delete incident' } });
		// Present in the a11y tree (getByText finds it — it is not display:none).
		await expect.element(screen.getByText('Delete incident')).toBeInTheDocument();
	});

	it('renders a <span> by default', async () => {
		const screen = await render(VisuallyHiddenProbe, { props: { text: 'Label' } });
		expect(screen.getByText('Label').element().tagName).toBe('SPAN');
	});

	it('renders a custom element via the `as` prop', async () => {
		const screen = await render(VisuallyHiddenProbe, {
			props: { text: 'Moved task to Done', rest: { as: 'div', 'aria-live': 'polite' } }
		});
		const el = screen.getByText('Moved task to Done').element();
		expect(el.tagName).toBe('DIV');
		expect(el).toHaveAttribute('aria-live', 'polite');
	});

	it('applies the clip styles that hide it visually', async () => {
		const screen = await render(VisuallyHiddenProbe, { props: { text: 'Hidden' } });
		const el = screen.getByText('Hidden').element();
		// The StyleX class is attached.
		expect(el.getAttribute('class')).toBeTruthy();
		// It must NOT be display:none / hidden — it stays in the a11y tree.
		expect(el).not.toHaveAttribute('hidden');
	});

	// Counterpart to upstream's `forwards a ref to the rendered element`.
	it('hands the rendered element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		await render(VisuallyHiddenProbe, {
			props: { text: 'Ref target', rest: { [createAttachmentKey()]: attached } }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
		expect(attached.mock.calls[0][0].textContent).toBe('Ref target');
	});

	it('passes through arbitrary BaseProps (id, role, data-*)', async () => {
		const screen = await render(VisuallyHiddenProbe, {
			props: { text: 'Status', rest: { id: 'announcer', role: 'status', 'data-testid': 'vh' } }
		});
		const el = screen.getByTestId('vh').element();
		expect(el).toHaveAttribute('id', 'announcer');
		expect(el).toHaveAttribute('role', 'status');
	});

	it('gives an icon-only control an accessible name', async () => {
		const screen = await render(VisuallyHiddenProbe, {
			props: { text: 'Delete', inButton: true }
		});
		// `exact` restores testing-library's whole-string name match, which this
		// runner's `name` (Playwright's, substring and case-insensitive) is not.
		// Without it the case passes even when the `aria-hidden` icon leaks into
		// the accessible name, which is the one thing it exists to rule out.
		await expect
			.element(screen.getByRole('button', { name: 'Delete', exact: true }))
			.toBeInTheDocument();
	});
});
