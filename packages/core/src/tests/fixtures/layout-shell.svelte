<script lang="ts">
	import type { AriaRole } from 'svelte/elements';
	import Layout from '$lib/components/layout/layout.svelte';
	import LayoutContent from '$lib/components/layout/layout-content.svelte';
	import LayoutFooter from '$lib/components/layout/layout-footer.svelte';
	import LayoutHeader from '$lib/components/layout/layout-header.svelte';
	import LayoutPanel from '$lib/components/layout/layout-panel.svelte';
	import type { SizeValue } from '$lib/internal/types.js';

	/**
	 * A `Layout` built from the real slot components, for the cases that are
	 * about how the two halves talk to each other — the divider default, the
	 * content-width inner wrapper, and a panel reading the slot it is in.
	 *
	 * Each slot's text is wrapped in a span carrying a `data-testid`, so a case
	 * can walk up from it to the element that owns the padding or the divider.
	 */
	interface Props {
		contentWidth?: SizeValue;
		defaultHasDividers?: boolean;
		header?: string;
		headerHasDivider?: boolean;
		footer?: string;
		footerHasDivider?: boolean;
		content?: string;
		contentRole?: AriaRole;
		start?: string;
		end?: string;
		panelHasDivider?: boolean;
		panelRole?: AriaRole;
		panelLabel?: string;
	}

	const {
		contentWidth,
		defaultHasDividers,
		header,
		headerHasDivider,
		footer,
		footerHasDivider,
		content,
		contentRole,
		start,
		end,
		panelHasDivider,
		panelRole,
		panelLabel
	}: Props = $props();
</script>

{#snippet headerSlot()}
	<LayoutHeader hasDivider={headerHasDivider}>
		<span data-testid="header-child">{header}</span>
	</LayoutHeader>
{/snippet}

{#snippet footerSlot()}
	<LayoutFooter hasDivider={footerHasDivider}>
		<span data-testid="footer-child">{footer}</span>
	</LayoutFooter>
{/snippet}

{#snippet contentSlot()}
	<LayoutContent role={contentRole}>
		<span data-testid="body">{content}</span>
	</LayoutContent>
{/snippet}

{#snippet startSlot()}
	<LayoutPanel hasDivider={panelHasDivider} role={panelRole} label={panelLabel}>
		<span data-testid="start-child">{start}</span>
	</LayoutPanel>
{/snippet}

{#snippet endSlot()}
	<LayoutPanel hasDivider={panelHasDivider} role={panelRole} label={panelLabel}>
		<span data-testid="end-child">{end}</span>
	</LayoutPanel>
{/snippet}

<Layout
	{contentWidth}
	{defaultHasDividers}
	header={header != null ? headerSlot : undefined}
	footer={footer != null ? footerSlot : undefined}
	start={start != null ? startSlot : undefined}
	end={end != null ? endSlot : undefined}
	content={content != null ? contentSlot : undefined}
/>
