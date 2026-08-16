<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface ChatComposerDrawerProps extends BaseProps<HTMLDivElement> {
		/** Content to render inside the drawer — attachments, context chips, previews, etc. */
		children: Snippet;
		/**
		 * Total item count — shown in the collapsed badge.
		 * When omitted, the component doesn't support collapse.
		 */
		count?: number;
		/**
		 * Label shown next to the count in collapsed state.
		 * @default 'Items'
		 */
		label?: string;
		/**
		 * Whether the drawer is collapsed.
		 * Uncontrolled by default (internal toggle).
		 */
		isCollapsed?: boolean;
		/**
		 * Default collapsed state for uncontrolled usage.
		 * @default false
		 */
		defaultIsCollapsed?: boolean;
		/** Callback when collapsed state changes. */
		onCollapsedChange?: (isCollapsed: boolean) => void;
	}
</script>

<script lang="ts">
	import Badge from '../badge/badge.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		chatComposerDrawerBarHandleAttrs,
		chatComposerDrawerCollapseLabelAttrs,
		chatComposerDrawerContentAttrs,
		chatComposerDrawerContentGridAttrs,
		chatComposerDrawerRootAttrs,
		chatComposerDrawerToggleContentAttrs,
		chatComposerDrawerToggleRowAttrs
	} from './chat-composer-drawer.stylex.js';

	/**
	 * Collapsible drawer panel for a chat composer — attachments, context chips,
	 * or any supplementary content above the input.
	 *
	 * Collapsing is only offered when `count` is given; the handle and the
	 * badge+label share one grid cell so they crossfade without layout shift.
	 *
	 * @example
	 * ```svelte
	 * <ChatComposerDrawer count={3}>
	 *   <AttachmentThumbnail />
	 *   <AttachmentThumbnail />
	 * </ChatComposerDrawer>
	 * ```
	 */
	const {
		children,
		count,
		label: labelFromProps,
		isCollapsed: controlledCollapsed,
		defaultIsCollapsed = false,
		onCollapsedChange,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatComposerDrawerProps = $props();

	const t = useTranslator();

	// The toggle points `aria-controls` at the content region so assistive tech
	// can navigate from the toggle to what it discloses. The content stays mounted
	// while collapsed (it is a 0fr grid row), so the reference always resolves.
	const contentId = $props.id();
	const label = $derived(labelFromProps ?? t('@astryx.chat.composerDrawer.label'));

	let internalCollapsed = $state(defaultIsCollapsed);
	const isControlled = $derived(controlledCollapsed !== undefined);
	const isCollapsed = $derived(isControlled ? controlledCollapsed! : internalCollapsed);

	const canCollapse = $derived(count != null);

	function toggle(): void {
		const next = !isCollapsed;
		if (!isControlled) {
			internalCollapsed = next;
		}
		onCollapsedChange?.(next);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}

	const theme = $derived(
		themeProps('chat-composer-drawer', {
			collapsed: isCollapsed ? 'collapsed' : null
		})
	);
	const root = $derived(chatComposerDrawerRootAttrs(xstyle));
	const toggleRow = $derived(chatComposerDrawerToggleRowAttrs(isCollapsed));
	const toggleContent = $derived(chatComposerDrawerToggleContentAttrs(isCollapsed));
	const collapseLabel = $derived(chatComposerDrawerCollapseLabelAttrs());
	const barHandle = $derived(chatComposerDrawerBarHandleAttrs(isCollapsed));
	const contentGrid = $derived(chatComposerDrawerContentGridAttrs(canCollapse && isCollapsed));
	const content = $derived(chatComposerDrawerContentAttrs(canCollapse && isCollapsed));
</script>

<!-- `{...rest}` last, matching upstream's trailing `{...htmlProps}`. -->
<div
	{...theme}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
	{...rest}
>
	{#if count != null}
		<div
			class={toggleRow.class}
			style={toggleRow.style}
			role="button"
			tabindex="0"
			aria-expanded={!isCollapsed}
			aria-controls={contentId}
			aria-label={isCollapsed
				? t('@astryx.chatComposerDrawer.expand', { label })
				: t('@astryx.chatComposerDrawer.collapse', { label })}
			onclick={toggle}
			onkeydown={handleKeyDown}
		>
			<div class={toggleContent.class} style={toggleContent.style}>
				<!-- Upstream passes the number straight to `Badge`; this port's `label`
					 is `string | Snippet`, the settled leaf-slot shape, so it is
					 stringified here — React renders the same text either way. -->
				<Badge variant="neutral" label={String(count)} />
				<span class={collapseLabel.class} style={collapseLabel.style}>{label}</span>
			</div>
			<div class={barHandle.class} style={barHandle.style}></div>
		</div>
	{/if}

	<div id={contentId} class={contentGrid.class} style={contentGrid.style}>
		<div class={content.class} style={content.style}>
			{@render children()}
		</div>
	</div>
</div>
