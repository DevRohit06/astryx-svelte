<!--
	Ported from upstream's `assets/templates/pages/login/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here rather than inlining the SVG, so the logo is a
	registry substitution: `CubeIcon` → `stop`. A stand-in rather than a true
	match — the registry has no cube glyph and `stop` is its square — and the same
	one the demo routes make. Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import {
		Banner,
		Button,
		Card,
		Center,
		Heading,
		Icon,
		Text,
		TextInput,
		VStack
	} from '@astryx-svelte/core';

	// Standalone auth page paints its own body background (no host shell).
	const pageStyle =
		'min-height: 100%; background-color: var(--color-background-body); padding: var(--spacing-6);';
	// Cap the column at 400px but let it shrink to fit narrow screens (Stack
	// has no maxWidth prop, so it's set here).
	const contentStyle = 'width: 100%; max-width: 400px;';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');

	function handleSignIn() {
		error = '';
		if (!email || !password) {
			error = 'Please enter both email and password.';
			return;
		}
		isLoading = true;
		setTimeout(() => (isLoading = false), 2000);
	}
</script>

<Center axis="both" style={pageStyle}>
	<VStack gap={4} hAlign="center" style={contentStyle}>
		<!-- Logo -->
		<VStack gap={2} hAlign="center">
			<Icon icon="stop" size="lg" />
			<Text type="body" weight="bold" size="lg">Product Inc.</Text>
		</VStack>

		<!-- Card -->
		<Card padding={8} width="100%">
			<VStack gap={4} hAlign="stretch">
				<VStack gap={1} hAlign="center">
					<Heading level={2}>Sign in</Heading>
					<Text type="body" color="secondary" size="sm">Enter your credentials to continue</Text>
				</VStack>

				{#if error}
					<Banner status="error" title={error} container="card" />
				{/if}

				<TextInput
					label="Email"
					value={email}
					onChange={(value) => (email = value)}
					placeholder="you@example.com"
					type="email"
					size="lg"
				/>

				<TextInput
					label="Password"
					value={password}
					onChange={(value) => (password = value)}
					placeholder="Enter your password"
					type="password"
					size="lg"
				/>

				<Button
					label="Sign in"
					variant="primary"
					size="lg"
					isLoading={isLoading}
					onclick={handleSignIn}
				/>
			</VStack>
		</Card>
	</VStack>
</Center>
