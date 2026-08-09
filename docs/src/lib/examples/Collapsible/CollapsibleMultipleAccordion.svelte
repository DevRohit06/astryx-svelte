<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleMultipleAccordion.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Collapsible, CollapsibleGroup, Text, VStack } from '@astryx-svelte/core';
</script>

<CollapsibleGroup type="multiple" defaultValue={['features', 'pricing']}>
	<VStack gap={2} style="width: 100%; max-width: 400px">
		<Card>
			<Collapsible trigger="Features" value="features">
				<Text type="body">
					Includes real-time collaboration, version history, and granular permissions for teams of
					any size.
				</Text>
			</Collapsible>
		</Card>
		<Card>
			<Collapsible trigger="Pricing" value="pricing">
				<Text type="body">
					Free for up to 5 users. Pro plans start at $12/user/month with annual billing.
				</Text>
			</Collapsible>
		</Card>
		<Card>
			<Collapsible trigger="Integrations" value="integrations">
				<Text type="body">
					Connect with Slack, GitHub, Jira, and 40+ other tools through our REST API and pre-built
					connectors.
				</Text>
			</Collapsible>
		</Card>
	</VStack>
</CollapsibleGroup>
