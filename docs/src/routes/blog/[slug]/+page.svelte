<script lang="ts">
	import BlogArticle from '$lib/blog/blog-article.svelte';

	/** `/blog/<slug>` — upstream's `app/blog/[slug]/page.tsx`. */
	const { data } = $props();
</script>

<svelte:head>
	<title>{data.post.title} · astryx-svelte</title>
	<meta name="description" content={data.post.description} />
</svelte:head>

<BlogArticle post={data.post} />
