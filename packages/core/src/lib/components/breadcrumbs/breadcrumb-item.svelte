<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';
	import type { DropdownMenuSize } from '../dropdown-menu/dropdown-menu-item.stylex.js';
	import type { DropdownMenuOption } from '../dropdown-menu/dropdown-menu-types.js';

	/** `onclick` is omitted from `BaseProps` so the narrowed redeclaration replaces it. */
	export interface BreadcrumbItemProps extends Omit<BaseProps<HTMLLIElement>, 'onclick'> {
		/**
		 * Custom component to render instead of `<a>`, overriding the
		 * provider-level default. Only applies to non-current items.
		 */
		as?: LinkComponentType;
		/**
		 * Label content of the breadcrumb item. A plain string is also the menu
		 * surface's accessible name, which is why the type is a union rather than
		 * a bare `Snippet` — upstream's `ReactNode` is narrowed the same way.
		 */
		children: Snippet | string;
		/** URL for the breadcrumb link. Omit for the current page. */
		href?: string;
		/** Click handler. Works with or without `href`. */
		onclick?: (event: MouseEvent) => void;
		/**
		 * Marks this item as the current page — a span with `aria-current="page"`.
		 * When no item sets it, the last item is auto-detected as current.
		 * @default false
		 */
		isCurrent?: boolean;
		/** Optional icon rendered before the label. */
		startIcon?: Snippet;
		/**
		 * Menu opened when the item is activated. Accepts the SAME item API as
		 * `DropdownMenu` / `MoreMenu` / `ContextMenu`, so a consumer's existing
		 * menu-item definitions are portable into a breadcrumb with no rewrite:
		 * - a `DropdownMenuOption[]` data array (items, sections, dividers), or
		 * - composed `DropdownMenuItem` / `DropdownMenuCheckboxItem` /
		 *   `DropdownMenuRadioGroup` children in a snippet.
		 *
		 * When set, the item renders as a link-styled menu trigger (button + a
		 * trailing chevron, `aria-haspopup="menu"` / `aria-expanded`) whose popover
		 * is a `role="menu"` container that provides `DropdownMenuContext` and runs
		 * `useListFocus`. Takes precedence over `href` / `onclick` (which are
		 * ignored when `menu` is set — a dev-time warning is logged).
		 */
		menu?: DropdownMenuOption[] | Snippet;
		/**
		 * Size passed to the menu items via `DropdownMenuContext` (item
		 * padding/typography). Defaults from the breadcrumb variant:
		 * `'supporting'` → `'sm'`, otherwise `'md'`.
		 */
		menuSize?: DropdownMenuSize;
	}
</script>

<script lang="ts">
	import { createAttachmentKey, type Attachment } from 'svelte/attachments';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { devWarn } from '../../utils/dev-warning.js';
	import LinkElement from '../link/link-element.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import BreadcrumbMenuTrigger from './breadcrumb-menu-trigger.svelte';
	import { useBreadcrumb } from './breadcrumbs-context.svelte.js';
	import {
		breadcrumbButtonAttrs,
		breadcrumbCurrentAttrs,
		breadcrumbIconAttrs,
		breadcrumbItemAttrs,
		breadcrumbLinkAttrs,
		breadcrumbSeparatorAttrs
	} from './breadcrumb-item.stylex.js';

	/**
	 * An individual breadcrumb item — a link (`<a>`), a `<button>` or a span,
	 * depending on which of `href`/`onclick` is given and whether it represents
	 * the current page.
	 *
	 * Each item renders its own *leading* separator, hidden on `:first-child`
	 * through the `--separator-display` custom property. Auto-current detection
	 * reads the DOM after render rather than introspecting children.
	 *
	 * @example
	 * ```svelte
	 * <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
	 * <BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
	 * ```
	 */
	let {
		as,
		children,
		href,
		onclick,
		isCurrent: isCurrentProp,
		startIcon,
		menu,
		menuSize,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: BreadcrumbItemProps = $props();

	const ctx = useBreadcrumb();
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));
	const isSupporting = $derived(ctx().variant === 'supporting');

	const isCurrent = $derived(isCurrentProp === true);
	const isAutoCandidate = $derived(isCurrentProp == null);
	const hasMenu = $derived(menu != null);
	const resolvedMenuSize = $derived(menuSize ?? (isSupporting ? 'sm' : 'md'));

	// `menu` owns the click interaction; a label can't both navigate/act and open
	// a menu on the same activation. Warn so the (ignored) href/onclick don't
	// silently disappear on the consumer. Upstream spells the production gate out
	// inline (`process.env.NODE_ENV !== 'production'` inside the effect); `devWarn`
	// is that same expression, so the emitted message is unchanged.
	$effect(() => {
		if (!hasMenu) return;
		if (href != null) {
			devWarn(
				'BreadcrumbItem',
				'`menu` and `href` are mutually exclusive; `menu` ' +
					'takes precedence and `href` is ignored.'
			);
		} else if (onclick != null) {
			devWarn(
				'BreadcrumbItem',
				'`menu` and `onclick` are mutually exclusive; ' +
					'`menu` takes precedence and `onclick` is ignored.'
			);
		}
	});

	let liEl = $state<HTMLLIElement | null>(null);
	// Points at the element holding the item's content (the link/button/span in
	// the auto-candidate path). Auto-current detection sets `aria-current` on this
	// rather than guessing the `<li>`'s last child, so the attribute lands on the
	// interactive element — including when the last item is a link (navigation-11).
	let contentEl = $state<HTMLElement | null>(null);

	// Auto-detect: if no sibling carries aria-current="page" and this is the last
	// item, set aria-current on our content element. Reads the DOM after render,
	// as upstream's dependency-less `useEffect` does.
	$effect(() => {
		if (!isAutoCandidate) return;

		const li = liEl;
		if (!li) return;
		const ol = li.parentElement;
		if (!ol) return;

		const items = Array.from(ol.children) as HTMLElement[];
		const isLast = items.length > 0 && items[items.length - 1] === li;
		const hasExplicit = ol.querySelector('[aria-current="page"]');

		if (isLast && !hasExplicit) {
			// Fall back to the <li> only if the content element is unresolved.
			const target = contentEl ?? li;
			target.setAttribute('aria-current', 'page');
			return () => {
				target.removeAttribute('aria-current');
			};
		}
	});

	const theme = themeProps('breadcrumb-item');
	const rootAttrs = $derived(breadcrumbItemAttrs(isSupporting, xstyle));
	const separatorAttrs = breadcrumbSeparatorAttrs();
	const currentAttrs = $derived(breadcrumbCurrentAttrs(isSupporting));
	const linkAttrs = $derived(breadcrumbLinkAttrs(isSupporting));
	const buttonAttrs = $derived(breadcrumbButtonAttrs(isSupporting));
	const iconAttrs = breadcrumbIconAttrs();

	// Upstream's `contentRef`, as an attachment: both `LinkElement` and
	// `BreadcrumbMenuTrigger` own their own element, so neither is reachable with
	// `bind:this` from here.
	const attachContent: Attachment<HTMLElement> = (node) => {
		contentEl = node;
		return () => {
			contentEl = null;
		};
	};

	// `LinkElement` renders either a tag or a component, so the attachment travels
	// in the props object, the same seam `ClickableCard` uses.
	const anchorProps = $derived({
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		onclick,
		class: linkAttrs.class,
		style: linkAttrs.style,
		[createAttachmentKey()]: attachContent
	});
</script>

{#snippet content()}
	{#if startIcon}
		<span class={iconAttrs.class} style={iconAttrs.style}>{@render startIcon()}</span>
	{/if}
	{#if typeof children === 'string'}{children}{:else}{@render children()}{/if}
{/snippet}

<li
	bind:this={liEl}
	{...rest}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	data-testid={testId}
>
	<span aria-hidden="true" class={separatorAttrs.class} style={separatorAttrs.style}>
		{#if typeof ctx().separator === 'function'}
			{@render (ctx().separator as Snippet)()}
		{:else}
			{ctx().separator}
		{/if}
	</span>
	{#if isCurrent}
		{#if hasMenu}
			<!-- A current crumb can also open a sibling menu — the trigger keeps
			     both aria-current="page" and aria-haspopup="menu". -->
			<BreadcrumbMenuTrigger
				{attachContent}
				menu={menu as DropdownMenuOption[] | Snippet}
				menuSize={resolvedMenuSize}
				{isSupporting}
				isCurrent
				label={children}
				children={content}
			/>
		{:else}
			<span class={currentAttrs.class} style={currentAttrs.style} aria-current="page">
				{@render content()}
			</span>
		{/if}
	{:else if hasMenu}
		<BreadcrumbMenuTrigger
			{attachContent}
			menu={menu as DropdownMenuOption[] | Snippet}
			menuSize={resolvedMenuSize}
			{isSupporting}
			label={children}
			children={content}
		/>
	{:else if href != null}
		<LinkElement component={linkResolved.component} props={anchorProps}>
			{@render content()}
		</LinkElement>
	{:else if onclick != null}
		<button
			bind:this={contentEl}
			type="button"
			{onclick}
			class={buttonAttrs.class}
			style={buttonAttrs.style}
		>
			{@render content()}
		</button>
	{:else}
		<span bind:this={contentEl} class={currentAttrs.class} style={currentAttrs.style}>
			{@render content()}
		</span>
	{/if}
</li>
