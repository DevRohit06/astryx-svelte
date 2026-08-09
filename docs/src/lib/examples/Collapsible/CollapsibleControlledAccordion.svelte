<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleControlledAccordion.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Collapsible, CollapsibleGroup, Text, VStack } from '@astryx-svelte/core';

	let open = $state<string | string[]>('profile');
</script>

<CollapsibleGroup type="single" value={open} onChange={(next) => (open = next)}>
	<VStack gap={2} style="width: 100%; max-width: 400px">
		<Card>
			<Collapsible trigger="Profile Information" value="profile">
				<Text type="body">
					Update your name, email, and profile photo. Changes are saved automatically.
				</Text>
			</Collapsible>
		</Card>
		<Card>
			<Collapsible trigger="Security" value="security">
				<Text type="body">
					Manage two-factor authentication, active sessions, and login history.
				</Text>
			</Collapsible>
		</Card>
		<Card>
			<Collapsible trigger="Billing" value="billing">
				<Text type="body">
					View invoices, update payment method, and manage your subscription plan.
				</Text>
			</Collapsible>
		</Card>
	</VStack>
</CollapsibleGroup>
