<!--
	Ported from upstream's `templates/blocks/components/AppShell/AppShellContentOnly.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AppShell, Heading, Text, VStack } from '@astryx-svelte/core';
</script>

<!--
	`AppShell` fills the viewport (`height: 100dvh`), and upstream's own blocks
	cut that down with `height: 100%` — which only resolves against an ancestor
	that has a definite height. Upstream's docsite gives every block an
	`aspectRatio: 4 / 3` frame; this one's preview container is shrink-to-fit on
	both axes, so the block supplies the frame itself. Same precedent as
	`AspectRatio/AspectRatioImageGallery.svelte`.
-->
<div style="width: 640px; height: 480px">
	<AppShell contentPadding={6} style="height: 100%; min-height: 0">
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</Text>
		</VStack>
	</AppShell>
</div>
