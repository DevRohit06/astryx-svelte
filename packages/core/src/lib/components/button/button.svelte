<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { ButtonSize, ButtonVariant } from './button.stylex.js';
	import type { StyleArg } from '../../internal/sx.js';
	import type { Elevation } from '../../internal/types.js';
	import type { LinkComponentType } from '../link/types.js';

	/**
	 * Upstream exports a props type from every component's `index.ts`, so a
	 * consumer can name the type of a component they are wrapping — `IconButton`
	 * is upstream's own example, and ours needs it for the same reason. A
	 * `<script module>` block is where Svelte allows that export, and the
	 * instance script below still sees the type because module scope encloses it.
	 */
	export interface ButtonProps extends Omit<
		HTMLButtonAttributes & HTMLAnchorAttributes,
		'size' | 'type' | 'children'
	> {
		/** Accessible name, and the visible text unless `children` overrides it. */
		label: string;
		/**
		 * StyleX styles applied after the button's own, overriding any property
		 * they set. Button is not a `BaseProps` component (it takes the button and
		 * anchor attribute sets for its link mode), so `xstyle` is declared here
		 * rather than inherited — but it is the same repo-wide prop.
		 */
		xstyle?: StyleArg;
		variant?: ButtonVariant;
		/**
		 * Resting elevation — the shadow depth a standalone button sits at.
		 * Ignored inside a `ButtonGroup`, which owns the elevation for the whole
		 * group so the shared surface lifts as one unit.
		 * @default 'none'
		 */
		elevation?: Elevation;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		isDisabled?: boolean;
		isLoading?: boolean;
		/** Opts out of the fire-once guard so a re-click can interrupt in-flight work. */
		isInterruptible?: boolean;
		/** Async handler. Drives the pending state and the delayed spinner. */
		clickAction?: (event: MouseEvent) => unknown;
		/** Renders a square button using `label` as the accessible name only. */
		isIconOnly?: boolean;
		width?: string | number;
		href?: string;
		/**
		 * Custom link component to use when `href` is provided. Overrides the
		 * provider-level default set by LinkProvider. Only applies when `href` is
		 * provided.
		 */
		as?: LinkComponentType;
		/** Tooltip text shown on hover. */
		tooltip?: string;
		icon?: Snippet;
		endContent?: Snippet;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { createAttachmentKey, type Attachment } from 'svelte/attachments';
	import Spinner from '../spinner/spinner.svelte';
	import LinkElement from '../link/link-element.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import { useButtonGroup, useSize } from '../../internal/contexts.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { EDGE_COMP_ATTR } from '../../internal/edge-compensation.stylex.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		buttonContentAttrs,
		buttonEndContentAttrs,
		buttonIconAttrs,
		buttonLabelAttrs,
		buttonRootAttrs,
		buttonSpinnerOverlayAttrs
	} from './button.stylex.js';

	/**
	 * A versatile button with multiple variants.
	 *
	 * When `href` is provided and the button is not disabled it renders as an
	 * `<a>` with full button styling, so native browser behaviours — middle-click,
	 * Cmd+click, "open in new tab" — keep working.
	 */
	const {
		label,
		variant = 'secondary',
		elevation = 'none',
		size: sizeProp,
		type = 'button',
		isDisabled = false,
		isLoading = false,
		isInterruptible = false,
		clickAction,
		isIconOnly = false,
		width,
		href,
		as,
		tooltip,
		icon,
		endContent,
		children,
		xstyle,
		class: className,
		style: styleProp,
		onclick,
		onkeydown,
		'aria-describedby': ariaDescribedBy,
		...rest
	}: ButtonProps = $props();

	const tooltipId = $props.id();

	const t = useTranslator();

	// Contexts must be read during init, then called inside $derived so a
	// container changing its size or disabled state still propagates.
	const resolveSize = useSize();
	const group = useButtonGroup();

	const size = $derived(resolveSize(sizeProp, 'md'));
	const groupValue = $derived(group?.() ?? null);

	let isPending = $state(false);
	// clickAction is normally fire-once (submit/save/pay), so a same-tick double
	// click must dedupe — a flag set in a microtask would not. Interruptible
	// callers opt out so a re-click can interrupt the in-flight action.
	let actionInFlight = false;

	const isLoadingState = $derived(isLoading || isPending);
	// Delay the spinner for action-driven loading so a fast action that settles
	// within the delay never flashes one. Explicit `isLoading` stays immediate,
	// since the consumer is deliberately showing it.
	const delaySpinner = $derived(isPending || isInterruptible);

	// When interruptible, loading drives the spinner and aria-busy but not
	// disabled, so clicks keep landing and can interrupt the in-flight action.
	const buttonDisabled = $derived(
		isDisabled || (groupValue?.isDisabled ?? false) || (isLoadingState && !isInterruptible)
	);

	// Disabled links are an accessibility anti-pattern — fall back to <button>.
	const renderAsLink = $derived(href != null && !buttonDisabled);

	// Use aria-disabled when a tooltip is present so the button stays focusable
	// and keyboard users can still reach the tooltip. Otherwise use native
	// disabled. Only reachable on the `<button>` branch: a disabled button never
	// renders as a link.
	const useAriaDisabled = $derived(tooltip != null && buttonDisabled);

	// Attach tooltip behaviour via the hook rather than wrapping the button in a
	// <Tooltip>. The hook adds hover/focus triggers to the button itself, so no
	// extra DOM node is inserted — the button stays a direct child of its
	// container (no layout shift, and edge-compensation markers stay
	// discoverable through the container's direct-child `:has()` selector).
	const tooltipHook = useTooltip(() => ({
		id: tooltipId,
		placement: 'above',
		isEnabled: tooltip != null
	}));

	// Upstream merges the consumer ref with the hook's trigger ref, and tolerates
	// `undefined` on the tooltip side. Attachments compose by simply both being
	// applied, so the only thing to express is the same no-op: a consumer's own
	// `{@attach}` arrives through `rest` and is unaffected either way.
	const noop: Attachment<HTMLElement> = () => undefined;
	const attachTooltip = $derived(tooltip != null ? tooltipHook.attachTrigger : noop);

	// Ghost buttons are edge-compensatable — a container detects this attribute
	// with `:has()` and pulls its own slot margin in, so the button's transparent
	// padding does not double the container's at an edge.
	const edgeCompAttr = $derived(variant === 'ghost' ? { [EDGE_COMP_ATTR]: '' } : {});

	const root = $derived(
		buttonRootAttrs({
			variant,
			size,
			isIconOnly,
			isDisabled: buttonDisabled,
			isAriaDisabled: useAriaDisabled,
			isLink: renderAsLink,
			width,
			group: groupValue,
			elevation,
			xstyle
		})
	);
	const theme = $derived(themeProps('button', { variant, size }));
	const content = $derived(buttonContentAttrs(isLoadingState, delaySpinner));
	const overlay = $derived(buttonSpinnerOverlayAttrs(delaySpinner));
	const iconAttrs = $derived(buttonIconAttrs(size));
	const labelAttrs = buttonLabelAttrs();
	const endAttrs = buttonEndContentAttrs();

	// aria-label is set when icon-only mode makes `label` the only accessible
	// name, when loading needs the purpose announced, or when `children` render
	// something other than `label`.
	const needsAriaLabel = $derived(
		(isIconOnly && label !== '') || (isLoadingState && !isIconOnly) || children != null
	);

	// When a tooltip is attached via the hook, point aria-describedby at the
	// tooltip content, composing with any consumer-provided value.
	const describedBy = $derived(
		tooltip != null
			? [ariaDescribedBy, tooltipHook.describedBy].filter(Boolean).join(' ') || undefined
			: ariaDescribedBy
	);

	// The link branch resolves through `useLinkComponent`, as upstream's does;
	// `as` overrides the provider. `LinkElement` renders either a tag or a
	// component, so the tooltip attachment travels in the props object — the
	// `BreadcrumbItem`/`ClickableCard` seam.
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));
	const linkProps = $derived({
		href,
		// `useLinkComponent`'s `to` alias for `to`-based routers; upstream injects
		// it inside the hook's wrapper component, which has no Svelte counterpart.
		...(linkResolved.isNative ? {} : { to: href }),
		...rest,
		...theme,
		...edgeCompAttr,
		class: cx(theme.class, root.class, className),
		style: mergeStyle(root.style, styleProp as string | undefined),
		'aria-label': needsAriaLabel ? label : undefined,
		'aria-describedby': describedBy,
		// The link branch shows the spinner and announces "Loading" like the
		// `<button>` one, so it needs the machine-readable busy state too — an
		// interruptible loading link carried none before 0.1.9.
		'aria-busy': isLoadingState || undefined,
		onclick: handleClick,
		onkeydown: onkeydown as HTMLAnchorAttributes['onkeydown'],
		[createAttachmentKey()]: attachTooltip
	});

	// An aria-disabled button is still focusable and still receives keys, so the
	// activation keys have to be swallowed by hand — the native `disabled` that
	// would have done it is exactly what this branch gives up. Only the `<button>`
	// branch needs it: `renderAsLink` is false whenever the button is disabled, so
	// the link passes `onkeydown` straight through.
	const handleKeyDown = $derived(
		useAriaDisabled
			? (event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
					} else {
						onkeydown?.(event);
					}
				}
			: onkeydown
	);

	async function handleClick(event: MouseEvent) {
		if (buttonDisabled || (actionInFlight && !isInterruptible)) {
			event.preventDefault();
			return;
		}

		onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });

		if (clickAction && !event.defaultPrevented) {
			actionInFlight = true;
			isPending = true;
			try {
				await clickAction(event);
			} finally {
				actionInFlight = false;
				isPending = false;
			}
		}
	}
</script>

{#snippet body()}
	{#if isLoadingState}
		<span class={overlay.class} style={overlay.style} aria-hidden="true">
			<Spinner size="sm" shade="inherit" />
		</span>
	{/if}

	<span class={content.class} style={content.style} aria-hidden={isLoadingState || undefined}>
		{#if icon}
			<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
		{/if}
		{#if !isIconOnly}
			<span class={labelAttrs.class} style={labelAttrs.style}>
				{#if children}{@render children()}{:else}{label}{/if}
			</span>
		{/if}
		{#if !isIconOnly && endContent}
			<span class={endAttrs.class} style={endAttrs.style}>{@render endContent()}</span>
		{/if}
	</span>

	<!-- Live region announcing the loading state. -->
	<VisuallyHidden role="status" aria-live="polite">
		{isLoadingState ? t('@astryx.button.loading') : ''}
	</VisuallyHidden>
{/snippet}

{#if renderAsLink}
	<!--
		Rendered through `LinkElement`, not a bare `<a>`: upstream calls
		`useLinkComponent(as)` here, so a link button inside a `LinkProvider`
		navigates through the app's router. `href` is a consumer-supplied URL of
		any kind, so SvelteKit's resolve() does not apply; the attachment travels
		in `props` because `LinkElement` spreads them onto whichever element it
		resolves.
	-->
	<LinkElement component={linkResolved.component} props={linkProps}>
		{@render body()}
	</LinkElement>
{:else}
	<button
		{type}
		disabled={useAriaDisabled ? undefined : buttonDisabled}
		{...rest}
		{...theme}
		{...edgeCompAttr}
		{@attach attachTooltip}
		class={cx(theme.class, root.class, className)}
		style={mergeStyle(root.style, styleProp as string | undefined)}
		aria-label={needsAriaLabel ? label : undefined}
		aria-describedby={describedBy}
		aria-busy={isLoadingState || undefined}
		aria-disabled={useAriaDisabled || undefined}
		onclick={handleClick}
		onkeydown={handleKeyDown}
	>
		{@render body()}
	</button>
{/if}

{#if tooltip}
	<!--
		The layer is a sibling of the button, not a wrapper — which is why
		`ButtonGroup`'s trailing end cap is `:not(:has(~ *:not([popover])))` rather
		than `:last-child`: a tooltip'd Button renders button + layer, so the layer
		would otherwise take the last slot.
	-->
	<TooltipLayer tooltip={tooltipHook}>{tooltip}</TooltipLayer>
{/if}
