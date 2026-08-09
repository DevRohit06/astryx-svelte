import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChatMessageBubble from '$lib/components/chat/chat-message-bubble.svelte';
import ChatMessageMetadata from '$lib/components/chat/chat-message-metadata.svelte';
import ChatSystemMessage from '$lib/components/chat/chat-system-message.svelte';
import ChatListProbe from './fixtures/chat-list-probe.svelte';
import ChatMessageProbe from './fixtures/chat-message-probe.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * The chat message family: `ChatMessage`, `ChatMessageBubble`,
 * `ChatMessageMetadata`, `ChatMessageList` and `ChatSystemMessage`.
 *
 * Five upstream suites in one file — `ChatMessage.test.tsx` (9),
 * `ChatMessageBubble.test.tsx` (10, half of them metadata),
 * `ChatMessageMetadata.test.tsx` (2), `ChatMessageList.test.tsx` (8) and
 * `ChatSystemMessage.test.tsx` (10) — because every one of them nests the same
 * components and would otherwise repeat the same fixture five times. **39
 * cases, matching upstream's 39** at v0.3.0.
 *
 * (The previous header said "`ChatSystemMessage.test.tsx` (9) … 38 cases,
 * matching upstream's 38". That suite has 10: `exposes the divider variant label
 * as the separator accessible name` was unported and unnamed. It is ported here
 * and passed on the first run.)
 *
 * One case is a counterpart rather than a translation:
 * `ChatMessageList`'s "renders empty state when no children" passes `{[]}`
 * upstream — children that are present and render nothing. A `Snippet` cannot
 * be that, so the port omits the prop instead, which is the same question asked
 * the only way Svelte can ask it. The component says so in place.
 */

describe('ChatMessage', () => {
	it('renders children', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', text: 'Hello world' }
		});
		await expect.element(screen.getByText('Hello world')).toBeInTheDocument();
	});

	it('renders sender name', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', name: 'Navi', text: 'Hi' }
		});
		await expect.element(screen.getByText('Navi')).toBeInTheDocument();
	});

	it('hides name for system sender', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'system', name: 'System', customContent: 'Notice' }
		});
		expect(screen.container.textContent).not.toContain('System');
	});

	it('renders avatar for assistant', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', hasAvatar: true, text: 'Hi' }
		});
		expect(screen.container.querySelector('[data-testid="avatar"]')).not.toBeNull();
	});

	it('hides avatar for system', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'system', hasAvatar: true, customContent: 'Notice' }
		});
		expect(screen.container.querySelector('[data-testid="avatar"]')).toBeNull();
	});

	it('applies sender class', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'user', text: 'Hi', rest: { 'data-testid': 'msg' } }
		});
		const el = screen.container.querySelector('[data-testid="msg"]');
		expect(el?.className).toContain('user');
	});

	it('sets accessible aria-labelledby with name', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', name: 'Navi', text: 'Hi', rest: { 'data-testid': 'msg' } }
		});
		const el = screen.container.querySelector('[data-testid="msg"]');
		const labelId = el?.getAttribute('aria-labelledby');
		expect(labelId).toBeTruthy();
		expect(el?.querySelector(`#${CSS.escape(labelId as string)}`)?.textContent).toBe('Navi');
	});

	it('sets accessible aria-label without name', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'user', text: 'Hi', rest: { 'data-testid': 'msg' } }
		});
		const el = screen.container.querySelector('[data-testid="msg"]');
		expect(el?.getAttribute('aria-label')).toBe('Message from user');
	});

	it('renders non-bubble children', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', customContent: 'Custom widget' }
		});
		expect(screen.container.querySelector('[data-testid="custom-content"]')).not.toBeNull();
	});
});

describe('ChatMessageBubble', () => {
	it('renders children', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', text: 'Hello world' }
		});
		await expect.element(screen.getByText('Hello world')).toBeInTheDocument();
	});

	it('applies sender-aware class from context', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'user', text: 'Hi', bubbleRest: { 'data-testid': 'bubble' } }
		});
		const el = screen.container.querySelector('[data-testid="bubble"]');
		expect(el?.className).toContain('user');
	});

	it('defaults to assistant when no context', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: ChatMessageBubble,
				slot: 'children',
				text: 'Standalone',
				rest: { 'data-testid': 'bubble' }
			}
		});
		const el = screen.container.querySelector('[data-testid="bubble"]');
		expect(el?.className).toContain('assistant');
	});

	it('applies inherited compact density class', async () => {
		const screen = await render(ChatMessageProbe, {
			props: {
				sender: 'assistant',
				listDensity: 'compact',
				text: 'Compact',
				bubbleRest: { 'data-testid': 'bubble' }
			}
		});
		const el = screen.container.querySelector('[data-testid="bubble"]');
		expect(el?.className).toContain('compact');
	});

	it('applies data-testid', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', text: 'Hi', bubbleRest: { 'data-testid': 'my-bubble' } }
		});
		expect(screen.container.querySelector('[data-testid="my-bubble"]')).not.toBeNull();
	});
});

describe('ChatMessageMetadata', () => {
	it('renders timestamp', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', metadata: { timestamp: '2:30 PM' } }
		});
		await expect.element(screen.getByText('2:30 PM')).toBeInTheDocument();
	});

	it('renders footer content', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', metadata: { footer: 'Liked' } }
		});
		await expect.element(screen.getByText('Liked')).toBeInTheDocument();
	});

	it('renders status', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'user', metadata: { status: 'sent' } }
		});
		expect(screen.container.querySelector('[aria-label="Message sent"]')).not.toBeNull();
	});

	it('renders timestamp and status on one row', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'user', metadata: { timestamp: '2:30 PM', status: 'read' } }
		});
		await expect.element(screen.getByText('2:30 PM')).toBeInTheDocument();
		expect(screen.container.querySelector('[aria-label="Message read"]')).not.toBeNull();
		// Upstream's `getByText('·')` requires an element whose whole text is the
		// separator — it is a real `<span>`, rendered only when a timestamp sits
		// beside a footer or status, which is exactly what this case is named for.
		// A locator would substring-match the span *and* its parent and trip
		// strict mode, so the equality is asserted against the nodes directly.
		const separators = [...screen.container.querySelectorAll('span')];
		expect(separators.some((node) => node.textContent === '·')).toBe(true);
	});

	it('renders nothing when all props are empty', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'user', metadata: {} }
		});
		// Only the article wrapper from ChatMessage
		expect(screen.container.querySelectorAll('article').length).toBe(1);
		expect(screen.container.querySelector('[class*="astryx-chat-message-metadata"]')).toBeNull();
	});

	it('renders metadata content', async () => {
		const screen = await render(ChatMessageMetadata, {
			props: { timestamp: '12:00', status: 'read', 'data-testid': 'meta' }
		});
		expect(screen.container.querySelector('[data-testid="meta"]')).not.toBeNull();
	});

	it('forwards rest props (data-*, aria-*, id) to the root element', async () => {
		const screen = await render(ChatMessageMetadata, {
			props: { timestamp: '12:00', 'data-testid': 'meta', 'data-custom': 'x', id: 'meta-1' }
		});
		const root = screen.container.querySelector('[data-testid="meta"]');
		expect(root?.getAttribute('data-custom')).toBe('x');
		expect(root?.getAttribute('id')).toBe('meta-1');
	});
});

describe('ChatMessageList', () => {
	it('renders children', async () => {
		const screen = await render(ChatMessageProbe, {
			props: { sender: 'assistant', listDensity: 'balanced', text: 'Hello' }
		});
		await expect.element(screen.getByText('Hello')).toBeInTheDocument();
	});

	it('renders with role="log"', async () => {
		const screen = await render(ChatListProbe, {
			props: { rest: { 'data-testid': 'list' } }
		});
		const el = screen.container.querySelector('[data-testid="list"]');
		expect(el?.getAttribute('role')).toBe('log');
	});

	it('is not aria-busy by default', async () => {
		const screen = await render(ChatListProbe, {
			props: { rest: { 'data-testid': 'list' } }
		});
		const el = screen.container.querySelector('[data-testid="list"]');
		expect(el?.hasAttribute('aria-busy')).toBe(false);
	});

	it('marks the log aria-busy while streaming', async () => {
		const screen = await render(ChatListProbe, {
			props: { isStreaming: true, rest: { 'data-testid': 'list' } }
		});
		const el = screen.container.querySelector('[data-testid="list"]');
		expect(el?.getAttribute('aria-busy')).toBe('true');
	});

	it('renders empty state when no children', async () => {
		const screen = await render(ChatListProbe, {
			props: { hasChildren: false, emptyStateText: 'No messages yet' }
		});
		await expect.element(screen.getByText('No messages yet')).toBeInTheDocument();
	});

	it('applies density class', async () => {
		const screen = await render(ChatListProbe, {
			props: { density: 'compact', rest: { 'data-testid': 'list' } }
		});
		const el = screen.container.querySelector('[data-testid="list"]');
		expect(el?.className).toContain('compact');
	});

	it('accepts gap independently from density', async () => {
		const screen = await render(ChatListProbe, {
			props: { density: 'compact', gap: 6, rest: { 'data-testid': 'list' } }
		});
		const el = screen.container.querySelector('[data-testid="list"]');
		expect(el?.className).toContain('compact');
	});

	it('applies data-testid', async () => {
		const screen = await render(ChatListProbe, {
			props: { rest: { 'data-testid': 'chat-list' } }
		});
		expect(screen.container.querySelector('[data-testid="chat-list"]')).not.toBeNull();
	});
});

describe('ChatSystemMessage', () => {
	it('renders children', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Conversation started' }
		});
		await expect.element(screen.getByText('Conversation started')).toBeInTheDocument();
	});

	it('has role="status"', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Notice', 'data-testid': 'sys' }
		});
		const el = screen.container.querySelector('[data-testid="sys"]');
		expect(el?.getAttribute('role')).toBe('status');
	});

	it('renders default variant without divider lines', async () => {
		const screen = await render(ChatSystemMessage, { props: { children: 'Hello' } });
		// Divider lines have aria-hidden, so check there are none
		expect(screen.container.querySelectorAll('[aria-hidden]').length).toBe(0);
	});

	it('renders divider variant with Divider', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Today', variant: 'divider' }
		});
		await expect.element(screen.getByText('Today')).toBeInTheDocument();
	});

	it('exposes the divider variant label as the separator accessible name', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Today', variant: 'divider' }
		});
		await expect.element(screen.getByRole('separator')).toHaveAccessibleName('Today');
	});

	it('renders icon', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: ChatSystemMessage,
				slot: 'icon',
				text: '*',
				testid: 'icon',
				rest: { children: 'Notice' }
			}
		});
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeNull();
	});

	it('applies variant class', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Today', variant: 'divider', 'data-testid': 'sys' }
		});
		const el = screen.container.querySelector('[data-testid="sys"]');
		expect(el?.className).toContain('divider');
	});

	it('applies data-testid', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Hello', 'data-testid': 'my-sys' }
		});
		expect(screen.container.querySelector('[data-testid="my-sys"]')).not.toBeNull();
	});

	it('forwards rest props (data-*, id) while keeping its own role', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Hello', 'data-testid': 'sys', 'data-custom': 'x', id: 'sys-1' }
		});
		const el = screen.container.querySelector('[data-testid="sys"]');
		expect(el?.getAttribute('data-custom')).toBe('x');
		expect(el?.getAttribute('id')).toBe('sys-1');
		expect(el?.getAttribute('role')).toBe('status');
	});

	it('forwards rest props in the divider variant', async () => {
		const screen = await render(ChatSystemMessage, {
			props: { children: 'Today', variant: 'divider', 'data-testid': 'sys', 'data-custom': 'x' }
		});
		const el = screen.container.querySelector('[data-testid="sys"]');
		expect(el?.getAttribute('data-custom')).toBe('x');
		expect(el?.getAttribute('role')).toBe('status');
	});
});
