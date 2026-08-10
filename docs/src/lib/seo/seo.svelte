<script lang="ts">
	/**
	 * Every tag a page needs to be found and to share well, in one component.
	 *
	 * Each route used to hand-write a `<title>` and sometimes a description, which
	 * meant no page had a canonical URL, an Open Graph card, or a Twitter card —
	 * so every link to this site rendered as a bare URL, and paginated or
	 * parameterised routes had nothing telling a crawler which URL was the real
	 * one.
	 *
	 * `page.url.pathname` is the canonical source rather than a prop: a canonical
	 * URL a caller can get wrong is worse than none, because it silently points
	 * search engines at the wrong page. The host is always `SITE_URL`, never
	 * `page.url.origin`, since during prerender the origin is SvelteKit's internal
	 * placeholder.
	 */
	import { page } from '$app/state';
	import { SITE_DESCRIPTION, SITE_NAME, SITE_OG_IMAGE, absolute } from './site.js';

	interface Props {
		/** The page's own title. The site name is appended unless `bare`. */
		title: string;
		description?: string;
		/** `article` for blog posts, `website` for everything else. */
		type?: 'website' | 'article';
		/** Overrides the social card image with an absolute URL. */
		image?: string;
		/** Set on the home page, whose title is already the site name. */
		bare?: boolean;
		/** Keeps a page out of search results without hiding it from users. */
		noindex?: boolean;
		/** JSON-LD, serialised into a `application/ld+json` script. */
		schema?: Record<string, unknown> | null;
		/** ISO 8601. Emitted as `article:published_time`. */
		published?: string | null;
	}

	const {
		title,
		description = SITE_DESCRIPTION,
		type = 'website',
		image = SITE_OG_IMAGE,
		bare = false,
		noindex = false,
		schema = null,
		published = null
	}: Props = $props();

	// A title that already names the site does not get it a second time — release
	// posts are titled "astryx-svelte v0.3.1: …", and the suffix made those read
	// "… · astryx-svelte" for no gain.
	const fullTitle = $derived(
		bare || title.toLowerCase().includes(SITE_NAME.toLowerCase())
			? title
			: `${title} · ${SITE_NAME}`
	);
	const canonical = $derived(absolute(page.url.pathname));

	/**
	 * The closing tag, assembled so the literal string never appears in this
	 * file's source. Written whole it would close the component's own `<script>`
	 * block; written `<\/script>` it is an escape eslint (correctly) calls
	 * pointless in a template literal. Concatenation is the version that is true
	 * both ways.
	 */
	const CLOSE_SCRIPT = `<${'/'}script>`;

	/**
	 * `JSON.stringify` output with `<` escaped, so no string inside the schema can
	 * open or close a tag. The inputs are `site.ts` and the generated registries —
	 * none of them user-controlled — and this is the only construct Svelte offers
	 * for emitting a `<script>` element's *text*, since markup `<script>` is
	 * parsed as a template rather than as content.
	 */
	const jsonLd = $derived(schema === null ? null : JSON.stringify(schema).replace(/</g, '\\u003c'));
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	{#if published}
		<meta property="article:published_time" content={published} />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	{#if jsonLd}
		<!-- Payload is JSON.stringify output with `<` escaped, from inputs nobody outside
		     this repo controls. See the `jsonLd` docstring for why `{@html}` is the only option. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<script type="application/ld+json">${jsonLd}${CLOSE_SCRIPT}`}
	{/if}
</svelte:head>

<!--
	`{@html}` is the only way to emit a JSON-LD block from a component: Svelte
	treats the contents of a `<script>` element in markup as a template, not as
	text. The payload is `JSON.stringify` output with `<` escaped, so a string in
	the schema cannot close the tag early — the one injection this construct is
	actually exposed to. `SITE_URL` and the registries are the only inputs, and
	none of them is user-controlled.
-->
