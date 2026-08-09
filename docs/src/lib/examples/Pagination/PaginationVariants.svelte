<!--
	Ported from upstream's `templates/blocks/components/Pagination/PaginationVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Pagination, Stack } from '@astryx-svelte/core';

	let pagesPage = $state(3);
	let countPage = $state(2);
	let compactPage = $state(5);
	let dotsPage = $state(3);
</script>

<Stack direction="vertical" gap={5} hAlign="center" style="width: 100%">
	<Pagination
		page={dotsPage}
		onChange={(next) => (dotsPage = next)}
		totalPages={8}
		variant="dots"
	/>
	<Pagination
		page={compactPage}
		onChange={(next) => (compactPage = next)}
		totalPages={10}
		variant="compact"
	/>
	<Pagination
		page={countPage}
		onChange={(next) => (countPage = next)}
		totalItems={200}
		pageSize={20}
		variant="count"
	/>
	<Pagination
		page={pagesPage}
		onChange={(next) => (pagesPage = next)}
		totalItems={200}
		pageSize={10}
		variant="pages"
	/>
</Stack>
