<!--
	Ported from upstream's `templates/blocks/components/Theme/useThemeHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, HStack, Text, useTheme, VStack } from '@astryx-svelte/core';

	/**
	 * Upstream destructures `{name, mode, token}`. `UseThemeReturn` exposes `name`
	 * and `mode` as getters here, so destructuring would snapshot them and the
	 * heading would stop tracking a theme change — the object is kept and the
	 * resolved colours are `$derived`.
	 */
	const theme = useTheme();

	const accent = $derived(theme.token('--color-accent'));
	const muted = $derived(theme.token('--color-accent-muted'));
	const text = $derived(theme.token('--color-text-primary'));
</script>

<Card width={360} padding={4}>
	<VStack gap={3}>
		<Text type="body" weight="bold">{theme.name} · {theme.mode}</Text>
		<svg width="300" height="120" role="img" aria-label="Themed bar chart">
			<rect x="24" y="20" width="64" height="80" rx="8" fill={accent} />
			<rect x="118" y="48" width="64" height="52" rx="8" fill={muted} />
			<rect x="212" y="32" width="64" height="68" rx="8" fill={accent} opacity="0.72" />
			<text x="24" y="114" fill={text} font-size="12">Resolved token values</text>
		</svg>
		<HStack gap={2}>
			<Text type="code">--color-accent</Text>
			<Text type="code" color="secondary">{accent}</Text>
		</HStack>
	</VStack>
</Card>
