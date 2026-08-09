import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Spinner from '$lib/components/spinner/spinner.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Ported from Astryx's `Spinner/Spinner.test.tsx`, all 17 cases.
 *
 * The suite is a late addition: `Spinner` was one of the first components
 * ported, before the case-for-case discipline, and its `label` prop was missed
 * with it — the styles module had `wrapper` all along with nothing rendering it.
 * The prop is now restored and this suite pins it.
 *
 * `label={<span/>}` becomes the shared `slot-probe` (a snippet), and
 * `renders as an inline element (span)` reads the *unlabelled* root, which is
 * where upstream's `data-testid` lands too — with a label the testid moves to
 * the wrapper `<div>`, exactly as upstream routes it.
 *
 * Runs in the **client** (real Chromium) project: the spinner paints itself onto
 * a `<canvas>` through `getComputedStyle`, which needs a real layout.
 */

describe('Spinner', () => {
	it('renders with default props', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with size sm', async () => {
		const screen = await render(Spinner, { props: { size: 'sm', 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with size md', async () => {
		const screen = await render(Spinner, { props: { size: 'md', 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with size lg', async () => {
		const screen = await render(Spinner, { props: { size: 'lg', 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with shade default', async () => {
		const screen = await render(Spinner, {
			props: { shade: 'default', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with shade onMedia', async () => {
		const screen = await render(Spinner, {
			props: { shade: 'onMedia', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders with shade inherit', async () => {
		const screen = await render(Spinner, {
			props: { shade: 'inherit', 'data-testid': 'spinner' }
		});
		const spinner = screen.getByTestId('spinner');
		await expect.element(spinner).toBeInTheDocument();
		await expect.element(spinner).toHaveAttribute('data-shade', 'inherit');
	});

	it('has role="status"', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('has aria-label="Loading" by default', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		await expect.element(screen.getByTestId('spinner')).toHaveAttribute('aria-label', 'Loading');
	});

	it('names the status element from the visible string label', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Fetching data', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByRole('status')).toHaveAccessibleName('Fetching data');
	});

	it('does not duplicate a visible string label as aria-label', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Fetching data', 'data-testid': 'spinner' }
		});
		const status = screen.getByRole('status');
		await expect.element(status).not.toHaveAttribute('aria-label');
		await expect.element(status).toHaveAttribute('aria-labelledby');
	});

	it('uses explicit aria-label over string label', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Loading...', 'aria-label': 'Please wait', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByRole('status')).toHaveAttribute('aria-label', 'Please wait');
	});

	it('renders label content below the spinner', async () => {
		const screen = await render(Spinner, {
			props: { label: 'Loading...', 'data-testid': 'spinner' }
		});
		await expect.element(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('renders a snippet label', async () => {
		// Upstream's `renders ReactNode label` — rich content is a snippet here.
		const screen = await render(SlotProbe, {
			props: {
				component: Spinner,
				slot: 'label',
				text: 'Custom content',
				testid: 'custom-label',
				rest: { 'aria-label': 'Loading', 'data-testid': 'spinner' }
			}
		});
		await expect.element(screen.getByTestId('custom-label')).toBeInTheDocument();
	});

	it('defaults aria-label to "Loading" for a snippet label without explicit aria-label', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Spinner,
				slot: 'label',
				text: 'Rich content',
				rest: { 'data-testid': 'spinner' }
			}
		});
		await expect.element(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
	});

	it('accepts data-testid', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'my-spinner' } });
		await expect.element(screen.getByTestId('my-spinner')).toBeInTheDocument();
	});

	it('renders as an inline element (span)', async () => {
		const screen = await render(Spinner, { props: { 'data-testid': 'spinner' } });
		expect(screen.getByTestId('spinner').element().tagName.toLowerCase()).toBe('span');
	});
});
