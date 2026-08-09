<!--
	Ported from upstream's `templates/blocks/components/ToggleButton/ToggleButtonColor.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Text, ToggleButton } from '@astryx-svelte/core';

	/**
	 * Upstream pairs each button's outline Heroicon with its solid counterpart
	 * (`Bold`, `Italic`, `Underline`, `Star`, `Heart`, `Bookmark`) and reuses one
	 * glyph for the rest. The registry ships none of those pairs, so each button
	 * substitutes a built-in and keeps it across both states — the block's point is
	 * the *pressed colour*, which is transcribed exactly (`accent`/`yellow`/`red`/
	 * `blue`). Retires with the icon registry (TODO.md).
	 */

	let toolbar = $state<Record<string, boolean>>({
		bold: true,
		italic: false,
		underline: true,
		strikethrough: false,
		link: false
	});
	const toggleToolbar = (key: string) => (toolbar = { ...toolbar, [key]: !toolbar[key] });

	let reactions = $state<Record<string, boolean>>({
		star: false,
		heart: false,
		bookmark: true,
		bell: false
	});
	const toggleReaction = (key: string) => (reactions = { ...reactions, [key]: !reactions[key] });
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Toolbar</Text>
		<Stack direction="horizontal" gap={1}>
			<ToggleButton
				label="Bold"
				isPressed={toolbar.bold}
				onPressedChange={() => toggleToolbar('bold')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="check" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="check" color="accent" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Italic"
				isPressed={toolbar.italic}
				onPressedChange={() => toggleToolbar('italic')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="info" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="info" color="accent" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Underline"
				isPressed={toolbar.underline}
				onPressedChange={() => toggleToolbar('underline')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="arrowDown" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="arrowDown" color="accent" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Strikethrough"
				isPressed={toolbar.strikethrough}
				onPressedChange={() => toggleToolbar('strikethrough')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="close" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="close" color="accent" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Link"
				isPressed={toolbar.link}
				onPressedChange={() => toggleToolbar('link')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="externalLink" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="externalLink" color="accent" />{/snippet}
			</ToggleButton>
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Reactions</Text>
		<Stack direction="horizontal" gap={2}>
			<ToggleButton
				label="Star"
				isPressed={reactions.star}
				onPressedChange={() => toggleReaction('star')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="success" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="success" color="yellow" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Like"
				isPressed={reactions.heart}
				onPressedChange={() => toggleReaction('heart')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="error" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="error" color="red" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Save"
				isPressed={reactions.bookmark}
				onPressedChange={() => toggleReaction('bookmark')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="copy" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="copy" color="blue" />{/snippet}
			</ToggleButton>
			<ToggleButton
				label="Follow"
				isPressed={reactions.bell}
				onPressedChange={() => toggleReaction('bell')}
				isIconOnly
			>
				{#snippet icon()}<Icon icon="warning" color="secondary" />{/snippet}
				{#snippet pressedIcon()}<Icon icon="warning" color="accent" />{/snippet}
			</ToggleButton>
		</Stack>
	</Stack>
</Stack>
