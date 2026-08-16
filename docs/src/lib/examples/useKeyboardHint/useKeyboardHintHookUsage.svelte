<!--
	Ported from upstream's `templates/blocks/components/Hooks/useKeyboardHintHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Icon, Section, Text, Toolbar, VStack } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Bold`/`Italic`/`Underline`; the registry ships
	 * none of them, so each substitutes a built-in that stays distinguishable from
	 * its siblings — the block is about the toolbar's keyboard hint, not the
	 * glyphs. Retires with the icon registry (port/todo.md).
	 */
</script>

{#snippet boldIcon()}<Icon icon="check" />{/snippet}
{#snippet italicIcon()}<Icon icon="info" />{/snippet}
{#snippet underlineIcon()}<Icon icon="arrowDown" />{/snippet}

<Card style="width: 420px">
	<Toolbar label="Text formatting" dividers={['bottom']}>
		{#snippet startContent()}
			<Button label="Bold" variant="ghost" icon={boldIcon} isIconOnly />
			<Button label="Italic" variant="ghost" icon={italicIcon} isIconOnly />
			<Button label="Underline" variant="ghost" icon={underlineIcon} isIconOnly />
		{/snippet}
	</Toolbar>
	<Section>
		<VStack gap={1}>
			<Text type="body" weight="bold">Keyboard-friendly by default</Text>
			<Text type="supporting" color="secondary">
				Tab into the toolbar with your keyboard and Toolbar shows an ephemeral "← → to navigate"
				hint — powered by useKeyboardHint — so sighted keyboard users learn that arrows move within
				the group.
			</Text>
		</VStack>
	</Section>
</Card>
