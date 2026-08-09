<!--
	Ported from upstream's `templates/blocks/components/SideNavItem/SideNavItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors both SVGs in the block file itself, so there is no Heroicons
	substitution here — the icon components become snippets, which is the
	`Snippet` arm of `SideNavItem.icon`. Each `<svg>` gains the `width`/`height`
	the `<Icon>` wrapper supplies upstream (`size="sm"`, 1rem), because a snippet
	renders raw.
-->
<script lang="ts">
	import { SideNav, SideNavItem } from '@astryx-svelte/core';
</script>

{#snippet inboxIcon()}
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
			d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
		/>
	</svg>
{/snippet}

{#snippet documentIcon()}
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
			d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
		/>
	</svg>
{/snippet}

<SideNav>
	<SideNavItem label="Inbox" icon={inboxIcon} isSelected href="#" />
	<SideNavItem label="Documents" icon={documentIcon} href="#" />
</SideNav>
