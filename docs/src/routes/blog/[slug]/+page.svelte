<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import { SITE_NAME, SITE_URL, absolute } from '$lib/seo/site.js';
	import BlogArticle from '$lib/blog/blog-article.svelte';

	/** `/blog/<slug>` — upstream's `app/blog/[slug]/page.tsx`. */
	const { data } = $props();
</script>

<!--
	`type="article"` and `article:published_time` are what turn a shared link into
	a dated post rather than another copy of the site card, and `BlogPosting`
	is what a search result needs to show the date at all.
-->
<Seo
	title={data.post.title}
	description={data.post.description}
	type="article"
	published={data.post.date}
	schema={{
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.post.title,
		description: data.post.description,
		datePublished: data.post.date,
		dateModified: data.post.updatedAt ?? data.post.date,
		author: data.post.authors?.map((name: string) => ({ '@type': 'Person', name })) ?? [
			{ '@type': 'Organization', name: SITE_NAME }
		],
		publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
		mainEntityOfPage: absolute(`/blog/${data.post.slug}`),
		keywords: data.post.tags?.join(', ')
	}}
/>

<BlogArticle post={data.post} />
