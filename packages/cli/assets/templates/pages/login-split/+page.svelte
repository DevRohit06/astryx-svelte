<!--
	Ported from upstream's `assets/templates/pages/login-split/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `SquaresPlusIcon` → `stop`, `CheckCircleIcon` →
	`success`. Only `success` is a true match; the registry has no squares/plus
	glyph, so the logo reuses the `stop` square the repo already stands in for
	`CubeIcon` in the sibling Login templates. Retires with the icon registry
	(TODO.md).
-->
<script lang="ts">
	import {
		Button,
		Card,
		Center,
		Divider,
		EmptyState,
		Grid,
		HStack,
		Icon,
		Link,
		Section,
		StackItem,
		Text,
		TextInput,
		VStack
	} from '@astryx-svelte/core';

	const COVER_IMAGE_URL =
		'https://lookaside.facebook.com/assets/astryx/light-working-vertical-1.png';
	const APPLE_LOGO_URL = 'https://lookaside.facebook.com/assets/astryx/AppleLogo.png';
	const GOOGLE_LOGO_URL = 'https://lookaside.facebook.com/assets/astryx/GoogleLogo.png';

	// Grid emits minmax(MIN, 1fr) where MIN is a hard floor, so MIN plus the
	// grid inset and page padding must fit the narrowest phone or the column is
	// clipped. 320 − 2×24 (page) − 2×16 (stacked inset) = 240.
	const COLUMN_MIN_WIDTH = 240;
	// repeat:'fit' (auto-fit) collapses the two columns to one — expanding to fill —
	// below 2×MIN + 32(gap) = 512px. The container query reorders the image and
	// tightens the inset at that same point, keyed to the card width (not the
	// window) so it never desyncs.
	// minHeight:100% fills the host so the centered card never leaves an unpainted
	// band; padding keeps it off the surface edges.
	const pageStyle =
		'min-height: 100%; background-color: var(--color-background-body); padding: var(--spacing-6);';
	const cardWrap = 'width: 100%; max-width: 1000px; margin-inline: auto;';
	const coverImage = 'width: 100%; height: 100%; object-fit: cover;';

	let email = $state('');
	let password = $state('');
	let loginFailed = $state(false);
	let isLoading = $state(false);
	let isSuccess = $state(false);

	function handleLogin() {
		if (!email || !password) {
			loginFailed = true;
			return;
		}
		isLoading = true;
		loginFailed = false;
		setTimeout(() => {
			isLoading = false;
			isSuccess = true;
		}, 2000);
	}
</script>

{#snippet successIcon()}
	<Icon icon="success" size="lg" />
{/snippet}

{#snippet appleLogo()}
	<img src={APPLE_LOGO_URL} alt="" width="16" height="16" />
{/snippet}

{#snippet googleLogo()}
	<img src={GOOGLE_LOGO_URL} alt="" width="16" height="16" />
{/snippet}

<Center axis="both" style={pageStyle}>
	<VStack gap={4} width="100%">
		<div style={cardWrap}>
			<Card padding={0} width="100%">
				<Grid
					columns={{ minWidth: COLUMN_MIN_WIDTH, repeat: 'fit' }}
					gap={8}
					align="stretch"
					class="login-split-grid"
				>
					<!-- Form -->
					<Section variant="transparent" padding={0} height="100%">
						<VStack gap={4} height="100%">
							<HStack gap={2} vAlign="center">
								<Icon icon="stop" />
								<Text type="body" weight="bold">Product Inc.</Text>
							</HStack>

							<StackItem size="fill">
								<Center axis="vertical" height="100%">
									{#if isSuccess}
										<EmptyState
											title="You're signed in"
											description="Redirecting to your dashboard…"
											icon={successIcon}
										/>
									{:else}
										<VStack gap={4} hAlign="stretch" width="100%">
											<VStack gap={1}>
												<Text type="display-1" as="h2">Welcome back</Text>
												<Text type="body" color="secondary" size="sm">
													Login to your Product Inc. account
												</Text>
											</VStack>

											<VStack gap={2}>
												<TextInput
													label="Email"
													isLabelHidden
													type="email"
													placeholder="name@company.com"
													value={email}
													onChange={(value) => (email = value)}
													size="lg"
												/>
												<VStack gap={1}>
													<TextInput
														label="Password"
														isLabelHidden
														placeholder="Enter your password"
														type="password"
														value={password}
														onChange={(v) => {
															password = v;
															loginFailed = false;
														}}
														size="lg"
														status={loginFailed
															? { type: 'error', message: 'Incorrect password. Try again.' }
															: undefined}
													/>
													{#if loginFailed}
														<VStack hAlign="end">
															<Link href="#" size="sm" color="secondary" type="supporting">
																Forgot your password?
															</Link>
														</VStack>
													{/if}
												</VStack>
											</VStack>

											<Button
												label="Login"
												variant="primary"
												size="lg"
												isLoading={isLoading}
												onclick={handleLogin}
											/>

											<Divider label="Or continue with" />

											<Grid columns={2} gap={3} justify="stretch">
												<Button label="Apple" variant="secondary" icon={appleLogo} size="lg" />
												<Button label="Google" variant="secondary" icon={googleLogo} size="lg" />
											</Grid>
										</VStack>
									{/if}
								</Center>
							</StackItem>

							{#if !isSuccess}
								<Text type="supporting" color="secondary">
									Don't have an account? <Link href="#" type="supporting">Sign up</Link>
								</Text>
							{/if}
						</VStack>
					</Section>

					<!-- Cover image — the transparent Card clips it to rounded
					     corners (overflow:clip + radius), so the image needs no radius. -->
					<div class="login-split-image">
						<Card variant="transparent" padding={0} width="100%" height="100%">
							<img style={coverImage} src={COVER_IMAGE_URL} alt="Two people working at a desk" />
						</Card>
					</div>
				</Grid>
			</Card>
		</div>

		<VStack hAlign="center">
			<Text type="supporting" color="secondary">
				By clicking continue, you agree to our
				<Link href="#" type="supporting">Terms of Service</Link>
				and
				<Link href="#" type="supporting">Privacy Policy</Link>.
			</Text>
		</VStack>
	</VStack>
</Center>

<!--
	Upstream inlines this as a plain `<style>{LOGIN_SPLIT_CSS}</style>` element
	inside the page, so the container query needs NO CSS compiler. Svelte's
	component `<style>` block is the same thing and must sit at the top level of
	the file, which is the one structural difference from upstream's tree.

	- Pad the grid, not the Card: the form's Section escapes Card's
	  --container-padding-* vars, which would cancel the inset on the form side.
	  container-type makes the grid the query container for the stack point.
	- repeat:'fit' (auto-fit) collapses the two columns to one below 511px; the
	  query reorders the image (order:-1) and tightens the inset at that point,
	  keyed to the card width (not the window) so it never desyncs.

	`.login-split-grid` lands on a COMPONENT (`Grid`), and Svelte's scoper only
	rewrites selectors it can match against an element in this template — a class
	passed to a component is left alone and the rule would be pruned as unused.
	`:global()` is therefore required there, and it also matches upstream, whose
	raw `<style>` tag is global to begin with. `.login-split-image` is a real
	element here, so it scopes normally.
-->
<style>
	:global(.login-split-grid) {
		container-type: inline-size;
		container-name: login-split;
		padding: var(--spacing-8);
	}

	.login-split-image {
		width: 100%;
		order: 0;
	}

	@container login-split (max-width: 511px) {
		:global(.login-split-grid) {
			padding: var(--spacing-4);
		}

		.login-split-image {
			order: -1;
		}
	}
</style>
