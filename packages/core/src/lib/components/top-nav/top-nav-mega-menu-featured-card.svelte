<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface TopNavMegaMenuFeaturedCardProps extends BaseProps<HTMLDivElement> {
		/** Card title. */
		title: string;
		/** Description text below the title. */
		description?: string;
		/** Optional image URL displayed above the body. */
		image?: string;
		/** Alt text for the image. */
		imageAlt?: string;
		/** CTA link text. */
		linkLabel?: string;
		/** CTA link URL. */
		linkHref?: string;
		/** Custom content rendered below the standard body. */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import {
		featuredCardAttrs,
		featuredCardBodyAttrs,
		featuredCardDescriptionAttrs,
		featuredCardImageAttrs,
		featuredCardLinkAttrs,
		featuredCardTitleAttrs
	} from './top-nav-mega-menu-featured-card.stylex.js';

	/**
	 * The standard featured card for `TopNavMegaMenu`'s `featured` slot — an
	 * optional image, a title, a description and a call-to-action link.
	 *
	 * The slot accepts anything, so this is the consistent option rather than the
	 * only one.
	 *
	 * `title` is declared explicitly because `BaseProps` omits it: upstream omits
	 * the same attribute for the same reason, and both then re-declare it here as
	 * card content rather than a tooltip.
	 *
	 * @example
	 * ```svelte
	 * {#snippet featured()}
	 *   <TopNavMegaMenuFeaturedCard
	 *     title="What's new in v4.0"
	 *     description="AI-powered analytics and real-time collaboration."
	 *     linkLabel="Read the announcement"
	 *     linkHref="/blog/v4"
	 *   />
	 * {/snippet}
	 * <TopNavMegaMenu label="Products" {items} {featured} />
	 * ```
	 */
	let {
		title,
		description,
		image,
		imageAlt,
		linkLabel,
		linkHref,
		children,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TopNavMegaMenuFeaturedCardProps = $props();

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());

	const theme = themeProps('top-nav-mega-menu-featured-card');
	const rootAttrs = $derived(featuredCardAttrs(xstyle));
	const imageAttrs = featuredCardImageAttrs();
	const bodyAttrs = featuredCardBodyAttrs();
	const titleAttrs = featuredCardTitleAttrs();
	const descriptionAttrs = featuredCardDescriptionAttrs();
	const linkAttrs = featuredCardLinkAttrs();

	const linkProps = $derived({
		href: linkHref,
		...(linkResolved.isNative ? {} : { to: linkHref }),
		class: linkAttrs.class,
		style: linkAttrs.style
	});
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
>
	{#if image}
		<!--
			Without `imageAlt`, the image is explicitly decorative rather than silently
			empty-alt, matching Avatar's handling of unnamed images. Usually correct
			here: the card already has a visible title.
		-->
		<img
			src={image}
			alt={imageAlt ?? ''}
			role={imageAlt ? undefined : 'presentation'}
			aria-hidden={imageAlt ? undefined : true}
			class={imageAttrs.class}
			style={imageAttrs.style}
		/>
	{/if}
	<div class={bodyAttrs.class} style={bodyAttrs.style}>
		<span class={titleAttrs.class} style={titleAttrs.style}>{title}</span>
		{#if description}
			<span class={descriptionAttrs.class} style={descriptionAttrs.style}>{description}</span>
		{/if}
		{#if linkLabel && linkHref}
			<LinkElement component={linkResolved.component} props={linkProps}>
				{linkLabel} →
			</LinkElement>
		{/if}
		{#if children}{@render children()}{/if}
	</div>
</div>
