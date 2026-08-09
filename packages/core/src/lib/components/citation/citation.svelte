<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { CitationVariant } from './citation.stylex.js';

	export interface CitationSource {
		title?: string;
		url?: string;
		/**
		 * Image URL for a favicon or source logo, rendered as `<img src>` inside the
		 * icon circle. This is the idiomatic field for image sources (mirrors
		 * `Avatar`/`Thumbnail` `src`). When both `src` and a snippet `icon` are
		 * provided, `icon` wins.
		 */
		src?: string;
		/**
		 * Source icon shown before the label text (label variant only). Accepts:
		 * - a snippet — an Astryx `<Icon>`, an SVG, a custom element — rendered
		 *   as-is, or
		 * - a string image URL — rendered as `<img src>` for backward compatibility
		 *   with callers that passed a favicon URL here.
		 *
		 * Note: unlike icon slots elsewhere in the system, a bare string is treated
		 * as an image URL rather than a registry icon name — upstream's rule, kept
		 * because the string form predates the node form here as it does there.
		 *
		 * The icon is decorative either way: the accessible name comes solely from
		 * the citation's `aria-label`, so nothing is double-announced.
		 */
		icon?: string | Snippet;
	}

	export interface CitationProps extends BaseProps<HTMLElement> {
		source: CitationSource;
		/** 1-based index of this citation in the document. */
		number: number;
		/** @default 'label' */
		variant?: CitationVariant;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		citationIconAttrs,
		citationIconWrapAttrs,
		citationLabelTextAttrs,
		citationRootAttrs
	} from './citation.stylex.js';

	/**
	 * An inline reference to a source, in two shapes: a `label` pill carrying the
	 * source's title and favicon, or a superscript `number` badge.
	 *
	 * A source with a `url` renders as an `<a>` and gets the hover treatment; one
	 * without renders as a `<span>` and is inert.
	 *
	 * @example
	 * ```svelte
	 * <Citation source={{ title: 'Example', url: 'https://example.com' }} number={1} />
	 * <Citation source={{ title: 'Example' }} number={2} variant="number" />
	 * ```
	 */
	const {
		source,
		number,
		variant = 'label',
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: CitationProps = $props();

	const t = useTranslator();

	const title = $derived(source.title ?? String(number));
	const href = $derived(source.url);

	// Resolve the source icon. A non-string `icon` renders as-is (an Astryx
	// `<Icon>`, an SVG, an avatar). Otherwise fall back to an image URL: `src`, or
	// a legacy string passed to `icon` (back-compat — favicon URLs still render as
	// an `<img>`). The icon is decorative; the accessible name comes solely from
	// the element's `aria-label`, so nothing is double-announced.
	const iconNode = $derived(
		source.icon != null && typeof source.icon !== 'string' ? source.icon : null
	);
	const imageSrc = $derived(
		source.src ?? (typeof source.icon === 'string' ? source.icon : undefined)
	);
	const hasIcon = $derived(iconNode != null || imageSrc != null);

	// `doc-noteref` is a reference role, and only appropriate on the interactive
	// link form. On a plain span it is not a permitted role (axe:
	// aria-allowed-role), so it is omitted there and the aria-label still names it.
	const noteRole = $derived(href ? 'doc-noteref' : undefined);

	const root = $derived(citationRootAttrs(variant, hasIcon, href != null, xstyle));
	const theme = $derived(themeProps('citation', { variant }));
	const labelText = citationLabelTextAttrs();
	const iconWrap = citationIconWrapAttrs();
	const iconAttrs = citationIconAttrs();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	{...rest}
	role={noteRole}
	aria-label={t('@astryx.citation.label', { number, title })}
	{href}
	target={href ? '_blank' : undefined}
	rel={href ? 'noopener noreferrer' : undefined}
	{title}
	{...theme}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
>
	{#if variant === 'number'}
		{number}
	{:else}
		{#if hasIcon}
			<!--
				`aria-hidden` sits on the *wrapper*, not the `<img>` — upstream's
				placement, and load-bearing now that the wrapper can hold a snippet
				instead. Hiding the image alone would leave a rendered icon node
				exposed.
			-->
			<span aria-hidden="true" class={iconWrap.class} style={iconWrap.style}>
				{#if iconNode}
					{@render iconNode()}
				{:else}
					<img src={imageSrc} alt="" class={iconAttrs.class} style={iconAttrs.style} />
				{/if}
			</span>
		{/if}
		<span class={labelText.class} style={labelText.style}>{title}</span>
	{/if}
</svelte:element>
