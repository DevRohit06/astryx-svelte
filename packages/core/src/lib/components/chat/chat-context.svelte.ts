import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `Chat/ChatContext.tsx` — all four of its contexts.
 *
 * Stored as **getters**, per the port's context convention: `sender`/`density`
 * are static in practice but the composer's `value`/`canSend`/`isStopShown`
 * change on every keystroke, and a stored value would freeze the
 * sub-components at whatever the container held when they mounted.
 *
 * Every one is optional on both sides — `createContext(null)` upstream,
 * `getOr(null)` here — because each sub-component is documented as usable
 * standalone.
 *
 * Upstream's `ChatLayoutContextValue.scrollContainerRef` is a
 * `RefObject<HTMLElement | null>`; Svelte has no ref objects, so it arrives as
 * a getter, the translation `useOutlineFromDOM` and `useScrollSpy` already
 * settled. `contentRef` is already a *callback* ref upstream, which needs no
 * translation at all — the consumer calls it from an attachment.
 *
 * **This comment used to say only `useChatLayoutContext` is published, and it was
 * wrong.** Upstream's `Chat/index.ts` exports `useChatLayoutContext` *and*
 * `useChatComposerContext`, plus the types `ChatComposerContextValue` and
 * `ChatComposerInputControl`. All four are published here. The fourth used to
 * have no counterpart, because this port's `ChatComposerContextValue` also
 * lacked the `inputControlRef` field it exists to type; both have now landed.
 */

export type ChatMessageSender = 'user' | 'assistant' | 'system';
export type ChatDensity = 'compact' | 'balanced' | 'spacious';

export interface ChatMessageContextValue {
	sender: ChatMessageSender;
	density: ChatDensity;
}

const chatMessageContext = new Context<() => ChatMessageContextValue>('astryx.chat-message');

export function setChatMessageContext(get: () => ChatMessageContextValue): void {
	chatMessageContext.set(get);
}

/** Returns a getter, or null outside a `ChatMessage`. */
export function useChatMessageContext(): (() => ChatMessageContextValue) | null {
	return chatMessageContext.getOr(null);
}

export interface ChatListContextValue {
	density: ChatDensity;
}

const chatListContext = new Context<() => ChatListContextValue>('astryx.chat-list');

export function setChatListContext(get: () => ChatListContextValue): void {
	chatListContext.set(get);
}

/** Returns a getter, or null outside a `ChatMessageList`. */
export function useChatListContext(): (() => ChatListContextValue) | null {
	return chatListContext.getOr(null);
}

// =============================================================================
// Composer context — shared state between ChatComposer and ChatComposerInput
// =============================================================================

/**
 * Imperative surface the composer shell can invoke on its input slot.
 *
 * The input is one slot inside the composer body — it does not span the whole
 * body — so shell-level interactions like "click empty space to focus the
 * input" must flow shell → input. A custom input registers this control (via
 * {@link ChatComposerContextValue.inputControlRef}) so the shell can drive it
 * without knowing its DOM shape. Optional methods can be added over time;
 * inputs implement only what they support.
 */
export interface ChatComposerInputControl {
	/** Move keyboard focus into the input. */
	focus: () => void;
}

export interface ChatComposerContextValue {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	placeholder: string;
	isDisabled: boolean;
	isStopShown: boolean;
	canSend: boolean;
	onStop?: () => void;
	/**
	 * Registers the input slot's {@link ChatComposerInputControl} with the shell,
	 * so the shell can drive the input (e.g. focus on body click). A custom input
	 * calls `inputControlRef(control)` on mount and `inputControlRef(null)` on
	 * unmount. While nothing is registered, the shell falls back to focusing a
	 * `contenteditable`/`textarea` it finds in the body.
	 *
	 * Upstream's is a `RefObject<ChatComposerInputControl | null>` the input
	 * assigns `.current` on. Svelte has no ref objects, and unlike
	 * `scrollContainerRef` this one is written by the *child*, so a getter cannot
	 * carry it — it arrives as the callback half instead, which is the shape
	 * `ChatLayoutContextValue.contentRef` below already uses (and which upstream
	 * itself uses there). The name is upstream's, unchanged.
	 */
	inputControlRef?: (control: ChatComposerInputControl | null) => void;
}

const chatComposerContext = new Context<() => ChatComposerContextValue>('astryx.chat-composer');

export function setChatComposerContext(get: () => ChatComposerContextValue): void {
	chatComposerContext.set(get);
}

/** Returns a getter, or null outside a `ChatComposer`. */
export function useChatComposerContext(): (() => ChatComposerContextValue) | null {
	return chatComposerContext.getOr(null);
}

// =============================================================================
// Layout context — shared between ChatLayout and ChatMessageList
// =============================================================================

export interface ChatLayoutContextValue {
	/** The scrollable container element that wraps the message area. */
	scrollContainer: HTMLElement | null;
	/** Callback for the message list content element — layout observes it for size changes. */
	contentRef: (el: HTMLElement | null) => void;
}

const chatLayoutContext = new Context<() => ChatLayoutContextValue>('astryx.chat-layout');

export function setChatLayoutContext(get: () => ChatLayoutContextValue): void {
	chatLayoutContext.set(get);
}

/**
 * Access the layout's scroll container and content-observer callback.
 * Returns null when used outside a `ChatLayout`.
 */
export function useChatLayoutContext(): (() => ChatLayoutContextValue) | null {
	return chatLayoutContext.getOr(null);
}
