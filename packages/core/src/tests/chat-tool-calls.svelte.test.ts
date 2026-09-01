/** PORTS: Chat/ChatToolCalls.test.tsx */

import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ChatToolCalls from '$lib/components/chat/chat-tool-calls.svelte';
import ChatToolCallsProbe from './fixtures/chat-tool-calls-probe.svelte';

/**
 * `ChatToolCalls.test.tsx` ported case for case — all **15** cases at v0.3.0,
 * 15 here, nothing dropped.
 *
 * (The previous header said "11 cases". Upstream has 15: the four-case error
 * block — `exposes the error message as text without requiring hover`,
 * `includes the error message in the accessible name of an expandable error
 * row`, `keeps the hover tooltip on the error status icon` and `renders no
 * error text for non-error calls` — was unported and unnamed. All four are
 * ported here and all four passed on the first run.)
 *
 * Only the cases that need a `resultDetail` element go through the probe; the
 * rest pass `calls` straight to the component, as upstream does.
 *
 * The error row's visible text goes through the i18n catalog here
 * (`@astryx.chatToolCalls.error` → `"Error: {message}"`) where upstream
 * hardcodes the same string, so upstream's `/Error:/` negative reads identically
 * against the shipped `en` catalog.
 */
describe('ChatToolCalls', () => {
	it('renders nothing for empty calls', async () => {
		const screen = await render(ChatToolCalls, { props: { calls: [] } });
		// Upstream checks `container.firstChild` is null. Svelte always leaves an
		// anchor comment where a block could render, so the equivalent question is
		// whether any element was produced. The text assertion is the other half of
		// what `firstChild` proved: without it a stray text node — a leaked
		// `{calls.length}`, an unguarded `{@render}` — would still pass.
		expect(screen.container.querySelector('*')).toBeNull();
		expect(screen.container.textContent).toBe('');
	});

	it('renders single call inline without group chrome', async () => {
		const screen = await render(ChatToolCalls, {
			props: { calls: [{ name: 'bash', status: 'complete', duration: '1.2s' }] }
		});
		await expect.element(screen.getByText('bash', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('1.2s', { exact: true })).toBeInTheDocument();
		// No group header / expand button for single call
		expect(screen.container.querySelector('[role="button"]')).toBeNull();
	});

	it('renders latest call as surface for multiple calls', async () => {
		const screen = await render(ChatToolCalls, {
			props: {
				calls: [
					{ name: 'searchCode', status: 'complete' },
					{ name: 'readFile', status: 'complete' },
					{ name: 'editFile', status: 'running' }
				]
			}
		});
		// Latest call (editFile) shown at surface + in expanded list
		expect(screen.getByText('editFile', { exact: true }).elements().length).toBeGreaterThanOrEqual(
			1
		);
		expect(screen.container.querySelector('[role="button"]')).not.toBeNull();
	});

	it('hides duration when not complete', async () => {
		const screen = await render(ChatToolCalls, {
			props: { calls: [{ name: 'bash', status: 'running', duration: '1.2s' }] }
		});
		expect(screen.container.textContent).not.toContain('1.2s');
	});

	it('defaults to collapsed', async () => {
		const screen = await render(ChatToolCalls, {
			props: {
				calls: [
					{ name: 'a', status: 'complete' },
					{ name: 'b', status: 'complete' }
				]
			}
		});
		expect(screen.container.querySelector('[role="button"]')?.getAttribute('aria-expanded')).toBe(
			'false'
		);
	});

	it('auto-collapses groups of more than 3', async () => {
		const screen = await render(ChatToolCalls, {
			props: { calls: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }] }
		});
		expect(screen.container.querySelector('[role="button"]')?.getAttribute('aria-expanded')).toBe(
			'false'
		);
	});

	it('toggles on click', async () => {
		const screen = await render(ChatToolCalls, {
			props: {
				defaultIsExpanded: false,
				calls: [
					{ name: 'a', status: 'complete' },
					{ name: 'b', status: 'complete' }
				]
			}
		});
		const btn = screen.container.querySelector('[role="button"]') as HTMLElement;
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		await userEvent.click(btn);
		expect(btn.getAttribute('aria-expanded')).toBe('true');
	});

	it('shows target when provided', async () => {
		const screen = await render(ChatToolCalls, {
			props: { calls: [{ name: 'bash', target: 'git status', status: 'complete' }] }
		});
		await expect.element(screen.getByText('git status', { exact: true })).toBeInTheDocument();
	});

	it('exposes no aria-expanded on a call row without resultDetail', async () => {
		const screen = await render(ChatToolCalls, {
			props: { calls: [{ name: 'bash', status: 'complete' }] }
		});
		expect(screen.container.querySelector('[aria-expanded]')).toBeNull();
	});

	it('wires disclosure semantics on an expandable call row', async () => {
		const screen = await render(ChatToolCallsProbe, {
			props: {
				calls: [{ name: 'readFile', status: 'complete' }],
				detailText: 'file contents here'
			}
		});
		const row = screen.container.querySelector('[role="button"]') as HTMLElement;
		expect(row.getAttribute('aria-expanded')).toBe('false');
		// Detail panel is conditionally mounted, so no aria-controls while closed.
		expect(row.hasAttribute('aria-controls')).toBe(false);
		expect(screen.container.textContent).not.toContain('file contents here');

		await userEvent.click(row);

		expect(row.getAttribute('aria-expanded')).toBe('true');
		const detailId = row.getAttribute('aria-controls');
		expect(detailId).toBeTruthy();
		const panel = document.getElementById(detailId as string);
		expect(panel).not.toBeNull();
		expect(panel?.textContent).toContain('file contents here');
	});

	it('exposes the error message as text without requiring hover', async () => {
		const screen = await render(ChatToolCalls, {
			props: {
				calls: [{ name: 'bash', status: 'error', errorMessage: 'Command exited with code 1' }]
			}
		});
		// The message must exist as real (screen-reader-visible) text content,
		// not only inside a hover-only title attribute.
		await expect.element(screen.getByText(/Command exited with code 1/)).toBeInTheDocument();
	});

	it('includes the error message in the accessible name of an expandable error row', async () => {
		const screen = await render(ChatToolCallsProbe, {
			props: {
				calls: [{ name: 'bash', status: 'error', errorMessage: 'Command exited with code 1' }],
				detailText: 'stderr output'
			}
		});
		await expect
			.element(screen.getByRole('button', { name: /Command exited with code 1/ }))
			.toBeInTheDocument();
	});

	it('keeps the hover tooltip on the error status icon', async () => {
		const screen = await render(ChatToolCalls, {
			props: {
				calls: [{ name: 'bash', status: 'error', errorMessage: 'Command exited with code 1' }]
			}
		});
		expect(screen.container.querySelector('[title="Command exited with code 1"]')).not.toBeNull();
	});

	it('renders no error text for non-error calls', async () => {
		const screen = await render(ChatToolCalls, {
			props: { calls: [{ name: 'bash', status: 'complete', errorMessage: 'stale message' }] }
		});
		// Upstream's two `queryByText` negatives, asked of the rendered text: a
		// Vitest locator throws rather than returning null when nothing matches, so
		// the absence is read off `textContent` — the same question, and it also
		// catches a match split across elements.
		expect(screen.container.textContent).not.toContain('stale message');
		expect(screen.container.textContent).not.toContain('Error:');
	});

	it('points the group header aria-controls at the content region', async () => {
		const screen = await render(ChatToolCalls, {
			props: {
				defaultIsExpanded: true,
				calls: [
					{ name: 'searchCode', status: 'complete' },
					{ name: 'readFile', status: 'complete' }
				]
			}
		});
		const header = screen.container.querySelector('[role="button"]') as HTMLElement;
		expect(header.getAttribute('aria-expanded')).toBe('true');
		const regionId = header.getAttribute('aria-controls');
		expect(regionId).toBeTruthy();
		const region = document.getElementById(regionId as string);
		expect(region).not.toBeNull();
		expect(region?.textContent).toContain('searchCode');
		expect(region?.textContent).toContain('readFile');
	});
});
