<!--
	Ported from upstream's `templates/blocks/components/HoverCard/HoverCardInteractiveContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HoverCard, HStack, Icon, Link, Text, VStack } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `LinkIcon`; the registry ships `externalLink`, so
	 * this is a near-exact swap. Retires with the icon registry (TODO.md).
	 */
</script>

{#snippet guideCard()}
	<VStack gap={2} style="max-width: 280px">
		<HStack gap={2} vAlign="start">
			<Icon icon="externalLink" size="sm" color="secondary" />
			<VStack gap={1}>
				<Text type="label">Getting Started Guide</Text>
				<Text type="body" color="secondary">
					Learn how to set up your first project, invite team members, and configure your workspace.
				</Text>
				<Text type="supporting" color="secondary">docs.example.com/getting-started</Text>
			</VStack>
		</HStack>
	</VStack>
{/snippet}

<Text type="body">
	Read more in the <HoverCard placement="below" content={guideCard}>
		<Link href="#" hasUnderline>Getting Started Guide</Link>
	</HoverCard>.
</Text>
