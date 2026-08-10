<!--
	Ported from upstream's `assets/templates/pages/contact-form/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Because of that, `WHY_US.icon` holds an `IconName` string here where
	upstream holds a component reference; `<Icon icon={item.icon} …>` is
	otherwise unchanged.

	`useState` → `$state`; the render-time `errors` expression → `$derived`;
	`toggleGoal`'s `setGoals(prev => …)` updater → the equivalent assignment.
-->
<script lang="ts">
	/**
	 * Contact Form — lead capture form template
	 */

	import {
		Banner,
		Button,
		Card,
		Center,
		CheckboxInput,
		Divider,
		Grid,
		HStack,
		Icon,
		Link,
		RadioList,
		RadioListItem,
		Section,
		Selector,
		Text,
		TextArea,
		TextInput,
		Token,
		VStack,
		type IconName
	} from '@astryx-svelte/core';

	const CAMPAIGN_GOALS = [
		'Brand Awareness',
		'Product Sampling',
		'Product Launch',
		'Event Promotion',
		'Retail / In-Store',
		'Trade Show',
		'Influencer Activation',
		'Community Building',
		'Seasonal Campaign',
		'Other'
	];

	const LAUNCH_OPTIONS = [
		'Within 30 days',
		'1–3 months',
		'3–6 months',
		'6–12 months',
		'12+ months'
	];

	const BUDGET_OPTIONS = [
		'Under $5K/mo',
		'$5K–$15K/mo',
		'$15K–$50K/mo',
		'$50K–$100K/mo',
		'$100K+/mo'
	];

	const WHY_US: { icon: IconName; title: string; description: string }[] = [
		{
			icon: 'arrowUp',
			title: 'We move fast for you',
			description: 'We cut through the noise and get straight to the work.'
		},
		{
			icon: 'wrench',
			title: 'We build around you',
			description: "We tailor everything to what you're trying to achieve."
		},
		{
			icon: 'stop',
			title: 'We show up for you',
			description: 'A dedicated team that knows your brand and wants to win.'
		}
	];

	let fullName = $state('');
	let email = $state('');
	let company = $state('');
	let phone = $state('');
	let goals = $state<string[]>([]);
	let timeline = $state('');
	let budget = $state('');
	let message = $state('');
	let hearAboutUs = $state('');
	let isDecider = $state(false);
	let submitted = $state(false);

	const errors = $derived(
		submitted
			? {
					fullName: !fullName.trim() ? 'Required' : undefined,
					email: !email.trim() ? 'Required' : undefined,
					company: !company.trim() ? 'Required' : undefined,
					phone: !phone.trim() ? 'Required' : undefined,
					goals: goals.length === 0 ? 'Pick at least one' : undefined,
					timeline: !timeline ? 'Required' : undefined,
					budget: !budget ? 'Required' : undefined
				}
			: {}
	);

	const toggleGoal = (goal: string) =>
		(goals = goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal]);
</script>

<Center axis="horizontal">
	<VStack hAlign="center" width="100%">
		<Section maxWidth={800} padding={6} paddingBlock={10} variant="section">
			<VStack gap={6}>
				<!-- Header -->
				<VStack gap={2} hAlign="center">
					<Text type="display-1" weight="bold">Let's work together</Text>
					<Text type="body" color="secondary">
						Tell us a bit about what you're working on — we'd love to help.
					</Text>
				</VStack>

				<!-- Why work with us -->
				<VStack gap={5}>
					<Grid columns={{ minWidth: 200 }} gap={4}>
						{#each WHY_US as item (item.title)}
							<Card>
								<VStack gap={3}>
									<Icon icon={item.icon} size="lg" color="accent" />
									<VStack gap={1}>
										<Text type="body" weight="bold">{item.title}</Text>
										<Text type="supporting" color="secondary">{item.description}</Text>
									</VStack>
								</VStack>
							</Card>
						{/each}
					</Grid>
				</VStack>

				<!-- Your details -->
				<VStack gap={5}>
					<Grid columns={{ minWidth: 260 }} gap={4}>
						<TextInput
							label="Full Name"
							placeholder="Full Name"
							value={fullName}
							onChange={(value) => (fullName = value)}
							status={errors.fullName ? { type: 'error', message: errors.fullName } : undefined}
						/>
						<TextInput
							label="Email"
							placeholder="you@company.com"
							value={email}
							onChange={(value) => (email = value)}
							status={errors.email ? { type: 'error', message: errors.email } : undefined}
						/>
					</Grid>
					<Grid columns={{ minWidth: 260 }} gap={4}>
						<TextInput
							label="Company"
							placeholder="Company"
							value={company}
							onChange={(value) => (company = value)}
							status={errors.company ? { type: 'error', message: errors.company } : undefined}
						/>
						<TextInput
							label="Phone"
							placeholder="Phone number"
							value={phone}
							onChange={(value) => (phone = value)}
							status={errors.phone ? { type: 'error', message: errors.phone } : undefined}
						/>
					</Grid>
				</VStack>

				<Divider />

				<!-- Your project -->
				<VStack gap={5}>
					<VStack gap={2}>
						<Text type="label" color="secondary">What are you going for?</Text>
						<HStack gap={2} wrap="wrap">
							{#each CAMPAIGN_GOALS as goal (goal)}
								<Token
									label={goal}
									color={goals.includes(goal) ? 'blue' : 'default'}
									onclick={() => toggleGoal(goal)}
								/>
							{/each}
						</HStack>
						{#if errors.goals}
							<Banner status="error" title={errors.goals} />
						{/if}
					</VStack>

					<Selector
						label="When are you thinking?"
						placeholder="When are you thinking of launching?"
						options={LAUNCH_OPTIONS}
						value={timeline}
						onChange={(value) => (timeline = value)}
						status={errors.timeline ? { type: 'error', message: errors.timeline } : undefined}
					/>

					<Selector
						label="Ballpark budget?"
						placeholder="What's your rough monthly budget?"
						options={BUDGET_OPTIONS}
						value={budget}
						onChange={(value) => (budget = value)}
						status={errors.budget ? { type: 'error', message: errors.budget } : undefined}
					/>

					<RadioList
						label="How did you hear about us?"
						value={hearAboutUs}
						onChange={(value) => (hearAboutUs = value)}
					>
						<RadioListItem label="Social media" value="social" />
						<RadioListItem label="Word of mouth" value="word-of-mouth" />
						<RadioListItem label="Search engine" value="search" />
						<RadioListItem label="Event or conference" value="event" />
						<RadioListItem label="Other" value="other" />
					</RadioList>

					<TextArea
						label="Anything else?"
						placeholder="Tell us whatever else is on your mind..."
						value={message}
						onChange={(value) => (message = value)}
					/>

					<CheckboxInput
						label="I'm a budget decision-maker"
						value={isDecider}
						onChange={(checked) => (isDecider = checked)}
					/>
				</VStack>

				<!-- Submit -->
				<VStack gap={3}>
					<Button
						label="Submit"
						variant="primary"
						size="lg"
						onclick={() => (submitted = true)}
					/>
					<HStack gap={1} hAlign="center">
						<Text type="supporting" color="secondary">
							By submitting you agree to our
							<Link href="#" type="supporting">Privacy Policy</Link>.
						</Text>
					</HStack>
				</VStack>
			</VStack>
		</Section>
	</VStack>
</Center>
