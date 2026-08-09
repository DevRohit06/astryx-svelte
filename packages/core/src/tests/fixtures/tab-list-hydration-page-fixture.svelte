<script lang="ts">
	import Card from '$lib/components/card/card.svelte';
	import Section from '$lib/components/section/section.svelte';
	import VStack from '$lib/components/stack/vstack.svelte';
	import Tab from '$lib/components/tab-list/tab.svelte';
	import TabList from '$lib/components/tab-list/tab-list.svelte';
	import Text from '$lib/components/text/text.svelte';

	/**
	 * The docs component page's actual shape, not just its nesting: a top-level
	 * `{#snippet}` rendered from inside an `{#if}` whose condition is `$state`
	 * written by an `$effect`, with a *second* `TabList` inside the snippet — the
	 * per-example strip.
	 *
	 * Each of those is a candidate the isolated fixture does not exercise. An
	 * effect that writes the branch condition runs during hydration, and a
	 * snippet declared in one component but rendered inside another is where
	 * component context has to be carried across.
	 */
	const { initialTab = 'overview' }: { initialTab?: string } = $props();

	/*
	 * `svelte/prefer-writable-derived` would collapse these two into one
	 * `$derived`, which would defeat the fixture: the shape under test is
	 * precisely "branch condition written by an effect that first runs during
	 * hydration", which is what the docs page does and what a derived would not
	 * reproduce.
	 */
	// eslint-disable-next-line svelte/prefer-writable-derived
	let tab = $state('overview');

	$effect(() => {
		tab = initialTab;
	});
</script>

{#snippet overview()}
	<VStack gap={8}>
		<Card padding={3}>
			<Text type="body" weight="medium">An example</Text>
			<Section variant="muted" padding={1} dividers={['top']}>
				<TabList value="description" onChange={() => {}} size="sm">
					<Tab value="description" label="Description" />
					<Tab value="code" label="Code" />
				</TabList>
			</Section>
		</Card>
	</VStack>
{/snippet}

<Section maxWidth={960} padding={6} variant="transparent">
	<VStack gap={4}>
		<VStack gap={2}>
			<Text type="display-1">Button</Text>
			<Text type="supporting" color="secondary">@astryx-svelte/core · Button</Text>
		</VStack>

		<TabList value={tab} onChange={() => {}} hasDivider>
			<Tab value="overview" label="Overview" />
			<Tab value="properties" label="Properties" />
		</TabList>

		{#if tab === 'properties'}
			<Text type="supporting" color="secondary">Props go here.</Text>
		{:else}
			{@render overview()}
		{/if}
	</VStack>
</Section>
