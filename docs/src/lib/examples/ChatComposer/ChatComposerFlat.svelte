<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerFlat.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Icons are registry substitutions, exactly as `ChatComposerFooterActions`
	makes them: `SparklesIcon` → `wrench`, `Cog6ToothIcon` → `wrench`,
	`MicrophoneIcon` → `microphone`, which is exact. Retires with the icon
	registry (TODO.md).

	`elevation="none"` is not "the same surface, less shadow": it draws a real
	border and re-insets the body padding by the border width, so content
	geometry does not shift between the two tiers.
-->
<script lang="ts">
	import { Button, ChatComposer, DropdownMenu, Icon, Stack, Text } from '@astryx-svelte/core';
</script>

{#snippet sparklesIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet settingsIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet microphoneIcon()}<Icon icon="microphone" />{/snippet}

{#snippet autoLabel()}Auto{/snippet}
{#snippet settingsLabel()}Settings{/snippet}

{#snippet footerActions()}
	<DropdownMenu
		button={{
			label: 'Auto',
			variant: 'ghost',
			size: 'md',
			icon: sparklesIcon,
			children: autoLabel
		}}
		menuWidth={200}
		items={[
			{ label: 'Auto', onClick: () => {} },
			{ label: 'Model A', onClick: () => {} },
			{ label: 'Model B', onClick: () => {} }
		]}
	/>
	<DropdownMenu
		button={{
			label: 'Settings',
			variant: 'ghost',
			size: 'md',
			icon: settingsIcon,
			children: settingsLabel
		}}
		menuWidth={200}
		items={[
			{ label: 'Preferences', onClick: () => {} },
			{ label: 'Keyboard shortcuts', onClick: () => {} },
			{ label: 'About', onClick: () => {} }
		]}
	/>
{/snippet}

{#snippet sendActions()}
	<Button label="Microphone" variant="ghost" size="md" icon={microphoneIcon} isIconOnly />
{/snippet}

<Stack direction="vertical" gap={2} style="width: 450px; max-width: 100%">
	<Text type="supporting" color="secondary">
		elevation="none" — flat, with a text-input-style border and focus ring
	</Text>
	<ChatComposer
		elevation="none"
		onSubmit={(value) => {
			console.log('Sent:', value);
		}}
		{footerActions}
		{sendActions}
	/>
</Stack>
