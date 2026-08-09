<!--
	Ported from upstream's `templates/blocks/components/BaseTypeahead/BaseTypeaheadCustomSearch.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		BaseTypeahead,
		createStaticSource,
		HStack,
		Icon,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import type { SearchableItem } from '@astryx-svelte/core';

	/**
	 * Three translations, all this port's standing shapes. Upstream passes
	 * `anchorRef` (a `RefObject`) where `BaseTypeahead` takes `anchorEl` — a plain
	 * element. `HStack` exposes no element seam, so the wrapper is captured with
	 * an attachment threaded through its rest props, the same way
	 * `SelectableCard`/`ClickableCard` reach `Card`'s container. And upstream's
	 * `MagnifyingGlassIcon` is the registry's `search`, a true match rather than a
	 * stand-in.
	 */
	const frameworks: SearchableItem[] = [
		{ id: 'react', label: 'React' },
		{ id: 'vue', label: 'Vue' },
		{ id: 'angular', label: 'Angular' },
		{ id: 'svelte', label: 'Svelte' },
		{ id: 'solid', label: 'SolidJS' },
		{ id: 'remix', label: 'Remix' },
		{ id: 'next', label: 'Next.js' },
		{ id: 'nuxt', label: 'Nuxt' }
	];

	const source = createStaticSource(frameworks);

	let value = $state<SearchableItem | null>(null);
	let wrapperEl = $state<HTMLElement | null>(null);
</script>

<VStack gap={3} style="width: 320px">
	<HStack
		{@attach (el) => {
			wrapperEl = el;
		}}
		gap={2}
		vAlign="center"
		style="border: 1px solid var(--color-border); border-radius: var(--radius-control); padding: 6px 10px; background: var(--color-surface)"
	>
		<Icon icon="search" size="sm" color="secondary" />
		<BaseTypeahead
			searchSource={source}
			{value}
			onChange={(item) => (value = item)}
			anchorEl={wrapperEl}
			placeholder="Search frameworks…"
			hasEntriesOnFocus
			debounceMs={0}
		/>
	</HStack>
	<Text type="supporting" color="secondary">
		{value != null ? `Selected: ${value.label}` : 'No selection'}
	</Text>
</VStack>
