<!--
	Ported from upstream's `templates/blocks/components/Heading/HeadingPageLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Heading, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={6} width="100%" style="max-width: 400px">
	<VStack>
		<Heading level={1}>Dashboard Overview</Heading>
		<Text type="supporting" display="block">Last updated 5 minutes ago</Text>
	</VStack>
	<VStack>
		<Heading level={2}>Recent Activity</Heading>
		<Text type="body" display="block">Here's what's been happening in your workspace.</Text>
	</VStack>
	<VStack>
		<Heading level={3}>Today</Heading>
		<Text type="body" display="block">
			• Project Alpha updated
			<br />
			• 3 new comments
			<br />• Task completed
		</Text>
	</VStack>
</VStack>
