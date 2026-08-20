<!--
	Ported from upstream's `templates/blocks/components/BottomSheet/BottomSheetShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		BottomSheet,
		Button,
		CheckboxInput,
		Divider,
		Heading,
		Section,
		VStack
	} from '@astryx-svelte/core';

	let isOpen = $state(false);
	let inStock = $state<boolean | 'indeterminate'>(false);
	let onSale = $state<boolean | 'indeterminate'>(false);
	let freeShipping = $state<boolean | 'indeterminate'>(false);
</script>

<Button label="Open sheet" onclick={() => (isOpen = true)} />
<BottomSheet {isOpen} onOpenChange={(next) => (isOpen = next)} label="Filters">
	<Section padding={4}>
		<VStack gap={4}>
			<Heading level={3}>Filters</Heading>
			<Divider />
			<VStack gap={2}>
				<CheckboxInput label="In stock" value={inStock} onChange={(next) => (inStock = next)} />
				<CheckboxInput label="On sale" value={onSale} onChange={(next) => (onSale = next)} />
				<CheckboxInput
					label="Free shipping"
					value={freeShipping}
					onChange={(next) => (freeShipping = next)}
				/>
			</VStack>
			<Button label="Apply" onclick={() => (isOpen = false)} />
		</VStack>
	</Section>
</BottomSheet>
