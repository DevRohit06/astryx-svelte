<script lang="ts">
	import Section from '$lib/components/section/section.svelte';
	import VStack from '$lib/components/stack/vstack.svelte';
	import Tab from '$lib/components/tab-list/tab.svelte';
	import TabList from '$lib/components/tab-list/tab-list.svelte';

	/**
	 * A `TabList` in the nesting the docs site puts it in — `Section` > `VStack` >
	 * `TabList` > `Tab` — server-rendered and then hydrated.
	 *
	 * The wrappers are not decoration. `TabList` renders a `KeyboardHintLayer`
	 * after `{@render children()}`, so the tabs are not the last thing inside its
	 * `<nav>`; reproducing the real nesting is what keeps the marker sequence the
	 * same as the page that failed.
	 *
	 * `value` is deliberately fixed rather than stateful: this fixture is about
	 * whether the *first* client pass finds `TabList`'s context, not about
	 * selection behaviour, which `tab-list.svelte.test.ts` already covers.
	 */
	interface Props {
		value?: string;
	}

	const { value = 'overview' }: Props = $props();
</script>

<Section maxWidth={960} padding={6} variant="transparent">
	<VStack gap={4}>
		<TabList {value} onChange={() => {}} hasDivider>
			<Tab value="overview" label="Overview" />
			<Tab value="properties" label="Properties" />
		</TabList>
	</VStack>
</Section>
