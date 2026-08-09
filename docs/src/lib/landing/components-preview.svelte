<script lang="ts">
	import {
		Badge,
		Button,
		CheckboxInput,
		Grid,
		Icon,
		RadioList,
		RadioListItem,
		Switch,
		TextInput,
		VStack
	} from '@astryx-svelte/core';

	/**
	 * Live, theme-aware sampler of real Astryx components, ported from upstream's
	 * `_landing/ComponentsPreview.tsx`.
	 *
	 * It replaced a baked `/feature-components.png` upstream for a reason worth
	 * keeping: the PNG stayed light on the dark surface, and real components
	 * re-theme for dark mode.
	 */
	let checked = $state(true);
	let on = $state(true);
	let search = $state('');
</script>

<!--
	Upstream passes lucide's `Search` to `startIcon`. This port's registry has an
	exact `search` glyph, so this one is a real match rather than a substitution.
-->
{#snippet searchIcon()}<Icon icon="search" size="sm" color="secondary" />{/snippet}

<div class="root" inert>
	<VStack gap={4} align="stretch">
		<!--
			Upstream's `HStack gap={2} hAlign="evenly" vAlign="center" wrap="wrap"`
			with `xstyle={{rowGap: spacing-3}}`. The row-gap override has to sit on
			the flex container itself — on a wrapper div around the HStack it is a
			no-op and the row gap silently stays at gap={2}. So this is the flex
			HStack would have produced, with the override applied to the same box.
		-->
		<div class="controls-row">
			<Badge variant="orange" label="Badge" />
			<Badge variant="blue" label="Badge" />
			<RadioList label="Sample option" isLabelHidden size="md" value="" onChange={() => {}}>
				<RadioListItem label="" value="sample" />
			</RadioList>
			<CheckboxInput
				label="Sample checkbox"
				isLabelHidden
				size="md"
				value={checked}
				onChange={(next) => (checked = next)}
			/>
			<Switch label="Sample switch" isLabelHidden value={on} onChange={(next) => (on = next)} />
		</div>

		<Grid columns={2} gap={3}>
			<Button variant="secondary" label="Secondary" class="fill" />
			<Button variant="primary" label="Primary" class="fill" />
		</Grid>

		<TextInput
			label="Search components"
			isLabelHidden
			placeholder="Search..."
			value={search}
			onChange={(next) => (search = next)}
			startIcon={searchIcon}
			hasClear
		/>
	</VStack>
</div>

<style>
	.root {
		width: 100%;
		max-width: 360px;
		margin-inline: auto;
		/* Decorative preview — never interactive. */
		pointer-events: none;
	}

	.controls-row {
		display: flex;
		flex-direction: row;
		justify-content: space-evenly;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		row-gap: var(--spacing-3);
	}

	.root :global(.fill) {
		width: 100%;
	}
</style>
