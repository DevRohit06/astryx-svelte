<script lang="ts" module>
	/** One `<SideNavItem>`'s spec, recursive through `children`. */
	export interface SideNavItemSpec {
		/** Props spread onto `<SideNavItem>` — `label`, `href`, `isSelected`, … */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props: Record<string, any>;
		/**
		 * Fills `icon` with `<svg data-testid="stub-icon" />` — upstream's
		 * `StubIcon`, passed as `icon={StubIcon}` (the `IconType` half of
		 * `ReactNode | IconType`). The Svelte slot shape is `IconName | Snippet`,
		 * so a snippet is the counterpart.
		 */
		hasStubIcon?: boolean;
		/** Fills `endContent` with `<span data-testid={testid}>{text}</span>`. */
		endContent?: { text: string; testid?: string };
		/** Sub-items, rendered as nested `<SideNavItem>`s. */
		children?: SideNavItemSpec[];
	}
</script>

<script lang="ts">
	import SideNavItem, {
		type SideNavItemProps
	} from '$lib/components/side-nav/side-nav-item.svelte';
	import Self from './side-nav-item-node.svelte';

	/**
	 * Renders one `SideNavItem` from a spec, recursing into its children.
	 *
	 * Upstream nests items as JSX children; a Svelte snippet can only be authored
	 * in a template and the nesting has no `{#each}` to hang one off, so the tree
	 * becomes data and this component turns it back into markup — the same shape
	 * `tree-list-fixture` takes.
	 */
	const { spec }: { spec: SideNavItemSpec } = $props();
</script>

{#snippet stubIcon()}<svg data-testid="stub-icon"></svg>{/snippet}

{#snippet endContentSlot()}<span data-testid={spec.endContent?.testid}>{spec.endContent?.text}</span
	>{/snippet}

{#snippet childItems()}
	{#each spec.children ?? [] as child, i (i)}
		<Self spec={child} />
	{/each}
{/snippet}

<SideNavItem
	{...spec.props as SideNavItemProps}
	{...spec.hasStubIcon ? { icon: stubIcon } : {}}
	{...spec.endContent ? { endContent: endContentSlot } : {}}
	{...spec.children ? { children: childItems } : {}}
/>
