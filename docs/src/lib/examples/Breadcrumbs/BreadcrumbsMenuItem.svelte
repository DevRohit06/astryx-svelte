<!--
	Ported from upstream's `templates/blocks/components/Breadcrumbs/BreadcrumbsMenuItem.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Breadcrumbs, BreadcrumbItem } from '@astryx-svelte/core';
	import type { BreadcrumbMenuOption } from '@astryx-svelte/core';

	const teamMenu: BreadcrumbMenuOption[] = [
		{ label: 'Design', onClick: () => {} },
		{ label: 'Engineering', onClick: () => {} },
		{ type: 'divider' },
		{ label: 'Data', onClick: () => {} }
	];
</script>

<Breadcrumbs>
	<BreadcrumbItem href="/">Home</BreadcrumbItem>
	<!--
		`children` travels as a **prop**, not as slot content: upstream's
		`<BreadcrumbItem menu={…}>Teams</BreadcrumbItem>` gives a *string* child, and
		the string is what names the menu surface. Slot content — even a literal —
		compiles to a snippet, which is opaque, so the menu would go unnamed.
	-->
	<BreadcrumbItem menu={teamMenu} children="Teams" />
	<BreadcrumbItem isCurrent>Overview</BreadcrumbItem>
</Breadcrumbs>
