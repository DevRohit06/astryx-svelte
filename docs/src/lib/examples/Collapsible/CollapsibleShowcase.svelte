<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Collapsible, CollapsibleGroup, Text, VStack } from '@astryx-svelte/core';
</script>

<Card width={400}>
	<CollapsibleGroup type="single" defaultValue="notifications">
		<VStack gap={6}>
			<Collapsible trigger="General settings" value="general">
				<Text type="body" color="secondary">
					Configure your display name, language, and time zone preferences.
				</Text>
			</Collapsible>
			<Collapsible trigger="Notifications" value="notifications">
				<Text type="body" color="secondary">
					Choose which email and push notifications you want to receive.
				</Text>
			</Collapsible>
			<Collapsible trigger="Privacy" value="privacy">
				<Text type="body" color="secondary">
					Manage your data sharing preferences and account visibility.
				</Text>
			</Collapsible>
		</VStack>
	</CollapsibleGroup>
</Card>
