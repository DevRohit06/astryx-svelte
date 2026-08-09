<script lang="ts">
	import PackageStubPage from '$lib/shell/package-stub-page.svelte';
	import ReferenceDocView from '$lib/shell/reference-doc-view.svelte';
	import type { PageProps } from './$types.js';

	/**
	 * `/docs/<slug>` — upstream's unified docs template, serving two kinds of
	 * slug from one route. `+page.ts` resolves which; this picks the view.
	 *
	 * A reference topic renders its authored `ContentBlock[]`; a package renders
	 * its README through `Markdown`, with the outline parsed from the README's
	 * own headings.
	 */
	const { data }: PageProps = $props();
</script>

<svelte:head>
	{#if data.kind === 'package'}
		<title>{data.pkg.displayName} · astryx-svelte</title>
		<meta name="description" content={data.pkg.description} />
	{:else}
		<title>{data.topic.title} · astryx-svelte</title>
		<meta name="description" content={data.topic.description} />
	{/if}
</svelte:head>

{#if data.kind === 'package'}
	<PackageStubPage
		name={data.pkg.name}
		description={data.pkg.description}
		version={data.pkg.version}
		isReleased={data.isReleased}
		readme={data.readme}
		installSteps={data.installSteps}
		cta={data.cta}
		stripSections={data.stripSections}
		stripIntro={data.stripIntro}
	/>
{:else}
	<ReferenceDocView topic={data.topic} />
{/if}
