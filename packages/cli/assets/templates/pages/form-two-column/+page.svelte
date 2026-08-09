<!--
	Ported from upstream's `assets/templates/pages/form-two-column/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream's two `CSSProperties` objects become `style` strings under the same
	const names, because Svelte's `style` prop is a string. `useState` →
	`$state`; the render-time `errors` expression → `$derived`; the two
	`setX(prev => …)` updaters → the equivalent assignments.
-->
<script lang="ts">
	/**
	 * Form (Two-column) — marketing contact form template.
	 *
	 * Layout:
	 *   Top: two-column — left has headline + description + illustration,
	 *        right has the contact form on a card.
	 *   Bottom: three-column contact info strip.
	 *   Mobile (<768px): single column stack.
	 */

	import {
		AspectRatio,
		Button,
		Card,
		Center,
		Divider,
		Grid,
		HStack,
		Link,
		Section,
		Selector,
		Text,
		TextArea,
		TextInput,
		Token,
		VStack
	} from '@astryx-svelte/core';

	const ILLUSTRATION_URL =
		'https://lookaside.facebook.com/assets/astryx/light-working-vertical-2.png';

	const INQUIRY_REASONS = [
		'New business',
		'General inquiry',
		'Press & media',
		'Partnerships',
		'Product feedback',
		'Technical support',
		'Other'
	];

	const BUDGET_OPTIONS = [
		'Under $10k',
		'$10k – $50k',
		'$50k – $100k',
		'$100k – $500k',
		'$500k+',
		'Not sure yet'
	];

	const CONTACT_COLUMNS = [
		{ label: 'General inquiries', email: 'hello@company.com' },
		{ label: 'New business', email: 'newbiz@company.com' },
		{ label: 'Press & partnerships', email: 'press@company.com' }
	];

	// AspectRatio has no objectFit/radius prop and there's no Image primitive
	// (#2582), so the cover photo is styled directly. overflow:hidden masks the
	// cover crop to the rounded corners.
	const pageStyle = 'min-height: 100%;';
	const illustrationImg =
		'width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-container); overflow: hidden;';

	let fullName = $state('');
	let email = $state('');
	let company = $state('');
	let jobTitle = $state('');
	let phone = $state('');
	let inquiryReason = $state('');
	let budget = $state('');
	let details = $state('');
	let submitted = $state(false);

	const errors = $derived(
		submitted
			? {
					fullName: !fullName.trim() ? 'Required' : undefined,
					email: !email.trim() ? 'Required' : undefined,
					details: !details.trim() ? 'Required' : undefined
				}
			: {}
	);

	const handleSubmit = () => (submitted = true);
</script>

<Center style={pageStyle}>
	<Section maxWidth={1100} width="100%" padding={10} variant="transparent">
		<VStack gap={10}>
			<!-- Two-column; stacks to one column below ~520px. -->
			<Grid columns={{ minWidth: 320 }} align="center" gap={10}>
				<VStack gap={6}>
					<VStack gap={3}>
						<Text type="display-1" as="h1">Let's work together</Text>
						<Text type="body" color="secondary">
							Tell us what you're working on and we'll help you figure out the best path forward.
						</Text>
					</VStack>
					<AspectRatio ratio={4 / 3}>
						<img src={ILLUSTRATION_URL} alt="Two people working at a desk" style={illustrationImg} />
					</AspectRatio>
				</VStack>

				<Card padding={8}>
					<VStack gap={4}>
						<Text type="label">Your details</Text>
						<TextInput
							label="Full name"
							isLabelHidden
							placeholder="Full name*"
							value={fullName}
							onChange={(value) => (fullName = value)}
							status={errors.fullName ? { type: 'error', message: errors.fullName } : undefined}
						/>
						<Grid columns={{ minWidth: 180 }} gap={3}>
							<TextInput
								label="Email"
								isLabelHidden
								placeholder="Email*"
								value={email}
								onChange={(value) => (email = value)}
								status={errors.email ? { type: 'error', message: errors.email } : undefined}
							/>
							<TextInput
								label="Company name"
								isLabelHidden
								placeholder="Company name"
								value={company}
								onChange={(value) => (company = value)}
							/>
						</Grid>
						<Grid columns={{ minWidth: 180 }} gap={3}>
							<TextInput
								label="Job title"
								isLabelHidden
								placeholder="Job title"
								value={jobTitle}
								onChange={(value) => (jobTitle = value)}
							/>
							<TextInput
								label="Phone number"
								isLabelHidden
								placeholder="Phone number"
								value={phone}
								onChange={(value) => (phone = value)}
							/>
						</Grid>

						<VStack gap={2}>
							<Text type="label">What are you reaching out about?</Text>
							<HStack gap={2} wrap="wrap">
								{#each INQUIRY_REASONS as reason (reason)}
									<Token
										label={reason}
										color={inquiryReason === reason ? 'blue' : 'default'}
										onclick={() => (inquiryReason = inquiryReason === reason ? '' : reason)}
									/>
								{/each}
							</HStack>
						</VStack>
						<Selector
							label="Budget range"
							options={BUDGET_OPTIONS}
							value={budget}
							onChange={(value) => (budget = value)}
							placeholder="Select a budget range..."
						/>
						<TextArea
							label="Project details"
							isLabelHidden
							placeholder="Project details*"
							value={details}
							onChange={(value) => (details = value)}
							status={errors.details ? { type: 'error', message: errors.details } : undefined}
						/>
						<!-- hAlign="stretch" = full-width button workaround; Button
						     has no full-width prop (#2600). -->
						<VStack hAlign="stretch">
							<Button label="Let's connect" variant="primary" onclick={handleSubmit} />
						</VStack>
					</VStack>
				</Card>
			</Grid>

			<!-- Contact strip; stacks below ~440px. -->
			<VStack gap={6}>
				<Divider />
				<Grid columns={{ minWidth: 200 }} gap={6}>
					{#each CONTACT_COLUMNS as col (col.label)}
						<VStack gap={1} hAlign="center">
							<Text type="supporting" color="secondary">{col.label}</Text>
							<Link href={`mailto:${col.email}`} type="body" size="sm">{col.email}</Link>
						</VStack>
					{/each}
				</Grid>
			</VStack>
		</VStack>
	</Section>
</Center>
