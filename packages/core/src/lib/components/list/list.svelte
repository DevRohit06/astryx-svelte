<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ListDensity, ListMarkerStyle } from './list-context.svelte.js';

	export interface ListProps extends BaseProps<HTMLUListElement | HTMLOListElement> {
		/** List items. Should be `ListItem` components. */
		children: Snippet;
		/**
		 * Spacing density for list items.
		 * @default 'balanced'
		 */
		density?: ListDensity;
		/**
		 * Whether to show dividers between list items.
		 * @default false
		 */
		hasDividers?: boolean;
		/** Header content rendered above the list, associated via `aria-labelledby`. */
		header?: string | Snippet;
		/**
		 * List marker style. `'decimal'` renders an `<ol>`; anything else a `<ul>`.
		 * @default 'none'
		 */
		listStyle?: ListMarkerStyle;
		/**
		 * Starting number for ordered lists. Sets the CSS counter to begin here.
		 * @default 1
		 */
		start?: number;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { setListContext } from './list-context.svelte.js';
	import { listAttrs, listHeaderAttrs, listRootAttrs } from './list.stylex.js';

	/**
	 * A vertical list for rendering collections of items.
	 *
	 * Renders a semantic `<ul>` or `<ol>` with configurable density, dividers,
	 * marker styles, and an optional header.
	 *
	 * @example
	 * ```svelte
	 * <List>
	 *   <ListItem label="Notifications" description="Manage your alerts" />
	 *   <ListItem label="Privacy" description="Control your data" />
	 * </List>
	 * ```
	 */
	let {
		children,
		density = 'balanced',
		hasDividers = false,
		header,
		listStyle = 'none',
		start,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: ListProps = $props();

	const headerId = $props.id();
	const isOrdered = $derived(listStyle === 'decimal');

	setListContext(() => ({ density, hasDividers, listStyle }));

	const theme = $derived(themeProps('list', { density, listStyle }));
	const attrs = $derived(listAttrs(hasDividers, listStyle, start, xstyle));
	const rootAttrs = listRootAttrs();
	const headerAttrs = listHeaderAttrs();
</script>

{#snippet listElement()}
	<!--
		The base list style always sets `list-style-type: none` (markers are
		custom-rendered by `ListItem`), and Safari/VoiceOver drops implicit list
		semantics for lists styled that way. The explicit role restores
		"list, N items" announcements for every `listStyle` variant, which is why it
		is unconditional rather than gated on `listStyle === 'none'` (WCAG 1.3.1).

		It reads as a redundant role and is not: the CSS is what removed the implicit
		one. `a11y_no_redundant_roles` does not fire here only because the tag is
		dynamic — were this a literal `<ul>`, the rule would need suppressing, and the
		reason would be this paragraph.
	-->
	<svelte:element
		this={isOrdered ? 'ol' : 'ul'}
		{...rest}
		data-testid={testId}
		aria-labelledby={header != null ? headerId : undefined}
		start={isOrdered && start != null && start !== 1 ? start : undefined}
		role="list"
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
	>
		{@render children()}
	</svelte:element>
{/snippet}

{#if header == null}
	{@render listElement()}
{:else}
	<div class={rootAttrs.class} style={rootAttrs.style}>
		<div id={headerId} class={headerAttrs.class} style={headerAttrs.style}>
			{#if typeof header === 'function'}{@render header()}{:else}{header}{/if}
		</div>
		{@render listElement()}
	</div>
{/if}
