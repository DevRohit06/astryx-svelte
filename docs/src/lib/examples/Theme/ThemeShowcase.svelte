<!--
	Ported from upstream's `templates/blocks/components/Theme/ThemeShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Badge,
		Button,
		Card,
		Grid,
		Heading,
		Section,
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
</script>

{#snippet themeCard(label: string)}
	<Card padding={4} width="100%">
		<Stack direction="vertical" gap={3}>
			<Stack direction="horizontal" gap={2} vAlign="center">
				<Heading level={4}>{label}</Heading>
				<Badge label="Active" variant="success" />
			</Stack>
			<Text type="body" color="secondary">
				The same content inherits this provider's colors, typography, radius, and component
				treatment.
			</Text>
			<Stack direction="horizontal" gap={2} wrap="wrap">
				<Button label="Primary" variant="primary" size="sm" />
				<Button label="Secondary" variant="secondary" size="sm" />
				<Button label="Ghost" variant="ghost" size="sm" />
			</Stack>
		</Stack>
	</Card>
{/snippet}

<Section variant="muted" padding={4} maxWidth={600}>
	<Grid columns={{ minWidth: 240, repeat: 'fit' }} gap={3} width="100%">
		<Theme theme={warmTheme}>
			{@render themeCard('Warm')}
		</Theme>
		<Theme theme={forestTheme}>
			{@render themeCard('Forest')}
		</Theme>
	</Grid>
</Section>
