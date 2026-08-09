<!--
	Ported from upstream's `templates/blocks/components/CollapsibleGroup/CollapsibleGroupShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Center, Collapsible, CollapsibleGroup, Text, VStack } from '@astryx-svelte/core';
</script>

<Center width={400}>
	<CollapsibleGroup type="single" defaultValue="shipping">
		<VStack gap={2} width="100%">
			<Card>
				<Collapsible trigger="Shipping Information" value="shipping">
					<Text type="body" color="secondary">
						Standard shipping takes 3–5 business days. Express shipping is available for an
						additional fee.
					</Text>
				</Collapsible>
			</Card>
			<Card>
				<Collapsible trigger="Return Policy" value="returns">
					<Text type="body" color="secondary">
						Items can be returned within 30 days of purchase. Items must be unused and in original
						packaging.
					</Text>
				</Collapsible>
			</Card>
			<Card>
				<Collapsible trigger="Payment Methods" value="payment">
					<Text type="body" color="secondary">
						We accept all major credit cards, PayPal, and bank transfers.
					</Text>
				</Collapsible>
			</Card>
		</VStack>
	</CollapsibleGroup>
</Center>
