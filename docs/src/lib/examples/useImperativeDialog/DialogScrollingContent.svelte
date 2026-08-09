<!--
	Ported from upstream's `templates/blocks/components/Dialog/DialogScrollingContent.tsx`
	(the block targets both `Dialog` and `useImperativeDialog`, so it is filed under each).
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's in-file `Content({onClose})` becomes a parameterised snippet, named
	`dialogContent` so it does not shadow the `content` snippet `Layout` takes —
	the same translation `DialogConfirmationDialog` documents. Upstream's
	`TERMS.map((term, i) => <Text key={i}>…</Text>)` becomes an `{#each}` keyed on
	the same index.
-->
<script lang="ts">
	import {
		Button,
		Dialog,
		DialogHeader,
		HStack,
		ImperativeDialogLayer,
		Layout,
		LayoutContent,
		LayoutFooter,
		Text,
		useImperativeDialog,
		VStack
	} from '@astryx-svelte/core';

	const TERMS = [
		'You agree to use the service only for lawful purposes and in compliance with all applicable laws and regulations in your jurisdiction.',
		'Your account credentials are your responsibility. Notify us immediately if you suspect unauthorized access to your account.',
		'We reserve the right to suspend accounts that violate these terms or engage in abusive behavior toward other users.',
		'Content you upload remains your property. You grant us a license to host and display it within the service.',
		'We may update these terms at any time. Continued use after changes constitutes acceptance of the updated terms.',
		'The service is provided as-is without warranties of any kind. We are not liable for data loss or service interruptions.',
		'You may cancel your account at any time. Your data will be deleted within 30 days of cancellation.',
		'Disputes will be resolved through binding arbitration in accordance with applicable regulations.',
		'You agree not to reverse-engineer, decompile, or disassemble any part of the service or its underlying technology.',
		'We may collect anonymized usage data to improve the service. Personal data is handled per our Privacy Policy.',
		'Third-party integrations are governed by their own terms. We are not responsible for third-party service outages.',
		'You are responsible for maintaining backups of your data. We provide export tools but do not guarantee data recovery.',
		'Commercial use requires a Business plan. Free accounts are limited to personal and non-commercial projects.',
		'We may introduce new features or discontinue existing ones with 30 days notice via email or in-app notification.',
		'Violation of these terms may result in immediate termination of your account without prior notice or refund.'
	];

	const dialog = useImperativeDialog(() => ({ maxHeight: '50vh' }));
</script>

{#snippet dialogContent(onClose: () => void)}
	<Layout>
		{#snippet header()}
			<DialogHeader title="Terms and Conditions" onOpenChange={() => onClose()} />
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<VStack gap={3}>
					{#each TERMS as term, i (i)}
						<Text type="body">{i + 1}. {term}</Text>
					{/each}
				</VStack>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter>
				<HStack gap={2} hAlign="end">
					<Button label="Decline" variant="secondary" onclick={onClose} />
					<Button label="Accept" variant="primary" onclick={onClose} />
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
{/snippet}

{#snippet modalContent()}
	{@render dialogContent(() => dialog.hide())}
{/snippet}

<!-- Remove isInline for production — dialogs should be modal. -->
<Dialog isOpen isInline onOpenChange={() => {}} maxHeight={360}>
	{@render dialogContent(() => dialog.show(modalContent))}
</Dialog>
<ImperativeDialogLayer {dialog} />
