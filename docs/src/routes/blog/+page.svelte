<script lang="ts">
	import BlogIndex from '$lib/blog/blog-index.svelte';

	/**
	 * `/blog` — upstream's `app/blog/page.tsx`.
	 *
	 * Upstream gives the blog its own route-group layout with no sidebar ("avoid
	 * traditional blog sidebars"). This port needs no such file: the root layout
	 * already decides the sidebar from the pathname, and `/blog` is not under
	 * `/docs` or `/components`, so it gets the marketing shape — top nav, no side
	 * panel, footer — which is exactly what upstream's blog layout composes by
	 * hand.
	 */
	const { data } = $props();
</script>

<svelte:head>
	<title>Blog · astryx-svelte</title>
	<meta
		name="description"
		content="Releases, notes and the occasional deep dive on porting Astryx to Svelte."
	/>
</svelte:head>

<BlogIndex posts={data.posts} availableTypes={data.availableTypes} />
