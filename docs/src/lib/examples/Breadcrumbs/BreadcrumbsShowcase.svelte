<!--
	Ported from upstream's `templates/blocks/components/Breadcrumbs/BreadcrumbsShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs } from '@astryx-svelte/core';
</script>

<Breadcrumbs>
	<BreadcrumbItem href="/">Home</BreadcrumbItem>
	<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
	<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
</Breadcrumbs>
