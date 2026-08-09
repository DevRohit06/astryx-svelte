<!--
	Ported from upstream's `templates/blocks/components/BreadcrumbItem/BreadcrumbItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs } from '@astryx-svelte/core';
</script>

<Breadcrumbs>
	<BreadcrumbItem href="/">Home</BreadcrumbItem>
	<BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
	<BreadcrumbItem isCurrent>Profile</BreadcrumbItem>
</Breadcrumbs>
