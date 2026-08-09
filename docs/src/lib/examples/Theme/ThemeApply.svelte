<!--
	Ported from upstream's `templates/blocks/components/Theme/ThemeApply.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Heading, Section, Stack, Text, Theme } from '@astryx-svelte/core';
	import { defineTheme } from '@astryx-svelte/core/theme';

	const forestTheme = defineTheme({
		name: 'forest-docs',
		tokens: {
			'--color-accent': ['#15803D', '#86EFAC'],
			'--color-background-card': ['#FFFFFF', '#0F3D24'],
			'--color-text-primary': ['#052E16', '#DCFCE7'],
			'--color-text-secondary': ['#166534', '#BBF7D0'],
			'--color-border': ['#BBF7D0', '#15803D66']
		}
	});
</script>

<Section variant="muted" padding={4} maxWidth={420}>
	<Theme theme={forestTheme}>
		<Card padding={4} width="100%">
			<Stack direction="vertical" gap={3}>
				<Heading level={4}>Forest workspace</Heading>
				<Text type="body" color="secondary">Wrap any subtree to apply a theme locally.</Text>
				<Button label="Create project" />
			</Stack>
		</Card>
	</Theme>
</Section>
