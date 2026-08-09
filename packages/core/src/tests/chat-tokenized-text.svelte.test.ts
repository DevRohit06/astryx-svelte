import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChatTokenizedText from '$lib/components/chat/chat-tokenized-text.svelte';

/**
 * `ChatTokenizedText.test.tsx` ported case for case — 10 cases.
 *
 * No fixture: `children` is a plain string on both sides (upstream types it
 * `string`, not `ReactNode`), so every case renders the component directly.
 */
describe('ChatTokenizedText', () => {
	it('renders plain text when no tokens provided', async () => {
		const screen = await render(ChatTokenizedText, { props: { children: 'Hello world' } });
		await expect.element(screen.getByText('Hello world')).toBeInTheDocument();
	});

	it('renders plain text when tokens array is empty', async () => {
		const screen = await render(ChatTokenizedText, {
			props: { children: 'Hello world', tokens: [] }
		});
		await expect.element(screen.getByText('Hello world')).toBeInTheDocument();
	});

	it('replaces a single token with a badge', async () => {
		const screen = await render(ChatTokenizedText, {
			props: {
				children: 'Hey @cindy!',
				tokens: [{ value: '@cindy', label: '@Cindy Zhang', variant: 'blue' }]
			}
		});
		await expect.element(screen.getByText('@Cindy Zhang')).toBeInTheDocument();
		// Upstream asserts the raw token value is gone via `queryByText('@cindy')`;
		// the label differs from it only in case, so a substring check is exact.
		expect(screen.container.textContent).not.toContain('@cindy');
	});

	it('replaces multiple different tokens', async () => {
		const screen = await render(ChatTokenizedText, {
			props: {
				children: 'Hey @cindy, can @navi help?',
				tokens: [
					{ value: '@cindy', label: '@Cindy Zhang', variant: 'blue' },
					{ value: '@navi', label: '@Navi', variant: 'blue' }
				]
			}
		});
		await expect.element(screen.getByText('@Cindy Zhang')).toBeInTheDocument();
		await expect.element(screen.getByText('@Navi')).toBeInTheDocument();
	});

	it('handles repeated occurrences of the same token', async () => {
		const screen = await render(ChatTokenizedText, {
			props: {
				children: '@cindy and @cindy again',
				tokens: [{ value: '@cindy', label: '@Cindy Zhang' }]
			}
		});
		expect(screen.getByText('@Cindy Zhang').elements()).toHaveLength(2);
	});

	it('renders text with no matching tokens as plain text', async () => {
		const screen = await render(ChatTokenizedText, {
			props: { children: 'Hello world', tokens: [{ value: '@cindy', label: '@Cindy Zhang' }] }
		});
		await expect.element(screen.getByText('Hello world')).toBeInTheDocument();
	});

	it('handles tokens with special regex characters in pattern', async () => {
		const screen = await render(ChatTokenizedText, {
			props: { children: 'Run /search now', tokens: [{ value: '/search', label: '/search' }] }
		});
		// The badge should render with the label
		await expect.element(screen.getByText('/search')).toBeInTheDocument();
	});

	it('preserves surrounding text', async () => {
		const screen = await render(ChatTokenizedText, {
			props: {
				children: 'Before @cindy after',
				tokens: [{ value: '@cindy', label: '@Cindy Zhang' }]
			}
		});
		expect(screen.container.textContent).toContain('Before');
		expect(screen.container.textContent).toContain('after');
		expect(screen.container.textContent).toContain('@Cindy Zhang');
	});

	it('forwards rest props (data-*, id) to the root element', async () => {
		const screen = await render(ChatTokenizedText, {
			props: { children: 'Plain text', 'data-testid': 'tokenized', 'data-custom': 'x', id: 'tok-1' }
		});
		const root = screen.container.querySelector('[data-testid="tokenized"]');
		expect(root?.getAttribute('data-custom')).toBe('x');
		expect(root?.getAttribute('id')).toBe('tok-1');
	});

	it('forwards rest props when rendering tokens', async () => {
		const screen = await render(ChatTokenizedText, {
			props: {
				children: 'Hi @cindy',
				tokens: [{ value: '@cindy', label: '@Cindy Zhang' }],
				'data-testid': 'tokenized',
				'data-custom': 'x'
			}
		});
		const root = screen.container.querySelector('[data-testid="tokenized"]');
		expect(root?.getAttribute('data-custom')).toBe('x');
	});
});
