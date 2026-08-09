<!--
	Ported from upstream's `templates/blocks/components/TopNavHeading/TopNavHeadingBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream passes the registry's `viewColumns` here, not a Heroicon, so the icon
	transcribes as-is; only the render shape changes, from an element to the
	snippet `NavIcon.icon` and `TopNavHeading.logo` take.
-->
<script lang="ts">
	import { Icon, NavIcon, TopNav, TopNavHeading } from '@astryx-svelte/core';
</script>

{#snippet viewColumnsIcon()}<Icon icon="viewColumns" />{/snippet}
{#snippet logo()}<NavIcon icon={viewColumnsIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="Acme Platform" {logo} headingHref="/" />
{/snippet}

<TopNav label="Product navigation" {heading} />
