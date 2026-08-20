<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { BadgeProps } from '../badge/badge.svelte';
	import type { SearchSource, SearchableItem } from '../typeahead/types.js';
	import type { UseChatPasteAsTokenReturn } from './use-chat-paste-as-token.js';

	/**
	 * The imperative handle a `ChatComposerInput` exposes.
	 *
	 * Upstream reaches it through a `handleRef` prop and `useImperativeHandle`;
	 * Svelte's counterpart is the component instance itself, so these are
	 * instance exports and `bind:this` is the seam — the arrangement `Tokenizer`,
	 * `SideNav`, `Calendar` and `PowerSearch` already established. There is
	 * therefore no `handleRef` prop; the type still describes exactly what
	 * upstream's does.
	 *
	 * It also drops upstream's `selfRef`/`useImperativeHandle` duplication and
	 * the two `insertTokenRef`/`insertTextRef` mirrors: those exist because React
	 * only runs the `useImperativeHandle` factory when a parent attaches a ref,
	 * so paste-as-token would silently no-op inside `ChatComposer`. Instance
	 * exports are always present, so the internal consumer reads the same
	 * functions the parent would.
	 */
	export interface ChatComposerInputHandle {
		/** Insert a token (badge chip) at the current cursor position. */
		insertToken: (token: ChatComposerToken) => string | undefined;
		/** Expand a token — replace the token span with its serialized text value. */
		expandToken: (id: string) => void;
		/** Insert plain text at the current cursor position. */
		insertText: (text: string) => void;
		/** Focus the input. */
		focus: () => void;
		/** Get the current serialized value. */
		getValue: () => string;
	}

	/** Badge config for the common case — structured, simple, autocomplete-friendly. */
	export type ChatComposerTokenBadge = {
		/** Serialized value — what this token becomes in the `onSubmit` string. */
		value: string;
	} & Omit<BadgeProps, 'xstyle' | 'class' | 'style'>;

	/**
	 * Custom render for the escape hatch — tooltips, hovercards, rich content.
	 *
	 * Upstream types `render` as `() => ReactNode`, a function called at render
	 * time. A `Snippet` *is* a nullary function producing markup, so it slots in
	 * unchanged: `{@render token.render()}` is upstream's `token.render()` call,
	 * and `typeof token.render === 'function'` still discriminates the union.
	 */
	export type ChatComposerTokenCustom = {
		/** Serialized value — what this token becomes in the `onSubmit` string. */
		value: string;
		/** Full control over the token's rendered content. */
		render: Snippet;
	};

	/**
	 * Token inserted into the contentEditable by a trigger menu.
	 *
	 * Two forms:
	 * - **Badge config** (recommended): `{ value, label, variant?, icon? }` —
	 *   renders a Badge. Structured, themeable, autocomplete-friendly.
	 * - **Custom render**: `{ value, render }` — full control via a snippet.
	 *   Use for tooltips, hovercards, or any content beyond a badge.
	 */
	export type ChatComposerToken = ChatComposerTokenBadge | ChatComposerTokenCustom;

	export type ChatComposerTriggerItem = SearchableItem;

	export type ChatComposerTrigger = {
		/** Character that activates this trigger menu (e.g. `'@'`, `'/'`). */
		character: string;
		/**
		 * Search source providing items for this trigger. Reuses the same
		 * `SearchSource` interface as `Typeahead` — supports sync/async search,
		 * bootstrap, and `cancel()`.
		 *
		 * Use `createStaticSource()` for static item lists, or implement
		 * `SearchSource` for API-backed search.
		 *
		 * @example
		 * ```ts
		 * import { createStaticSource } from '@astryx-svelte/core';
		 * const mentionTrigger = {
		 *   character: '@',
		 *   searchSource: createStaticSource(users),
		 *   onSelect: (item) => ({ value: `@${item.id}`, render: userToken })
		 * };
		 * ```
		 */
		searchSource: SearchSource;
		/** How to render each item in the trigger menu. */
		renderItem?: Snippet<[SearchableItem]>;
		/**
		 * What to insert when an item is selected. Return a string for plain text,
		 * or a token for an inline chip.
		 */
		onSelect: (item: SearchableItem) => string | ChatComposerToken;
		/**
		 * Parse serialized tokens back into rendered tokens. Used when loading a
		 * previous message for editing.
		 */
		deserialize?: (value: string) => ChatComposerToken | null;
		/** Text shown when no results found. @default 'No results' */
		emptySearchResultsText?: string;
		/** Text shown during async search. @default 'Searching…' */
		loadingText?: string;
		/** Accessible label for the menu. @default 'Suggestions' */
		menuLabel?: string;
	};

	export interface ChatComposerInputProps extends Omit<
		BaseProps<HTMLDivElement>,
		'onchange' | 'onpaste' | 'onsubmit'
	> {
		/** Controlled value. */
		value?: string;
		/** Change handler. */
		onChange?: (value: string) => void;
		/** Placeholder text. @default 'Type a message…' */
		placeholder?: string;
		/** Max rows before scrolling. @default 8 */
		maxRows?: number;
		/** Trigger definitions for `@` menus, `/` commands, etc. */
		triggers?: ChatComposerTrigger[];
		/**
		 * Debounce delay in ms before triggering async search. Set to 0 for
		 * immediate search.
		 * @default 150
		 */
		debounceMs?: number;
		/** Enable message history recall. @default true */
		hasHistory?: boolean;
		/** Accessible label. @default 'Message input' */
		label?: string;
		/** Disabled state. @default false */
		isDisabled?: boolean;
		/**
		 * Paste handler. Called with the plain text before insertion. Return true
		 * to handle the paste yourself (e.g. insert a token instead).
		 */
		onPaste?: (event: ClipboardEvent, text: string) => boolean | void;
		/**
		 * Paste-as-token behavior. Defaults to converting pastes over 200 chars
		 * into token chips. Pass a custom `useChatPasteAsToken` result to
		 * override, or `false` to disable.
		 */
		pasteAsToken?: UseChatPasteAsTokenReturn | false;
		/** File drop/paste handler. */
		onFiles?: (files: File[]) => void;
		/** Submit handler (Enter without Shift). */
		onSubmit?: (value: string) => void;
		/**
		 * Key-down handler invoked before the built-in Enter/history behavior
		 * (but after an open trigger menu consumes the event).
		 *
		 * This is the seam for platform- or app-specific key handling:
		 * - Call `event.preventDefault()` to suppress the default submit (e.g.
		 *   let Enter insert a newline on a touch keyboard).
		 * - Add behavior by acting on the event yourself (e.g. submit on
		 *   Cmd/Ctrl+Enter) without calling `preventDefault()`, so the default
		 *   handling still runs for other keys.
		 *
		 * IME composition is always respected regardless of this handler: Enter
		 * never submits while a composition is in progress.
		 *
		 * Keeps upstream's casing: unlike `onkeydown`, this is a callback prop
		 * that never reaches an element — it is invoked from the editable's own
		 * handler — so there is no DOM event name to match. The inherited
		 * lowercase `onkeydown` still lands on the root `<div>` via the rest
		 * props, where it sees the event on the way back up; only this prop runs
		 * *before* the built-in handling and can pre-empt it.
		 */
		onKeyDown?: (event: KeyboardEvent) => void;
	}

	/** Select all text in a contentEditable element. */
	function selectAll(el: HTMLElement): void {
		const selection = window.getSelection();
		if (!selection) {
			return;
		}
		const range = document.createRange();
		range.selectNodeContents(el);
		selection.removeAllRanges();
		selection.addRange(range);
	}

	function serialize(node: Node): string {
		let result = '';
		for (const child of Array.from(node.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE) {
				result += child.textContent ?? '';
			} else if (child instanceof HTMLElement) {
				if (child.hasAttribute('data-astryx-token')) {
					result += child.getAttribute('data-astryx-token-value') ?? '';
				} else if (child.tagName === 'BR') {
					result += '\n';
				} else {
					result += serialize(child);
				}
			}
		}
		return result;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Badge from '../badge/badge.svelte';
	import ChatPastedTextToken from './chat-pasted-text-token.svelte';
	import TriggerMenuLayer from './trigger-menu-layer.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { isImeKeyEvent } from '../../utils/ime.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { ensureCaretInside, insertTextAtCursor } from './chat-composer-selection.js';
	import { useChatComposerContext } from './chat-context.svelte.js';
	import { isCustomToken, useChatComposerTokens } from './use-chat-composer-tokens.svelte.js';
	import { useChatPasteAsToken } from './use-chat-paste-as-token.js';
	import { useTriggerMenu } from './use-trigger-menu.svelte.js';
	import {
		LINE_HEIGHT_PX,
		chatComposerInputEditableAttrs,
		chatComposerInputPlaceholderAttrs,
		chatComposerInputRootAttrs
	} from './chat-composer-input.stylex.js';

	/**
	 * ContentEditable-based rich input for the chat composer. Supports trigger
	 * menus (`@` mentions, `/` commands) via `SearchSource`, inline token
	 * rendering, serialization, Enter/Shift+Enter, message history, paste/drop
	 * file handling, and mobile-safe touch typography.
	 *
	 * **`createPortal` becomes a moved node, and this is the port's only use of
	 * either.** Token spans are created imperatively — a `Range` decides where
	 * they go — so no framework can own them declaratively; upstream portals the
	 * token's content into each span. Svelte has no portal, and `mount()` is not
	 * a substitute: it starts a *separate* component tree, so context would stop
	 * reaching the content and `ChatPastedTextToken`'s `useTranslator()` would
	 * fall back to the shipped catalog. Instead each portal renders a
	 * `display: contents` span in this component's own tree, and an attachment
	 * moves that span into the token span. Context, reactivity and teardown all
	 * behave as they would in place; the wrapper generates no box, so layout and
	 * the emitted atomic classes are identical. It is one element upstream does
	 * not have, recorded under Known debts.
	 *
	 * **DOM_OWNERSHIP — why `svelte/no-dom-manipulating` is disabled at five
	 * sites.** The rule guards against a template-owned node being mutated behind
	 * Svelte's back. It does not apply here: the editable `<div>` has *no*
	 * template children at all — it is empty in the markup, and every node inside
	 * it is authored by the user typing, by `insertToken`'s `Range` work, or by
	 * these five `textContent` writes. Svelte therefore has nothing to reconcile
	 * against, which is exactly what makes a contentEditable editor possible.
	 * (The moved portal spans are the one exception, and they are moved *into*
	 * it rather than reconciled inside it — Svelte still owns each span itself.)
	 */
	// `valueProp` is destructured *without* a default so it stays `undefined`
	// when the caller passes none — that distinction is what upstream reads as
	// `props.value !== undefined` before applying the context fallback, and it is
	// lost the moment a default is written into the pattern.
	const {
		value: valueProp,
		onChange: onChangeProp,
		placeholder: placeholderProp,
		maxRows = 8,
		triggers,
		debounceMs = 150,
		hasHistory = true,
		label: labelProp,
		isDisabled: isDisabledProp,
		onPaste: onPasteProp,
		pasteAsToken: pasteAsTokenProp,
		onFiles,
		onSubmit: onSubmitProp,
		onKeyDown: onKeyDownProp,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatComposerInputProps = $props();

	const t = useTranslator();
	const context = useChatComposerContext();
	const ctx = $derived(context?.() ?? null);

	const hasControlledValueProp = $derived(valueProp !== undefined);
	const controlledValue = $derived(valueProp ?? ctx?.value);
	const isDisabled = $derived(isDisabledProp ?? ctx?.isDisabled ?? false);
	const onSubmit = $derived(onSubmitProp ?? ctx?.onSubmit);
	const label = $derived(labelProp ?? t('@astryx.chat.composerInput.label'));
	const placeholder = $derived(
		placeholderProp ?? ctx?.placeholder ?? t('@astryx.chat.composer.placeholder')
	);

	/**
	 * Upstream's `onChange`: a controlled `value` prop routes only to the prop
	 * handler; otherwise the composer context is notified first and the prop
	 * handler after — but only when the two are not the same function, so a
	 * consumer that passed the context's own `onChange` is not called twice.
	 */
	function onChange(nextValue: string): void {
		if (hasControlledValueProp) {
			onChangeProp?.(nextValue);
			return;
		}
		const composerOnChange = ctx?.onChange;
		composerOnChange?.(nextValue);
		if (onChangeProp !== composerOnChange) {
			onChangeProp?.(nextValue);
		}
	}

	let editable: HTMLDivElement | null = $state(null);
	let isEmpty = $state(true);
	let history: string[] = [];
	let historyIndex = -1;
	let currentDraft = '';
	// One-shot marker: when set, holds the value we expect the parent to echo
	// back as `controlledValue` after our latest `onChange` emission. We use it
	// to skip a single resync, because resyncing would (a) collapse the caret to
	// offset 0 and (b) discard any characters the user typed between the emit
	// and the resulting commit. Cleared on consumption — either when the echo
	// arrives or when a non-echoing external update overwrites it — so a later
	// external set back to the same string is never incorrectly skipped.
	let pendingEchoValue: string | undefined = undefined;

	function emitChange(): void {
		if (!editable) {
			return;
		}
		const text = serialize(editable);
		// Browsers may leave a trailing <br> when all content is deleted, which
		// serializes to "\n". Treat whitespace-only as empty.
		const hasTokens =
			editable.querySelector('[data-astryx-token], [data-astryx-dictation-interim]') != null;
		const trimmedEmpty = text.trim().length === 0 && !hasTokens;
		const nextValue = trimmedEmpty ? '' : text;
		pendingEchoValue = nextValue;
		isEmpty = trimmedEmpty;
		onChange(nextValue);
		tokens.cleanupPortals();
	}

	// --- Token management (via hook) ---
	const tokens = useChatComposerTokens({
		editableRef: () => editable,
		onEmitChange: emitChange
	});

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function insertText(text: string): void {
		if (!editable) {
			return;
		}
		insertTextAtCursor(editable, text);
	}

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function insertToken(token: ChatComposerToken): string | undefined {
		return tokens.insertToken(token);
	}

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function expandToken(id: string): void {
		tokens.expandToken(id);
	}

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function focus(): void {
		editable?.focus();
	}

	/** Upstream's `useImperativeHandle(handleRef, …)` — reach it via `bind:this`. */
	export function getValue(): string {
		return serialize(editable ?? document.createElement('div'));
	}

	// The same handle, for internal consumers. Upstream keeps `selfRef` for
	// exactly this and explains why `useImperativeHandle` cannot serve both.
	const selfHandle: ChatComposerInputHandle = {
		insertToken,
		expandToken,
		insertText,
		focus,
		getValue
	};

	// Register a focus control with the composer shell so body-click-to-focus
	// works without the shell sniffing the input's DOM shape. Cleared on unmount
	// so the shell falls back cleanly if the input goes away.
	//
	// The registration function is read `untrack`ed and the effect therefore has
	// no dependencies — mount and unmount only, which is what upstream's
	// `[inputControlRef]` amounts to for a stable ref. Reading it through `ctx`
	// instead would re-run this on every keystroke, because the composer rebuilds
	// its context value whenever `value` changes.
	$effect(() => {
		const register = untrack(() => context?.().inputControlRef);
		if (!register) {
			return;
		}
		register({ focus });
		return () => register(null);
	});

	// --- Paste-as-token (internal default) ---
	const defaultPasteAsToken = useChatPasteAsToken({ inputRef: () => selfHandle });
	const pasteAsToken = $derived(
		pasteAsTokenProp === false ? null : (pasteAsTokenProp ?? defaultPasteAsToken)
	);

	// --- Trigger menu ---
	// `$props.id()` is only legal as a top-level variable initialiser, so the id
	// is minted here and handed down rather than written inline in the options.
	const inputId = $props.id();
	const triggerMenu = useTriggerMenu({
		id: inputId,
		triggers: () => triggers,
		editableRef: () => editable,
		onInsertToken: (token) => {
			tokens.insertToken(token);
		},
		onInsertText: insertText,
		onEmitChange: emitChange,
		get debounceMs() {
			return debounceMs;
		}
	});

	$effect(() => {
		const next = controlledValue;
		if (next === undefined || !editable) {
			return;
		}
		// Skip exactly one echo of our most recent `onChange` emission: the DOM is
		// already authoritative for that value, and the user may have typed more
		// characters between the emit and this effect running. Consume the marker
		// so a later external set to the same string is still applied.
		if (next === pendingEchoValue) {
			pendingEchoValue = undefined;
			return;
		}
		const el = editable;
		if (serialize(el) !== next) {
			// Genuine external override — invalidate any stale pending echo before
			// we rewrite the DOM.
			pendingEchoValue = undefined;
			const wasFocused = document.activeElement === el;
			// No disable needed here, unlike the four writes in `handleKeyDown`:
			// the rule only fires on a `bind:this` binding read directly, and this
			// site writes through the local `el` copy.
			el.textContent = next;
			// Setting `textContent` tears down the existing text node, which
			// collapses any Selection inside this editable to offset 0. If the user
			// was focused (e.g. a programmatic insert from a slash-menu pick),
			// restore the caret to the end of the new content so the next keystroke
			// appends rather than prepends.
			if (wasFocused) {
				const selection = window.getSelection();
				if (selection) {
					const range = document.createRange();
					range.selectNodeContents(el);
					range.collapse(false);
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}
			isEmpty = next.length === 0;
		} else {
			pendingEchoValue = undefined;
		}
	});

	function handleInput(): void {
		emitChange();
		triggerMenu.handleInput();
	}

	function handleKeyDown(e: KeyboardEvent): void {
		// Let trigger menu consume the event first
		if (triggerMenu.handleKeyDown(e)) {
			return;
		}

		// Consumer passthrough — runs before built-in Enter/history handling.
		// A consumer can preventDefault() to fully own the keystroke.
		onKeyDownProp?.(e);
		if (e.defaultPrevented) {
			return;
		}

		// Handle Backspace near tokens — prevent the browser from creating stray
		// <br> elements or moving the cursor unexpectedly.
		if (e.key === 'Backspace') {
			const selection = window.getSelection();
			if (selection && selection.isCollapsed && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				const { startContainer, startOffset } = range;

				if (
					startContainer.nodeType === Node.TEXT_NODE &&
					startOffset === 0 &&
					startContainer.previousSibling instanceof HTMLElement &&
					startContainer.previousSibling.hasAttribute('data-astryx-token')
				) {
					// Cursor is at start of text node right after a token — let the
					// browser handle it normally (it will select/delete the token)
				} else if (
					startContainer.nodeType === Node.TEXT_NODE &&
					startContainer.textContent === '\u00A0' &&
					startOffset <= 1 &&
					startContainer.previousSibling instanceof HTMLElement &&
					startContainer.previousSibling.hasAttribute('data-astryx-token')
				) {
					// Cursor is in or after the trailing NBSP — remove the NBSP and the
					// token in one action
					e.preventDefault();
					const tokenSpan = startContainer.previousSibling;
					const parent = startContainer.parentNode;
					if (parent) {
						parent.removeChild(startContainer);
						parent.removeChild(tokenSpan);
					}
					emitChange();
					return;
				}
			}
		}

		if (e.key === 'Enter' && !e.shiftKey) {
			// Never submit mid-composition — an IME uses Enter to commit a
			// candidate. See utils/ime.ts for the full rationale.
			if (isImeKeyEvent(e)) {
				return;
			}

			e.preventDefault();
			if (!editable) {
				return;
			}
			const text = serialize(editable).trim();
			if (!text) {
				return;
			}

			if (hasHistory) {
				history.push(text);
				historyIndex = -1;
				currentDraft = '';
			}

			onSubmit?.(text);
			// eslint-disable-next-line svelte/no-dom-manipulating -- see DOM_OWNERSHIP
			editable.textContent = '';
			isEmpty = true;
			onChange('');
			return;
		}

		// History navigation (only when trigger menu is not active)
		if (hasHistory && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			if (!editable) {
				return;
			}
			const text = serialize(editable);
			if (history.length === 0) {
				return;
			}

			if (e.key === 'ArrowUp') {
				if (historyIndex === -1) {
					currentDraft = text;
				}
				const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
				historyIndex = nextIndex;
				// eslint-disable-next-line svelte/no-dom-manipulating -- see DOM_OWNERSHIP
				editable.textContent = history[nextIndex];
				selectAll(editable);
				emitChange();
				e.preventDefault();
			} else if (e.key === 'ArrowDown' && historyIndex !== -1) {
				const nextIndex = historyIndex + 1;
				if (nextIndex >= history.length) {
					historyIndex = -1;
					// eslint-disable-next-line svelte/no-dom-manipulating -- see DOM_OWNERSHIP
					editable.textContent = currentDraft;
					if (currentDraft) {
						selectAll(editable);
					}
				} else {
					historyIndex = nextIndex;
					// eslint-disable-next-line svelte/no-dom-manipulating -- see DOM_OWNERSHIP
					editable.textContent = history[nextIndex];
					selectAll(editable);
				}
				emitChange();
				e.preventDefault();
			}
		}
	}

	function handlePaste(e: ClipboardEvent): void {
		if (!editable) {
			return;
		}

		// Place a caret at the end of the editable if the Selection has no Range
		// inside it — programmatic focus alone doesn't create one in
		// Chromium/Firefox.
		ensureCaretInside(editable);

		// Handle paste near/into tokens first
		if (tokens.handlePaste(e)) {
			return;
		}

		const files = Array.from(e.clipboardData?.files ?? []);
		if (files.length > 0) {
			e.preventDefault();
			onFiles?.(files);
			return;
		}

		e.preventDefault();
		const text = e.clipboardData?.getData('text/plain') ?? '';

		// Paste-as-token: convert long pastes to token chips
		if (pasteAsToken?.onPaste(e, text)) {
			emitChange();
			return;
		}

		// Consumer onPaste — return true to prevent default text insert
		const handled = onPasteProp?.(e, text);
		if (handled) {
			emitChange();
			return;
		}

		insertTextAtCursor(editable, text);
		emitChange();
	}

	const maxHeight = $derived(maxRows * LINE_HEIGHT_PX);

	const theme = themeProps('chat-composer-input');
	const root = $derived(chatComposerInputRootAttrs(isDisabled, xstyle));
	const editableAttrs = $derived(chatComposerInputEditableAttrs());
	const placeholderAttrs = $derived(chatComposerInputPlaceholderAttrs());

	const livePortals = $derived(tokens.tokenPortals.filter(({ span }) => span.isConnected));

	/**
	 * Move a rendered portal wrapper into its imperatively-created token span.
	 * The cleanup is Svelte's own removal path, so nothing is needed here.
	 */
	function intoSpan(span: HTMLSpanElement) {
		return (node: HTMLElement) => {
			span.appendChild(node);
		};
	}
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
>
	{#if isEmpty}
		<div class={placeholderAttrs.class} style={placeholderAttrs.style} aria-hidden="true">
			{placeholder}
		</div>
	{/if}
	<div
		bind:this={editable}
		aria-multiline="true"
		aria-label={label}
		contenteditable={!isDisabled}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onpaste={handlePaste}
		{...triggerMenu.ariaProps}
		class={editableAttrs.class}
		style={mergeStyle(editableAttrs.style, `max-height: ${maxHeight}px;`)}
	></div>
	<TriggerMenuLayer menu={triggerMenu} />
	{#each livePortals as portal (portal.id)}
		<span style="display: contents" {@attach intoSpan(portal.span)}>
			{#if isCustomToken(portal.token)}
				{@render portal.token.render()}
			{:else if portal.token.value.length > (pasteAsToken === null ? Infinity : 200)}
				<ChatPastedTextToken
					text={portal.token.value}
					onExpand={() => tokens.expandToken(portal.id)}
				/>
			{:else}
				<Badge label={portal.token.label} variant={portal.token.variant} icon={portal.token.icon} />
			{/if}
		</span>
	{/each}
</div>
