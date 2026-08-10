<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Section, Text } from '@astryx-svelte/core';
	import { templatesHref } from '$lib/shell/links.js';
	import type { PageProps } from './$types.js';

	/**
	 * The bounce to `/templates?preview=<slug>`. See `+page.ts` for why this is a
	 * page rather than a `redirect(308, …)` — in short, prerendering a redirect
	 * also prerenders its destination, and this destination carries a query.
	 *
	 * Three mechanisms, deliberately, because they cover different readers:
	 *
	 * 1. `meta refresh` — the only one that works with JavaScript disabled, and
	 *    the one baked into the prerendered HTML.
	 * 2. `goto(..., { replaceState: true })` in `onMount` — a client-side
	 *    navigation, so a reader arriving with the runtime already booted gets the
	 *    gallery without a document round-trip. `replaceState` keeps this URL out
	 *    of the history stack, so Back returns where the reader came from rather
	 *    than bouncing them forward again.
	 * 3. The visible line below — what a reader sees if both are somehow blocked.
	 *    It is not decoration; without it the page is blank.
	 */
	let { data }: PageProps = $props();

	/**
	 * Built against `page.url` so the configured base path is applied once, by
	 * `templatesHref()`. Only `pathname + search` is ever emitted: during
	 * prerender `page.url`'s origin is SvelteKit's internal
	 * `http://sveltekit-prerender`, and baking that into the HTML would send
	 * every reader to a host that does not exist.
	 */
	const target = $derived.by(() => {
		const url = new URL(templatesHref(), page.url);
		url.searchParams.set('preview', data.slug);
		return url;
	});

	const relative = $derived(`${target.pathname}${target.search}`);

	onMount(() => {
		void goto(target, { replaceState: true });
	});
</script>

<!-- Nothing should index a shim that exists only to forward, but it should still
	 be followed so the destination is discovered. -->
<Seo title="{data.slug} · Templates" noindex />

<svelte:head>
	<meta http-equiv="refresh" content="0;url={relative}" />
</svelte:head>

<Section padding={6}>
	<Text type="body" color="secondary">
		Opening the <a href={relative}>{data.slug}</a> template preview…
	</Text>
</Section>
