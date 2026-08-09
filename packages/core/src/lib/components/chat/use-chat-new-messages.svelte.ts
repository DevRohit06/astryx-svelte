import { observeResize, unobserveResize } from '../../internal/shared-resize-observer.js';

/**
 * Detects new chat messages, ported from Astryx's `Chat/useChatNewMessages.ts`.
 *
 * Observes a content element via the shared `ResizeObserver` and tracks the
 * last `.astryx-chat-message` element. When a new message appears (the last
 * element changes), it flags `hasNewMessages` — but only if the scroll is
 * unlocked, since a locked scroll means the user is already at the bottom.
 *
 * It also calls `onResize` on every content height change so the scroll hook
 * can follow growing content (streaming).
 *
 * **`contentRef` stays a callback, not an attachment.** Everywhere else this
 * port turns a React callback ref into an attachment, because that is what the
 * consumer would spell — but here the callback is published *through a context*
 * and invoked by a different component (`ChatMessageList`), which is exactly
 * the shape upstream's `ChatLayoutContextValue.contentRef` already has. Keeping
 * it a function means the two sides read the same and the consumer decides how
 * to attach it.
 *
 * The options arrive as **getters** because upstream mirrors both into refs on
 * every render (`isLockedRef.current = isLocked`), so they are genuinely live.
 */

export interface UseChatNewMessagesOptions {
	/**
	 * Whether the scroll is currently locked (following content). When locked,
	 * new messages don't flag — the user is already at the bottom.
	 */
	isLocked: () => boolean;

	/**
	 * Called on every content height change (new message or streaming growth).
	 * Use to trigger scroll-if-locked in the scroll hook.
	 */
	onResize?: () => void;
}

export interface UseChatNewMessagesReturn {
	/** Whether new messages arrived while the scroll was unlocked. */
	readonly hasNewMessages: boolean;

	/** Dismiss the new messages flag. */
	dismiss: () => void;

	/**
	 * Callback for the content element. Handles late mount — the observer
	 * attaches whenever the element appears, and re-attaches on a swap.
	 */
	contentRef: (el: HTMLElement | null) => void;
}

export function useChatNewMessages({
	isLocked,
	onResize
}: UseChatNewMessagesOptions): UseChatNewMessagesReturn {
	let hasNewMessages = $state(false);
	let lastMessage: Element | null = null;

	// Track the current content element. When the callback fires, we tear down
	// the old observer and set up a new one.
	let element: HTMLElement | null = null;
	let cleanup: (() => void) | null = null;

	function attach(el: HTMLElement): void {
		observeResize(el, () => {
			onResize?.();

			const messages = el.getElementsByClassName('astryx-chat-message');
			const last = messages.length > 0 ? messages[messages.length - 1] : null;

			if (last && last !== lastMessage) {
				lastMessage = last;
				if (!isLocked()) {
					hasNewMessages = true;
				}
			}
		});

		cleanup = () => unobserveResize(el);
	}

	function detach(): void {
		cleanup?.();
		cleanup = null;
	}

	function contentRef(el: HTMLElement | null): void {
		if (el === element) {
			return;
		}

		// Detach from previous element
		detach();
		element = el;

		// Attach to new element
		if (el) {
			attach(el);
		}
	}

	// Cleanup on unmount
	$effect(() => {
		return () => detach();
	});

	function dismiss(): void {
		hasNewMessages = false;
	}

	return {
		get hasNewMessages() {
			return hasNewMessages;
		},
		dismiss,
		contentRef
	};
}
