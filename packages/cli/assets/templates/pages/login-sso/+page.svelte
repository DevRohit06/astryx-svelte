<!--
	Ported from upstream's `assets/templates/pages/login-sso/page.tsx`.
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
		Avatar,
		Button,
		Card,
		Center,
		Divider,
		HStack,
		Icon,
		Link,
		Section,
		Text,
		TextInput,
		VStack
	} from '@astryx-svelte/core';
	import { ShieldCheckIcon } from '@fvilers/heroicons-svelte/24/outline';

	// -------------------------------------------------------------------------
	// Styles
	// -------------------------------------------------------------------------

	const BG_URL = 'https://lookaside.facebook.com/assets/astryx/building.png';

	const pageStyle =
		`min-height: 100%; background-image: url(${BG_URL}); background-size: cover; ` +
		'background-position: center; padding: var(--spacing-6);';

	type SSOProvider = {
		name: string;
		abbr: string;
	};
	const SSO_PROVIDERS: Record<string, SSOProvider> = {
		'google.com': { name: 'Google Workspace', abbr: 'G' },
		'microsoft.com': { name: 'Microsoft Entra ID', abbr: 'M' },
		'okta.com': { name: 'Okta', abbr: 'O' },
		'meta.com': { name: 'Meta SSO', abbr: 'M' },
		'apple.com': { name: 'Apple Business', abbr: 'A' }
	};

	function getProvider(email: string) {
		const domain = email.split('@')[1]?.toLowerCase();
		return domain ? (SSO_PROVIDERS[domain] ?? null) : null;
	}

	function isValidEmail(email: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	// -------------------------------------------------------------------------
	// Component
	// -------------------------------------------------------------------------

	type Step = 'email' | 'sso-confirm' | 'password-fallback';

	let step = $state<Step>('email');
	let email = $state('');
	let password = $state('');
	let loginFailed = $state(false);
	let isLoading = $state(false);

	const provider = $derived(getProvider(email));
	const emailValid = $derived(isValidEmail(email));

	function handleContinue() {
		if (!emailValid) {
			return;
		}
		if (provider) {
			step = 'sso-confirm';
		} else {
			step = 'password-fallback';
		}
	}

	function handleBack() {
		step = 'email';
		loginFailed = false;
		isLoading = false;
	}

	function handleSignIn() {
		if (!password) {
			loginFailed = true;
			return;
		}
		isLoading = true;
		loginFailed = false;
		setTimeout(() => {
			isLoading = false;
			loginFailed = true;
		}, 2000);
	}
</script>

<Center axis="both" style={pageStyle}>
	<Card padding={8} width="100%" maxWidth={400}>
		<VStack gap={4} hAlign="stretch">
			<!-- ── Step 1: Email entry ── -->
			{#if step === 'email'}
				<VStack gap={1} hAlign="center">
					<Text type="display-1" as="h2">Welcome back</Text>
					<Text type="body" color="secondary" size="sm">
						Enter your details to sign in to your account
					</Text>
				</VStack>

				<VStack gap={2}>
					<TextInput
						label="Work email"
						isLabelHidden
						type="email"
						placeholder="you@company.com"
						value={email}
						onChange={(value) => (email = value)}
						size="lg"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								handleContinue();
							}
						}}
					/>
					<TextInput
						label="Password"
						isLabelHidden
						type="password"
						placeholder="Password"
						value={password}
						onChange={(value) => (password = value)}
						size="lg"
					/>
				</VStack>

				<Link href="#" size="sm" color="secondary" type="supporting">
					Having trouble signing in?
				</Link>

				<Button
					label="Sign in"
					variant="primary"
					size="lg"
					onclick={handleContinue}
					isDisabled={!emailValid}
				/>

				<Divider label="Or sign in with" />

				<Button
					label="Continue with SSO"
					variant="secondary"
					size="lg"
					onclick={handleContinue}
					isDisabled={!emailValid}
				/>

				<VStack hAlign="center">
					<Text type="supporting" color="secondary">
						Don't have an account? <Link href="#" type="supporting">Request access</Link>
					</Text>
				</VStack>
			{/if}

			<!-- ── Step 2a: SSO provider detected ── -->
			{#if step === 'sso-confirm' && provider}
				<VStack gap={2} hAlign="center">
					<Avatar name={provider.name} size={48} />
					<Text type="display-3" as="h2">Sign in with {provider.name}</Text>
					<Text type="body" color="secondary" size="sm">
						You will be redirected back after signing in.
					</Text>
				</VStack>

				<Card padding={0}>
					<Section variant="muted" padding={4}>
						<HStack gap={2} vAlign="center">
							<Icon icon={ShieldCheckIcon} color="secondary" />
							<VStack gap={0}>
								<Text type="label">{provider.name}</Text>
								<Text type="supporting" color="secondary">{email}</Text>
							</VStack>
						</HStack>
					</Section>
				</Card>

				<VStack gap={3}>
					<Button
						label={`Continue with ${provider.name}`}
						variant="primary"
						size="lg"
						isLoading={isLoading}
						onclick={() => (isLoading = true)}
					/>
					<Button label="Use a different email" variant="ghost" size="lg" onclick={handleBack} />
				</VStack>
			{/if}

			<!-- ── Step 2b: No SSO — password fallback ── -->
			{#if step === 'password-fallback'}
				<VStack gap={1} hAlign="center">
					<Text type="display-1" as="h2">Welcome back</Text>
					<Text type="body" color="secondary" size="sm">{email}</Text>
				</VStack>

				<VStack gap={4}>
					<VStack gap={1}>
						<TextInput
							label="Password"
							type="password"
							value={password}
							size="lg"
							onChange={(v) => {
								password = v;
								loginFailed = false;
							}}
							status={loginFailed
								? { type: 'error', message: 'Incorrect password. Try again.' }
								: undefined}
						/>
						{#if loginFailed}
							<VStack hAlign="end">
								<Link href="#" size="sm" color="secondary" type="supporting">
									Forgot password?
								</Link>
							</VStack>
						{/if}
					</VStack>

					<Button
						label="Sign in"
						variant="primary"
						size="lg"
						isLoading={isLoading}
						onclick={handleSignIn}
					/>
					<Button label="Use a different email" variant="ghost" size="lg" onclick={handleBack} />
				</VStack>
			{/if}
		</VStack>
	</Card>
</Center>
