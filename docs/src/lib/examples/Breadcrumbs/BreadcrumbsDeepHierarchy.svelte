<!--
	Ported from upstream's `templates/blocks/components/Breadcrumbs/BreadcrumbsDeepHierarchy.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs, Icon } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Home`; the registry has no house glyph, so this
	 * substitutes a built-in. Retires with the icon registry (TODO.md).
	 */
</script>

{#snippet homeIcon()}<Icon icon="menu" size="sm" />{/snippet}

<Breadcrumbs>
	<BreadcrumbItem href="/" startIcon={homeIcon}>Home</BreadcrumbItem>
	<BreadcrumbItem href="/products">Products</BreadcrumbItem>
	<BreadcrumbItem href="/products/electronics">Electronics</BreadcrumbItem>
	<BreadcrumbItem href="/products/electronics/phones">Phones</BreadcrumbItem>
	<BreadcrumbItem isCurrent>iPhone 15 Pro</BreadcrumbItem>
</Breadcrumbs>
