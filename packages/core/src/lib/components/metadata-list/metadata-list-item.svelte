<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/**
	 * `BaseProps<HTMLElement>`, not upstream's `BaseProps<HTMLDivElement>`: the
	 * root is a `<div>` only in the stacked branch, and a `<dt>` in the inline
	 * one. Upstream can name the narrower type because its `ref` is the only
	 * thing that reaches either element; ours forwards every rest prop, and a
	 * `<dt>` will not take handlers typed for a `<div>`.
	 */
	export interface MetadataListItemProps extends BaseProps<HTMLElement> {
		/** The value for this item. */
		children: Snippet;
		/** Rendered before the label text. */
		icon?: Snippet;
		label: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useMetadataList } from './metadata-list-context.svelte.js';
	import {
		metadataListItemIconAttrs,
		metadataListItemLabelAttrs,
		metadataListItemStackedLabelAttrs,
		metadataListItemStackedValueAttrs,
		metadataListItemStackedWrapperAttrs,
		metadataListItemValueAttrs
	} from './metadata-list-item.stylex.js';

	/**
	 * One labelled value inside a `MetadataList`, as a `<dt>` / `<dd>` pair.
	 *
	 * Whether the pair sits side by side or stacked is the list's decision, not
	 * this component's — it reads `labelConfig` from the context.
	 *
	 * @example
	 * ```svelte
	 * <MetadataListItem label="Status">Active</MetadataListItem>
	 * ```
	 */
	const {
		children,
		icon,
		label,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: MetadataListItemProps = $props();

	const list = useMetadataList();

	// Claimed during init, which is what makes the list's count final before it
	// renders its toggle — on the server as well as the client.
	const index = list()?.register() ?? 0;

	/**
	 * A function rather than a `$derived`, for the reason `MetadataList`'s
	 * `exceedsMax` sets out: the answer depends on a count that is still growing
	 * during the render, and a derived would cache the first one it saw.
	 */
	const isVisible = () => list()?.isItemVisible(index) ?? true;
	const isStacked = $derived(
		list()?.labelConfig.position === 'top' || list()?.orientation === 'horizontal'
	);

	const labelAttrs = $derived(metadataListItemLabelAttrs(xstyle));
	const valueAttrs = metadataListItemValueAttrs();
	const stackedWrapper = $derived(metadataListItemStackedWrapperAttrs(xstyle));
	const stackedLabel = metadataListItemStackedLabelAttrs();
	const stackedValue = metadataListItemStackedValueAttrs();
	const iconAttrs = metadataListItemIconAttrs();
	const theme = themeProps('metadata-list-item');
</script>

{#snippet labelContent()}
	{#if icon}
		<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
	{/if}
	{label}
{/snippet}

{#if isVisible()}
	{#if isStacked}
		<div
			{...theme}
			class={cx(theme.class, stackedWrapper.class, className)}
			style={mergeStyle(stackedWrapper.style, styleProp as string | undefined)}
			{...rest}
		>
			<dt class={stackedLabel.class} style={stackedLabel.style}>{@render labelContent()}</dt>
			<dd class={stackedValue.class} style={stackedValue.style}>{@render children()}</dd>
		</div>
	{:else}
		<!-- Inline layout: the dt and dd are direct grid children, so no wrapper. -->
		<dt
			{...theme}
			class={cx(theme.class, labelAttrs.class, className)}
			style={mergeStyle(labelAttrs.style, styleProp as string | undefined)}
			{...rest}
		>
			{@render labelContent()}
		</dt>
		<dd class={valueAttrs.class} style={valueAttrs.style}>{@render children()}</dd>
	{/if}
{/if}
