<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { HoverCardFocusTrigger } from './use-hover-card.svelte.js';

	// Upstream's `HoverCard.tsx:26` re-exports `HoverCardFocusTrigger` so the type
	// is reachable from either module of the `./HoverCard` subpath. We publish no
	// per-component subpaths (see "Known debts"), so that second path would lead
	// nowhere, and `tooltip.svelte` already omits the equivalent re-export. The
	// type is public from the barrel, via `use-hover-card.svelte.js`.

	/**
	 * Upstream's `Pick<BaseProps, 'xstyle' | 'className' | 'style'>` minus the
	 * deferred `xstyle` — the same closed list `OverlayProps` takes, so there is
	 * no rest spread owed here either.
	 */
	export interface HoverCardProps extends Pick<BaseProps, 'xstyle' | 'class' | 'style'> {
		/**
		 * The trigger element(s). Children refs are preserved.
		 *
		 * A snippet — including anything written as component content — is
		 * wrapped in `display: contents` and the trigger is its first *element*.
		 * Pass a string or number to get the inline-span trigger instead, with the
		 * tab stop and the dashed underline `hasHoverIndication` describes; see
		 * `Tooltip` for why content cannot be sniffed for that.
		 */
		children: string | number | Snippet;

		/**
		 * Content to display in the hover card.
		 */
		content: Snippet;

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
		 * @default 300
		 */
		delay?: number;

		/**
		 * Delay before hiding after mouse/focus leave (ms)
		 * @default 200
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
		focusTrigger?: HoverCardFocusTrigger;

		/**
		 * Whether the hover card is enabled.
		 * When false, hover/focus triggers are disabled.
		 *
		 * @default true
		 */
		isEnabled?: boolean;

		/**
		 * Accessible name for the hover card popup.
		 *
		 * When provided, the popup is exposed to assistive technology as a named
		 * `role="dialog"`. When omitted, the popup falls back to `role="group"` —
		 * a group may validly be unnamed, an unnamed dialog may not.
		 */
		label?: string;

		/**
		 * Callback fired when hover card visibility changes.
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
		 * - `true`: force-show the hover card (hover/focus hide is suppressed)
		 * - `false`: force-hide the hover card
		 * - `undefined`: uncontrolled — hover/focus triggers manage visibility
		 */
		isOpen?: boolean;

		/**
		 * Whether the hover card should be shown on mount.
		 * The hover card is still dismissible — this just opens it initially.
		 */
		isDefaultOpen?: boolean;
	}
</script>

<script lang="ts">
	import { mergeDescribedBy } from '../../internal/described-by.js';
	import { watchFirstElementChild } from '../../internal/first-element-child.svelte.js';
	import HoverCardLayer from './hover-card-layer.svelte';
	import {
		hoverCardWrapperContentsAttrs,
		hoverCardWrapperInlineAttrs
	} from './hover-card.stylex.js';
	import { useHoverCard } from './use-hover-card.svelte.js';

	/**
	 * Interactive content shown on hover or focus, ported from Astryx's
	 * `HoverCard/HoverCard.tsx`.
	 *
	 * The trigger is wired without cloning it, exactly as `Tooltip`'s is:
	 * upstream already renders a `display: contents` wrapper and attaches to its
	 * `firstElementChild`, so the mechanism transcribes — `bind:this` on the
	 * wrapper, an `$effect` for the lookup, and the hook's attachment applied to
	 * the element it finds.
	 *
	 * Three things are specific to this component rather than inherited from
	 * `Tooltip`:
	 *
	 * **Both wrappers are `<span>`**, where `Tooltip` uses a `div` for the
	 * `display: contents` one. A hover card is expected inside a `<p>`, and a
	 * `div` there is reparented by the HTML parser — which breaks both inline
	 * validity and hydration. Two of upstream's own tests assert the tag.
	 *
	 * **`children` is `string | number | Snippet`.** Upstream takes `ReactNode`
	 * and asks `typeof children === 'string' || 'number'` to pick the inline-span
	 * branch; a snippet is a function, so the same test separates them here. The
	 * consequence is `Tooltip`'s and is recorded with it: Svelte wraps component
	 * *content* in a snippet whatever it holds, so a text-only trigger has to be
	 * written as the prop — `<HoverCard children="Hover for details" …/>` — which
	 * is the only form that can be told apart.
	 *
	 * **`class`, `style` and `xstyle` reach the popover container**, which is now
	 * simply upstream's behaviour. Upstream used to hand all three of its picked
	 * props to `renderHoverCard`, whose body then built its render props from
	 * scratch and never read them, so all three were published no-ops (verified in
	 * `dist/` too). This port honoured them anyway, aimed at the container their
	 * intent pointed at, and recorded the divergence under Known debts; 0.2.0
	 * routes them to that same container, so the entry retires and the two agree.
	 *
	 * `useIsomorphicLayoutEffect` is a plain `$effect`: it exists upstream only
	 * to dodge React's SSR warning about `useLayoutEffect`, and Svelte effects do
	 * not run during SSR at all.
	 */
	const {
		children,
		content,
		placement = 'above',
		alignment = 'center',
		delay = 300,
		hideDelay = 200,
		focusTrigger = 'auto',
		isEnabled = true,
		label,
		onOpenChange,
		hasHoverIndication = 'auto',
		isOpen,
		isDefaultOpen,
		xstyle,
		class: className,
		style
	}: HoverCardProps = $props();

	const id = $props.id();

	let wrapper = $state<HTMLElement | null>(null);

	/** Check if children are text-only (no markup) */
	const textOnly = $derived(typeof children === 'string' || typeof children === 'number');

	// Determine if hover indication should be shown
	const showHoverIndication = $derived(
		hasHoverIndication === true || (hasHoverIndication === 'auto' && textOnly)
	);

	const hoverCard = useHoverCard(() => ({
		id,
		placement,
		alignment,
		delay,
		hideDelay,
		focusTrigger,
		isEnabled,
		label,
		isOpen,
		isDefaultOpen,
		onShow: () => onOpenChange?.(true),
		onHide: () => onOpenChange?.(false)
	}));

	// For element children with display:contents, attach to the first child, and
	// re-attach if that child is later swapped for a different element — which
	// upstream gets for free from its ref identity churning on every render. See
	// `watchFirstElementChild` for why an observer is the counterpart.
	//
	// The body is upstream's layout effect: the combined ref plus a self-repairing
	// `aria-describedby`, with the attribute restored on teardown. The describedby
	// half is shared with `Tooltip` — upstream inlines the same body in both, and
	// it has to survive the caller rewriting the attribute; see
	// `internal/described-by.ts`.
	watchFirstElementChild(
		() => (textOnly ? null : wrapper),
		(firstChild) => {
			const detach = hoverCard.attachTrigger(firstChild);
			const restoreDescribedBy = mergeDescribedBy(firstChild, hoverCard.describedBy);

			return () => {
				restoreDescribedBy();
				detach?.();
			};
		}
	);

	const wrapperContents = hoverCardWrapperContentsAttrs();
	const wrapperInline = $derived(hoverCardWrapperInlineAttrs(showHoverIndication));
</script>

{#if textOnly}
	<!--
		For text-only children: inline span with the attachment on the wrapper.

		The tab stop is upstream's and is what the branch is for — a bare string
		trigger has nothing focusable in it, so without `tabindex` a keyboard user
		could never reach the card.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<span
		{@attach hoverCard.attachTrigger}
		tabindex="0"
		aria-describedby={hoverCard.describedBy}
		class={wrapperInline.class}
		style={wrapperInline.style}>{children}</span
	>
{:else}
	<!-- For element children: display:contents, attachment on the first child -->
	<span bind:this={wrapper} class={wrapperContents.class} style={wrapperContents.style}>
		{#if typeof children === 'function'}{@render children()}{/if}
	</span>
{/if}
<HoverCardLayer {hoverCard} {xstyle} class={className} {style}>{@render content()}</HoverCardLayer>
