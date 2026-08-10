<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
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

<Seo
	title="Blog"
	description="Release notes and deep dives on porting a design system: what the class oracles catch, what they miss, and the bugs found along the way."
/>

<BlogIndex posts={data.posts} availableTypes={data.availableTypes} />
