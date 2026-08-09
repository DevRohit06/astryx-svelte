<!--
	Ported from upstream's
	`templates/blocks/components/InternationalizationProvider/InternationalizationProvider03RtlDirection.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The block sets direction in **two** places on purpose, and that is the whole
	lesson: `InternationalizationProvider dir` drives the JavaScript half
	(`useDirection`, pointer math, arrow keys) and the `dir` *attribute* drives
	the CSS half, because logical properties resolve against the DOM and know
	nothing about a Svelte context. Setting only one gives a half-flipped page
	that reads as a component bug.
-->
<script lang="ts">
	import {
		InternationalizationProvider,
		Pagination,
		SegmentedControl,
		SegmentedControlItem,
		VStack
	} from '@astryx-svelte/core';

	type TextDirection = 'ltr' | 'rtl';

	let textDirection = $state<TextDirection>('ltr');
	let page = $state(3);
</script>

<InternationalizationProvider locale="en" dir={textDirection}>
	<!-- `dir` on the VStack scopes text direction to this subtree — no extra
	     wrapper needed. (VStack has no `direction` prop, so there's nothing to
	     confuse with `dir` here.) -->
	<VStack gap={4} hAlign="center" dir={textDirection} style="width: 100%">
		<SegmentedControl
			label="Direction"
			value={textDirection}
			onChange={(next) => (textDirection = next as TextDirection)}
			size="sm"
		>
			<SegmentedControlItem value="ltr" label="LTR" />
			<SegmentedControlItem value="rtl" label="RTL" />
		</SegmentedControl>
		<Pagination
			{page}
			onChange={(next) => (page = next)}
			totalItems={200}
			pageSize={10}
			variant="pages"
		/>
	</VStack>
</InternationalizationProvider>
