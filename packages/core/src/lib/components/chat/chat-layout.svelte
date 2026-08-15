<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ChatDensity } from './chat-context.svelte.js';

	export interface ChatLayoutProps extends BaseProps<HTMLDivElement> {
		/**
		 * Message content — flows naturally in the page, scrolls with the page.
		 * Typically `ChatMessageList` with `ChatMessage` children.
		 *
		 * Optional for the reason `ChatMessageList`'s is: upstream reaches its
		 * tested empty state by passing `[]`, and omitting the prop is the nearest
		 * a `Snippet` gets to content that renders nothing.
		 */
		children?: Snippet;

		/**
		 * Composer element — fixed to the bottom with a frosted glass dock.
		 * Typically `ChatComposer`.
		 */
		composer: Snippet;

		/** Content shown when `children` is empty. */
		emptyState?: Snippet;

		/**
		 * Scroll-to-bottom button rendered above the composer in the dock.
		 * Defaults to `ChatLayoutScrollButton` wired to `useChatStreamScroll`.
		 * Pass a snippet to override, or `null` to hide.
		 */
		scrollButton?: Snippet | null;

		/**
		 * External scroll container. When provided, auto-scroll and
		 * scroll-to-bottom target this element instead of the layout root.
		 * Upstream takes a `RefObject`; this port takes a getter.
		 *
		 * When omitted, the layout root itself is the scroll container.
		 */
		scrollRef?: () => HTMLElement | null;

		/**
		 * Layout density. Controls spacing, max-width, and blur layer sizing.
		 * @default 'balanced'
		 */
		density?: ChatDensity;
	}
</script>

<script lang="ts">
	import ChatLayoutScrollButton from './chat-layout-scroll-button.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setChatLayoutContext } from './chat-context.svelte.js';
	import { useChatNewMessages } from './use-chat-new-messages.svelte.js';
	import { useChatStreamScroll } from './use-chat-stream-scroll.svelte.js';
	import {
		chatLayoutBlurLayerAttrs,
		chatLayoutDockAttrs,
		chatLayoutDockContainerAttrs,
		chatLayoutDockInnerAttrs,
		chatLayoutEmptyStateAttrs,
		chatLayoutMessageAreaAttrs,
		chatLayoutRootAttrs
	} from './chat-layout.stylex.js';

	/**
	 * Layout shell for full chat interfaces — messages in page flow, composer
	 * fixed to the bottom.
	 *
	 * Structural only: scroll behaviour is delegated to `useChatStreamScroll` and
	 * `useChatNewMessages`. Density is a prop rather than a measurement, and the
	 * `container-type` on the root enables container queries in children.
	 *
	 * Layout contract: the root is a flex column. The message area flexes
	 * (grow 1, shrink 0) to fill the space the dock doesn't need; the sticky dock
	 * keeps its natural height in flow. Short content therefore fills exactly 100%
	 * with no overflow, and long content grows past the root so self-scroll mode
	 * scrolls (#2573). In external-`scrollRef` mode the dock is `position: fixed`
	 * (out of flow) and the message area fills the root.
	 *
	 * **The empty-state test is the one place this port cannot match upstream
	 * exactly.** `hasVisibleContent` asks whether React was handed `null`,
	 * `false` or an empty array; a `Snippet` is an opaque function, so "did the
	 * caller pass something that renders nothing?" is undecidable here — the
	 * empty-slot-detection question `port/todo.md` still lists as open. The test is
	 * therefore `children == null`, which agrees with upstream on the two cases
	 * a consumer actually writes (a snippet, or none) and differs only for a
	 * snippet that renders nothing at all.
	 */
	const {
		children,
		composer,
		density = 'balanced',
		emptyState,
		scrollButton,
		scrollRef: externalScrollRef,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatLayoutProps = $props();

	const t = useTranslator();
	let rootEl: HTMLDivElement | null = $state(null);

	// Upstream recomputes both on every render, so both read the prop live: a
	// consumer that starts passing `scrollRef` must flip the root from
	// self-scrolling to fixed-dock, not stay on whatever it mounted with.
	const isSelfScrolling = $derived(externalScrollRef == null);
	const scrollContainerRef = () => (externalScrollRef ? externalScrollRef() : rootEl);

	// --- Default scroll behavior ---
	const scroll = useChatStreamScroll({ scrollRef: scrollContainerRef });
	const newMsgs = useChatNewMessages({
		isLocked: () => scroll.isLocked,
		onResize: () => scroll.scrollIfLocked()
	});

	// --- Layout context ---
	setChatLayoutContext(() => ({
		scrollContainer: scrollContainerRef(),
		contentRef: newMsgs.contentRef
	}));

	const showEmpty = $derived(children == null);

	const theme = $derived(themeProps('chat-layout', { density }));
	const root = $derived(chatLayoutRootAttrs(isSelfScrolling, xstyle));
	const messageArea = $derived(chatLayoutMessageAreaAttrs(density));
	const emptyStateAttrs = $derived(chatLayoutEmptyStateAttrs());
	const dockContainer = $derived(chatLayoutDockContainerAttrs(isSelfScrolling));
	const blurLayer = $derived(chatLayoutBlurLayerAttrs(density));
	const dock = $derived(chatLayoutDockAttrs(density));
	const dockInner = $derived(chatLayoutDockInnerAttrs(density));
</script>

{#snippet defaultScrollButton()}
	<ChatLayoutScrollButton
		isVisible={scroll.isScrolledUp || newMsgs.hasNewMessages}
		label={newMsgs.hasNewMessages ? t('@astryx.chatLayout.newMessages') : undefined}
		onClick={() => {
			newMsgs.dismiss();
			scroll.scrollToBottom();
		}}
	/>
{/snippet}

<div
	{...rest}
	{...theme}
	bind:this={rootEl}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
>
	<!-- Message area -->
	<div class={messageArea.class} style={messageArea.style}>
		{#if showEmpty && emptyState}
			<div class={emptyStateAttrs.class} style={emptyStateAttrs.style}>{@render emptyState()}</div>
		{:else}
			{@render children?.()}
		{/if}
	</div>

	<!-- Dock container — sticky/fixed, holds blur + scroll button + composer -->
	<div class={dockContainer.class} style={dockContainer.style}>
		<!-- Scroll-to-bottom button -->
		{#if scrollButton === undefined}
			{@render defaultScrollButton()}
		{:else if scrollButton != null}
			{@render scrollButton()}
		{/if}

		<!-- Frosted glass layer -->
		<div class={blurLayer.class} style={blurLayer.style}></div>

		<!-- Composer -->
		<div class={dock.class} style={dock.style}>
			<div class={dockInner.class} style={dockInner.style}>
				{@render composer()}
			</div>
		</div>
	</div>
</div>
