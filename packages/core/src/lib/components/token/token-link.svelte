<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SvelteStyleAttrs } from '../../internal/sx.js';
	import type { ResolvedLinkComponent } from '../link/link-context.svelte.js';

	/**
	 * Internal — not exported from `index.ts`, exactly as upstream's `TokenLink`
	 * is absent from `Token/index.ts`.
	 */
	export interface TokenLinkProps {
		/** Link URL. */
		href: string;
		/** Whether the token is disabled. */
		isDisabled: boolean;
		/** Resolved link component (native `<a>` or a router link) plus `isNative`. */
		linkResolved: ResolvedLinkComponent;
		/** `sx()` output applied to the invisible inner link. */
		linkAttrs: SvelteStyleAttrs;
		/** Theme/ARIA/class/style attributes for the container `<span>`. */
		containerProps: Record<string, unknown>;
		/** Visible (or visually hidden) label rendered inside the link. */
		label: Snippet;
		/** Optional leading icon. */
		icon?: Snippet;
		/** Content rendered after the label, before the remove button. */
		endContent?: Snippet;
		/** The remove button, rendered as a *sibling* of the link. */
		removeButton: Snippet;
	}
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import LinkElement from '../link/link-element.svelte';
	import { useClickableContainer } from '../../hooks/use-clickable-container.svelte.js';

	/**
	 * The interactive container for a `Token` that is both a link and removable,
	 * ported from Astryx's `Token/TokenLink.tsx`.
	 *
	 * Nesting a `<button>` inside an `<a>` is invalid HTML (WCAG 4.1.2), so when a
	 * token has both `href` and `onRemove` the link cannot be the root. This
	 * renders a `<span>` container holding an invisible inner link and the remove
	 * button as siblings, and wires `useClickableContainer` so the whole token
	 * surface activates the link — including middle-click and cmd/ctrl+click to
	 * open in a new tab — while the remove button keeps handling its own clicks.
	 *
	 * It is a separate file for upstream's reason: `Token` is a presentational
	 * component (their `@astryx/presentational-component` rule) and must hold no
	 * element references, which the delegation needs. Keeping the split also keeps
	 * the `$effect` this hook registers off every non-link `Token`.
	 */
	let {
		href,
		isDisabled,
		linkResolved,
		linkAttrs,
		containerProps,
		label,
		icon,
		endContent,
		removeButton
	}: TokenLinkProps = $props();

	let containerEl = $state<HTMLElement | null>(null);
	let linkEl = $state<HTMLElement | null>(null);

	const clickable = useClickableContainer(() => ({
		container: containerEl,
		interactive: linkEl,
		href,
		disabled: isDisabled
	}));

	// Upstream's `linkRef`. The inner link may be a router component rather than a
	// native `<a>`, so it is captured with a stable-keyed attachment threaded
	// through `LinkElement`'s props bag — the seam `ClickableCard` established.
	const linkAttach = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			linkEl = node;
			return () => {
				linkEl = null;
			};
		}
	};

	// A custom component also gets a `to={href}` alias, matching upstream's
	// `createLinkWithTo`.
	const linkProps = $derived({
		...linkAttach,
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		'aria-disabled': isDisabled || undefined,
		class: linkAttrs.class,
		style: linkAttrs.style
	});
</script>

<span
	bind:this={containerEl}
	onclick={isDisabled ? undefined : clickable.onclick}
	onmouseup={isDisabled ? undefined : clickable.onmouseup}
	{...containerProps}
>
	{#if icon}{@render icon()}{/if}
	<LinkElement component={linkResolved.component} props={linkProps}>
		{@render label()}
	</LinkElement>
	{#if endContent}{@render endContent()}{/if}
	{@render removeButton()}
</span>
