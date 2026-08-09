<!--
	Ported from upstream's `templates/blocks/components/Popover/PopoverSettingsPanel.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Divider, Heading, Popover, Switch, VStack } from '@astryx-svelte/core';

	let notifications = $state(true);
	let darkMode = $state(false);
	let sounds = $state(true);
</script>

<Popover placement="below" label="Settings" width={280}>
	{#snippet content()}
		<VStack gap={3}>
			<Heading level={4}>Settings</Heading>
			<Divider />
			<Switch
				label="Notifications"
				description="Receive push notifications"
				value={notifications}
				onChange={(next) => (notifications = next)}
			/>
			<Switch
				label="Dark mode"
				description="Use dark color theme"
				value={darkMode}
				onChange={(next) => (darkMode = next)}
			/>
			<Switch
				label="Sounds"
				description="Play sounds for actions"
				value={sounds}
				onChange={(next) => (sounds = next)}
			/>
		</VStack>
	{/snippet}
	<Button label="Settings">Settings</Button>
</Popover>
