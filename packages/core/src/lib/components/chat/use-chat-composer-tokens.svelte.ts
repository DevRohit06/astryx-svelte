import { ensureCaretInside, insertTextAtCursor } from './chat-composer-selection.js';
import type { ChatComposerToken, ChatComposerTokenCustom } from './chat-composer-input.svelte';

/**
 * Inline token chips in a contentEditable, ported from Astryx's
 * `Chat/useChatComposerTokens.ts`:
 *
 * - Insert tokens (badge or custom render) at the cursor position
 * - Backspace handling near tokens (removes token + trailing NBSP)
 * - Paste handling near tokens (prevents broken state)
 * - Portal tracking for rendering inside DOM-created spans
 * - Serialization awareness (`data-astryx-token` attributes)
 *
 * **The portal list survives the translation unchanged.** Upstream keeps a
 * `TokenPortal[]` because the token spans are created imperatively — a `Range`
 * decides where they go — so no framework can own them declaratively. That is
 * as true here as there; `ChatComposerInput` renders each portal's content into
 * its span by *moving* the rendered node with an attachment, which is the
 * closest Svelte has to `createPortal` and, unlike `mount()`, keeps the content
 * inside the component tree so context (i18n, theme) still reaches it. See that
 * file for why the moved node is the content's own root rather than a wrapper.
 *
 * `editableRef` arrives as a getter, this port's `RefObject` translation.
 */

export interface TokenPortal {
	id: string;
	span: HTMLSpanElement;
	token: ChatComposerToken;
}

export interface UseChatComposerTokensOptions {
	/** The contentEditable element. Upstream passes a `RefObject`. */
	editableRef: () => HTMLDivElement | null;
	/** Called after token insertion/removal to sync state. */
	onEmitChange: () => void;
}

export interface UseChatComposerTokensReturn {
	/** Active token portals — the component renders each into its own span. */
	readonly tokenPortals: TokenPortal[];
	/** Expand a token — replace the token span with its text value. */
	expandToken: (id: string) => void;
	/** Insert a token at the current cursor position. */
	insertToken: (token: ChatComposerToken) => string | undefined;
	/** Handle keydown — intercepts Backspace near tokens. Returns true if handled. */
	handleKeyDown: (e: KeyboardEvent) => boolean;
	/** Handle paste — prevents pasting into token spans. Returns true if handled. */
	handlePaste: (e: ClipboardEvent) => boolean;
	/** Clean up orphaned portals (call after content changes). */
	cleanupPortals: () => void;
}

/** Type guard: does this token use the custom render path? */
export function isCustomToken(token: ChatComposerToken): token is ChatComposerTokenCustom {
	return 'render' in token && typeof token.render === 'function';
}

/** Check if a node is inside or is a token span. */
function isInsideToken(node: Node): HTMLElement | null {
	let current: Node | null = node;
	while (current) {
		if (current instanceof HTMLElement && current.hasAttribute('data-astryx-token')) {
			return current;
		}
		current = current.parentNode;
	}
	return null;
}

export function useChatComposerTokens({
	editableRef,
	onEmitChange
}: UseChatComposerTokensOptions): UseChatComposerTokensReturn {
	let tokenPortals = $state.raw<TokenPortal[]>([]);

	// --- Insert token at cursor ---
	function insertToken(token: ChatComposerToken): string | undefined {
		const editable = editableRef();
		if (!editable) {
			return;
		}

		// Place a caret at the end of the editable if there's no Range inside it
		// (programmatic focus does not create one).
		const selection = ensureCaretInside(editable);
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const range = selection.getRangeAt(0);

		// Create a non-editable container — the component renders the badge into it
		const span = document.createElement('span');
		const id = `token-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		span.setAttribute('data-astryx-token', '');
		span.setAttribute('data-astryx-token-value', token.value);
		span.setAttribute('data-astryx-token-id', id);
		span.contentEditable = 'false';
		span.style.display = 'inline-flex';
		span.style.verticalAlign = 'baseline';

		range.deleteContents();
		range.insertNode(span);

		// Add a non-breaking space after the token and move cursor there
		const space = document.createTextNode('\u00A0');
		span.after(space);

		const newRange = document.createRange();
		newRange.setStartAfter(space);
		newRange.collapse(true);
		selection.removeAllRanges();
		selection.addRange(newRange);

		// Register for portal rendering
		tokenPortals = [...tokenPortals, { id, span, token }];
		return id;
	}

	// --- Backspace near tokens ---
	function handleKeyDown(e: KeyboardEvent): boolean {
		if (e.key !== 'Backspace') {
			return false;
		}

		const selection = window.getSelection();
		if (!selection || !selection.isCollapsed || selection.rangeCount === 0) {
			return false;
		}

		const range = selection.getRangeAt(0);
		const { startContainer, startOffset } = range;

		// Case 1: Cursor at start of text node right after a token — let the
		// browser handle it (it will select/delete the token)
		if (
			startContainer.nodeType === Node.TEXT_NODE &&
			startOffset === 0 &&
			startContainer.previousSibling instanceof HTMLElement &&
			startContainer.previousSibling.hasAttribute('data-astryx-token')
		) {
			return false;
		}

		// Case 2: Cursor in or after the trailing NBSP — remove both the NBSP and
		// the token in one action
		if (
			startContainer.nodeType === Node.TEXT_NODE &&
			startContainer.textContent === '\u00A0' &&
			startOffset <= 1 &&
			startContainer.previousSibling instanceof HTMLElement &&
			startContainer.previousSibling.hasAttribute('data-astryx-token')
		) {
			e.preventDefault();
			const tokenSpan = startContainer.previousSibling;
			const parent = startContainer.parentNode;
			if (parent) {
				parent.removeChild(startContainer);
				parent.removeChild(tokenSpan);
			}
			onEmitChange();
			return true;
		}

		return false;
	}

	// --- Paste near tokens ---
	function handlePaste(e: ClipboardEvent): boolean {
		const editable = editableRef();
		if (!editable) {
			return false;
		}

		const selection = ensureCaretInside(editable);
		if (!selection || selection.rangeCount === 0) {
			return false;
		}

		const range = selection.getRangeAt(0);

		// If selection overlaps a token, collapse to after the token and insert
		// there instead of breaking the token
		const tokenEl = isInsideToken(range.startContainer);
		if (tokenEl) {
			e.preventDefault();
			// `ClipboardEvent.clipboardData` is nullable in the DOM lib where
			// React's synthetic event types it non-null; the fallback is the only
			// change from upstream's expression.
			const text = e.clipboardData?.getData('text/plain') ?? '';

			// Move cursor after the token's trailing space
			const space = tokenEl.nextSibling;
			const newRange = document.createRange();
			if (space && space.nodeType === Node.TEXT_NODE) {
				newRange.setStartAfter(space);
			} else {
				newRange.setStartAfter(tokenEl);
			}
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);

			insertTextAtCursor(editable, text);
			onEmitChange();
			return true;
		}

		return false;
	}

	// --- Expand token (replace with text) ---
	function expandToken(id: string): void {
		const editable = editableRef();
		if (!editable) {
			return;
		}

		const portal = tokenPortals.find((p) => p.id === id);
		if (!portal) {
			return;
		}

		const { span } = portal;
		const value = span.getAttribute('data-astryx-token-value') ?? '';
		const textNode = document.createTextNode(value);

		// Remove the trailing NBSP if present
		const next = span.nextSibling;
		if (next?.nodeType === Node.TEXT_NODE && next.textContent === '\u00A0') {
			next.remove();
		}

		span.replaceWith(textNode);

		// Place cursor at end of inserted text
		const selection = window.getSelection();
		if (selection) {
			const range = document.createRange();
			range.setStartAfter(textNode);
			range.collapse(true);
			selection.removeAllRanges();
			selection.addRange(range);
		}

		// Remove from portals
		tokenPortals = tokenPortals.filter((p) => p.id !== id);
		onEmitChange();
	}

	// --- Cleanup orphaned portals ---
	function cleanupPortals(): void {
		const editable = editableRef();
		tokenPortals = tokenPortals.filter((p) => editable?.contains(p.span));
	}

	return {
		get tokenPortals() {
			return tokenPortals;
		},
		expandToken,
		insertToken,
		handleKeyDown,
		handlePaste,
		cleanupPortals
	};
}
