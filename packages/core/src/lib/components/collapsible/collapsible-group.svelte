<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { CollapsibleGroupDensity } from './collapsible-group-context.svelte.js';

	export interface CollapsibleGroupProps extends Omit<BaseProps<HTMLElement>, 'onchange'> {
		/** @default 'single' */
		type?: 'single' | 'multiple';
		/** Default open item(s) — uncontrolled. String for single, string[] for multiple. */
		defaultValue?: string | string[];
		/** Controlled open item(s). */
		value?: string | string[];
		/** Called when the open item(s) change. */
		onChange?: (value: string | string[]) => void;
		/**
		 * Draw hairline dividers between items (accordion row chrome). Renders a
		 * wrapper `<div>` (the group is otherwise DOM-less) and gives items
		 * `'balanced'` density unless `density` overrides. @default false
		 */
		hasDividers?: boolean;
		/** Row density for the group's items. Defaults to `'balanced'` with dividers. */
		density?: CollapsibleGroupDensity;
		/** Collapsible children (each needs a `value` to participate). */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		setCollapsibleGroupContext,
		setCollapsibleGroupPresentationContext
	} from './collapsible-group-context.svelte.js';
	import { collapsibleGroupWrapperAttrs } from './collapsible-group.stylex.js';

	/**
	 * Coordinates collapsible children's open/close state. Renders no wrapper DOM
	 * unless `hasDividers` is set — so `xstyle`/`class`/`style`/rest take effect
	 * only in divider mode (upstream's documented DOM-less contract). Single mode
	 * (default) keeps at most one item open; multiple mode toggles independently.
	 *
	 * @example
	 * ```svelte
	 * <CollapsibleGroup type="single" hasDividers defaultValue="faq1">
	 *   <Collapsible trigger="What is Astryx?" value="faq1">…</Collapsible>
	 *   <Collapsible trigger="How do I start?" value="faq2">…</Collapsible>
	 * </CollapsibleGroup>
	 * ```
	 */
	const {
		type = 'single',
		defaultValue,
		value: controlledValue,
		onChange,
		hasDividers = false,
		density,
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CollapsibleGroupProps = $props();

	function normalizeToArray(value: string | string[] | undefined): string[] {
		if (value == null) {
			return [];
		}
		return Array.isArray(value) ? value : [value];
	}

	const isControlled = $derived(controlledValue !== undefined);
	// Uncontrolled seed — only the INITIAL `defaultValue` matters (React's lazy
	// `useState(() => …)`); later changes are ignored by design.
	// svelte-ignore state_referenced_locally
	let internalValue = $state(normalizeToArray(defaultValue));
	const openValues = $derived(isControlled ? normalizeToArray(controlledValue) : internalValue);

	function isOpen(itemValue: string): boolean {
		return openValues.includes(itemValue);
	}

	function toggle(itemValue: string): void {
		let nextValues: string[];
		if (type === 'single') {
			// Toggling an open item closes it; a closed item opens (and closes others).
			nextValues = openValues.includes(itemValue) ? [] : [itemValue];
		} else {
			nextValues = openValues.includes(itemValue)
				? openValues.filter((v) => v !== itemValue)
				: [...openValues, itemValue];
		}
		if (!isControlled) {
			internalValue = nextValues;
		}
		if (onChange) {
			// Return the value in the shape the type suggests.
			onChange(type === 'single' ? (nextValues[0] ?? '') : nextValues);
		}
	}

	const resolvedDensity = $derived(density ?? (hasDividers ? 'balanced' : null));

	setCollapsibleGroupContext(() => ({ isOpen, toggle }));
	setCollapsibleGroupPresentationContext(() => ({ hasDividers, density: resolvedDensity }));

	const theme = $derived(
		themeProps('collapsible-group', { density: resolvedDensity ?? undefined })
	);
	const groupAttrs = $derived(collapsibleGroupWrapperAttrs(xstyle));
</script>

{#if hasDividers}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, groupAttrs.class, className)}
		style={mergeStyle(groupAttrs.style, styleProp as string | undefined)}
	>
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
