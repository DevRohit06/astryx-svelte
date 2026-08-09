<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ElementSize } from '../../internal/contexts.svelte.js';
	import type { SpacingStep } from '../../internal/types.js';
	import type { SectionDivider, SectionVariant } from '../section/section.stylex.js';

	export type ToolbarSize = ElementSize;

	export interface ToolbarProps extends BaseProps<HTMLDivElement> {
		/** Content aligned to the start (left in LTR). */
		startContent?: Snippet;
		/**
		 * Content centred between start and end. When provided, the layout
		 * switches to a CSS grid (`1fr auto 1fr`).
		 */
		centerContent?: Snippet;
		/** Content aligned to the end (right in LTR). */
		endContent?: Snippet;
		/** Accessible label, applied as `aria-label` on the inner toolbar element. */
		label: string;
		/**
		 * Size of the toolbar. Children inherit it as their default through the
		 * size context, so `Button`, `TextInput`, `TabList` and `Selector` line up.
		 * @default 'md'
		 */
		size?: ToolbarSize;
		/**
		 * Gap between items within each slot, on the spacing scale.
		 * @default 1
		 */
		gap?: SpacingStep;
		/**
		 * Orientation for keyboard navigation — which arrow keys move between
		 * items.
		 * @default 'horizontal'
		 */
		orientation?: 'horizontal' | 'vertical';
		/**
		 * Visual variant passed through to `Section`.
		 * @default 'transparent'
		 */
		variant?: SectionVariant;
		/** Which sides get divider borders. Passed through to `Section`. */
		dividers?: SectionDivider[];
	}
</script>

<script lang="ts">
	import Section from '../section/section.svelte';
	import KeyboardHintLayer from '../../hooks/keyboard-hint-layer.svelte';
	import { useKeyboardHint } from '../../hooks/use-keyboard-hint.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { setSizeContext } from '../../internal/contexts.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		defaultBlockPaddingForSize,
		toolbarAttrs,
		toolbarCenterSlotAttrs,
		toolbarEndSlotAttrs,
		toolbarStartSlotAttrs
	} from './toolbar.stylex.js';

	/**
	 * A general-purpose toolbar with start, centre and end content slots.
	 *
	 * Built on `Section`: flex or grid layout with roving-tabindex keyboard
	 * navigation from `useListFocus`, the size cascaded to children through the
	 * size context, and edge compensation so ghost buttons sit flush at container
	 * edges.
	 *
	 * @example
	 * ```svelte
	 * <Toolbar label="Actions" size="sm">
	 *   {#snippet startContent()}<Button label="Cut" variant="ghost" />{/snippet}
	 *   {#snippet endContent()}<Button label="Settings" variant="ghost" />{/snippet}
	 * </Toolbar>
	 * ```
	 */
	let {
		startContent,
		centerContent,
		endContent,
		label,
		size = 'md',
		gap = 1,
		orientation = 'horizontal',
		variant = 'transparent',
		dividers,
		xstyle,
		class: className,
		style: styleProp,
		onkeydown: onKeyDownProp,
		onfocusin: onFocusProp,
		onfocusout: onBlurProp,
		// Read and dropped, as upstream reads and drops them: the toolbar owns
		// its own `role`/`aria-label`/`aria-orientation`.
		role: _role,
		'aria-label': _ariaLabel,
		'aria-orientation': _ariaOrientation,
		...props
	}: ToolbarProps = $props();

	const hasCenterContent = $derived(centerContent != null);
	const hasStartContent = $derived(startContent != null);
	const hasEndContent = $derived(endContent != null);
	const hasBottomDivider = $derived(dividers?.includes('bottom') ?? false);

	const hintId = $props.id();

	const listFocus = useListFocus(() => ({
		itemSelector: 'button, input, [tabindex]',
		orientation,
		hasRovingTabIndex: true,
		hasCaretGuard: true
	}));

	const keyboardHint = useKeyboardHint(() => ({ id: hintId, orientation }));

	setSizeContext(() => size);

	function handleToolbarKeyDown(e: KeyboardEvent): void {
		onKeyDownProp?.(e as KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onKeyDown(e);
		listFocus.handleKeyDown(e);
	}

	function handleToolbarFocus(e: FocusEvent): void {
		onFocusProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onFocus(e);
		listFocus.handleFocus(e);
	}

	function handleToolbarBlur(e: FocusEvent): void {
		onBlurProp?.(e as FocusEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (e.defaultPrevented) {
			return;
		}
		keyboardHint.onBlur(e);
	}

	const theme = $derived(themeProps('toolbar', { size }));
	const rootAttrs = $derived(
		toolbarAttrs(hasCenterContent, orientation, size, gap, hasBottomDivider)
	);
	const startAttrs = $derived(toolbarStartSlotAttrs(size, gap, !hasEndContent));
	const centerAttrs = $derived(toolbarCenterSlotAttrs(gap));
	const endAttrs = $derived(toolbarEndSlotAttrs(size, gap, !hasStartContent));
	// The grid layout's slots always sit between siblings, so neither is "only".
	const gridStartAttrs = $derived(toolbarStartSlotAttrs(size, gap, false));
	const gridEndAttrs = $derived(toolbarEndSlotAttrs(size, gap, false));
</script>

<Section
	{variant}
	paddingBlock={defaultBlockPaddingForSize[size]}
	{dividers}
	{xstyle}
	class={className}
	style={styleProp}
>
	<div
		{...props}
		{@attach listFocus.attachList}
		role="toolbar"
		aria-label={label}
		aria-orientation={orientation}
		onkeydown={handleToolbarKeyDown}
		onfocusin={handleToolbarFocus}
		onfocusout={handleToolbarBlur}
		{...theme}
		class={cx(theme.class, rootAttrs.class)}
		style={rootAttrs.style}
	>
		{#if hasCenterContent}
			<!-- Three-slot grid layout -->
			<div class={gridStartAttrs.class} style={gridStartAttrs.style}>
				{@render startContent?.()}
			</div>
			<div class={centerAttrs.class} style={centerAttrs.style}>
				{@render centerContent?.()}
			</div>
			<div class={gridEndAttrs.class} style={gridEndAttrs.style}>
				{@render endContent?.()}
			</div>
		{:else}
			<!-- Two-slot flex layout -->
			{#if hasStartContent}
				<div class={startAttrs.class} style={startAttrs.style}>{@render startContent?.()}</div>
			{/if}
			{#if hasEndContent}
				<div class={endAttrs.class} style={endAttrs.style}>{@render endContent?.()}</div>
			{/if}
		{/if}
		<KeyboardHintLayer hint={keyboardHint} />
	</div>
</Section>
