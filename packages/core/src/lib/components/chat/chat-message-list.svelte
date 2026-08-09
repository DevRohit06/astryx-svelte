<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SpacingStep } from '../../internal/types.js';
	import type { ChatDensity } from './chat-context.svelte.js';

	export interface ChatMessageListProps extends BaseProps<HTMLDivElement> {
		/**
		 * Message elements — typically `ChatMessage` components.
		 * Also accepts `Divider` (date separators) or any content.
		 *
		 * Optional, unlike upstream's `children: ReactNode`, because upstream's
		 * *documented and tested* empty state is reached by passing `[]` — content
		 * that renders nothing. A `Snippet` cannot express that, so omitting the
		 * prop is this port's spelling of it, and a required prop would put the
		 * empty state out of reach of the published type.
		 */
		children?: Snippet;

		/** Custom content when the list has no messages. */
		emptyState?: Snippet;

		/**
		 * Async action when the user scrolls to the top.
		 * Use for loading older messages — a spinner shows at the top while it runs.
		 */
		scrollToTopAction?: () => Promise<void>;

		/**
		 * Visual density — flows to child messages via context.
		 * Individual messages can override.
		 * @default 'balanced'
		 */
		density?: ChatDensity;

		/**
		 * Gap between top-level message rows, using the spacing scale.
		 * Defaults to the selected density's gap. Override this when each
		 * row is independent (for example, LLM event streams where messages cannot
		 * be grouped) and row spacing should be tuned separately from density.
		 */
		gap?: SpacingStep;

		/**
		 * Whether an assistant message is actively streaming into the list.
		 *
		 * The list is a `role="log"` / `aria-live="polite"` region, so while a
		 * message streams in token-by-token, screen readers would otherwise
		 * re-announce the accumulating partial text on every mutation. Set
		 * `isStreaming` to `true` for the duration of a stream: it marks the log
		 * `aria-busy="true"` so assistive tech waits and announces the completed
		 * message once, when `isStreaming` returns to `false`.
		 *
		 * @default false
		 */
		isStreaming?: boolean;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Spinner from '../spinner/spinner.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { setChatListContext, useChatLayoutContext } from './chat-context.svelte.js';
	import {
		chatMessageListEmptyStateAttrs,
		chatMessageListInnerAttrs,
		chatMessageListLoadingTopAttrs,
		chatMessageListRootAttrs,
		chatMessageListSpacerAttrs
	} from './chat-message-list.stylex.js';

	/**
	 * Presentational container for chat messages.
	 *
	 * Renders messages in a flex column with density-based spacing. A spacer
	 * pushes content to the bottom when the list isn't full, and
	 * `scrollToTopAction` loads older messages when a top sentinel scrolls into
	 * view.
	 *
	 * Auto-scroll and the scroll-to-bottom button are owned by `ChatLayout`; used
	 * standalone this is purely presentational, and `useChatStreamScroll` is the
	 * piece to compose yourself.
	 *
	 * The empty-state test is `children == null`, the same deviation `ChatLayout`
	 * carries and for the same reason: upstream asks React whether it was handed
	 * `null`, `false` or `[]`, and a `Snippet` is opaque.
	 *
	 * @example
	 * ```svelte
	 * <ChatMessageList>
	 *   <ChatMessage sender="assistant" name="Navi">
	 *     <ChatMessageBubble>Hello!</ChatMessageBubble>
	 *   </ChatMessage>
	 * </ChatMessageList>
	 * ```
	 */
	const {
		children,
		emptyState,
		scrollToTopAction,
		density = 'balanced',
		gap,
		isStreaming = false,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatMessageListProps = $props();

	const layoutContext = useChatLayoutContext();

	let sentinelEl: HTMLDivElement | null = $state(null);
	let innerEl: HTMLDivElement | null = $state(null);

	/**
	 * Upstream's `useTransition` pending flag. A counter rather than a boolean
	 * because that is what `isPending` reports: the sentinel can intersect again
	 * while an earlier load is still in flight, and React keeps pending true
	 * until *every* transition it started has settled.
	 */
	let pendingLoads = $state(0);
	const isLoadingTop = $derived(pendingLoads > 0);

	// Register inner content element with the layout for height observation.
	//
	// The context getter rebuilds its object on each call and reads the layout's
	// scroll container, so calling it tracked would re-register on every change
	// to an element this effect does not care about. Upstream's context value is
	// `useMemo`'d on `[scrollContainerRef, contentRef]` — both stable — so its
	// effect runs once; untracking the read is what reproduces that.
	$effect(() => {
		const el = innerEl;
		if (el == null) {
			return;
		}

		const contentRef = untrack(() => layoutContext?.().contentRef);
		if (contentRef == null) {
			return;
		}

		contentRef(el);
		return () => contentRef(null);
	});

	const hasChildren = $derived(children != null);

	// IntersectionObserver for scroll-to-top infinite scroll.
	//
	// `scrollContainer` *is* read tracked here, unlike the registration above.
	// Upstream reads `scrollContainerRef.current` at effect time and gets the
	// element, because React attaches every ref before it runs any effect; a
	// Svelte `bind:this` in the parent has no such guarantee relative to a child
	// effect, so the observer is rebuilt if the root lands later.
	$effect(() => {
		const el = sentinelEl;
		const action = scrollToTopAction;
		if (action == null || el == null) {
			return;
		}

		const scrollContainer = layoutContext?.().scrollContainer ?? null;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					pendingLoads += 1;
					void action().finally(() => {
						pendingLoads -= 1;
					});
				}
			},
			{ root: scrollContainer, threshold: 0 }
		);

		observer.observe(el);
		return () => observer.disconnect();
	});

	setChatListContext(() => ({ density }));

	const theme = $derived(themeProps('chat-message-list', { density }));
	const root = $derived(chatMessageListRootAttrs(xstyle));
	const inner = $derived(chatMessageListInnerAttrs(density, gap));
	const spacer = $derived(chatMessageListSpacerAttrs());
	const loadingTop = $derived(chatMessageListLoadingTopAttrs());
	const empty = $derived(chatMessageListEmptyStateAttrs());
</script>

<div
	{...rest}
	{...theme}
	role="log"
	aria-live="polite"
	aria-busy={isStreaming || undefined}
	tabindex="0"
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
>
	<div bind:this={innerEl} class={inner.class} style={inner.style}>
		<!-- Sentinel for infinite scroll -->
		{#if scrollToTopAction}
			<div bind:this={sentinelEl} aria-hidden="true"></div>
		{/if}

		<!-- Loading spinner at top -->
		{#if isLoadingTop}
			<div class={loadingTop.class} style={loadingTop.style}>
				<Spinner size="md" />
			</div>
		{/if}

		<!-- Spacer pushes messages to bottom when list isn't full -->
		<div class={spacer.class} style={spacer.style} aria-hidden="true"></div>

		<!-- Messages or empty state -->
		{#if hasChildren}
			{@render children?.()}
		{:else if emptyState}
			<div class={empty.class} style={empty.style}>{@render emptyState()}</div>
		{/if}
	</div>
</div>
