<!--
	Ported from upstream's `assets/templates/pages/login/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.
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
	import { CubeIcon } from '@fvilers/heroicons-svelte/24/outline';

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
			<Icon icon={CubeIcon} size="lg" />
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
