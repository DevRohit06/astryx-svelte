<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleSingleAccordion.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Collapsible, CollapsibleGroup, Section, Text, VStack } from '@astryx-svelte/core';
</script>

<CollapsibleGroup type="single" defaultValue="general">
	<VStack gap={2} style="width: 100%; max-width: 400px">
		<Section>
			<Collapsible trigger="General Settings" value="general">
				<Text type="body">
					Configure your general preferences including language, timezone, and display options.
				</Text>
			</Collapsible>
		</Section>
		<Section>
			<Collapsible trigger="Privacy Settings" value="privacy">
				<Text type="body">
					Manage who can see your profile, activity, and personal information.
				</Text>
			</Collapsible>
		</Section>
		<Section>
			<Collapsible trigger="Notification Settings" value="notifications">
				<Text type="body">Choose which notifications you receive and how they are delivered.</Text>
			</Collapsible>
		</Section>
	</VStack>
</CollapsibleGroup>
