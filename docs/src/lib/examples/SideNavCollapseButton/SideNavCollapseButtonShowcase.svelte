<!--
	Ported from upstream's
	`templates/blocks/components/SideNavCollapseButton/SideNavCollapseButtonShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors both SVGs in the block file itself, so there is no Heroicons
	substitution here — the icon components become snippets, which is the
	`Snippet` arm of `SideNavItem.icon`. Each `<svg>` gains the `width`/`height`
	the `<Icon>` wrapper supplies upstream (`size="sm"`, 1rem), because a snippet
	renders raw.
-->
<script lang="ts">
	import {
		SideNav,
		SideNavCollapseButton,
		SideNavHeading,
		SideNavItem,
		SideNavSection
	} from '@astryx-svelte/core';
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

{#snippet folderIcon()}
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
			d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
		/>
	</svg>
{/snippet}

{#snippet header()}
	<SideNavHeading heading="Workspace" />
{/snippet}

{#snippet footerIcons()}
	<SideNavCollapseButton />
{/snippet}

<SideNav collapsible={{ hasButton: false }} {header} {footerIcons}>
	<SideNavSection title="Main">
		<SideNavItem label="Home" icon={homeIcon} isSelected href="#" />
		<SideNavItem label="Projects" icon={folderIcon} href="#" />
	</SideNavSection>
</SideNav>
