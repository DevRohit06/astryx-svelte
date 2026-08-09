/**
 * The hooks barrel, matching Astryx's `hooks/index.ts`.
 *
 * Upstream's barrel exports 19 hooks; this file grows as they land. Several of
 * the modules in that directory are never exported at all upstream
 * (`useIsomorphicLayoutEffect`, `useMenuHover`), and of the ones that are, the
 * purely-memoising ones are obviated by runes (`planning/06`).
 *
 * `__resetLiveRegionsForTest` is deliberately absent: upstream marks it
 * `@internal` and keeps it out of its barrel too, so it is reachable only from
 * the module itself, which is where the test imports it from. Its companion
 * `__resetDevWarnings` (in `utils/dev-warning.ts`) has the same standing.
 */

export { useAnnounce, type AnnounceFn, type AnnouncePoliteness } from './use-announce.js';

export {
	useClickableContainer,
	INTERACTIVE_SELECTORS,
	type ClickableContainerResult,
	type UseClickableContainerOptions
} from './use-clickable-container.svelte.js';

// The pool module behind this hook (`POOL`, `POOL_SIZE`, `m0`…`m5`,
// `RevealSlot`) is deliberately absent: it is internal to `useContainerReveal`
// upstream too, and its barrel names only these four.
export {
	useContainerReveal,
	type ContentRevealOptions,
	type UseContainerRevealOptions,
	type UseContainerRevealReturn
} from './use-container-reveal.svelte.js';

export { useDevWarning } from './use-dev-warning.svelte.js';

export { useEntryAnimation, type EntryAnimationPreset } from './use-entry-animation.js';

// `hasActiveFocusTrapEscape` and `isImeKeyEvent` are deliberately absent, as
// they are from upstream's barrel: Dialog is their only consumer and imports
// them from the module directly.
export {
	useFocusTrap,
	type UseFocusTrapOptions,
	type UseFocusTrapReturn
} from './use-focus-trap.svelte.js';

export {
	useGridFocus,
	type UseGridFocusOptions,
	type UseGridFocusReturn
} from './use-grid-focus.svelte.js';

export { useHotkeys, type Hotkey } from './use-hotkeys.svelte.js';

export {
	useImageMode,
	type ImageModeState,
	type ImageSampleRegion,
	type UseImageModeOptions
} from './use-image-mode.svelte.js';

export { useInputContainer, type UseInputContainerOptions } from './use-input-container.svelte.js';

export {
	useInputStatusIcon,
	type UseInputStatusIconOptions,
	type UseInputStatusIconReturn
} from './use-input-status-icon.svelte.js';

// The rendering half of `useInputStatusIcon`. Upstream has no such symbol — its
// hook returns `statusIcon` as a node — so this is the same sanctioned split
// `KeyboardHintLayer` and `TooltipLayer` are. `STATUS_ICON` and
// `STATUS_BUTTON_LABEL_KEY` stay barrel-absent, as they are module-private
// upstream.
export { default as InputStatusIcon } from './input-status-icon.svelte';
export type { InputStatusIconProps } from './input-status-icon.svelte';

export {
	useInteractiveRole,
	type InteractiveRole,
	type UseInteractiveRoleOptions
} from './use-interactive-role.svelte.js';

export {
	useListFocus,
	type ListFocusOrientation,
	type UseListFocusOptions,
	type UseListFocusReturn
} from './use-list-focus.svelte.js';

export {
	useLongPress,
	type UseLongPressHandlers,
	type UseLongPressOptions
} from './use-long-press.svelte.js';

export {
	useKeyboardHint,
	type KeyboardHintOrientation,
	type UseKeyboardHintOptions,
	type UseKeyboardHintReturn
} from './use-keyboard-hint.svelte.js';

// The rendering half of `useKeyboardHint`. Upstream has no such symbol — its
// hook returns `hintElement` directly — so this is the sanctioned split
// `TooltipLayer` and `OverlayScrim` already made public for the same reason.
// `ARROW_HINT_KEYS` stays barrel-absent, as it is module-private upstream.
export { default as KeyboardHintLayer } from './keyboard-hint-layer.svelte';
export type { KeyboardHintLayerProps } from './keyboard-hint-layer.svelte';

export { useMediaQuery, type MediaQueryState } from './use-media-query.svelte.js';

export {
	useOverflow,
	type UseOverflowOptions,
	type UseOverflowReturn
} from './use-overflow.svelte.js';

export { useScrollLock } from './use-scroll-lock.svelte.js';

export {
	useScrollOverflow,
	type ScrollOverflow,
	type ScrollOverflowState
} from './use-scroll-overflow.svelte.js';

export {
	useStreamingText,
	type StreamingTextSpeed,
	type StreamingTextState,
	type UseStreamingTextOptions
} from './use-streaming-text.svelte.js';

export {
	useTreeFocus,
	type UseTreeFocusOptions,
	type UseTreeFocusReturn
} from './use-tree-focus.svelte.js';

export {
	useTypeahead,
	type UseTypeaheadOptions,
	type UseTypeaheadReturn
} from './use-typeahead.js';
