<!--
	Ported from upstream's `templates/blocks/components/Breadcrumbs/BreadcrumbsSupportingVariant.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Default</Text>
		<Breadcrumbs>
			<BreadcrumbItem href="/">Home</BreadcrumbItem>
			<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
			<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
		</Breadcrumbs>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Supporting</Text>
		<Breadcrumbs variant="supporting">
			<BreadcrumbItem href="/">Home</BreadcrumbItem>
			<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
			<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
		</Breadcrumbs>
	</Stack>
</Stack>
