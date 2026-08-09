<script lang="ts">
	import SideNavItem, {
		type SideNavItemProps
	} from '$lib/components/side-nav/side-nav-item.svelte';
	import SideNavSection, {
		type SideNavSectionProps
	} from '$lib/components/side-nav/side-nav-section.svelte';

	/**
	 * `<SideNavSection>` with `<SideNavItem>` children, driven by data — upstream
	 * writes the items as JSX children and `endContent` as an inline element, and
	 * a Svelte snippet can only be authored in a template.
	 */
	interface Props {
		/** Props spread onto `<SideNavSection>`. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>;
		/** Fills `endContent` with `<span data-testid={testid}>{text}</span>`. */
		endContent?: { text: string; testid?: string };
		/** Props for each `<SideNavItem>` inside. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		items?: Record<string, any>[];
	}

	const { props = {}, endContent, items = [{ label: 'Dashboard' }] }: Props = $props();
</script>

{#snippet endSlot()}<span data-testid={endContent?.testid}>{endContent?.text}</span>{/snippet}

<!-- `children` is omitted from the spread's type on purpose: the items below are
     the section's content, and a spread that *could* carry `children` makes
     svelte-check flag the duplicate ("specified more than once"). -->
<SideNavSection
	{...props as Omit<SideNavSectionProps, 'children'>}
	endContent={endContent ? endSlot : undefined}
>
	{#each items as item, i (i)}
		<SideNavItem {...item as SideNavItemProps} />
	{/each}
</SideNavSection>
