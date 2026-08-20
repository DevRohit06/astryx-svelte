import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import ChatComposerInput from '$lib/components/chat/chat-composer-input.svelte';
import type {
	ChatComposerInputProps,
	ChatComposerTrigger
} from '$lib/components/chat/chat-composer-input.svelte';
import { createStaticSource } from '$lib/components/typeahead/create-static-source.js';
import type { SearchableItem } from '$lib/components/typeahead/types.js';
import ChatComposerInputProbe from './fixtures/chat-composer-input-probe.svelte';
import ChatComposerProbe from './fixtures/chat-composer-probe.svelte';

/**
 * `ChatComposerInput.test.tsx` ported case for case — **51 upstream cases at
 * v0.3.0**, 44 here.
 *
 * ## The count, re-derived from the tag (the previous header was wrong)
 *
 * This header used to read "44 cases across its nine describes", implying
 * upstream had 44. It has **51**, and the seven absences were never named. All
 * seven have since been ported, closing the file — the `composer focus control`
 * case and the six-case `Enter submit behavior` block.
 *
 * **Six of those seven fail, and the failures are the port's, not the cases'.**
 * `chat-composer-input.svelte` has neither the `onKeyDown` consumer seam nor the
 * IME-composition guard upstream's `handleKeyDown` carries. The block's own
 * comment sets out both, with line references on each side. Nothing there is
 * weakened to go green.
 *
 * (Upstream's `forwards ref to the root element` and `exposes imperative handle
 * via handleRef` *are* here, as the two counterparts described below.)
 *
 * ## Five restated assertions
 *
 * Upstream's whole `triggers` describe asserts `expect(container).toBeTruthy()`
 * — an assertion on a constant, which can never fail and which this repo's
 * `expect.requireAssertions` cannot catch because an assertion did run. Each of
 * the five is restated to assert what its title claims (the composer still
 * renders its editable surface with that trigger config), and says so in place.
 *
 * Three things translate rather than map:
 *
 * - **`handleRef` becomes `bind:this`.** Upstream passes a callback prop and
 *   catches the handle; the port publishes the same five functions as instance
 *   exports, so `chat-composer-input-probe.svelte` binds the component and hands
 *   the handle back. The "exposes imperative handle" case therefore checks the
 *   object's shape rather than that a callback received it — the callback has no
 *   counterpart, and the object is what both sides actually use.
 * - **`ref` becomes an attachment** through the rest props, the port's settled
 *   `ref`-forwarding translation.
 * - **The cursor-anchor describe runs the *other* branch.** Upstream's comments
 *   are explicit that jsdom has no layout, so `getBoundingClientRect` returns a
 *   zero rect and the trigger menu falls back to anchoring on the editable.
 *   These tests run in real Chromium, where the cursor rect is real and the body
 *   anchor path is the one taken. Every assertion in that block is about what
 *   must hold on *either* path — no stray spans inside the editable, clean
 *   serialization, no orphaned anchors — so the block is more, not less,
 *   informative here. The one case whose title names the fallback keeps
 *   upstream's name and says so in place.
 */

const USERS: SearchableItem[] = [
	{ id: 'cindy', label: 'Cindy Zhang' },
	{ id: 'alex', label: 'Alex Johnson' },
	{ id: 'sam', label: 'Sam Rivera' }
];

const COMMANDS: SearchableItem[] = [
	{ id: 'summarize', label: 'summarize' },
	{ id: 'translate', label: 'translate' },
	{ id: 'search', label: 'search' }
];

function createMentionTrigger(overrides?: Partial<ChatComposerTrigger>): ChatComposerTrigger {
	return {
		character: '@',
		searchSource: createStaticSource(USERS),
		onSelect: (item) => ({
			value: `@${item.id}`,
			label: `@${item.label}`,
			variant: 'blue' as const
		}),
		...overrides
	};
}

function createCommandTrigger(overrides?: Partial<ChatComposerTrigger>): ChatComposerTrigger {
	return {
		character: '/',
		searchSource: createStaticSource(COMMANDS),
		onSelect: (item) => `/${item.label} `,
		...overrides
	};
}

/**
 * `fireEvent` has no counterpart in the browser runner, and `userEvent` cannot
 * express "the contentEditable's text changed underneath us" — which is exactly
 * what upstream simulates by assigning `textContent` and firing `input`. These
 * dispatch the same three events with the same init.
 */
function fireInput(el: HTMLElement): void {
	el.dispatchEvent(new Event('input', { bubbles: true }));
}

function fireKeyDown(el: HTMLElement, init: KeyboardEventInit): void {
	el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
}

function firePaste(el: HTMLElement, clipboardData: unknown): void {
	const event = new Event('paste', { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'clipboardData', { value: clipboardData });
	el.dispatchEvent(event);
}

const editableOf = (container: HTMLElement) =>
	container.querySelector('[contenteditable]') as HTMLElement;

describe('ChatComposerInput', () => {
	describe('basic rendering', () => {
		it('renders with placeholder', async () => {
			const screen = await render(ChatComposerInput, { props: { placeholder: 'Type here...' } });
			await expect.element(screen.getByText('Type here...')).toBeInTheDocument();
		});

		it('renders with default placeholder', async () => {
			const screen = await render(ChatComposerInput, {});
			// Upstream's `getByText` matches a node's own text. The placeholder is a
			// distinct `aria-hidden` element, so assert against it rather than the
			// container's full text, which would also pass on a value that merely
			// happened to contain the string.
			const placeholder = screen.container.querySelector('[aria-hidden="true"]');
			expect(placeholder?.textContent).toMatch(/Type a message/);
		});

		it('renders a textbox role', async () => {
			const screen = await render(ChatComposerInput, { props: { label: 'Test input' } });
			const textbox = screen.container.querySelector('[role="textbox"]');
			expect(textbox).not.toBeNull();
			expect(textbox?.getAttribute('aria-label')).toBe('Test input');
		});

		it('renders disabled state', async () => {
			const screen = await render(ChatComposerInput, { props: { isDisabled: true } });
			const textbox = screen.container.querySelector('[role="textbox"]');
			expect(textbox?.getAttribute('contenteditable')).toBe('false');
		});
	});

	describe('change and submit', () => {
		it('calls onChange on input', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onChange } });
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			expect(onChange).toHaveBeenCalledWith('hello');
		});

		it('calls onSubmit on Enter', async () => {
			const onSubmit = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onSubmit } });
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello world';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter' });
			expect(onSubmit).toHaveBeenCalledWith('hello world');
		});

		it('does not submit on Shift+Enter', async () => {
			const onSubmit = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onSubmit } });
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter', shiftKey: true });
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('clears input after submit', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, {
				props: { onSubmit: () => {}, onChange }
			});
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter' });
			expect(onChange).toHaveBeenLastCalledWith('');
		});

		it('does not submit empty input', async () => {
			const onSubmit = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onSubmit } });
			const textbox = editableOf(screen.container);
			fireKeyDown(textbox, { key: 'Enter' });
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('keeps parent submit flow when child onChange observes input changes', async () => {
			const onSubmit = vi.fn();
			const onInputChange = vi.fn();
			const screen = await render(ChatComposerProbe, {
				props: { onSubmit, inputProps: { onChange: onInputChange } }
			});

			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello world';
			fireInput(textbox);

			expect(onInputChange).toHaveBeenLastCalledWith('hello world');

			fireKeyDown(textbox, { key: 'Enter' });

			expect(onSubmit).toHaveBeenCalledWith('hello world');
			expect(onInputChange).toHaveBeenLastCalledWith('');
			expect(textbox.textContent).toBe('');
		});
	});

	describe('composer focus control', () => {
		// Goes through the registered-control branch, as upstream's does.
		//
		// This comment used to say the opposite — that the port had no
		// `composerCtx.inputControlRef` registration and fell through to
		// `ChatComposer`'s DOM-sniffing fallback, calling that "a parity gap no
		// case in this file can see". That stopped being true:
		// `chat-composer-input.svelte:401` registers a control and
		// `chat-composer.svelte:206` provides `registerInputControl`, so the
		// preferred branch is the one taken. The stale reason survived because
		// upstream's assertion — the editable ends up focused — holds either way,
		// which is exactly how an expired reason hides (CLAUDE.md § Testing).
		// `chat-composer.svelte.test.ts` now covers both branches directly.
		it('registers a focus control so a body click focuses the input', async () => {
			const screen = await render(ChatComposerProbe, { props: { onSubmit: () => {} } });
			const editable = editableOf(screen.container);
			// Walk to the composer body: editable → input root → inputArea → body.
			const inputRoot = editable.parentElement!;
			const inputArea = inputRoot.parentElement!;
			const body = inputArea.parentElement!;
			// Click empty space in the body → shell drives the registered control.
			// Dispatched rather than clicked with the pointer: the body's centre is
			// occupied by the editable, so a real pointer there would hit the
			// `[contenteditable]` the handler deliberately ignores — upstream's
			// `fireEvent.click(body)` targets the body itself, which this reproduces.
			body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(document.activeElement).toBe(editable);
		});
	});

	/**
	 * **All six cases in this block fail, and every failure is the port's.**
	 * Upstream's `handleKeyDown` (`ChatComposerInput.tsx:505-570`) does two things
	 * `chat-composer-input.svelte:439-500` does not:
	 *
	 * 1. a consumer passthrough — `onKeyDownProp?.(e); if (e.defaultPrevented)
	 *    return;` — run *before* the built-in Backspace/Enter handling. The port
	 *    declares no `onKeyDown` prop at all (`ChatComposerInputProps:114-153`),
	 *    and its rest props land on the *root* div rather than the editable, so
	 *    even a lowercase `onkeydown` would only see the event on the way back up,
	 *    after the built-in submit had already fired. That is the four `onKeyDown`
	 *    cases.
	 * 2. an IME guard on Enter — `if (e.nativeEvent.isComposing ||
	 *    e.nativeEvent.keyCode === 229) return;` — which the port omits entirely,
	 *    so Enter submits mid-composition. That is the two composing cases, and it
	 *    is a live bug for every CJK user.
	 *
	 * Both are upstream's v0.3.0 shape. The assertions below are upstream's,
	 * unchanged; the only edit is the `as ChatComposerInputProps` assertion needed
	 * to hand a prop the port's type does not declare.
	 */
	describe('Enter submit behavior', () => {
		it('does not submit on Enter while IME composition is in progress', async () => {
			const onSubmit = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onSubmit } });
			const textbox = editableOf(screen.container);
			textbox.textContent = 'こんにちは';
			fireInput(textbox);
			// isComposing is surfaced on the native event during IME composition.
			fireKeyDown(textbox, { key: 'Enter', isComposing: true });
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('does not submit on Enter for the legacy keyCode 229 composing signal', async () => {
			const onSubmit = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onSubmit } });
			const textbox = editableOf(screen.container);
			textbox.textContent = 'ㅎ';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter', keyCode: 229 });
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('lets onKeyDown suppress the default submit via preventDefault (touch-newline recipe)', async () => {
			// The documented "insert a newline instead of sending" pattern: a
			// consumer preventDefaults Enter (e.g. on a coarse pointer).
			const onSubmit = vi.fn();
			const onKeyDown = vi.fn((e: KeyboardEvent) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
				}
			});
			const screen = await render(ChatComposerInput, {
				props: { onSubmit, onKeyDown } as ChatComposerInputProps
			});
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter' });
			expect(onKeyDown).toHaveBeenCalled();
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('lets onKeyDown add behavior (Cmd/Ctrl+Enter submit) without preventDefault', async () => {
			// Adding a submit shortcut is just handling the event yourself; the
			// built-in Enter handling still runs for the plain-Enter case.
			const onSubmit = vi.fn();
			const handle = vi.fn();
			const onKeyDown = vi.fn((e: KeyboardEvent) => {
				if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
					handle();
				}
			});
			const screen = await render(ChatComposerInput, {
				props: { onSubmit, onKeyDown } as ChatComposerInputProps
			});
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter', metaKey: true });
			expect(handle).toHaveBeenCalled();
			// Consumer did not preventDefault, so the built-in submit also fires.
			expect(onSubmit).toHaveBeenCalledWith('hello');
		});

		it('calls onKeyDown before submit and lets preventDefault take over', async () => {
			const onSubmit = vi.fn();
			const onKeyDown = vi.fn((e: KeyboardEvent) => {
				e.preventDefault();
			});
			const screen = await render(ChatComposerInput, {
				props: { onSubmit, onKeyDown } as ChatComposerInputProps
			});
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter' });
			expect(onKeyDown).toHaveBeenCalled();
			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('calls onKeyDown but still submits when the consumer does not preventDefault', async () => {
			const onSubmit = vi.fn();
			const onKeyDown = vi.fn();
			const screen = await render(ChatComposerInput, {
				props: { onSubmit, onKeyDown } as ChatComposerInputProps
			});
			const textbox = editableOf(screen.container);
			textbox.textContent = 'hello';
			fireInput(textbox);
			fireKeyDown(textbox, { key: 'Enter' });
			expect(onKeyDown).toHaveBeenCalled();
			expect(onSubmit).toHaveBeenCalledWith('hello');
		});
	});

	// Controlled-value sync used to overwrite `textContent` on every
	// distinct render, which (a) collapsed the caret to offset 0
	// (visible after a slash-command pick like
	// `setValue('/feedback ')` — the next keystroke landed at the
	// start of the input) and (b) ran a redundant DOM rebuild on every
	// echo of our own `onChange` emission. The effect now skips echoes
	// of its own emission and restores the caret to the end of the new
	// content when the editable is focused.
	describe('controlled value sync', () => {
		it('places caret at end after a programmatic value change while focused', async () => {
			const screen = await render(ChatComposerInput, {
				props: { value: '/', onChange: () => {} }
			});
			const textbox = editableOf(screen.container);
			textbox.focus();

			await screen.rerender({ value: '/feedback ', onChange: () => {} });

			expect(textbox.textContent).toBe('/feedback ');
			const selection = window.getSelection();
			expect(selection).not.toBeNull();
			expect(selection?.rangeCount).toBe(1);
			const range = selection!.getRangeAt(0);
			expect(range.collapsed).toBe(true);
			// Caret is at the end of the editable's contents — the next
			// keystroke will append, not prepend.
			expect(range.endContainer === textbox || range.endContainer.parentNode === textbox).toBe(
				true
			);
			expect(textbox.textContent?.length).toBe(10);
			expect(range.endOffset).toBe(
				range.endContainer.nodeType === Node.TEXT_NODE
					? (range.endContainer.textContent?.length ?? 0)
					: textbox.childNodes.length
			);
		});

		it('does not touch the DOM when controlled value echoes our own emission', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, { props: { value: '', onChange } });
			const textbox = editableOf(screen.container);
			textbox.focus();
			// User types `hello` — emitted via onChange.
			textbox.textContent = 'hello';
			fireInput(textbox);
			expect(onChange).toHaveBeenLastCalledWith('hello');
			// Parent commits the echo. The effect must not rebuild the DOM,
			// otherwise the caret would jump back to offset 0.
			const textNodeBefore = textbox.firstChild;
			await screen.rerender({ value: 'hello', onChange });
			expect(textbox.firstChild).toBe(textNodeBefore);
			expect(textbox.textContent).toBe('hello');
		});

		it('writes textContent on a true external value change while unfocused', async () => {
			const screen = await render(ChatComposerInput, {
				props: { value: 'hello', onChange: () => {} }
			});
			const textbox = editableOf(screen.container);
			expect(textbox.textContent).toBe('hello');
			// Unfocused programmatic change — still applied, no caret work.
			await screen.rerender({ value: 'world', onChange: () => {} });
			expect(textbox.textContent).toBe('world');
		});

		it('does not stale-cache an emitted value across an external override', async () => {
			// Regression: a permanent cache of "last emitted" would
			// incorrectly skip a later external set back to the emitted
			// string. The marker is one-shot — consumed by the first
			// matching commit or invalidated by any non-echoing update.
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, { props: { value: '', onChange } });
			const textbox = editableOf(screen.container);
			textbox.focus();
			textbox.textContent = 'hello';
			fireInput(textbox);
			// External override — clears the pending echo marker.
			await screen.rerender({ value: 'world', onChange });
			expect(textbox.textContent).toBe('world');
			// Parent now sets the value back to what we previously emitted.
			// The effect must apply this — the stale marker is gone.
			await screen.rerender({ value: 'hello', onChange });
			expect(textbox.textContent).toBe('hello');
		});
	});

	describe('file handling', () => {
		it('calls onFiles on paste with files', async () => {
			const onFiles = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onFiles } });
			const textbox = editableOf(screen.container);

			const file = new File(['content'], 'test.txt', { type: 'text/plain' });
			firePaste(textbox, { files: [file], getData: () => '' });
			expect(onFiles).toHaveBeenCalledWith([file]);
		});
	});

	// Paste / insert paths used to bail silently when the contenteditable
	// was programmatically focused but no Selection range existed inside
	// it — the common case after `ChatComposer`'s body click calls
	// `editable.focus()`. Browsers do not create a Range on bare focus.
	// See `chat-composer-selection.ts`.
	describe('selection recovery (no range inside editable)', () => {
		function clearSelection() {
			window.getSelection()?.removeAllRanges();
		}

		it('paste inserts plain text after a focus() with no selection range', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, { props: { onChange } });
			const textbox = editableOf(screen.container);

			textbox.focus();
			clearSelection();
			expect(window.getSelection()?.rangeCount ?? 0).toBe(0);

			firePaste(textbox, {
				files: [],
				getData: (type: string) => (type === 'text/plain' ? 'hello' : '')
			});

			expect(textbox.textContent).toBe('hello');
			expect(onChange).toHaveBeenLastCalledWith('hello');
		});

		it('paste inserts a token chip for long pastes after a focus() with no selection range', async () => {
			const screen = await render(ChatComposerInput, {});
			const textbox = editableOf(screen.container);

			textbox.focus();
			clearSelection();

			// Default pasteAsToken threshold is 200 chars.
			const long = 'a'.repeat(250);
			firePaste(textbox, {
				files: [],
				getData: (type: string) => (type === 'text/plain' ? long : '')
			});

			expect(textbox.querySelector('[data-astryx-token]')).not.toBeNull();
		});

		it('imperative insertToken works after a focus() with no selection range', async () => {
			const screen = await render(ChatComposerInputProbe, {});
			const textbox = editableOf(screen.container);

			textbox.focus();
			clearSelection();

			screen.component.handle().insertToken({
				value: '@sam',
				label: '@Sam Rivera',
				variant: 'blue' as const
			});

			expect(textbox.querySelector('[data-astryx-token]')).not.toBeNull();
		});

		it('imperative insertText works after a focus() with no selection range', async () => {
			const screen = await render(ChatComposerInputProbe, {});
			const textbox = editableOf(screen.container);

			textbox.focus();
			clearSelection();

			screen.component.handle().insertText('hello');
			expect(textbox.textContent).toContain('hello');
		});

		it('paste falls through to plain-text path when pasteAsToken={false}', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, {
				props: { pasteAsToken: false, onChange }
			});
			const textbox = editableOf(screen.container);

			textbox.focus();
			clearSelection();

			const long = 'b'.repeat(250);
			firePaste(textbox, {
				files: [],
				getData: (type: string) => (type === 'text/plain' ? long : '')
			});

			expect(textbox.querySelector('[data-astryx-token]')).toBeNull();
			expect(textbox.textContent).toBe(long);
		});
	});

	describe('triggers', () => {
		it('accepts triggers with searchSource', async () => {
			const screen = await render(ChatComposerInput, {
				props: { triggers: [createMentionTrigger()] }
			});
			// RESTATED: upstream asserts `expect(container).toBeTruthy()`, which is an
			// assertion on a constant and can never fail. The claim the title makes —
			// the trigger config is *accepted* — is that the composer still renders its
			// editable surface, so that is what is asserted.
			expect(editableOf(screen.container)).toBeInTheDocument();
		});

		it('accepts multiple triggers', async () => {
			const screen = await render(ChatComposerInput, {
				props: { triggers: [createMentionTrigger(), createCommandTrigger()] }
			});
			// RESTATED: upstream asserts `expect(container).toBeTruthy()`, which is an
			// assertion on a constant and can never fail. The claim the title makes —
			// the trigger config is *accepted* — is that the composer still renders its
			// editable surface, so that is what is asserted.
			expect(editableOf(screen.container)).toBeInTheDocument();
		});

		it('accepts async searchSource trigger', async () => {
			const asyncTrigger: ChatComposerTrigger = {
				character: '@',
				searchSource: {
					async search(query: string) {
						return USERS.filter((u) => u.label.toLowerCase().includes(query.toLowerCase()));
					},
					async bootstrap() {
						return USERS;
					},
					cancel() {}
				},
				onSelect: (item) => ({
					value: `@${item.id}`,
					label: `@${item.label}`,
					variant: 'blue' as const
				})
			};
			const screen = await render(ChatComposerInput, { props: { triggers: [asyncTrigger] } });
			// RESTATED: upstream asserts `expect(container).toBeTruthy()`, which is an
			// assertion on a constant and can never fail. The claim the title makes —
			// the trigger config is *accepted* — is that the composer still renders its
			// editable surface, so that is what is asserted.
			expect(editableOf(screen.container)).toBeInTheDocument();
		});

		it('renders with custom renderItem', async () => {
			// `renderItem` is a `Snippet<[SearchableItem]>`, so the probe supplies it
			// — a snippet has no expression form.
			const screen = await render(ChatComposerInputProbe, {
				props: { props: { triggers: [createMentionTrigger()] }, customRenderItem: true }
			});
			// RESTATED: upstream asserts `expect(container).toBeTruthy()`, which is an
			// assertion on a constant and can never fail. The claim the title makes —
			// the trigger config is *accepted* — is that the composer still renders its
			// editable surface, so that is what is asserted.
			expect(editableOf(screen.container)).toBeInTheDocument();
		});

		it('supports configurable empty/loading text', async () => {
			const trigger = createMentionTrigger({
				emptySearchResultsText: 'Nobody found',
				loadingText: 'Looking up...',
				menuLabel: 'People'
			});
			const screen = await render(ChatComposerInput, { props: { triggers: [trigger] } });
			// RESTATED: upstream asserts `expect(container).toBeTruthy()`, which is an
			// assertion on a constant and can never fail. The claim the title makes —
			// the trigger config is *accepted* — is that the composer still renders its
			// editable surface, so that is what is asserted.
			expect(editableOf(screen.container)).toBeInTheDocument();
		});
	});

	describe('accessibility', () => {
		it('exposes role=combobox when triggers are configured', async () => {
			const screen = await render(ChatComposerInput, {
				props: { triggers: [createMentionTrigger()] }
			});
			// aria-expanded/haspopup/controls/activedescendant are only valid on
			// role="combobox", so the editable element must be a combobox (not a
			// plain textbox) whenever trigger-menu behavior is wired.
			expect(screen.container.querySelector('[role="combobox"]')).not.toBeNull();
			expect(screen.container.querySelector('[role="textbox"]')).toBeNull();
		});

		it('has aria-haspopup on the combobox', async () => {
			const screen = await render(ChatComposerInput, {
				props: { triggers: [createMentionTrigger()] }
			});
			const combobox = screen.container.querySelector('[role="combobox"]');
			expect(combobox?.getAttribute('aria-haspopup')).toBe('listbox');
		});

		it('has aria-expanded=false when menu is closed', async () => {
			const screen = await render(ChatComposerInput, {
				props: { triggers: [createMentionTrigger()] }
			});
			const combobox = screen.container.querySelector('[role="combobox"]');
			expect(combobox?.getAttribute('aria-expanded')).toBe('false');
		});

		it('stays role=textbox with no combobox attributes when no triggers are configured', async () => {
			const screen = await render(ChatComposerInput, { props: { label: 'Message' } });
			const textbox = screen.container.querySelector('[role="textbox"]') as HTMLElement;
			expect(textbox.getAttribute('aria-label')).toBe('Message');
			// A plain textbox must not carry combobox-only ARIA (axe: aria-allowed-attr).
			expect(textbox.hasAttribute('aria-expanded')).toBe(false);
			expect(textbox.hasAttribute('aria-haspopup')).toBe(false);
		});
	});

	describe('refs', () => {
		it('hands the root element to an attachment passed through rest props', async () => {
			const attached = vi.fn();
			await render(ChatComposerInput, {
				props: { [createAttachmentKey()]: attached }
			});
			expect(attached).toHaveBeenCalledOnce();
			const root = attached.mock.calls[0][0] as HTMLElement;
			expect(root).toBeInstanceOf(HTMLDivElement);
			expect(root.classList.contains('astryx-chat-composer-input')).toBe(true);
		});

		it('exposes an imperative handle from the component instance', async () => {
			const screen = await render(ChatComposerInputProbe, {});
			expect(screen.component.handle()).toEqual(
				expect.objectContaining({
					insertToken: expect.any(Function),
					insertText: expect.any(Function),
					focus: expect.any(Function),
					getValue: expect.any(Function)
				})
			);
		});

		it('getValue returns empty string for empty input', async () => {
			const screen = await render(ChatComposerInputProbe, {});
			expect(screen.component.handle().getValue()).toBe('');
		});
	});

	describe('token backspace handling', () => {
		it('removes token and trailing NBSP on backspace', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInputProbe, { props: { props: { onChange } } });
			const textbox = editableOf(screen.container);

			// Focus and set a collapsed selection so insertToken has a valid range
			textbox.focus();
			const sel = window.getSelection()!;
			const range = document.createRange();
			range.selectNodeContents(textbox);
			range.collapse(false);
			sel.removeAllRanges();
			sel.addRange(range);

			// Insert a token programmatically
			screen.component.handle().insertToken({
				value: '@sam',
				label: '@Sam Rivera',
				variant: 'blue' as const
			});
			fireInput(textbox);

			// The DOM should have a token span + trailing NBSP
			const tokenSpan = textbox.querySelector('[data-astryx-token]');
			expect(tokenSpan).not.toBeNull();

			const nbsp = tokenSpan!.nextSibling;
			expect(nbsp).toBeTruthy();
			expect(nbsp!.textContent).toBe('\u00A0');

			// Position cursor at end of NBSP text node
			const r2 = document.createRange();
			r2.setStart(nbsp!, 1);
			r2.collapse(true);
			sel.removeAllRanges();
			sel.addRange(r2);

			// Fire backspace
			fireKeyDown(textbox, { key: 'Backspace' });

			// Both the NBSP and the token should be removed
			expect(textbox.querySelector('[data-astryx-token]')).toBeNull();
		});

		it('serializes to empty after token backspace', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInputProbe, { props: { props: { onChange } } });
			const textbox = editableOf(screen.container);

			// Focus and set selection
			textbox.focus();
			const sel = window.getSelection()!;
			const range = document.createRange();
			range.selectNodeContents(textbox);
			range.collapse(false);
			sel.removeAllRanges();
			sel.addRange(range);

			screen.component.handle().insertToken({
				value: '@sam',
				label: '@Sam Rivera',
				variant: 'blue' as const
			});
			fireInput(textbox);

			const tokenSpan = textbox.querySelector('[data-astryx-token]')!;
			const nbsp = tokenSpan.nextSibling!;

			// Position cursor in the NBSP
			const r2 = document.createRange();
			r2.setStart(nbsp, 1);
			r2.collapse(true);
			sel.removeAllRanges();
			sel.addRange(r2);

			// Backspace should remove token + NBSP and fire onChange
			fireKeyDown(textbox, { key: 'Backspace' });
			expect(onChange).toHaveBeenLastCalledWith('');
		});
	});

	describe('astryx class names', () => {
		it('has astryx-chat-composer-input class', async () => {
			const screen = await render(ChatComposerInput, {});
			expect(screen.container.querySelector('.astryx-chat-composer-input')).not.toBeNull();
		});
	});

	describe('trigger menu cursor anchor', () => {
		// The trigger menu anchors its popover to the cursor position, not the
		// entire input element. In a real browser this creates a fixed-position
		// span on document.body at the cursor rect; upstream runs in jsdom, where
		// the zero rect sends it down the fallback that anchors on the editable.
		//
		// These tests verify:
		// 1. No anchor spans leak inside the contentEditable (text nodes stay intact)
		// 2. The anchoring path works (popover opens without errors)
		// 3. selectItem cleans up properly — trigger text is fully replaced
		// 4. No orphaned spans on document.body after menu dismiss

		const BODY_ANCHOR_SELECTOR = 'span[data-astryx-trigger-anchor]';

		async function setupTriggerInput(triggers: ChatComposerTrigger[]) {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInput, { props: { triggers, onChange } });
			// With triggers configured the editable is a combobox, not a textbox.
			const textbox = screen.container.querySelector('[role="combobox"]') as HTMLElement;
			textbox.focus();
			return { screen, textbox, onChange };
		}

		function setCursorAfterText(textbox: HTMLElement, text: string): Text {
			const textNode = document.createTextNode(text);
			textbox.appendChild(textNode);
			const sel = window.getSelection()!;
			const range = document.createRange();
			range.setStart(textNode, text.length);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
			return textNode;
		}

		afterEach(() => {
			// Clean up any orphaned anchor spans from document.body
			document.querySelectorAll(BODY_ANCHOR_SELECTOR).forEach((el) => el.remove());
		});

		it('does not insert spans inside the contentEditable', async () => {
			const { textbox } = await setupTriggerInput([createMentionTrigger()]);

			setCursorAfterText(textbox, 'hello @');
			fireInput(textbox);

			// No stray spans inside the editable — text nodes stay intact
			const spans = textbox.querySelectorAll('span[aria-hidden="true"]');
			expect(spans.length).toBe(0);
		});

		it('opens trigger menu without errors in jsdom fallback path', async () => {
			const { textbox } = await setupTriggerInput([createMentionTrigger()]);

			// Upstream's title names jsdom's zero-rect fallback; in Chromium the
			// cursor rect is real and the body-anchor path runs instead. Either
			// way: no crash, and the popover opens.
			setCursorAfterText(textbox, '@');
			fireInput(textbox);

			// The popover opened — ARIA says expanded
			await vi.waitFor(() => expect(textbox.getAttribute('aria-expanded')).toBe('true'));
		});

		it('does not throw when Escape dismisses the menu', async () => {
			const { textbox } = await setupTriggerInput([createMentionTrigger()]);

			setCursorAfterText(textbox, '@');
			fireInput(textbox);
			await vi.waitFor(() => expect(textbox.getAttribute('aria-expanded')).toBe('true'));

			// Escape should not throw — popover hide works even if aria-expanded
			// doesn't update synchronously
			expect(() => fireKeyDown(textbox, { key: 'Escape' })).not.toThrow();
		});

		it('does not throw when trigger text is cleared', async () => {
			const { textbox } = await setupTriggerInput([createMentionTrigger()]);

			setCursorAfterText(textbox, '@');
			fireInput(textbox);
			await vi.waitFor(() => expect(textbox.getAttribute('aria-expanded')).toBe('true'));

			// Clearing text removes the trigger — should not throw
			textbox.textContent = '';
			expect(() => fireInput(textbox)).not.toThrow();
		});

		it('does not create body anchor when no trigger is active', async () => {
			const { textbox } = await setupTriggerInput([createMentionTrigger()]);

			setCursorAfterText(textbox, 'hello');
			fireInput(textbox);

			expect(textbox.getAttribute('aria-expanded')).toBe('false');
			expect(document.querySelector(BODY_ANCHOR_SELECTOR)).toBeNull();
		});

		it('serialized output is clean — no anchor artifacts', async () => {
			const onChange = vi.fn();
			const screen = await render(ChatComposerInputProbe, {
				props: { props: { triggers: [createMentionTrigger()], onChange } }
			});
			const textbox = screen.container.querySelector('[role="combobox"]') as HTMLElement;
			textbox.focus();

			setCursorAfterText(textbox, 'hello @');
			fireInput(textbox);

			expect(screen.component.handle().getValue()).toBe('hello @');
			const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
			expect(lastCall[0]).toBe('hello @');
		});

		it('text nodes stay contiguous — no splits from anchor insertion', async () => {
			const { textbox } = await setupTriggerInput([createMentionTrigger()]);

			setCursorAfterText(textbox, 'hello @cin');
			fireInput(textbox);

			// All text is in a single text node — no splitting
			const textNodes = Array.from(textbox.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
			expect(textNodes.length).toBe(1);
			expect(textNodes[0].textContent).toBe('hello @cin');
		});

		it('cleans up on unmount without errors', async () => {
			const { screen, textbox } = await setupTriggerInput([createMentionTrigger()]);

			setCursorAfterText(textbox, '@');
			fireInput(textbox);

			expect(() => screen.unmount()).not.toThrow();
		});

		it('works with / command trigger', async () => {
			const { textbox } = await setupTriggerInput([createCommandTrigger()]);

			setCursorAfterText(textbox, '/');
			fireInput(textbox);

			await vi.waitFor(() => expect(textbox.getAttribute('aria-expanded')).toBe('true'));
		});
	});
});
