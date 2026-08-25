<script lang="ts" module>
	export interface LayerInvariantsModalSpec {
		label: string;
		purpose?: 'required';
		isOpenInitially?: boolean;
		/** Renders upstream's `<input aria-label="field" />` inside this modal. */
		hasField?: boolean;
	}

	export interface LayerInvariantsModalStackProps {
		/** Outermost first; each entry is rendered inside the one before it. */
		specs: LayerInvariantsModalSpec[];
	}
</script>

<script lang="ts">
	import Modal from './layer-invariants-modal.svelte';
	import Self from './layer-invariants-modal-stack.svelte';

	/**
	 * Every plain `Modal`-inside-`Modal` tree upstream writes inline, as one
	 * self-nesting fixture: `<Modal label="Outer"><Modal label="Inner" /></Modal>`
	 * is `specs={[{label: 'Outer'}, {label: 'Inner'}]}`.
	 *
	 * Upstream can write the nesting at each call site because JSX children are a
	 * value; here they are a snippet and can only be authored in a template, so
	 * one recursive fixture stands in for the six shapes rather than six fixtures
	 * standing in for six literals. Upstream's local `Pair` — the one shape that
	 * mounts and unmounts a nested modal through `rerender` — is the same fixture
	 * re-rendered with a shorter `specs`.
	 */
	const { specs }: LayerInvariantsModalStackProps = $props();

	const head = $derived(specs[0]);
	const tail = $derived(specs.slice(1));
</script>

{#if head}
	<Modal label={head.label} purpose={head.purpose} isOpenInitially={head.isOpenInitially}>
		{#if head.hasField}
			<input aria-label="field" />
		{/if}
		{#if tail.length > 0}
			<Self specs={tail} />
		{/if}
	</Modal>
{/if}
