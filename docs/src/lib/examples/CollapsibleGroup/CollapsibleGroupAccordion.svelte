<!--
	Ported from upstream's `templates/blocks/components/CollapsibleGroup/CollapsibleGroupAccordion.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Collapsible, CollapsibleGroup, Text, VStack } from '@astryx-svelte/core';
</script>

<CollapsibleGroup type="single" defaultValue="account">
	<VStack gap={2} width="100%">
		<Collapsible trigger="Account" value="account">
			<Text type="body" color="secondary">
				Manage your profile details, email address, and password.
			</Text>
		</Collapsible>
		<Collapsible trigger="Notifications" value="notifications">
			<Text type="body" color="secondary">
				Choose which activity triggers email and push notifications.
			</Text>
		</Collapsible>
		<Collapsible trigger="Billing" value="billing">
			<Text type="body" color="secondary">View invoices and update your payment method.</Text>
		</Collapsible>
	</VStack>
</CollapsibleGroup>
