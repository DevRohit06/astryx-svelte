<script lang="ts" module>
	import type { Component } from 'svelte';

	/** One crumb's spec. `props` reaches `BreadcrumbItem`; `label` is its content. */
	export interface CrumbSpec {
		label: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		/** Renders a `startIcon` span carrying this testid. */
		startIconTestid?: string;
		/**
		 * Renders `menu` as a snippet of composed `<BreadcrumbMenuItem>`s —
		 * upstream's composed-children form, which is a JSX fragment there. The
		 * data-array form needs no fixture support: it goes through `props.menu`.
		 */
		composedMenu?: { label: string; onClick?: () => void }[];
		/** Renders `menu` as a single composed `<BreadcrumbMenuCheckboxItem>`. */
		checkboxMenu?: { label: string; value: boolean; onChange?: (checked: boolean) => void };
		/** Renders `menu` as a composed `<BreadcrumbMenuRadioGroup>`. */
		radioMenu?: {
			label: string;
			value: string;
			onChange?: (value: string) => void;
			options: { value: string; label: string }[];
		};
	}

	export interface BreadcrumbsFixtureProps {
		/** Props for the `<Breadcrumbs>` itself. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		list?: Record<string, any>;
		/** Renders `separator` as `<span>›</span>`, upstream's custom-separator case. */
		hasCustomSeparator?: boolean;
		items: CrumbSpec[];
		/** When set, wraps everything in a `LinkProvider` publishing this component. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		provider?: Component<any>;
	}
</script>

<script lang="ts">
	import BreadcrumbItem from '$lib/components/breadcrumbs/breadcrumb-item.svelte';
	import BreadcrumbMenuCheckboxItem from '$lib/components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
	import BreadcrumbMenuItem from '$lib/components/dropdown-menu/dropdown-menu-item.svelte';
	import BreadcrumbMenuRadioGroup from '$lib/components/dropdown-menu/dropdown-menu-radio-group.svelte';
	import BreadcrumbMenuRadioItem from '$lib/components/dropdown-menu/dropdown-menu-radio-item.svelte';
	import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';
	import LinkProvider from '$lib/components/link/link-provider.svelte';

	/**
	 * `<Breadcrumbs>` with `<BreadcrumbItem>` children, driven by data.
	 *
	 * Upstream writes the crumbs as JSX children with inline `startIcon` elements
	 * and a `separator` node; a Svelte snippet can only be authored in a template,
	 * so the crumbs become a spec array and this fixture rebuilds the markup.
	 */
	const {
		list = {},
		hasCustomSeparator = false,
		items,
		provider
	}: BreadcrumbsFixtureProps = $props();
</script>

{#snippet separator()}
	<span>›</span>
{/snippet}

{#snippet trail()}
	<Breadcrumbs {...list} separator={hasCustomSeparator ? separator : undefined}>
		{#each items as crumb (crumb.label)}
			{#snippet startIcon()}
				<span data-testid={crumb.startIconTestid}>icon</span>
			{/snippet}
			{#snippet composedMenu()}
				{#each crumb.composedMenu ?? [] as entry (entry.label)}
					<BreadcrumbMenuItem label={entry.label} onClick={entry.onClick} />
				{/each}
			{/snippet}
			{#snippet checkboxMenu()}
				{#if crumb.checkboxMenu}
					<BreadcrumbMenuCheckboxItem
						label={crumb.checkboxMenu.label}
						value={crumb.checkboxMenu.value}
						onChange={crumb.checkboxMenu.onChange}
					/>
				{/if}
			{/snippet}
			{#snippet radioMenu()}
				{#if crumb.radioMenu}
					<BreadcrumbMenuRadioGroup
						value={crumb.radioMenu.value}
						onChange={crumb.radioMenu.onChange ?? (() => {})}
						label={crumb.radioMenu.label}
					>
						{#each crumb.radioMenu.options as option (option.value)}
							<BreadcrumbMenuRadioItem value={option.value} label={option.label} />
						{/each}
					</BreadcrumbMenuRadioGroup>
				{/if}
			{/snippet}
			<!-- `children` is passed as a string, not as slot content: upstream's
			     `<BreadcrumbItem>Teams</BreadcrumbItem>` gives a string child, and the
			     string is what names a `menu` crumb's surface. -->
			<BreadcrumbItem
				{...crumb.props}
				startIcon={crumb.startIconTestid != null ? startIcon : undefined}
				menu={crumb.composedMenu != null
					? composedMenu
					: crumb.checkboxMenu != null
						? checkboxMenu
						: crumb.radioMenu != null
							? radioMenu
							: crumb.props?.menu}
				children={crumb.label}
			/>
		{/each}
	</Breadcrumbs>
{/snippet}

{#if provider}
	<LinkProvider component={provider}>{@render trail()}</LinkProvider>
{:else}
	{@render trail()}
{/if}
