<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CollapsibleProps extends BaseProps<HTMLDivElement> {
		/**
		 * Always-visible trigger content, rendered inside the disclosure button. A
		 * string renders as text; a snippet renders element content (upstream's
		 * `ReactNode`, following the `Item.label` `string | Snippet` precedent).
		 */
		trigger: string | Snippet;
		/** Content that collapses/expands. */
		children?: Snippet;
		/** Default open state for uncontrolled usage. @default true */
		defaultIsOpen?: boolean;
		/** Controlled open state. */
		isOpen?: boolean;
		/**
		 * Disable the collapsible. The trigger uses `aria-disabled` (not native
		 * `disabled`) and drops out of the tab order, staying perceivable; an
		 * already-open item is not collapsed. @default false
		 */
		isDisabled?: boolean;
		/** Called when the open state changes. */
		onOpenChange?: (isOpen: boolean) => void;
		/** Identifier for coordination within a `CollapsibleGroup`. */
		value?: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Icon from '../icon/icon.svelte';
	import {
		setCollapsibleGroupPresentationContext,
		useCollapsibleGroupPresentationContext
	} from './collapsible-group-context.svelte.js';
	import { useCollapsible } from './use-collapsible.svelte.js';
	import {
		collapsibleChevronClosedStyle,
		collapsibleChevronOpenStyle,
		collapsibleChevronStyle,
		collapsibleContentAttrs,
		collapsibleRootAttrs,
		collapsibleTriggerAttrs,
		collapsibleTriggerLabelAttrs
	} from './collapsible.stylex.js';

	/**
	 * A primitive that makes any content collapsible: an always-visible trigger
	 * with a chevron, and a content region toggled on click. Self-managed by
	 * default, or coordinated by a `CollapsibleGroup` when given a `value`.
	 *
	 * Collapse is `display:none` (children stay mounted); only the chevron
	 * animates. When inside a divider group, the item draws its own row chrome
	 * from the presentation context — which is reset to null for its children so
	 * nested collapsibles stay chrome-free.
	 */
	const {
		trigger,
		children,
		defaultIsOpen,
		isOpen: controlledIsOpen,
		isDisabled = false,
		onOpenChange,
		value,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CollapsibleProps = $props();

	const contentId = $props.id();

	const collapsible = useCollapsible(() => ({
		isCollapsible:
			controlledIsOpen !== undefined
				? { isOpen: controlledIsOpen, onOpenChange }
				: { defaultIsOpen: defaultIsOpen ?? true, onOpenChange },
		value
	}));

	// Read the group's presentation (dividers/density) from the ancestor, then
	// reset it to null for our own descendants so nested collapsibles stay
	// chrome-free (the coordination context is intentionally NOT reset).
	const presentationGetter = useCollapsibleGroupPresentationContext();
	setCollapsibleGroupPresentationContext(() => null);

	const presentation = $derived(presentationGetter());
	const isDivided = $derived(presentation?.hasDividers ?? false);
	const density = $derived(presentation?.density ?? null);

	function handleToggle(): void {
		if (isDisabled) {
			return;
		}
		collapsible.toggle();
	}

	const theme = $derived(themeProps('collapsible', { density: density ?? undefined }));
	const contentTheme = $derived(
		themeProps('collapsible-content', { density: density ?? undefined })
	);
	const rootAttrs = $derived(collapsibleRootAttrs(isDivided, xstyle));
	// The trigger is a theming target of its own, so a theme can restyle it
	// independently from the content — e.g. a heading font on the trigger while
	// the content keeps the body font.
	const triggerTheme = $derived(
		themeProps('collapsible-trigger', { density: density ?? undefined })
	);
	const triggerAttrs = $derived(collapsibleTriggerAttrs(density, isDisabled));
	const triggerLabelAttrs = collapsibleTriggerLabelAttrs();
	const contentAttrs = $derived(collapsibleContentAttrs(density, collapsible.isOpen));
</script>

<!--
	`{...rest}` last, as upstream spreads `{...props}` last — a consumer's `data-*`
	or `aria-*` overrides the component's own reflection rather than being
	overridden by it. `class`/`style` are destructured out, so they cannot be
	clobbered from here.
-->
<div
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	{...rest}
>
	<button
		type="button"
		onclick={handleToggle}
		aria-disabled={isDisabled || undefined}
		aria-expanded={collapsible.isOpen}
		aria-controls={contentId}
		tabindex={isDisabled ? -1 : undefined}
		{...triggerTheme}
		class={cx(triggerTheme.class, triggerAttrs.class)}
		style={triggerAttrs.style}
	>
		<span class={triggerLabelAttrs.class} style={triggerLabelAttrs.style}>
			{#if typeof trigger === 'function'}{@render trigger()}{:else}{trigger}{/if}
		</span>
		<Icon
			icon="chevronDown"
			size="sm"
			color="secondary"
			xstyle={[
				collapsibleChevronStyle,
				collapsible.isOpen ? collapsibleChevronOpenStyle : collapsibleChevronClosedStyle
			]}
		/>
	</button>
	<div
		id={contentId}
		{...contentTheme}
		class={cx(contentTheme.class, contentAttrs.class)}
		style={contentAttrs.style}
	>
		{@render children?.()}
	</div>
</div>
