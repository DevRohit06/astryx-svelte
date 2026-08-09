<!--
	Ported from upstream's `templates/blocks/components/TopNavItem/TopNavItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors the item SVG in the block file itself and uses the registry's
	`search` for the end content, so there is no Heroicons substitution here —
	both become snippets, which is what `TopNavItem.icon` and `TopNav.endContent`
	take. The `<svg>` already carries its own 16px size.
-->
<script lang="ts">
	import { Icon, TopNav, TopNavHeading, TopNavItem } from '@astryx-svelte/core';
</script>

{#snippet homeIcon()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
		/>
	</svg>
{/snippet}

{#snippet heading()}
	<TopNavHeading heading="App" />
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Dashboard" href="#" isSelected icon={homeIcon} />
	<TopNavItem label="Projects" href="#" />
	<TopNavItem label="Reports" href="#" />
	<TopNavItem label="Archived" href="#" isDisabled />
{/snippet}

{#snippet endContent()}<Icon icon="search" />{/snippet}

<TopNav style="width: 600px" label="Navigation items demo" {heading} {startContent} {endContent} />
