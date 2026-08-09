<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SearchableItem } from './types.js';

	export interface TypeaheadItemProps<
		T extends SearchableItem = SearchableItem
	> extends BaseProps<HTMLDivElement> {
		/** The search result item. */
		item: T;
		/** Icon or avatar to display before the label. */
		icon?: Snippet;
		/** Description text displayed below the label. */
		description?: string;
		/**
		 * Whether this item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/** Group label for grouping items visually. */
		group?: string;
	}
</script>

<script lang="ts" generics="T extends SearchableItem">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		typeaheadItemContainerAttrs,
		typeaheadItemContentAttrs,
		typeaheadItemDescriptionAttrs,
		typeaheadItemLabelAttrs
	} from './typeahead-item.stylex.js';

	/**
	 * Default item component for typeahead dropdown results.
	 *
	 * Renders a label with optional icon and description. Exported for use in a
	 * custom `renderItem` snippet.
	 *
	 * `group` is declared and unused on both sides — upstream accepts it, never
	 * destructures it and renders nothing for it, so it is API surface with no
	 * behaviour. Kept for parity, and destructured out (unused) precisely so it
	 * stays inert: left in `...rest` it would be spread onto the container and
	 * render a `group="…"` attribute upstream never emits.
	 */
	const {
		item,
		icon,
		description,
		isDisabled = false,
		group: _group,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: TypeaheadItemProps<T> = $props();

	const theme = themeProps('typeahead-item');
	const container = $derived(typeaheadItemContainerAttrs(isDisabled, xstyle));
	const content = typeaheadItemContentAttrs();
	const labelAttrs = typeaheadItemLabelAttrs();
	const descriptionAttrs = typeaheadItemDescriptionAttrs();
</script>

<!--
	`item.element` short-circuits the whole row, as upstream's `if (item.element)
	return <>{item.element}</>` does — no wrapper, no theme class, and the
	component's own props are dropped on that branch exactly as upstream drops
	them.
-->
{#if item.element}
	{@render item.element()}
{:else}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, container.class, className)}
		style={mergeStyle(container.style, styleProp as string | undefined)}
	>
		{#if icon}{@render icon()}{/if}
		<div class={content.class} style={content.style}>
			<span class={labelAttrs.class} style={labelAttrs.style}>{item.label}</span>
			{#if description}
				<span class={descriptionAttrs.class} style={descriptionAttrs.style}>{description}</span>
			{/if}
		</div>
	</div>
{/if}
