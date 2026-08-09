<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleWithoutCard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Collapsible, CollapsibleGroup, Divider, Text, VStack } from '@astryx-svelte/core';
</script>

<CollapsibleGroup type="single" defaultValue="deployment">
	<VStack gap={3} style="width: 100%; max-width: 400px">
		<Collapsible trigger="Deployment Details" value="deployment">
			<Text type="body">
				Last deployed on April 18, 2026 at 3:42 PM by Sarah Chen. Build duration was 2m 14s with
				zero warnings.
			</Text>
		</Collapsible>
		<Divider />
		<Collapsible trigger="Environment Variables" value="environment">
			<Text type="body">
				12 variables configured. Last updated March 30, 2026. All secrets are encrypted at rest with
				AES-256.
			</Text>
		</Collapsible>
		<Divider />
		<Collapsible trigger="Build Logs" value="logs">
			<Text type="body">
				Build completed successfully. 847 modules compiled, 0 errors, 0 warnings. Bundle size: 142
				KB gzipped.
			</Text>
		</Collapsible>
	</VStack>
</CollapsibleGroup>
