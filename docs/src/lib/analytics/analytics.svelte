<script lang="ts">
	/**
	 * The site's analytics, such as it is: a `<head>` block and one call per
	 * client-side navigation.
	 *
	 * Everything about *what* is emitted, and why it is shaped the way it is,
	 * lives in `gtag.ts`. This component is only the mounting point — it exists so
	 * the head block renders once, from the root layout, rather than being
	 * repeated by every route.
	 *
	 * Both halves are guarded by the same build-time constant. With
	 * `PUBLIC_GA_MEASUREMENT_ID` unset `GA_HEAD` is `''` and `trackPageView` is a
	 * no-op, so the component renders nothing and registers a callback that does
	 * nothing — and Rollup, seeing a constant `''`, drops the inlined Partytown
	 * snippet from the bundle entirely.
	 */
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import { GA_HEAD, trackPageView } from './gtag.js';

	afterNavigate(async (navigation) => {
		// The first `afterNavigate` of a session is the initial page load, which
		// `gtag('config', …)` in the head has already reported. Counting it here
		// too would double every entry page.
		if (navigation.type === 'enter') return;

		// `document.title` is written by `svelte:head` during the render pass;
		// reading it before the flush would report the *previous* page's title.
		await tick();
		trackPageView();
	});
</script>

<svelte:head>
	<!--
		`{@html}` is the only way to emit a `<script>` element's text from a
		component — Svelte parses the contents of a markup `<script>` as a template,
		not as text. The payload is assembled in `gtag.ts` from the Partytown snippet
		and a measurement id validated against `/^G-[A-Z0-9]+$/`, so nothing here is
		interpolated from an unchecked source. `seo.svelte` carries the same
		construct for its JSON-LD, and the same reasoning.

		The `''`-when-off guard is inside the string rather than an `{#if}` around
		this block, because `<svelte:head>` may not sit inside a block.
	-->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html GA_HEAD}
</svelte:head>
