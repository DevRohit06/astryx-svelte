<!--
	Ported from upstream's `templates/blocks/components/SideNav/SideNavShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors all four SVGs in the block file itself, so there is no
	Heroicons substitution here — the icon components become snippets, which is
	the `Snippet` arm of `SideNavItem.icon`.

	One adjustment, in place on each `<svg>`: upstream's icons carry no size and
	get one from the `<Icon>` wrapper `renderIconSlot` puts around an `IconType`
	(`size="sm"`, 1rem). A snippet renders raw, so `width`/`height` land on the
	`<svg>` itself. `stroke="currentColor"` still inherits the row's colour.
-->
<script lang="ts">
	import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryx-svelte/core';
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

{#snippet chartBarIcon()}
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

{#snippet documentTextIcon()}
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
			d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
		/>
	</svg>
{/snippet}

{#snippet header()}
	<SideNavHeading heading="My App" headingHref="/" />
{/snippet}

<SideNav {header}>
	<SideNavSection title="Main">
		<SideNavItem label="Dashboard" icon={homeIcon} isSelected href="/dashboard" />
		<SideNavItem label="Projects" icon={folderIcon} href="/projects" />
		<SideNavItem label="Analytics" icon={chartBarIcon} href="/analytics" />
	</SideNavSection>
	<SideNavSection title="Documents">
		<SideNavItem label="All Documents" icon={documentTextIcon} href="/documents" />
	</SideNavSection>
</SideNav>
