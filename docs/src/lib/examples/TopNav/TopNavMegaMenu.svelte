<!--
	Ported from upstream's `templates/blocks/components/TopNav/TopNavMegaMenu.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`CubeIcon` → `stop`, `ChartBarIcon` → `viewColumns`, `ShieldCheckIcon` →
	`success`, `BoltIcon` → `arrowUp`, `CodeBracketIcon` → `wrench`,
	`GlobeAltIcon` → `externalLink`. Stand-ins rather than true matches, the same
	ones the demo routes make. Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import {
		Button,
		Icon,
		NavIcon,
		TopNav,
		TopNavHeading,
		TopNavItem,
		TopNavMegaMenu,
		TopNavMegaMenuFeaturedCard,
		TopNavMegaMenuItem
	} from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="My App" {logo} headingHref="#" />
{/snippet}

{#snippet chartBarIcon()}<Icon icon="viewColumns" />{/snippet}
{#snippet shieldCheckIcon()}<Icon icon="success" />{/snippet}
{#snippet boltIcon()}<Icon icon="arrowUp" />{/snippet}
{#snippet codeBracketIcon()}<Icon icon="wrench" />{/snippet}
{#snippet globeAltIcon()}<Icon icon="externalLink" />{/snippet}

{#snippet productItems()}
	<TopNavMegaMenuItem
		title="Analytics"
		description="Track and analyze user behavior across your apps"
		icon={chartBarIcon}
		href="#analytics"
	/>
	<TopNavMegaMenuItem
		title="Security"
		description="Enterprise-grade protection for your data"
		icon={shieldCheckIcon}
		href="#security"
	/>
	<TopNavMegaMenuItem
		title="Automation"
		description="Streamline workflows with intelligent tools"
		icon={boltIcon}
		href="#automation"
	/>
	<TopNavMegaMenuItem
		title="Developer Tools"
		description="APIs, SDKs, and CLI for integration"
		icon={codeBracketIcon}
		href="#dev-tools"
	/>
	<TopNavMegaMenuItem
		title="Global Network"
		description="Low-latency edge infra in 40+ regions"
		icon={globeAltIcon}
		href="#network"
	/>
{/snippet}

{#snippet productFeatured()}
	<TopNavMegaMenuFeaturedCard
		title="What's new in v4.0"
		description="AI-powered analytics and real-time collaboration."
		image="https://lookaside.facebook.com/assets/astryx/light-working-horizontal-1.png"
		imageAlt="Team collaboration"
		linkLabel="Read the announcement"
		linkHref="#announcement"
	/>
{/snippet}

{#snippet startContent()}
	<TopNavMegaMenu label="Products" items={productItems} featured={productFeatured} />
	<TopNavItem label="Pricing" href="#" />
	<TopNavItem label="Docs" href="#" />
{/snippet}

{#snippet endContent()}
	<Button label="Sign in" variant="ghost" />
	<Button label="Get started" variant="primary" />
{/snippet}

<TopNav label="Marketing navigation" {heading} {startContent} {endContent} />
