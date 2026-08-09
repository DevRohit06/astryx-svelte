<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LinkComponentType } from '../link/types.js';

	export interface NavItemElementProps {
		href?: string;
		as?: LinkComponentType;
		isDisabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		/** Attributes spread onto whichever element is rendered. */
		attrs?: Record<string, unknown>;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';

	/**
	 * Internal — renders `<a>` (through the resolved link component) when `href`
	 * is set and the item is enabled, and `<button>` otherwise.
	 *
	 * Upstream's `NavItemElement`, declared alongside `SideNavItem` in the same
	 * file; Svelte has no in-file component declaration, so it is a sibling
	 * module. It stays internal on both sides.
	 *
	 * Note the `href && !isDisabled` condition: a disabled item with an `href`
	 * becomes a `<button disabled>` rather than a dead link, which is what makes
	 * `disabled` actually block activation — an `<a aria-disabled>` still
	 * navigates.
	 */
	let { href, as, isDisabled, onclick, attrs = {}, children }: NavItemElementProps = $props();

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));

	const linkProps = $derived({
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		onclick,
		...attrs
	});
</script>

{#if href && !isDisabled}
	<LinkElement component={linkResolved.component} props={linkProps}>
		{@render children()}
	</LinkElement>
{:else}
	<button type="button" {onclick} disabled={isDisabled} {...attrs}>
		{@render children()}
	</button>
{/if}
