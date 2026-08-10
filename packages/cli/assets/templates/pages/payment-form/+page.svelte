<!--
	Ported from upstream's `assets/templates/pages/payment-form/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Other translations:
	  - `Layout content={<…>}` → a `content` snippet passed as that prop.
	  - The three `ReactNode` props — `RadioListItem.endContent` (×2) and
	    `Banner.icon` — become snippets, hoisted to the top level as Svelte
	    requires.
	  - Every `CSSProperties` object becomes a `style` string under the same
	    const name, keeping upstream's key order.
	  - `useMediaQuery('(max-width: 767px)')` takes a getter here and returns a
	    `{matches}` object, so the reads are `isMobile.matches`.
	  - `useState` → `$state`; the render-time `errors` expression → `$derived`;
	    `setQuantities(q => ({…}))` → the equivalent assignment. Upstream's
	    unused `_setPaymentMethod` has no counterpart — `paymentMethod` is a
	    `$state` that nothing reassigns, exactly as upstream never calls it.
-->
<script lang="ts">
	import {
		Badge,
		Banner,
		Button,
		Card,
		Center,
		CheckboxInput,
		Collapsible,
		Divider,
		Grid,
		HStack,
		Icon,
		Layout,
		LayoutContent,
		Link,
		NumberInput,
		RadioList,
		RadioListItem,
		Section,
		Selector,
		Stack,
		StackItem,
		Text,
		TextArea,
		TextInput,
		Thumbnail,
		VStack,
		useMediaQuery
	} from '@astryx-svelte/core';
	import {
		CheckCircleIcon,
		LockClosedIcon,
		ShieldCheckIcon,
		TruckIcon
	} from '@fvilers/heroicons-svelte/24/outline';

	// ── Constants ─────────────────────────────────────────────────────────────────

	const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
	const YEARS = Array.from({ length: 12 }, (_, i) => String(2025 + i));

	const US_STATES = [
		'Alabama',
		'Alaska',
		'Arizona',
		'Arkansas',
		'California',
		'Colorado',
		'Connecticut',
		'Delaware',
		'Florida',
		'Georgia',
		'Hawaii',
		'Idaho',
		'Illinois',
		'Indiana',
		'Iowa',
		'Kansas',
		'Kentucky',
		'Louisiana',
		'Maine',
		'Maryland',
		'Massachusetts',
		'Michigan',
		'Minnesota',
		'Mississippi',
		'Missouri',
		'Montana',
		'Nebraska',
		'Nevada',
		'New Hampshire',
		'New Jersey',
		'New Mexico',
		'New York',
		'North Carolina',
		'North Dakota',
		'Ohio',
		'Oklahoma',
		'Oregon',
		'Pennsylvania',
		'Rhode Island',
		'South Carolina',
		'South Dakota',
		'Tennessee',
		'Texas',
		'Utah',
		'Vermont',
		'Virginia',
		'Washington',
		'West Virginia',
		'Wisconsin',
		'Wyoming'
	];

	// Product photos from the local template-assets set (committed to the
	// docsite; the CLI swaps these for an inline placeholder on scaffold).
	const ITEM_IMAGES: Record<string, { src: string }> = {
		'1': {
			src: 'https://lookaside.facebook.com/assets/astryx/light-product-1.png'
		},
		'2': {
			src: 'https://lookaside.facebook.com/assets/astryx/light-product-4.png'
		},
		'3': {
			src: 'https://lookaside.facebook.com/assets/astryx/light-product-5.png'
		}
	};

	const ORDER_ITEMS = [
		{
			id: '1',
			name: 'Speckled Stoneware Mug',
			variant: 'Hand-thrown · 12 oz',
			price: 78,
			qty: 1,
			limited: false
		},
		{
			id: '2',
			name: 'Stoneware Dinner Plate',
			variant: 'Reactive glaze · 10 in',
			price: 72,
			qty: 1,
			limited: false
		},
		{
			id: '3',
			name: 'Cereal Bowl',
			variant: 'Speckled clay · 6 in',
			price: 80,
			qty: 1,
			limited: true
		}
	];

	const SUBTOTAL = 230;
	// SHIPPING is now computed from deliveryMethod state
	const TAX = 18.4;
	// TOTAL is computed dynamically based on delivery selection
	const fmt = (n: number) => `$${n.toFixed(2)}`;

	// ── Styles ────────────────────────────────────────────────────────────────────
	// Plain inline styles using Astryx design-token CSS variables (declared at
	// :root by `@astryx-svelte/core/astryx.css`). No StyleX compiler required.

	const fullWidth = 'width: 100%;';
	// Form column flex-basis so the two checkout columns share width evenly.
	const formColBasis = 'flex-basis: 0;';
	// Space the Order Summary content below its collapsible trigger title.
	const summaryContent = 'padding-block-start: var(--spacing-2);';
	// Order-summary column: sticky beside the form on desktop.
	const summarySticky =
		'flex-basis: 0; position: sticky; top: var(--spacing-4); align-self: flex-start;';
	// On mobile the summary moves above the form.
	const summaryMobileOrder = 'order: -1;';
	// Express-checkout brand buttons (fixed brand colors).
	const paypalButton = 'background-color: #FFC439; border-color: #FFC439;';
	// Official Google Pay dark button: black background with the unaltered
	// dark-variant mark (white "Google Pay" text + full-color G), per the
	// Google Pay brand guidelines.
	const gpayButton = 'background-color: #000; border-color: #000;';
	// Brand logos inside the express-checkout buttons.
	const brandLogo = 'height: var(--spacing-5); width: auto;';
	// Accepted card-network marks (Visa/Mastercard/Amex), shared style.
	const cardLogo =
		'height: var(--spacing-7); width: auto; border-radius: var(--radius-element); border-width: var(--border-width); border-style: solid; border-color: var(--color-border); background-color: var(--color-background-surface);';

	const isMobile = useMediaQuery(() => '(max-width: 767px)');
	let firstName = $state('');
	let lastName = $state('');
	let address = $state('');
	let city = $state('');
	let zip = $state('');
	let state = $state('');
	let phone = $state('');
	let saveInfo = $state(false);
	let email = $state('');
	let emailOffers = $state(false);
	let deliveryMethod = $state('standard');
	let paymentMethod = $state('card');
	let cardNumber = $state('');
	let expiry = $state('');
	let expYear = $state('');
	let billingMatchesShipping = $state(true);
	let billingAddress = $state('');
	let billingCity = $state('');
	let billingZip = $state('');
	let billingState = $state('');
	let addGiftMessage = $state(false);
	let giftTo = $state('');
	let giftFrom = $state('');
	let giftMessage = $state('');
	let cvc = $state('');
	let cardName = $state('');
	let promo = $state('');
	let quantities = $state<Record<string, number>>({
		'1': 1,
		'2': 1,
		'3': 1
	});
	let submitted = $state(false);

	const errors = $derived(
		submitted
			? {
					firstName: !firstName.trim() ? 'Required' : undefined,
					lastName: !lastName.trim() ? 'Required' : undefined,
					address: !address.trim() ? 'Required' : undefined,
					city: !city.trim() ? 'Required' : undefined,
					zip: !zip.trim() ? 'Required' : undefined,
					state: !state ? 'Required' : undefined,
					email: !email.trim() ? 'Required' : undefined,
					phone: !phone.trim() ? 'Required' : undefined,
					expiry: !expiry ? 'Required' : undefined,
					expYear: !expYear ? 'Required' : undefined,
					cvc: !cvc.trim() ? 'Required' : undefined,
					cardNumber: paymentMethod === 'card' && !cardNumber.trim() ? 'Required' : undefined,
					cardName: paymentMethod === 'card' && !cardName.trim() ? 'Required' : undefined,
					billingAddress:
						!billingMatchesShipping && !billingAddress.trim() ? 'Required' : undefined,
					billingCity: !billingMatchesShipping && !billingCity.trim() ? 'Required' : undefined,
					billingZip: !billingMatchesShipping && !billingZip.trim() ? 'Required' : undefined,
					billingState: !billingMatchesShipping && !billingState ? 'Required' : undefined
				}
			: {}
	);
</script>

{#snippet standardShippingPrice()}
	<Text type="body" weight="medium">$4.95</Text>
{/snippet}

{#snippet expeditedShippingPrice()}
	<Text type="body" weight="medium">$9.95</Text>
{/snippet}

{#snippet freeShippingIcon()}
	<Icon icon={TruckIcon} size="sm" />
{/snippet}

{#snippet content()}
	<LayoutContent padding={0}>
		<Center axis="horizontal">
			<Section variant="transparent" maxWidth={1100} width="100%" padding={6}>
				<VStack gap={5}>
					<!-- Page header -->
					<VStack gap={6}>
						<VStack gap={2}>
							<Text type="display-1" as="h1">Payment Request</Text>
							<Text type="body" color="secondary">
								Review your order and complete your purchase. All transactions are secured with
								256-bit SSL encryption.
							</Text>
						</VStack>
						<Divider />
					</VStack>

					<Stack direction={isMobile.matches ? 'vertical' : 'horizontal'} gap={8} vAlign="start">
						<StackItem size="fill" style={isMobile.matches ? undefined : formColBasis}>
							<VStack gap={8}>
								<!-- Sign in -->
								<VStack gap={1}>
									<HStack gap={2} hAlign="between" vAlign="center">
										<Text type="large" weight="bold">Sign in to check out</Text>
										<Button label="Sign In" variant="secondary" size="sm" onclick={() => {}} />
									</HStack>
									<Text type="supporting" color="secondary">
										Sign in to track your order and save your information for faster checkout.
									</Text>
								</VStack>

								<!-- Contact Information -->
								<VStack gap={3}>
									<Text type="large" weight="bold">Contact Information</Text>
									<TextInput
										size="lg"
										label="Email"
										placeholder="you@example.com"
										value={email}
										onChange={(value) => (email = value)}
										status={errors.email ? { type: 'error', message: errors.email } : undefined}
									/>
									<CheckboxInput
										label="Email me with news and offers"
										value={emailOffers}
										onChange={(checked) => (emailOffers = checked)}
									/>
								</VStack>

								<!-- Shipping Information -->
								<VStack gap={3}>
									<Text type="large" weight="bold">Shipping Information</Text>
									<Grid columns={2} gap={3}>
										<TextInput
											size="lg"
											label="First Name"
											placeholder="John"
											value={firstName}
											onChange={(value) => (firstName = value)}
											status={errors.firstName
												? { type: 'error', message: errors.firstName }
												: undefined}
										/>
										<TextInput
											size="lg"
											label="Last Name"
											placeholder="Doe"
											value={lastName}
											onChange={(value) => (lastName = value)}
											status={errors.lastName
												? { type: 'error', message: errors.lastName }
												: undefined}
										/>
									</Grid>
									<TextInput
										size="lg"
										label="Address"
										placeholder="123 Main Street"
										value={address}
										onChange={(value) => (address = value)}
										status={errors.address ? { type: 'error', message: errors.address } : undefined}
									/>
									<Grid columns={2} gap={3}>
										<TextInput
											size="lg"
											label="City"
											placeholder="New York"
											value={city}
											onChange={(value) => (city = value)}
											status={errors.city ? { type: 'error', message: errors.city } : undefined}
										/>
										<TextInput
											size="lg"
											label="ZIP Code"
											placeholder="10001"
											value={zip}
											onChange={(value) => (zip = value)}
											status={errors.zip ? { type: 'error', message: errors.zip } : undefined}
										/>
									</Grid>
									<Selector
										size="lg"
										label="State"
										placeholder="Select state"
										options={US_STATES}
										value={state}
										onChange={(value) => (state = value)}
										status={errors.state ? { type: 'error', message: errors.state } : undefined}
									/>
									<TextInput
										size="lg"
										label="Phone Number"
										placeholder="+1 (555) 123-4567"
										value={phone}
										onChange={(value) => (phone = value)}
										labelTooltip="We use your phone number to provide shipping updates and contact you about your delivery if needed."
										status={errors.phone ? { type: 'error', message: errors.phone } : undefined}
									/>
									<CheckboxInput
										label="Save my information for a faster checkout"
										value={saveInfo}
										onChange={(checked) => (saveInfo = checked)}
									/>
								</VStack>

								<!-- Delivery -->
								<VStack gap={3}>
									<VStack gap={1}>
										<Text type="large" weight="bold">Delivery</Text>
										<Text type="supporting" color="secondary">
											Please allow 1–3 business days processing time before your order ships.
										</Text>
									</VStack>
									<RadioList
										label="Delivery method"
										value={deliveryMethod}
										onChange={(value) => (deliveryMethod = value)}
									>
										<RadioListItem
											value="standard"
											label="Standard (3–7 business days)"
											endContent={standardShippingPrice}
										/>
										<RadioListItem
											value="expedited"
											label="Expedited (1–2 business days)"
											endContent={expeditedShippingPrice}
										/>
									</RadioList>
								</VStack>

								<!-- Payment Method -->
								<VStack gap={3}>
									<VStack gap={1}>
										<Text type="large" weight="bold">Payment Method</Text>
										<Text type="supporting" color="secondary">
											All transactions are secure and encrypted.
										</Text>
									</VStack>

									<!-- Express checkout -->
									<VStack gap={3}>
										<Grid columns={2} gap={3}>
											<!-- PayPal -->
											<Button
												label="PayPal"
												variant="primary"
												size="lg"
												onclick={() => {}}
												style={paypalButton}
											>
												<img
													src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
													alt="PayPal"
													style={brandLogo}
												/>
											</Button>
											<!-- Google Pay -->
											<Button
												label="Google Pay"
												variant="primary"
												size="lg"
												onclick={() => {}}
												style={gpayButton}
											>
												<img
													src="https://pay.google.com/about/static_kcs/images/logos/google-pay-logo.svg"
													alt="Google Pay"
													style={brandLogo}
												/>
											</Button>
										</Grid>
									</VStack>

									<!-- OR divider -->
									<HStack gap={3} vAlign="center">
										<StackItem size="fill">
											<Divider />
										</StackItem>
										<Text type="supporting" color="secondary">OR</Text>
										<StackItem size="fill">
											<Divider />
										</StackItem>
									</HStack>

									<!-- Credit card fields -->
									<VStack gap={3}>
										<!-- Card type icons -->
										<HStack gap={1.5} vAlign="center">
											<img
												src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat/visa.svg"
												alt="Visa"
												style={cardLogo}
											/>
											<img
												src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat/mastercard.svg"
												alt="Mastercard"
												style={cardLogo}
											/>
											<img
												src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat/amex.svg"
												alt="Amex"
												style={cardLogo}
											/>
										</HStack>
										<TextInput
											size="lg"
											label="Card Number"
											placeholder="1234 5678 9012 3456"
											value={cardNumber}
											onChange={(value) => (cardNumber = value)}
											status={errors.cardNumber
												? { type: 'error', message: errors.cardNumber }
												: undefined}
										/>
										<Grid columns={3} gap={3}>
											<Selector
												size="lg"
												label="Expiry Month"
												placeholder="MM"
												options={MONTHS}
												value={expiry}
												onChange={(value) => (expiry = value)}
												status={errors.expiry
													? { type: 'error', message: errors.expiry }
													: undefined}
											/>
											<Selector
												size="lg"
												label="Expiry Year"
												placeholder="YY"
												options={YEARS}
												value={expYear}
												onChange={(value) => (expYear = value)}
												status={errors.expYear
													? { type: 'error', message: errors.expYear }
													: undefined}
											/>
											<TextInput
												size="lg"
												label="CVC"
												placeholder="123"
												value={cvc}
												onChange={(value) => (cvc = value)}
												labelTooltip="3-digit security code usually found on the back of your card. American Express cards have a 4-digit code located on the front."
												status={errors.cvc ? { type: 'error', message: errors.cvc } : undefined}
											/>
										</Grid>
										<TextInput
											size="lg"
											label="Name on Card"
											placeholder="John Doe"
											value={cardName}
											onChange={(value) => (cardName = value)}
											status={errors.cardName
												? { type: 'error', message: errors.cardName }
												: undefined}
										/>
										<CheckboxInput
											label="Use shipping address as billing address"
											value={billingMatchesShipping}
											onChange={(checked) => (billingMatchesShipping = checked)}
										/>
										{#if !billingMatchesShipping}
											<VStack gap={3}>
												<TextInput
													size="lg"
													label="Address"
													placeholder="123 Main Street"
													value={billingAddress}
													onChange={(value) => (billingAddress = value)}
													status={errors.billingAddress
														? {
																type: 'error',
																message: errors.billingAddress
															}
														: undefined}
												/>
												<Grid columns={2} gap={3}>
													<TextInput
														size="lg"
														label="City"
														placeholder="New York"
														value={billingCity}
														onChange={(value) => (billingCity = value)}
														status={errors.billingCity
															? {
																	type: 'error',
																	message: errors.billingCity
																}
															: undefined}
													/>
													<TextInput
														size="lg"
														label="ZIP Code"
														placeholder="10001"
														value={billingZip}
														onChange={(value) => (billingZip = value)}
														status={errors.billingZip
															? {
																	type: 'error',
																	message: errors.billingZip
																}
															: undefined}
													/>
												</Grid>
												<Selector
													size="lg"
													label="State"
													placeholder="Select state"
													options={US_STATES}
													value={billingState}
													onChange={(value) => (billingState = value)}
													status={errors.billingState
														? {
																type: 'error',
																message: errors.billingState
															}
														: undefined}
												/>
											</VStack>
										{/if}
									</VStack>
								</VStack>

								<!-- Promo Code -->
								<VStack gap={3}>
									<Text type="large" weight="bold">Promo Code</Text>
									<HStack gap={2} vAlign="center">
										<StackItem size="fill">
											<TextInput
												size="lg"
												label="Promo code"
												isLabelHidden
												placeholder="Enter promo code"
												value={promo}
												onChange={(value) => (promo = value)}
												style={fullWidth}
											/>
										</StackItem>
										<Button label="Apply" variant="secondary" size="lg" onclick={() => {}} />
									</HStack>
								</VStack>

								<!-- Gift Options -->
								<VStack gap={3}>
									<Text type="large" weight="bold">Gift Options</Text>
									<CheckboxInput
										label="Add a gift message"
										value={addGiftMessage}
										onChange={(checked) => (addGiftMessage = checked)}
									/>
									{#if addGiftMessage}
										<VStack gap={3}>
											<Grid columns={2} gap={3}>
												<TextInput
													size="lg"
													label="To"
													isLabelHidden
													placeholder="To"
													value={giftTo}
													onChange={(value) => (giftTo = value)}
												/>
												<TextInput
													size="lg"
													label="From"
													isLabelHidden
													placeholder="From"
													value={giftFrom}
													onChange={(value) => (giftFrom = value)}
												/>
											</Grid>
											<TextArea
												label="Gift message"
												isLabelHidden
												placeholder="Write something here"
												value={giftMessage}
												onChange={(value) => (giftMessage = value)}
											/>
										</VStack>
									{/if}
								</VStack>

								<!-- Trust bar + CTAs + policy links -->
								<VStack gap={4}>
									<HStack gap={5} hAlign="center" wrap="wrap">
										<HStack gap={1} vAlign="center">
											<Icon icon={ShieldCheckIcon} size="sm" color="secondary" />
											<Text type="supporting" color="secondary">Secure Payment</Text>
										</HStack>
										<HStack gap={1} vAlign="center">
											<Icon icon={LockClosedIcon} size="sm" color="secondary" />
											<Text type="supporting" color="secondary">SSL Encrypted</Text>
										</HStack>
										<HStack gap={1} vAlign="center">
											<Icon icon={CheckCircleIcon} size="sm" color="secondary" />
											<Text type="supporting" color="secondary">Free Returns</Text>
										</HStack>
									</HStack>
									<VStack gap={2}>
										<Button
											label="Place Order"
											variant="primary"
											size="lg"
											style={fullWidth}
											onclick={() => (submitted = true)}
										/>
										<Button
											label="Continue Shopping"
											variant="secondary"
											size="lg"
											style={fullWidth}
											onclick={() => {}}
										/>
									</VStack>
									<Divider />
									<HStack gap={4} vAlign="center">
										<Link href="#" type="supporting">Refund policy</Link>
										<Link href="#" type="supporting">Privacy policy</Link>
										<Link href="#" type="supporting">Terms of service</Link>
										<Link href="#" type="supporting">Cancellations</Link>
									</HStack>
								</VStack>
							</VStack>
						</StackItem>

						<StackItem
							size="fill"
							style={isMobile.matches ? summaryMobileOrder : summarySticky}
						>
							<Card padding={5}>
								<VStack gap={4}>
									<!-- Accordion header — clickable on mobile only -->
									<Collapsible trigger="Order Summary" defaultIsOpen={true}>
										<VStack gap={4} style={summaryContent}>
											<!-- Line items -->
											{#each ORDER_ITEMS as item (item.id)}
												<VStack gap={3}>
													<HStack gap={3} vAlign="start">
														<Thumbnail src={ITEM_IMAGES[item.id].src} alt={item.name} />
														<StackItem size="fill">
															<VStack gap={1}>
																<HStack gap={2} hAlign="between" vAlign="start">
																	<HStack gap={2} vAlign="center">
																		<Text type="body" weight="medium">{item.name}</Text>
																		{#if item.limited}
																			<Badge variant="green" label="LIMITED EDITION" />
																		{/if}
																	</HStack>
																	<Text type="body" weight="bold">{fmt(item.price)}</Text>
																</HStack>
																<Text type="supporting" color="secondary">{item.variant}</Text>
																<HStack gap={2} vAlign="center">
																	<NumberInput
																		label="Qty"
																		isLabelHidden
																		value={quantities[item.id] ?? item.qty}
																		onChange={(v) =>
																			(quantities = {
																				...quantities,
																				[item.id]: v
																			})}
																		min={1}
																		max={10}
																		isIntegerOnly
																	/>
																	<Link href="#" type="supporting">Remove</Link>
																	<Link href="#" type="supporting">Save</Link>
																</HStack>
															</VStack>
														</StackItem>
													</HStack>
													<Divider />
												</VStack>
											{/each}

											<!-- Order total subsection -->
											<VStack gap={3}>
												<Text type="large" weight="bold">Order Total</Text>
												<VStack gap={2}>
													<HStack hAlign="between" vAlign="center">
														<Text type="body" color="secondary">Subtotal</Text>
														<Text type="body">{fmt(SUBTOTAL)}</Text>
													</HStack>
													<HStack hAlign="between" vAlign="center">
														<Text type="body" color="secondary">Shipping</Text>
														<Text type="body">
															{fmt(deliveryMethod === 'expedited' ? 9.95 : 4.95)}
														</Text>
													</HStack>
													<HStack hAlign="between" vAlign="center">
														<Text type="body" color="secondary">Tax</Text>
														<Text type="body">{fmt(TAX)}</Text>
													</HStack>
												</VStack>
												<Divider />
												<HStack hAlign="between" vAlign="center">
													<Text type="large" weight="bold">Total</Text>
													<Text type="large" weight="bold">
														{fmt(SUBTOTAL + (deliveryMethod === 'expedited' ? 9.95 : 4.95) + TAX)}
													</Text>
												</HStack>
												<Banner
													status="info"
													icon={freeShippingIcon}
													title="Free shipping on orders over $300"
												/>
											</VStack>
										</VStack>
									</Collapsible>
								</VStack>
								<!-- end outer card VStack gap={4} -->
							</Card>
						</StackItem>
					</Stack>
				</VStack>
			</Section>
		</Center>
	</LayoutContent>
{/snippet}

<Layout height="fill" {content} />
