<!--
	Ported from upstream's `templates/blocks/components/Collapsible/CollapsibleDividedAccordion.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Collapsible, CollapsibleGroup, Text } from '@astryx-svelte/core';
</script>

<div style="width: 100%; max-width: 400px">
	<CollapsibleGroup type="single" hasDividers defaultValue="reset">
		<Collapsible trigger="How do I reset my password?" value="reset">
			<Text type="body">
				Go to Settings → Security → Change Password. You'll receive a confirmation email within a
				few minutes.
			</Text>
		</Collapsible>
		<Collapsible trigger="Can I change my username?" value="username">
			<Text type="body">
				Usernames can be changed once every 30 days from your profile settings.
			</Text>
		</Collapsible>
		<Collapsible trigger="How do I delete my account?" value="delete">
			<Text type="body">
				Account deletion is permanent. Your data will be removed within 30 days.
			</Text>
		</Collapsible>
	</CollapsibleGroup>
</div>
