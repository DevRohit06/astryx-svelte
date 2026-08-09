<!--
	Ported from upstream's `templates/blocks/components/Switch/SwitchSettingsPanel.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Switch, VStack } from '@astryx-svelte/core';

	let notifications = $state(false);
	let darkMode = $state(true);
	let autoSave = $state(false);
</script>

<Card width="100%" style="max-width: 300px">
	<VStack gap={4}>
		<Switch
			label="Enable notifications"
			value={notifications}
			onChange={(next) => (notifications = next)}
			labelPosition="start"
			labelSpacing="spread"
		/>
		<Switch
			label="Dark mode"
			value={darkMode}
			onChange={(next) => (darkMode = next)}
			labelPosition="start"
			labelSpacing="spread"
		/>
		<Switch
			label="Auto-save"
			value={autoSave}
			onChange={(next) => (autoSave = next)}
			labelPosition="start"
			labelSpacing="spread"
		/>
	</VStack>
</Card>
