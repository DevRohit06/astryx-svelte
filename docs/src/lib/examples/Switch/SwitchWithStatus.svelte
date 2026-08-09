<!--
	Ported from upstream's `templates/blocks/components/Switch/SwitchWithStatus.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Switch, VStack } from '@astryx-svelte/core';

	let terms = $state(false);
	let sharing = $state(true);
	let twoFactor = $state(true);
</script>

<Center width={400}>
	<VStack gap={6} width="100%" style="max-width: 400px">
		<Switch
			label="Accept terms and conditions"
			value={terms}
			onChange={(next) => (terms = next)}
			isRequired
			status={{ type: 'error', message: 'You must accept the terms to continue' }}
		/>
		<Switch
			label="Share usage data"
			description="Help us improve by sharing anonymous usage statistics"
			value={sharing}
			onChange={(next) => (sharing = next)}
			status={{ type: 'warning', message: 'This data may be shared with partners' }}
		/>
		<Switch
			label="Two-factor authentication"
			value={twoFactor}
			onChange={(next) => (twoFactor = next)}
			status={{ type: 'success', message: 'Your account is now more secure' }}
		/>
	</VStack>
</Center>
