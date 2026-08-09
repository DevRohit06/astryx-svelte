<!--
	Ported from upstream's `templates/blocks/components/Theme/ThemeSwitcher.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Heading,
		Section,
		Selector,
		Stack,
		Text,
		Theme
	} from '@astryx-svelte/core';
	import { defineTheme } from '@astryx-svelte/core/theme';

	const warmTheme = defineTheme({
		name: 'warm-docs',
		tokens: {
			'--color-accent': ['#D97706', '#FBBF24'],
			'--color-background-surface': ['#FFF7ED', '#1F1300'],
			'--color-background-card': ['#FFFBEB', '#2A1A05'],
			'--color-text-primary': ['#3B2F15', '#FEF3C7'],
			'--color-text-secondary': ['#92400E', '#FCD34D'],
			'--color-border': ['#FED7AA', '#92400E66'],
			'--radius-container': '20px'
		}
	});

	const forestTheme = defineTheme({
		name: 'forest-docs',
		tokens: {
			'--color-accent': ['#15803D', '#86EFAC'],
			'--color-background-surface': ['#F0FDF4', '#052E16'],
			'--color-background-card': ['#FFFFFF', '#0F3D24'],
			'--color-text-primary': ['#052E16', '#DCFCE7'],
			'--color-text-secondary': ['#166534', '#BBF7D0'],
			'--color-border': ['#BBF7D0', '#15803D66'],
			'--radius-container': '8px'
		}
	});

	const themes = {
		Warm: warmTheme,
		Forest: forestTheme
	};

	type ThemeName = keyof typeof themes;

	let themeName = $state<ThemeName>('Warm');
</script>

<Section variant="muted" padding={4} maxWidth={420}>
	<Stack direction="vertical" gap={3}>
		<Selector
			label="Theme"
			value={themeName}
			options={Object.keys(themes)}
			onChange={(next: string) => (themeName = next as ThemeName)}
		/>
		<Theme theme={themes[themeName]}>
			<Card padding={4} width="100%">
				<Stack direction="vertical" gap={3}>
					<Heading level={4}>{themeName} preview</Heading>
					<Text type="body" color="secondary">
						Switching the theme object updates all tokens and component styles below the provider.
					</Text>
					<Button label="Save changes" />
				</Stack>
			</Card>
		</Theme>
	</Stack>
</Section>
