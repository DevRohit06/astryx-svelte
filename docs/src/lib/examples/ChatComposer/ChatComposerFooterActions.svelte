<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerFooterActions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `SparklesIcon` → `wrench`, `Cog6ToothIcon` →
	`wrench` (upstream's own settings glyph, and the substitution the AppShell
	blocks already make), `MicrophoneIcon` → `microphone`, which is exact.
	Retires with the icon registry (TODO.md).

	`DropdownMenu`'s `button` takes `ButtonProps` on both sides, so its `icon`
	is a snippet here and `children` — the visible label — stays a string.
-->
<script lang="ts">
	import { Button, ChatComposer, DropdownMenu, Icon, Stack, Text } from '@astryx-svelte/core';
</script>

{#snippet sparklesIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet settingsIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet microphoneIcon()}<Icon icon="microphone" />{/snippet}

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
			{ label: 'Model B', onClick: () => {} },
			{ label: 'Model C', onClick: () => {} }
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

{#snippet autoLabel()}Auto{/snippet}
{#snippet settingsLabel()}Settings{/snippet}

{#snippet sendActions()}
	<Button label="Microphone" variant="ghost" size="md" icon={microphoneIcon} isIconOnly />
{/snippet}

<Stack direction="vertical" gap={4} style="width: 100%; max-width: 450px">
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Model selector and settings dropdowns</Text>
		<ChatComposer
			onSubmit={(value) => {
				console.log('Sent:', value);
			}}
			{footerActions}
			{sendActions}
		/>
	</Stack>
</Stack>
