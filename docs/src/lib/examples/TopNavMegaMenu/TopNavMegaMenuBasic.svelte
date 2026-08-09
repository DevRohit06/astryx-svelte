<!--
	Ported from upstream's `templates/blocks/components/TopNavMegaMenu/TopNavMegaMenuBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so both icons are registry substitutions:
	`RocketLaunchIcon` → `arrowUp`, `BookOpenIcon` → `copy`. Upstream sizes each
	one `width={20} height={20}`, which is the registry `Icon`'s default `md`.
	Stand-ins rather than true matches, the same ones the demo routes make.
	Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import {
		Icon,
		TopNav,
		TopNavHeading,
		TopNavItem,
		TopNavMegaMenu,
		TopNavMegaMenuItem
	} from '@astryx-svelte/core';
</script>

{#snippet heading()}
	<TopNavHeading heading="DevTools" />
{/snippet}

{#snippet rocketLaunchIcon()}<Icon icon="arrowUp" size="md" />{/snippet}
{#snippet bookOpenIcon()}<Icon icon="copy" size="md" />{/snippet}

{#snippet productItems()}
	<TopNavMegaMenuItem
		title="Deploy"
		description="Ship to production in seconds"
		icon={rocketLaunchIcon}
		href="#deploy"
	/>
	<TopNavMegaMenuItem
		title="Documentation"
		description="Guides, references, and tutorials"
		icon={bookOpenIcon}
		href="#docs"
	/>
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Overview" href="#" isSelected />
	<TopNavMegaMenu label="Products" items={productItems} />
{/snippet}

<TopNav style="width: 600px" label="Main navigation" {heading} {startContent} />
