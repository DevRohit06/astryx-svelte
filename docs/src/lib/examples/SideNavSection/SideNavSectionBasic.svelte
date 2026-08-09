<!--
	Ported from upstream's `templates/blocks/components/SideNavSection/SideNavSectionBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors all three SVGs in the block file itself, so there is no
	Heroicons substitution here — the icon components become snippets, which is
	the `Snippet` arm of `SideNavItem.icon`. Each `<svg>` gains the `width`/
	`height` the `<Icon>` wrapper supplies upstream (`size="sm"`, 1rem), because a
	snippet renders raw.
-->
<script lang="ts">
	import { SideNav, SideNavItem, SideNavSection } from '@astryx-svelte/core';
</script>

{#snippet homeIcon()}
	<svg
		width="16"
		height="16"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
		/>
	</svg>
{/snippet}

{#snippet chartIcon()}
	<svg
		width="16"
		height="16"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
		/>
	</svg>
{/snippet}

{#snippet userIcon()}
	<svg
		width="16"
		height="16"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
		/>
	</svg>
{/snippet}

<SideNav>
	<SideNavSection title="Overview">
		<SideNavItem label="Dashboard" icon={homeIcon} isSelected href="#" />
		<SideNavItem label="Analytics" icon={chartIcon} href="#" />
	</SideNavSection>
	<SideNavSection title="Account">
		<SideNavItem label="Profile" icon={userIcon} href="#" />
	</SideNavSection>
</SideNav>
