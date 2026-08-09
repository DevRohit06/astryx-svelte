<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { TooltipFocusTrigger } from './use-tooltip.svelte.js';

	export interface TooltipProps {
		/**
		 * The trigger element(s). When `anchor` is provided, children can be
		 * omitted and the tooltip attaches to that element as a sibling.
		 *
		 * A snippet — including anything written as component content — is
		 * wrapped in `display: contents` and the trigger is its first *element*.
		 * Pass a string or number to get the inline-span trigger instead, with
		 * the tab stop and the dashed underline `hasHoverIndication` describes;
		 * see the module comment for why content cannot be sniffed for that.
		 */
		children?: string | number | Snippet;

		/**
		 * External element to use as the tooltip anchor, e.g. from `bind:this`.
		 * When provided (and no children), the tooltip attaches to this element
		 * instead of wrapping children. This enables sibling-mode rendering,
		 * useful for lazy-loaded tooltips that shouldn't remount children.
		 */
		anchor?: HTMLElement | null;

		/**
		 * Content to display in the tooltip.
		 * Typically short, non-interactive text.
		 */
		content: string | number | Snippet;

		/**
		 * Position placement relative to anchor
		 * @default 'above'
		 */
		placement?: LayerPlacement;

		/**
		 * Alignment along the placement axis
		 * @default 'center'
		 */
		alignment?: LayerAlignment;

		/**
		 * Delay before showing on hover (ms)
		 * @default 200
		 */
		delay?: number;

		/**
		 * Delay before hiding after mouse/focus leave (ms)
		 * @default 0
		 */
		hideDelay?: number;

		/**
		 * When to trigger on focus:
		 * - `auto`: Only if element is naturally focusable
		 * - `always`: Always attach focus listeners
		 * - `never`: Never attach focus listeners (for composite widgets)
		 *
		 * @default 'auto'
		 */
		focusTrigger?: TooltipFocusTrigger;

		/**
		 * Whether the tooltip is enabled.
		 * When false, hover/focus triggers are disabled.
		 *
		 * @default true
		 */
		isEnabled?: boolean;

		/**
		 * Callback fired when tooltip visibility changes.
		 * Called with `true` when shown and `false` when hidden.
		 */
		onOpenChange?: (isOpen: boolean) => void;

		/**
		 * Whether to show hover indication (dashed underline) on the trigger.
		 * - `'auto'`: Show for text-only children
		 * - `true`: Always show
		 * - `false`: Never show
		 *
		 * @default 'auto'
		 */
		hasHoverIndication?: 'auto' | boolean;

		/**
		 * Controlled open state. When provided, overrides hover/focus triggers:
		 * - `true`: force-show the tooltip (hover/focus hide is suppressed)
		 * - `false`: force-hide the tooltip
		 * - `undefined`: uncontrolled — hover/focus triggers manage visibility
		 */
		isOpen?: boolean;

		/**
		 * Whether the tooltip should be shown on mount.
		 * The tooltip is still dismissible — this just opens it initially.
		 */
		isDefaultOpen?: boolean;
	}
</script>

<script lang="ts">
	import { mergeDescribedBy } from '../../internal/described-by.js';
	import { watchFirstElementChild } from '../../internal/first-element-child.svelte.js';
	import TooltipLayer from './tooltip-layer.svelte';
	import { tooltipWrapperContentsAttrs, tooltipWrapperInlineAttrs } from './tooltip.stylex.js';
	import { useTooltip } from './use-tooltip.svelte.js';

	/**
	 * Informative text shown on hover or focus, ported from Astryx's
	 * `Tooltip/Tooltip.tsx`.
	 *
	 * The trigger is wired without cloning it, which is what makes this port
	 * tractable: upstream already renders a `display: contents` wrapper and
	 * attaches to its `firstElementChild` rather than reaching for
	 * `cloneElement`, so there is no React-only injection to replace. That
	 * mechanism transcribes — `bind:this` on the wrapper, an `$effect` for the
	 * lookup, and the hook's attachment applied to the element it finds. An
	 * attachment is a plain function, so applying one to a node found
	 * imperatively is just calling it and keeping its teardown.
	 *
	 * Two translations:
	 *
	 * **`anchorRef` becomes `anchor`.** Svelte has no ref objects, so — as
	 * `useClickableContainer` already established — the prop carries the element
	 * itself, the way `bind:this` hands it over. Upstream branches on whether the
	 * *prop* was passed rather than on whether its `.current` is set, so anchor
	 * mode here is `anchor !== undefined`: initialise the binding to `null` and
	 * the tooltip waits for the element, exactly as upstream waits for
	 * `anchorRef.current`.
	 *
	 * **`children` and `content` are `string | number | Snippet`.** Upstream
	 * takes `ReactNode` and asks `typeof children === 'string' || 'number'` to
	 * pick the inline-span branch. A snippet is a function, so the same test
	 * separates them here, as `Divider`'s `label` already does.
	 *
	 * That test carries one consequence worth stating plainly, because it is the
	 * one place the Svelte spelling differs from the React one. Svelte wraps
	 * component *content* in a snippet no matter what it holds, so
	 * `<Tooltip content="…">privacy policy</Tooltip>` reaches this component as a
	 * function and takes the element branch — where `firstElementChild` is null
	 * and nothing gets wired, which is also what upstream does when handed
	 * element-free children that are not a string. A text-only trigger is
	 * therefore written as the prop, `<Tooltip content="…" children="privacy
	 * policy" />`, which is the form the type asks for and the only one that can
	 * be told apart. Detecting it from the rendered DOM instead was considered
	 * and rejected: it would make the branch — and with it the tab stop and the
	 * dashed underline — depend on something upstream never consults.
	 *
	 * `useIsomorphicLayoutEffect` is a plain `$effect`: it exists upstream only
	 * to dodge React's SSR warning about `useLayoutEffect`, and Svelte effects do
	 * not run during SSR at all.
	 */
	const {
		children,
		anchor,
		content,
		placement = 'above',
		alignment = 'center',
		delay = 200,
		hideDelay = 0,
		focusTrigger = 'auto',
		isEnabled = true,
		onOpenChange,
		hasHoverIndication = 'auto',
		isOpen,
		isDefaultOpen
	}: TooltipProps = $props();

	const id = $props.id();

	let wrapper = $state<HTMLElement | null>(null);

	/** Whether the caller opted into sibling mode at all — upstream's `anchorRef` truthiness. */
	const isAnchorMode = $derived(anchor !== undefined);

	/** Check if children are text-only (no markup) */
	const textOnly = $derived(typeof children === 'string' || typeof children === 'number');

	// Determine if hover indication should be shown
	const showHoverIndication = $derived(
		hasHoverIndication === true || (hasHoverIndication === 'auto' && textOnly)
	);

	const tooltip = useTooltip(() => ({
		id,
		placement,
		alignment,
		delay,
		hideDelay,
		focusTrigger,
		isEnabled,
		isOpen,
		isDefaultOpen,
		onShow: () => onOpenChange?.(true),
		onHide: () => onOpenChange?.(false)
	}));

	/**
	 * Wire the combined attachment plus a self-repairing `aria-describedby` onto
	 * an element we found rather than rendered, restoring the attribute on
	 * teardown. Both of upstream's layout effects have this body; only the
	 * element differs — and `HoverCard` has it a third time, which is why the
	 * describedby half lives in `internal/described-by.ts` rather than here.
	 */
	function wire(element: HTMLElement): () => void {
		const detach = tooltip.attachTrigger(element);
		const restoreDescribedBy = mergeDescribedBy(element, tooltip.describedBy);

		return () => {
			restoreDescribedBy();
			detach?.();
		};
	}

	// Sibling mode: attach to the external anchor element
	$effect(() => {
		if (!isAnchorMode || anchor == null) {
			return;
		}
		return wire(anchor);
	});

	// For element children with display:contents, attach to the first child —
	// and re-attach if that child is later swapped for a different element, which
	// upstream gets for free from its ref identity churning every render. See
	// `watchFirstElementChild` for why an observer is the counterpart.
	watchFirstElementChild(
		() => (isAnchorMode || textOnly ? null : wrapper),
		(element) => wire(element)
	);

	const wrapperContents = tooltipWrapperContentsAttrs();
	const wrapperInline = $derived(tooltipWrapperInlineAttrs(showHoverIndication));
</script>

{#snippet surface()}
	{#if typeof content === 'function'}{@render content()}{:else}{content}{/if}
{/snippet}

{#if isAnchorMode && children == null}
	<!-- Sibling mode: render only the tooltip (no wrapper needed) -->
	<TooltipLayer {tooltip}>{@render surface()}</TooltipLayer>
{:else if textOnly}
	<!--
		For text-only children: inline span with the attachment on the wrapper.

		The tab stop is upstream's and is what the branch is for — a bare string
		trigger has nothing focusable in it, so without `tabindex` a keyboard user
		could never reach the tooltip. It is only ever a focus trap with nothing in
		it when there is no tooltip to reach, which is not this case.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<span
		{@attach tooltip.attachTrigger}
		tabindex="0"
		aria-describedby={tooltip.describedBy}
		class={wrapperInline.class}
		style={wrapperInline.style}>{children}</span
	>
	<TooltipLayer {tooltip}>{@render surface()}</TooltipLayer>
{:else}
	<!-- For element children: display:contents, attachment on the first child -->
	<div bind:this={wrapper} class={wrapperContents.class} style={wrapperContents.style}>
		{#if typeof children === 'function'}{@render children()}{/if}
	</div>
	<TooltipLayer {tooltip}>{@render surface()}</TooltipLayer>
{/if}
