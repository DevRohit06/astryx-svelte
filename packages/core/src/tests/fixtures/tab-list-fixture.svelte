<script lang="ts" module>
	import type { Component } from 'svelte';
	import type { TabListProps } from '$lib/components/tab-list/tab-list.svelte';
	import type { TabMenuOption } from '$lib/components/tab-list/tab-menu.svelte';

	/** One tab's spec. `props` reaches `Tab`; the rest fill its three snippets. */
	export interface TabFixtureItem {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props: Record<string, any>;
		/** `icon` — a span carrying this testid and glyph. */
		icon?: { testid: string; glyph: string };
		/** `selectedIcon` — a span carrying this testid and glyph. */
		selectedIcon?: { testid: string; glyph: string };
		/** `endContent` — a span carrying this testid and text. */
		end?: { testid: string; text: string };
	}
</script>

<script lang="ts">
	import Tab from '$lib/components/tab-list/tab.svelte';
	import TabList from '$lib/components/tab-list/tab-list.svelte';
	import TabMenu from '$lib/components/tab-list/tab-menu.svelte';
	import LinkProvider from '$lib/components/link/link-provider.svelte';

	/**
	 * `<TabList>` with `<Tab>` children and an optional trailing `<TabMenu>`,
	 * driven by data.
	 *
	 * Upstream's cases write the tabs as JSX children with inline
	 * `icon`/`selectedIcon`/`endContent` elements. A Svelte snippet can only be
	 * authored in a template, so the tabs become a spec array and this fixture is
	 * the template that turns each entry back into markup — the same move
	 * `list-fixture` makes.
	 */
	interface Props {
		/** Props for the `<TabList>` itself (value, onChange, size, …). */
		tabList: Omit<TabListProps, 'children'>;
		tabs?: TabFixtureItem[];
		/** When set, a trailing `<TabMenu>` with this label and these options. */
		menu?: { label: string; options: TabMenuOption[] };
		/** When set, wraps everything in a `LinkProvider` publishing this component. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider?: Component<any>;
	}

	const { tabList, tabs = [], menu, provider }: Props = $props();
</script>

{#snippet strip()}
	<TabList {...tabList}>
		{#each tabs as tab (tab.props.value)}
			{#snippet icon()}
				<span data-testid={tab.icon?.testid}>{tab.icon?.glyph}</span>
			{/snippet}
			{#snippet selectedIcon()}
				<span data-testid={tab.selectedIcon?.testid}>{tab.selectedIcon?.glyph}</span>
			{/snippet}
			{#snippet endContent()}
				<span data-testid={tab.end?.testid}>{tab.end?.text}</span>
			{/snippet}
			<Tab
				{...tab.props}
				value={tab.props.value as string}
				label={tab.props.label as string}
				icon={tab.icon ? icon : undefined}
				selectedIcon={tab.selectedIcon ? selectedIcon : undefined}
				endContent={tab.end ? endContent : undefined}
			/>
		{/each}
		{#if menu}
			<TabMenu label={menu.label} options={menu.options} />
		{/if}
	</TabList>
{/snippet}

{#if provider}
	<LinkProvider component={provider}>{@render strip()}</LinkProvider>
{:else}
	{@render strip()}
{/if}
