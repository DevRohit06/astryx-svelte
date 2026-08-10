<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Card,
		CodeBlock,
		Divider,
		Heading,
		Section,
		Tab,
		TabList,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import coverage from '$lib/generated/coverage.js';
	import BestPracticesBlock from '$lib/shell/best-practices-block.svelte';
	import ComponentPlayground from '$lib/shell/component-playground.svelte';
	import ExampleBlock from '$lib/shell/example-block.svelte';
	import InlineMarkdown from '$lib/shell/inline-markdown.svelte';
	import PropsTable from '$lib/shell/props-table.svelte';
	import ComponentPreviewTheme from '$lib/shell/component-preview-theme.svelte';
	import ShowcasePreview from '$lib/shell/showcase-preview.svelte';
	import type { PageProps } from './$types.js';

	/**
	 * A `/components/<name>` page — upstream's `ComponentDetailClient`.
	 *
	 * Structure is upstream's: a 960px transparent `Section`, a `display-1` title
	 * over a package caption, then either the Overview/Properties tab pair
	 * (components) or a `Divider` and the overview alone (hooks, which upstream
	 * detects with `params != null` and this port records as `isHook`).
	 *
	 * The Properties tab is `ComponentPlayground` — upstream's
	 * `InteractivePreviewStage` over `PlaygroundPropsTable`, with the knob state
	 * between them. The `?tab=` round-trip below is what keeps it out of the
	 * prerender: `tab` starts at `overview` and only an effect adopts the query
	 * string, so the stage renders no arbitrary component on the server.
	 *
	 * Upstream also ships an `Anatomy.tsx` under `component-detail/`, but imports
	 * it nowhere — the anatomy data in `.doc.mjs` is rendered on no page. An
	 * earlier revision of this page rendered it anyway; that was invented
	 * content by the parity rule, and it is gone.
	 */
	const { data }: PageProps = $props();

	const component = $derived(data.component);
	const examples = $derived(data.examples);

	/**
	 * The hero showcase, which upstream renders above Usage in a muted `Card`.
	 * The registry already sorts it first, and it is dropped from the Examples
	 * list below so the same block does not appear twice.
	 */
	const showcase = $derived(examples.find((example) => example.isShowcase) ?? null);
	const otherExamples = $derived(examples.filter((example) => !example.isShowcase));

	const importSnippet = $derived(
		`import { ${component.moduleName} } from '${component.importPath}';`
	);

	/**
	 * Upstream: `{pkg}{pkgVersion ? ` v${pkgVersion}` : ''} · {moduleName}`.
	 *
	 * `0.0.0` is the placeholder an unpublished workspace package carries, not a
	 * release anyone can install, so it takes upstream's no-version branch. Once
	 * core is actually versioned the caption starts showing it with no change
	 * here.
	 */
	const caption = $derived.by(() => {
		const { name, version } = coverage.corePackage;
		const suffix = version === '0.0.0' ? '' : ` v${version}`;
		return `${name}${suffix} · ${component.moduleName}`;
	});

	const hasPlayground = $derived(!component.isHook);

	/**
	 * Upstream keeps the tab in the query string and writes it with
	 * `router.replace(..., {scroll: false})`; `replaceState` is SvelteKit's
	 * counterpart, and like upstream's it leaves no history entry, so Back still
	 * leaves the page rather than stepping through tabs.
	 *
	 * The tab cannot simply be `$derived` from `page.url`: these pages are
	 * prerendered, and a prerendered page has no query string to read — SvelteKit
	 * throws on `url.searchParams` during prerender precisely so that a build
	 * cannot bake one request's query into a static file. So the URL is adopted
	 * *after* hydration, which also keeps the hydrated DOM identical to the
	 * server's. Upstream has the same constraint and answers it the same way, by
	 * wrapping the `useSearchParams()` subtree in `<Suspense>` so the server
	 * renders the fallback and the client renders the real tab.
	 *
	 * The effect writes `tab` without reading it, so it does not depend on its
	 * own output; `$state` skips equal writes, so the repeat assignment from
	 * `setTab` is a no-op rather than a second render.
	 */
	/*
	 * `svelte/prefer-writable-derived` wants `$derived(page.url…)` here, and a
	 * writable `$derived` would indeed carry `setTab`'s writes. It cannot be used:
	 * the derived would evaluate during prerender and throw on `searchParams`, and
	 * guarding it with `browser` only moves the problem — the client's *first*
	 * render would then compute a different tab than the server emitted, which is
	 * a hydration mismatch. Deferring to an effect is the point, not an oversight.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let tab = $state('overview');

	$effect(() => {
		tab = page.url.searchParams.get('tab') ?? 'overview';
	});

	function setTab(value: string): void {
		tab = value;
		const url = new URL(page.url);
		if (value === 'overview') url.searchParams.delete('tab');
		else url.searchParams.set('tab', value);
		replaceState(url, page.state);
	}
</script>

<!--
	The description falls back rather than going missing: a component whose
	`.doc.mjs` has no usage prose would otherwise inherit the site-wide default,
	which says nothing about the component someone searched for.
-->
<Seo
	title="{component.displayName} — Svelte 5 component"
	description={component.usage?.description?.split('\n')[0] ??
		`${component.displayName} for Svelte 5, ported 1:1 from Meta's Astryx design system. Props, examples, accessibility notes and theming.`}
/>

{#snippet overview()}
	<VStack gap={8}>
		{#if showcase}
			<ComponentPreviewTheme>
				<Card variant="muted" padding={0}>
					<ShowcasePreview id={showcase.id} hasSvelte={showcase.hasSvelte} />
				</Card>
			</ComponentPreviewTheme>
		{/if}

		{#if component.usage ?? component.description}
			<VStack gap={4}>
				<Heading level={2} type="display-3">Usage</Heading>

				{#each (component.usage?.description ?? component.description ?? '').split('\n\n') as paragraph, i (i)}
					{#if paragraph.trim()}
						<Text type="large" weight="normal">
							<InlineMarkdown text={paragraph.trim()} />
						</Text>
					{/if}
				{/each}

				<CodeBlock code={importSnippet} language="ts" width="100%" hasCopyButton />

				<!--
					Upstream nests best practices inside the Usage stack, not beside it,
					and its `BestPractices` carries its own heading — which an earlier
					revision of this page lost when it inlined the list.
				-->
				{#if component.usage?.bestPractices?.length}
					<Section>
						<VStack gap={4}>
							<Heading level={2} type="display-3">Best practices</Heading>
							<BestPracticesBlock items={component.usage.bestPractices} />
						</VStack>
					</Section>
				{/if}
			</VStack>
		{/if}

		<!-- Upstream's `HookSignature`: parameters and returns, in place of props. -->
		{#if component.isHook}
			{#if component.params?.length}
				<VStack gap={3}>
					<Heading level={2} type="display-3">Parameters</Heading>
					<PropsTable rows={component.params} nameHeader="Parameter" />
				</VStack>
			{/if}
			{#if component.returns?.length}
				<VStack gap={3}>
					<Heading level={2} type="display-3">Returns</Heading>
					<PropsTable rows={component.returns} nameHeader="Field" />
				</VStack>
			{/if}
		{/if}

		{#if otherExamples.length > 0}
			<VStack gap={4}>
				<Heading level={2} type="display-3">Examples</Heading>
				<Text type="large" weight="normal">Common configurations, variations, and states.</Text>
			</VStack>
			<VStack gap={10}>
				{#each otherExamples as example (example.id)}
					<ExampleBlock entry={example} />
				{/each}
			</VStack>
		{/if}
	</VStack>
{/snippet}

<!--
	`margin-inline: auto` belongs on the `Section` itself — upstream's
	`xstyle={{marginInline: 'auto'}}`. On a wrapper it does nothing: the wrapper is
	a full-width block, so the capped Section inside it stays against the left edge.
-->
<Section maxWidth={960} padding={6} variant="transparent" style="margin-inline: auto;">
	<VStack gap={4}>
		<VStack gap={2}>
			<Text type="display-1">{component.displayName}</Text>
			<Text type="supporting" color="secondary">{caption}</Text>
		</VStack>

		{#if hasPlayground}
			<TabList value={tab} onChange={setTab} hasDivider>
				<Tab value="overview" label="Overview" />
				<Tab value="properties" label="Properties" />
			</TabList>

			{#if tab === 'properties'}
				<!--
					Keyed on the entry: `ComponentPlayground` seeds its knobs once at
					initialisation, and SvelteKit reuses one component instance across
					`/components/[name]` navigations.
				-->
				{#key component.name}
					<ComponentPlayground {component} />
				{/key}
			{:else}
				{@render overview()}
			{/if}
		{:else}
			<Divider />
			{@render overview()}
		{/if}
	</VStack>
</Section>
