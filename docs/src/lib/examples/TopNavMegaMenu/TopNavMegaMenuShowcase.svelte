<!--
	Ported from upstream's `templates/blocks/components/TopNavMegaMenu/TopNavMegaMenuShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so the icons are registry substitutions:
	`RocketLaunchIcon` → `arrowUp`, `BookOpenIcon` → `copy`, `CodeBracketIcon` →
	`wrench`, `ShieldCheckIcon` → `success`, and `MagnifyingGlassIcon` →
	`search`, which is a true match rather than a stand-in. Upstream sizes each
	one `width={20} height={20}`, which is the registry `Icon`'s default `md`.
	Retires with the icon registry (port/todo.md).
-->
<script lang="ts">
	import {
		Icon,
		TopNav,
		TopNavHeading,
		TopNavItem,
		TopNavMegaMenu,
		TopNavMegaMenuFeaturedCard,
		TopNavMegaMenuItem
	} from '@astryx-svelte/core';
</script>

{#snippet heading()}
	<TopNavHeading heading="DevTools" />
{/snippet}

{#snippet rocketLaunchIcon()}<Icon icon="arrowUp" size="md" />{/snippet}
{#snippet bookOpenIcon()}<Icon icon="copy" size="md" />{/snippet}
{#snippet codeBracketIcon()}<Icon icon="wrench" size="md" />{/snippet}
{#snippet shieldCheckIcon()}<Icon icon="success" size="md" />{/snippet}

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
	<TopNavMegaMenuItem
		title="API"
		description="Programmatic access to all features"
		icon={codeBracketIcon}
		href="#api"
	/>
	<TopNavMegaMenuItem
		title="Security"
		description="Enterprise-grade protection"
		icon={shieldCheckIcon}
		href="#security"
	/>
{/snippet}

{#snippet productFeatured()}
	<TopNavMegaMenuFeaturedCard
		title="What's New"
		description="Check out our latest features and improvements in the Q2 release."
		linkLabel="Read the changelog"
		linkHref="#changelog"
	/>
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Overview" href="#" isSelected />
	<TopNavMegaMenu label="Products" items={productItems} featured={productFeatured} />
{/snippet}

{#snippet endContent()}<Icon icon="search" size="md" />{/snippet}

<TopNav style="width: 600px" label="Mega menu demo" {heading} {startContent} {endContent} />
