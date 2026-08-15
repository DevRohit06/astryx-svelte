<!--
	Ported from upstream's `templates/blocks/components/Breadcrumbs/BreadcrumbsWithIcons.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs, Icon } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Home` and `Cog6Tooth`; the registry has no house
	 * glyph but does ship `wrench`, so `Home` substitutes a built-in and
	 * `Cog6Tooth` is a near-exact swap. Retires with the icon registry (port/todo.md).
	 */
</script>

{#snippet homeIcon()}<Icon icon="menu" size="sm" />{/snippet}
{#snippet settingsIcon()}<Icon icon="wrench" size="sm" />{/snippet}

<Breadcrumbs>
	<BreadcrumbItem href="/" startIcon={homeIcon}>Home</BreadcrumbItem>
	<BreadcrumbItem href="/settings" startIcon={settingsIcon}>Settings</BreadcrumbItem>
	<BreadcrumbItem isCurrent>Profile</BreadcrumbItem>
</Breadcrumbs>
