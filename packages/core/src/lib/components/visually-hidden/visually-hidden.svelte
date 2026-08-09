<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	// Omits `xstyle` alongside `class`/`style`: the clip block is fixed so it can
	// never be displaced, which is upstream's stated intent for all three.
	export interface VisuallyHiddenProps extends Omit<
		BaseProps<HTMLElement>,
		'class' | 'style' | 'xstyle'
	> {
		/**
		 * Tag to render. Defaults to `span` for the common icon-label case; pass a
		 * block element such as `div` when wrapping block content or hosting an
		 * `aria-live` region. A structural choice, not a visual one.
		 *
		 * Upstream types this `ElementType` — any tag, not just the two the
		 * docstring names — and its own `VisuallyHiddenStructuralHeading` block
		 * passes `as="h2"` to give assistive tech a landmark with no visible
		 * heading. `keyof HTMLElementTagNameMap` is this port's counterpart, as
		 * `Stack`/`StackItem` already use.
		 */
		as?: keyof HTMLElementTagNameMap;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { visuallyHiddenAttrs } from './visually-hidden.stylex.js';

	/**
	 * Renders its children in the accessibility tree while hiding them visually.
	 *
	 * Use for content assistive technology must perceive but sighted users should
	 * not see: accessible names for icon-only controls, `aria-live` announcement
	 * regions, and supplementary screen-reader context.
	 *
	 * Deliberately styling-free — it exists in order *not* to be seen, so it takes
	 * no `class` or `style`. The clip block is fixed and non-overridable; styling a
	 * visually-hidden node is always a mistake. Accessibility pass-throughs
	 * (`aria-*`, `role`, `id`, `data-*`, handlers) remain, since the live-region
	 * case needs them.
	 */
	const { as = 'span', children, ...rest }: VisuallyHiddenProps = $props();

	const attrs = visuallyHiddenAttrs();
</script>

<!-- Consumer props spread first so the clip styles can never be displaced. -->
<svelte:element this={as} {...rest} class={attrs.class} style={attrs.style}>
	{@render children()}
</svelte:element>
