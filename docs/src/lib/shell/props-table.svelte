<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Badge, Code } from '@astryx-svelte/core';
	import type { PropEntry } from '$lib/generated/types.js';
	import InlineMarkdown from './inline-markdown.svelte';

	/**
	 * The props table. Upstream's is `PlaygroundPropsTable` — every row is
	 * simultaneously documentation *and* a live control, and the `control` snippet
	 * below is that second half. It is optional because half the callers have no
	 * live component to drive: a hook's parameters and returns are documentation
	 * only, and pass no snippet.
	 *
	 * A `<table>` until `Table` lands (batch 13), as the reference-doc tables are.
	 *
	 * The type column is core's **own** declaration, not upstream's React string.
	 * When the generator could not find a declaration the row says so, and says
	 * why — `unsupported` carries the reason, which is always a translation this
	 * port makes deliberately (a React `ref`, a `data-*` forwarded through rest).
	 * On those rows alone the generator also keeps `upstreamType`, because there
	 * the displayed type *is* the mapping and naming what it was mapped from is
	 * the provenance; a compiler-typed row carries no React type at all.
	 *
	 * `correctedFromUpstream` is the other note, and it is the reason
	 * `DOC_CORRECTIONS` exists: an upstream doc table can contradict the upstream
	 * source it documents, and this port follows the source. The corrected value
	 * without its reason is just an unexplained disagreement with the published
	 * docs, so the reason is rendered next to it.
	 */
	interface Props {
		rows: PropEntry[];
		/** `Property` for props, `Parameter` for a hook's params. */
		nameHeader?: string;
		/**
		 * The row's editor, rendered in a column of its own on the right. Supplied
		 * only by the Properties tab, where there is a live preview for it to
		 * drive.
		 */
		control?: Snippet<[PropEntry]>;
	}

	const { rows, nameHeader = 'Property', control }: Props = $props();
</script>

<div class="table-scroll">
	<table>
		<thead>
			<tr>
				<th scope="col">{nameHeader}</th>
				<th scope="col">Type</th>
				<th scope="col">Default</th>
				<th scope="col">Description</th>
				{#if control}
					<th scope="col" class="prop-control">Control</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.name)}
				<tr>
					<td class="prop-name">
						<Code>{row.name}</Code>
						{#if row.required}
							<Badge label="Required" variant="warning" />
						{/if}
						{#if row.renamedFrom}
							<span class="prop-renamed">upstream: <Code>{row.renamedFrom}</Code></span>
						{/if}
					</td>
					<td class="prop-type">
						<Code>{row.type}</Code>
					</td>
					<td class="prop-default">
						{#if row.default}<Code>{row.default}</Code>{:else}<span class="prop-empty">—</span>{/if}
					</td>
					<td>
						<InlineMarkdown text={row.description} />
						<!--
							Every note lives in this cell. The other three columns are sized to
							their content — two of them `nowrap` — so a paragraph in any of them
							widens the table until it scrolls sideways, and the corrected-default
							note is a sentence long.
						-->
						{#if row.correctedFromUpstream}
							<p class="prop-note">
								<span class="prop-note-label">Corrected from upstream's doc:</span>
								<InlineMarkdown text={row.correctedFromUpstream} />
							</p>
						{/if}
						<!--
							One paragraph, not two: the provenance belongs to whichever
							explanation is showing, and every unverified row currently has a
							specific one. The generic sentence is the fallback for a row the
							generator has not classified yet — it also prints in the drift
							warning, so a reader and the build see the same gap.
						-->
						{#if row.unsupported || row.unverified}
							<p class="prop-note">
								{#if row.unsupported}<InlineMarkdown text={row.unsupported} />{:else}Not declared by
									core, so this type is mapped from upstream's rather than read from the compiler.{/if}{#if row.upstreamType}
									Upstream declares <Code>{row.upstreamType}</Code>.{/if}
							</p>
						{/if}
					</td>
					{#if control}
						<td class="prop-control">{@render control(row)}</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-scroll {
		overflow-x: auto;
		/*
			The query container for the stacked layout at the bottom of this file.
			It has to be a container rather than the viewport: this table sits in the
			shell's content column, so a 929px window leaves it ~600px, and a
			viewport-width breakpoint would keep the wide layout at a width the wide
			layout does not fit in — which `overflow-x` above would then hide as a
			scrollbar instead of solving.
		*/
		container-type: inline-size;
	}

	table {
		width: 100%;
		font-size: var(--font-size-sm);
		border-collapse: collapse;
	}

	th,
	td {
		padding: var(--spacing-2) var(--spacing-3);
		text-align: start;
		vertical-align: top;
		border-block-end: 1px solid var(--color-border);
	}

	th {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.prop-name,
	.prop-type {
		white-space: nowrap;
	}

	/*
		A floor as well as a ceiling. With five columns the auto table layout gives
		this one its minimum, and a long union then wraps one member per line —
		`Badge.variant` is thirteen members and became a column of single words.
	*/
	.prop-type {
		min-width: 20ch;
		max-width: 28ch;
		overflow-wrap: anywhere;
		white-space: normal;
	}

	/* A default is a single token; it should never wrap mid-word. */
	.prop-default {
		white-space: nowrap;
	}

	.prop-renamed {
		display: block;
		margin-block-start: 2px;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.prop-empty {
		color: var(--color-text-disabled);
	}

	.prop-note {
		margin: var(--spacing-1) 0 0;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	/*
		Both tokens are theme variables rather than literal colours, so the note
		tracks the surrounding text in light and dark alike — the same pair the
		`th` and `.prop-renamed` rules already use.
	*/
	.prop-note-label {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	/* Upstream's control column: `flexBasis: 200, flexShrink: 0`, on the right. */
	.prop-control {
		width: 200px;
		text-align: end;
	}

	/*
		Narrow: the row stacks instead of scrolling. Upstream reaches the same
		layout through `useMediaQuery('(max-width: 768px)')` and a `VStack`; a
		query gets there without shipping a second copy of every row or a second
		instance of every control.

		The threshold is the width the five-column layout actually needs — a 200px
		control column, a name, a type, a default and a paragraph — measured against
		the table's own container rather than the window. That is what keeps the
		control column from putting a horizontal scrollbar on the table at any width.
	*/
	@container (max-width: 720px) {
		table,
		tbody,
		tr,
		td {
			display: block;
		}

		thead {
			display: none;
		}

		tr {
			padding-block: var(--spacing-3);
			border-block-end: 1px solid var(--color-border);
		}

		td {
			padding-inline: 0;
			padding-block: var(--spacing-1);
			border-block-end: 0;
		}

		.prop-name,
		.prop-type,
		.prop-default {
			min-width: 0;
			max-width: none;
			white-space: normal;
		}

		.prop-control {
			width: auto;
			text-align: start;
		}
	}
</style>
