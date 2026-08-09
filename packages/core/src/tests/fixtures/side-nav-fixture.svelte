<script lang="ts" module>
	/** One slot's content — `<span data-testid={testid}>{text}</span>`. */
	export interface SideNavSlotSpec {
		text: string;
		testid?: string;
	}
</script>

<script lang="ts">
	import SideNav, { type SideNavProps } from '$lib/components/side-nav/side-nav.svelte';

	/**
	 * `<SideNav>` with its five snippet slots filled from data.
	 *
	 * Upstream writes each slot as an inline JSX element (`header={<span
	 * data-testid="header">Header</span>}`); a Svelte snippet can only be authored
	 * in a template, so the slots become specs and this fixture rebuilds them.
	 * A slot left unset is passed as `undefined`, which is what makes the
	 * "does not render an empty footer container" case meaningful.
	 */
	interface Props {
		/** Props spread onto `<SideNav>` — `collapsible`, `resizable`, `data-testid`. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		header?: SideNavSlotSpec;
		topContent?: SideNavSlotSpec;
		footer?: SideNavSlotSpec;
		footerIcons?: SideNavSlotSpec;
		/** The scrollable `children`. */
		content?: SideNavSlotSpec;
	}

	const {
		props = {},
		header,
		topContent,
		footer,
		footerIcons,
		content = { text: 'Content' }
	}: Props = $props();
</script>

{#snippet headerSlot()}<span data-testid={header?.testid}>{header?.text}</span>{/snippet}
{#snippet topContentSlot()}<span data-testid={topContent?.testid}>{topContent?.text}</span
	>{/snippet}
{#snippet footerSlot()}<span data-testid={footer?.testid}>{footer?.text}</span>{/snippet}
{#snippet footerIconsSlot()}<span data-testid={footerIcons?.testid}>{footerIcons?.text}</span
	>{/snippet}
{#snippet contentSlot()}<span data-testid={content.testid}>{content.text}</span>{/snippet}

<SideNav
	{...props as SideNavProps}
	header={header ? headerSlot : undefined}
	topContent={topContent ? topContentSlot : undefined}
	footer={footer ? footerSlot : undefined}
	footerIcons={footerIcons ? footerIconsSlot : undefined}
	children={contentSlot}
/>
