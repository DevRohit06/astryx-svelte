<!--
	Ported from upstream's `templates/blocks/components/Hooks/useContainerRevealHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Three translations, each this port's standing shape rather than a change to
	the example:

	- `useContainerReveal` returns **props objects**, not a node, so it needs no
	  hook/layer split (the `renderTooltip` → `<TooltipLayer>` rule): the two
	  getters come back as `{class, style}` and spread straight onto the row and
	  onto the actions.
	- Upstream factors the row into a `FileRow` component so each row calls the
	  hook once. A Svelte snippet is not a component instance and cannot call a
	  hook, so the three instances are created here and the three rows are written
	  out longhand — which is how upstream lists them anyway.
	- Upstream's local `stylex.create` has no counterpart: a `.svelte` file may
	  not import StyleX. Its two rules are plain `style` attributes with the same
	  declarations, and `mergeProps(getContentRevealProps(), stylex.props(…))`
	  becomes the spread followed by that attribute — same order, so the same
	  side wins.

	Upstream passes Heroicons' `Pencil`/`Trash`; the registry ships neither, so
	this substitutes `wrench`/`close` — the same substitution `ButtonWithIcon`
	makes, retiring with the icon registry (TODO.md).
-->
<script lang="ts">
	import { Button, Card, Icon, Item, Stack, Text, useContainerReveal } from '@astryx-svelte/core';

	// Spreading getContainerProps() on the row gives it a scoped hover/focus-within
	// trigger; getContentRevealProps() hides the actions at rest and reveals them
	// when the row is hovered or focused.
	const report = useContainerReveal();
	const budget = useContainerReveal();
	const notes = useContainerReveal();
</script>

{#snippet reportActions()}
	<span {...report.getContentRevealProps()} style="display: flex; gap: 4px">
		<Button label="Edit report.pdf" variant="ghost" isIconOnly>
			{#snippet icon()}<Icon icon="wrench" size="sm" />{/snippet}
		</Button>
		<Button label="Delete report.pdf" variant="ghost" isIconOnly>
			{#snippet icon()}<Icon icon="close" size="sm" />{/snippet}
		</Button>
	</span>
{/snippet}

{#snippet budgetActions()}
	<span {...budget.getContentRevealProps()} style="display: flex; gap: 4px">
		<Button label="Edit budget.xlsx" variant="ghost" isIconOnly>
			{#snippet icon()}<Icon icon="wrench" size="sm" />{/snippet}
		</Button>
		<Button label="Delete budget.xlsx" variant="ghost" isIconOnly>
			{#snippet icon()}<Icon icon="close" size="sm" />{/snippet}
		</Button>
	</span>
{/snippet}

{#snippet notesActions()}
	<span {...notes.getContentRevealProps()} style="display: flex; gap: 4px">
		<Button label="Edit notes.txt" variant="ghost" isIconOnly>
			{#snippet icon()}<Icon icon="wrench" size="sm" />{/snippet}
		</Button>
		<Button label="Delete notes.txt" variant="ghost" isIconOnly>
			{#snippet icon()}<Icon icon="close" size="sm" />{/snippet}
		</Button>
	</span>
{/snippet}

<Card width={420} padding={2}>
	<Stack gap={0}>
		<Text type="supporting" color="secondary" style="padding-inline: 12px; padding-bottom: 8px">
			Hover a row — or Tab into it — to reveal its actions. On touch they stay visible.
		</Text>
		<Item
			label="report.pdf"
			description="Edited 2 hours ago"
			endContent={reportActions}
			{...report.getContainerProps()}
		/>
		<Item
			label="budget.xlsx"
			description="Edited 2 hours ago"
			endContent={budgetActions}
			{...budget.getContainerProps()}
		/>
		<Item
			label="notes.txt"
			description="Edited 2 hours ago"
			endContent={notesActions}
			{...notes.getContainerProps()}
		/>
	</Stack>
</Card>
