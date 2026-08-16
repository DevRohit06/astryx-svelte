<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ElementSize } from '../../internal/contexts.svelte.js';
	import type {
		SideNavControlledCollapsible,
		SideNavImperativeCollapseHandle
	} from './side-nav-collapse-context.svelte.js';

	export interface SideNavCollapseButtonProps extends BaseProps<HTMLButtonElement> {
		/**
		 * The same controlled `collapsible` config given to `SideNav`
		 * (`{isCollapsed, onCollapsedChange}`). Needed only when the button is
		 * rendered outside the sidenav, where collapse context cannot reach it.
		 */
		collapsible?: SideNavControlledCollapsible;

		/**
		 * The imperative handle from a `SideNav`.
		 *
		 * Upstream takes a `RefObject`; Svelte has none, so this is the handle
		 * itself — bind the `SideNav` with `bind:this` and pass it. The `Popover`
		 * `anchorRef` translation, applied again.
		 *
		 * @deprecated Pass `collapsible` instead.
		 */
		handle?: SideNavImperativeCollapseHandle | null;

		/**
		 * Custom button label text. Changes the accessible name only — the button
		 * is icon-only either way. (Upstream's docs claim a text-button variant;
		 * its source passes `isIconOnly` unconditionally, and source wins.)
		 */
		label?: string;

		/**
		 * Button size. Defaults to the size its container cascades — `sm` in a
		 * `SideNav` footer — or `md` outside one. Set it for placements with no row
		 * to inherit from, e.g. a button placed in a `TopNav`.
		 */
		size?: ElementSize;

		/** Custom button content. Overrides the default chevron icon. */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import Button, { type ButtonProps } from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import {
		sideNavCollapseChevronCollapsedStyle,
		sideNavCollapseChevronMirrorAttrs,
		sideNavCollapseChevronStyle
	} from './side-nav-collapse-button.stylex.js';
	import {
		useSideNavCollapse,
		type SideNavCollapseState
	} from './side-nav-collapse-context.svelte.js';

	/**
	 * The toggle for `SideNav`'s collapsed state.
	 *
	 * Place it anywhere inside a `SideNav` — header, `topContent`, `footer`,
	 * `footerIcons` — and it reads collapse state from context. To place it
	 * outside (in a `TopNav`, say), hold the state yourself and hand the same
	 * `collapsible` config to both.
	 *
	 * Renders nothing when collapse is not enabled, or on mobile, where the
	 * sidebar lives in a drawer and collapsing has no meaning.
	 *
	 * @example
	 * ```svelte
	 * <SideNav collapsible>
	 *   {#snippet footerIcons()}<SideNavCollapseButton />{/snippet}
	 * </SideNav>
	 * ```
	 *
	 * Outside the sidenav, hold the state and hand the same config to both. (The
	 * `<\/script>` escape below is only so this example can live inside a Svelte
	 * `<script>` block — write it unescaped.)
	 *
	 * @example
	 * ```svelte
	 * <script>
	 *   let isCollapsed = $state(false);
	 *   const collapsible = $derived({
	 *     isCollapsed,
	 *     onCollapsedChange: (v) => (isCollapsed = v)
	 *   });
	 * <\/script>
	 *
	 * <TopNav>
	 *   {#snippet endContent()}<SideNavCollapseButton {collapsible} />{/snippet}
	 * </TopNav>
	 * <SideNav collapsible={{ ...collapsible, hasButton: false }}>...</SideNav>
	 * ```
	 */
	// `rest` is cast once where it crosses into `Button`. Our props type is
	// `BaseProps<HTMLButtonElement>` (upstream's) while `ButtonProps` spans the
	// button/anchor union, and event handlers are contravariant in the element
	// type — so the two are incompatible even though the DOM agrees. Same seam,
	// and same single-point cast, as `ListItem` → `Item`.
	let {
		collapsible,
		handle,
		label,
		size,
		children,
		onclick: onclickProp,
		...rest
	}: SideNavCollapseButtonProps = $props();

	const t = useTranslator();
	const contextCollapse = useSideNavCollapse();
	const appShellMobile = useAppShellMobile();

	// Upstream's `useSideNavCollapseState`. Three sources, in priority order: the
	// controlled `collapsible` config (0.4.2's replacement for the handle), then
	// the deprecated handle, then context. Note the `isCollapsible` fallback
	// differs between the branches — `false` from an absent context, `true` from
	// a handle whose SideNav has not reported yet — which is what lets an
	// externally-placed button render before the sidebar mounts.
	const collapse = $derived.by<SideNavCollapseState>(() => {
		if (collapsible != null) {
			return {
				isCollapsed: collapsible.isCollapsed ?? false,
				toggle: () => collapsible.onCollapsedChange?.(!collapsible.isCollapsed),
				isCollapsible: true
			};
		}
		if (handle == null) {
			return contextCollapse();
		}
		return {
			isCollapsed: handle.getCollapseState()?.isCollapsed ?? false,
			toggle: () => {
				handle.getCollapseState()?.toggle();
			},
			isCollapsible: handle.getCollapseState()?.isCollapsible ?? true
		};
	});

	// Hide when not collapsible, or when in mobile mode (the sidenav is in the
	// mobile drawer — collapse doesn't apply there).
	const isVisible = $derived(collapse.isCollapsible && !appShellMobile().isMobile);

	const mirror = sideNavCollapseChevronMirrorAttrs();

	// Upstream's `composeEventHandlers(onClickProp, toggle)`: the caller's handler
	// runs first and can veto the toggle. Typed against the bare `MouseEvent` so it
	// satisfies `Button`'s button/anchor handler intersection.
	function handleClick(event: MouseEvent): void {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		// `composeEventHandlers` returns as soon as a handler sets `defaultPrevented`,
		// which is how a consumer opts out of the toggle. Dropping this check would
		// collapse the sidebar against the caller's explicit refusal.
		if (event.defaultPrevented) {
			return;
		}
		collapse.toggle();
	}
</script>

<!--
	The RTL mirror wraps the rotation rather than sharing its element: both are
	`transform`s, so composing them on one span makes the collapsed state and the
	mirror overwrite each other. This is #4838's one deliberate exception — every
	other converted chevron spells the mirror out per state instead.

	`sm` (1rem) matches what this glyph already renders at: Button's icon slot
	pins its wrapper to 16px, and the registry SVG is 1em.
-->
{#snippet chevron()}
	<span class={mirror.class} style={mirror.style}>
		<Icon
			icon="chevronLeft"
			size="sm"
			color="inherit"
			xstyle={[
				sideNavCollapseChevronStyle,
				collapse.isCollapsed && sideNavCollapseChevronCollapsedStyle
			]}
		/>
	</span>
{/snippet}

{#if isVisible}
	<Button
		label={label ??
			(collapse.isCollapsed
				? t('@astryx.sideNavCollapseButton.expandSidebar')
				: t('@astryx.sideNavCollapseButton.collapseSidebar'))}
		variant="ghost"
		{size}
		{...rest as Partial<ButtonProps>}
		onclick={handleClick}
		icon={children ?? chevron}
		isIconOnly
	/>
{/if}
