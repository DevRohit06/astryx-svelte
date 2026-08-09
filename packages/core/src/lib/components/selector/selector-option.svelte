<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { StyleArg } from '../../internal/sx.js';
	import type { IconName } from '../icon/icon-registry.js';

	/**
	 * Upstream's props are a closed list (no `BaseProps`, no rest spread): only
	 * `icon`/`label`/`description`/`endContent`/`xstyle`/`className`/`style` exist,
	 * and all of them are declared, so there is nothing dropped and no
	 * closed-prop-root contradiction to record.
	 */
	export interface SelectorOptionProps {
		/** Icon to display before the label — a registry name, or a snippet. */
		icon?: IconName | Snippet;
		/** Primary label text. */
		label: string | Snippet;
		/** Secondary description text displayed below the label. */
		description?: string | Snippet;
		/** Additional content to render after the label/description. */
		endContent?: Snippet;
		/**
		 * StyleX styles created via `stylex.create()`. Merged with the component's
		 * base styles inside a single `stylex.props()` call for optimal deduplication.
		 */
		xstyle?: StyleArg;
		/**
		 * CSS class name(s) appended to the root element.
		 * If you're using StyleX, prefer `xstyle` for optimal style deduplication.
		 */
		class?: string;
		/** Inline styles applied to the root element. */
		style?: string;
	}
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import Item from '../item/item.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { selectorOptionRootStyle } from './selector-option.stylex.js';

	/**
	 * A helper for rendering custom selector options with consistent styling.
	 *
	 * Use it inside `Selector`'s `renderOption` snippet to build custom option
	 * layouts while keeping the design-system chrome.
	 *
	 * @example
	 * ```svelte
	 * {#snippet renderOption(option)}
	 *   <SelectorOption icon="user" label={option.label ?? option.value} />
	 * {/snippet}
	 * ```
	 */
	const {
		icon,
		label,
		description,
		endContent,
		xstyle,
		class: className,
		style: styleProp
	}: SelectorOptionProps = $props();

	const theme = themeProps('selector-option');
</script>

{#snippet iconSlot()}
	{#if typeof icon === 'string'}
		<Icon {icon} size="sm" color="secondary" />
	{:else if icon}
		{@render icon()}
	{/if}
{/snippet}

<Item
	startContent={icon ? iconSlot : undefined}
	{label}
	{description}
	{endContent}
	xstyle={[selectorOptionRootStyle, xstyle]}
	class={cx(theme.class, className)}
	style={styleProp}
/>
