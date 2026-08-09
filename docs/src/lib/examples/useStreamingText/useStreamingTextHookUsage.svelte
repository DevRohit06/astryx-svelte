<!--
	Ported from upstream's `templates/blocks/components/Hooks/useStreamingTextHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The hook's arguments are **getters** here and its result is an object with a
	live `current`, which is this port's standing shape for a hook whose return
	value has to stay reactive across a component's lifetime (`useThemeMode`,
	`useMediaQuery`). Same three arguments, same order, same values.
-->
<script lang="ts">
	import { Card, Text, useStreamingText, VStack } from '@astryx-svelte/core';

	const response = 'Astryx hooks keep behavior reusable while components keep visuals consistent.';

	const displayedText = useStreamingText(
		() => response,
		() => false,
		() => ({ speed: 'fast' })
	);
</script>

<Card width={420} padding={4}>
	<VStack gap={2}>
		<Text type="body" weight="bold">Assistant response</Text>
		<Text type="body">{displayedText.current}</Text>
		<Text type="supporting" color="secondary">Complete</Text>
	</VStack>
</Card>
