<!--
	Ported from upstream's
	`templates/blocks/components/TopNavMegaMenuItem/TopNavMegaMenuItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors all four SVGs in the block file itself, so there is no
	Heroicons substitution here — the icon components become snippets, which is
	what `TopNavMegaMenuItem.icon` takes, and each already carries its own 20px
	size.
-->
<script lang="ts">
	import { Grid, TopNavMegaMenuItem } from '@astryx-svelte/core';
</script>

{#snippet boltIcon()}
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
		/>
	</svg>
{/snippet}

{#snippet cubeIcon()}
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
		/>
	</svg>
{/snippet}

{#snippet globeIcon()}
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.732-3.558"
		/>
	</svg>
{/snippet}

{#snippet wrenchIcon()}
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.192-.14 1.743"
		/>
	</svg>
{/snippet}

<Grid columns={2} gap={2}>
	<TopNavMegaMenuItem
		title="Edge Functions"
		description="Run serverless code at the network edge"
		icon={boltIcon}
		href="#edge"
	/>
	<TopNavMegaMenuItem
		title="Storage"
		description="Object and file storage for your application"
		icon={cubeIcon}
		href="#storage"
	/>
	<TopNavMegaMenuItem
		title="CDN"
		description="Global content delivery with instant purging"
		icon={globeIcon}
		href="#cdn"
	/>
	<TopNavMegaMenuItem
		title="Build Tools"
		description="Optimized bundling and compilation pipeline"
		icon={wrenchIcon}
		href="#build"
	/>
</Grid>
