<script lang="ts">
	import { untrack } from 'svelte';
	import { Heading, Section, Text, VStack } from '@astryx-svelte/core';
	import type { ComponentEntry } from '$lib/generated/types.js';
	import PlaygroundStage from './playground-stage.svelte';
	import PropControlCell from './prop-control-cell.svelte';
	import PropsTable from './props-table.svelte';
	import {
		buildInitialValues,
		buildKnobs,
		generateSvelteCode,
		missingRequired
	} from './prop-control.js';

	/**
	 * The Properties tab — upstream's `tab === 'properties'` branch of
	 * `ComponentDetailClient`, which owns the knob state through
	 * `useInteractiveState` and hands the same state to both the stage and the
	 * table.
	 *
	 * **This component must be keyed on the entry name by its caller.** The knobs
	 * and their seed are computed once at initialisation, as upstream's
	 * `useState(initialState)` is; SvelteKit reuses one component instance across
	 * `/components/[name]` navigations, so without a `{#key}` the next component's
	 * table would drive the previous component's values.
	 */
	interface Props {
		component: ComponentEntry;
	}

	const { component }: Props = $props();

	// `untrack`, because the entry is read once on purpose: this component is
	// keyed on it, so a change of entry is a new instance rather than a new value.
	const knobs = untrack(() => buildKnobs(component.props));
	const knobByName = new Map(knobs.map((knob) => [knob.row.name, knob]));

	/**
	 * `$state.raw` rather than `$state`: several seeds are objects and arrays that
	 * come straight out of the generated registry, and a deep proxy would wrap —
	 * and could write through to — module-level data every page shares. Nothing
	 * mutates a value in place, so replacing the record is the whole update.
	 */
	let values = $state.raw<Record<string, unknown>>(
		untrack(() => buildInitialValues(knobs, component.playground))
	);

	/** Edits so far. The stage passes it down so a failed boundary can reset. */
	let token = $state(0);

	const missing = $derived(missingRequired(knobs, values));
	const code = $derived(generateSvelteCode(component.name, knobs, values));

	function setValue(name: string, value: unknown): void {
		values = { ...values, [name]: value };
		token += 1;
	}
</script>

<VStack gap={4}>
	<div class="stage-sticky">
		<PlaygroundStage
			name={component.name}
			{knobs}
			{values}
			{code}
			{token}
			playground={component.playground}
			{missing}
			onValueChange={setValue}
		/>
	</div>

	{#if component.props?.length}
		<Section>
			<VStack gap={3}>
				<Heading level={3}>Props</Heading>
				{#if component.propsTypeName}
					<Text type="supporting" color="secondary">
						Types are read from core's own <code>{component.propsTypeName}</code>
						declaration, not mapped from upstream's React types.
					</Text>
				{/if}
				<PropsTable rows={component.props}>
					{#snippet control(row)}
						{@const knob = knobByName.get(row.name)}
						{#if knob}
							<PropControlCell
								{knob}
								value={values[row.name]}
								onChange={(next) => setValue(row.name, next)}
							/>
						{/if}
					{/snippet}
				</PropsTable>
			</VStack>
		</Section>
	{:else}
		<Text type="supporting" color="secondary">This component declares no props.</Text>
	{/if}
</VStack>

<style>
	/*
		Upstream's `previewStage`: the preview stays in view while the reader
		scrolls the table, which is the point of editing a row and watching the
		component change. Upstream pins it at a literal `top: 44` — its own nav
		height — where this shell publishes the same measurement as a variable from
		`AppShell`.

		The stage keeps the `Card`'s own border and radius rather than getting a
		second set: upstream draws the frame on this wrapper and passes `embedded`
		to flatten the Card inside it, which is one border either way.

		The **opaque background is not decoration**. `Card variant="muted"` is a
		translucent tint (`--color-background-muted` is `#0536590c` / `#1111127f`) —
		invisible over the page, and glass over anything it overlaps — so a pinned
		stage without this had table rows scrolling through the middle of the
		previewed component.

		The token is `--color-background-body`, not upstream's
		`--color-background-page`: that name is **not defined by this port's
		themes**, so copying upstream's rule leaves the wrapper transparent and the
		bug in place with nothing to see in the console. Upstream also blurs its
		backdrop; over an opaque background there is nothing left to blur, so that
		line is dropped rather than kept as a no-op compositing layer.
	*/
	.stage-sticky {
		position: sticky;
		z-index: 10;
		inset-block-start: var(--_app-shell-header-height, 0px);
		max-height: 400px;
		overflow: auto;
		background-color: var(--color-background-body);
		border-radius: var(--radius-container);
	}

	@media (max-width: 768px) {
		.stage-sticky {
			max-height: 250px;
		}
	}
</style>
