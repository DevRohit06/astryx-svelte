<!--
	Ported from upstream's `templates/blocks/components/BottomSheet/BottomSheetMobileKeyboard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		BottomSheet,
		Button,
		Divider,
		Heading,
		Text,
		TextArea,
		TextInput,
		VStack
	} from '@astryx-svelte/core';

	interface ProfileFormValues {
		name: string;
		email: string;
		company: string;
		role: string;
		bio: string;
		notes: string;
	}

	const initialValues: ProfileFormValues = {
		name: '',
		email: '',
		company: '',
		role: '',
		bio: '',
		notes: ''
	};

	let isOpen = $state(false);
	let values = $state(initialValues);
	const update = (field: keyof ProfileFormValues) => (value: string) => {
		values = { ...values, [field]: value };
	};
</script>

<Button label="Edit profile" onclick={() => (isOpen = true)} />
<BottomSheet {isOpen} onOpenChange={(next) => (isOpen = next)} label="Edit profile" height="tall">
	<form
		onsubmit={(event) => {
			event.preventDefault();
			isOpen = false;
		}}
	>
		<VStack gap={4} style="padding: var(--spacing-4)">
			<Heading level={3}>Edit profile</Heading>
			<Divider />
			<Text type="supporting" color="secondary">
				Focus fields throughout the form to see them remain visible above the mobile keyboard.
			</Text>
			<TextInput label="Name" value={values.name} onChange={update('name')} />
			<TextInput label="Email" type="email" value={values.email} onChange={update('email')} />
			<TextInput label="Company" value={values.company} onChange={update('company')} />
			<TextInput label="Role" value={values.role} onChange={update('role')} />
			<TextArea label="Bio" rows={5} value={values.bio} onChange={update('bio')} />
			<TextArea label="Notes" rows={5} value={values.notes} onChange={update('notes')} />
			<Button label="Save profile" type="submit" />
		</VStack>
	</form>
</BottomSheet>
