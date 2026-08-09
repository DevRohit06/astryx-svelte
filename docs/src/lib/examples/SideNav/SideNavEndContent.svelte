<!--
	Ported from upstream's `templates/blocks/components/SideNav/SideNavEndContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors all four SVGs in the block file itself, so there is no
	Heroicons substitution here — the icon components become snippets, which is
	the `Snippet` arm of `SideNavItem.icon`.

	Two adjustments, commented where they land: each `<svg>` gains the
	`width`/`height` the `<Icon>` wrapper supplies upstream (`size="sm"`, 1rem),
	because a snippet renders raw; and `Badge.label` is `string | Snippet` here
	where upstream's is `ReactNode`, so upstream's `label={12}` is written as its
	string form.
-->
<script lang="ts">
	import {
		Badge,
		MoreMenu,
		SideNav,
		SideNavHeading,
		SideNavItem,
		SideNavSection,
		Text
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

{#snippet userGroupIcon()}
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
			d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
		/>
	</svg>
{/snippet}

{#snippet header()}
	<SideNavHeading heading="My App" headingHref="/" />
{/snippet}

{#snippet dashboardEndContent()}
	<MoreMenu
		size="sm"
		items={[
			{ label: 'Pin to top', onClick: () => {} },
			{ label: 'Rename', onClick: () => {} }
		]}
	/>
{/snippet}

<!-- `Badge.label` is `string | Snippet` here; upstream's `label={12}` is `ReactNode`. -->
{#snippet projectsEndContent()}<Badge label="12" />{/snippet}
{#snippet analyticsEndContent()}<Badge label="New" />{/snippet}

{#snippet teamEndContent()}
	<Text type="supporting" color="secondary">8 members</Text>
{/snippet}

<SideNav {header}>
	<SideNavSection title="Navigation" isHeaderHidden>
		<SideNavItem
			label="Dashboard"
			icon={homeIcon}
			isSelected
			href="/dashboard"
			endContent={dashboardEndContent}
		/>
		<SideNavItem
			label="Projects"
			icon={folderIcon}
			href="/projects"
			endContent={projectsEndContent}
		/>
		<SideNavItem
			label="Analytics"
			icon={chartBarIcon}
			href="/analytics"
			endContent={analyticsEndContent}
		/>
		<SideNavItem label="Team" icon={userGroupIcon} href="/team" endContent={teamEndContent} />
	</SideNavSection>
</SideNav>
