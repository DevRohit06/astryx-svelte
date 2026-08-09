<!--
	Ported from upstream's `templates/blocks/components/BreadcrumbItem/BreadcrumbItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs, Text, VStack } from '@astryx-svelte/core';
</script>

<!--
	Upstream authors the house icon inline in the story file rather than pulling
	it from Heroicons, so it transcribes as-is.
-->
{#snippet homeIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke-width={2} stroke="currentColor">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
		/>
	</svg>
{/snippet}

<VStack gap={4}>
	<VStack gap={1}>
		<Text type="supporting" color="secondary">With start icon</Text>
		<Breadcrumbs>
			<BreadcrumbItem href="/" startIcon={homeIcon}>Home</BreadcrumbItem>
			<BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
			<BreadcrumbItem isCurrent>Components</BreadcrumbItem>
		</Breadcrumbs>
	</VStack>
	<VStack gap={1}>
		<Text type="supporting" color="secondary">As current page (non-link)</Text>
		<Breadcrumbs>
			<BreadcrumbItem href="/">Home</BreadcrumbItem>
			<BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
			<BreadcrumbItem isCurrent>Profile</BreadcrumbItem>
		</Breadcrumbs>
	</VStack>
	<VStack gap={1}>
		<Text type="supporting" color="secondary">Supporting variant</Text>
		<Breadcrumbs variant="supporting">
			<BreadcrumbItem href="/">Home</BreadcrumbItem>
			<BreadcrumbItem href="/admin">Admin</BreadcrumbItem>
			<BreadcrumbItem href="/admin/users">Users</BreadcrumbItem>
			<BreadcrumbItem isCurrent>Permissions</BreadcrumbItem>
		</Breadcrumbs>
	</VStack>
	<VStack gap={1}>
		<Text type="supporting" color="secondary">With onClick handler (no href)</Text>
		<Breadcrumbs>
			<BreadcrumbItem onclick={() => {}}>Dashboard</BreadcrumbItem>
			<BreadcrumbItem onclick={() => {}}>Projects</BreadcrumbItem>
			<BreadcrumbItem isCurrent>Project Alpha</BreadcrumbItem>
		</Breadcrumbs>
	</VStack>
</VStack>
