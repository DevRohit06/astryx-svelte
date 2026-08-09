<!--
	Ported from upstream's `templates/blocks/components/Blockquote/BlockquoteTestimonials.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Blockquote, Card, Grid, GridSpan } from '@astryx-svelte/core';
</script>

<Grid columns={2} gap={3} style="max-width: 600px">
	<Card padding={4}>
		<Blockquote>
			{#snippet cite()}Sarah K., Lead Engineer{/snippet}
			Shipping UI has never been this fast. Our team went from design to production in a single afternoon.
		</Blockquote>
	</Card>
	<Card padding={4}>
		<Blockquote>
			{#snippet cite()}Marcus T., Product Designer{/snippet}
			The token system means every new screen just looks right — no manual color or spacing decisions.
		</Blockquote>
	</Card>
	<GridSpan columns={2}>
		<Card padding={4}>
			<Blockquote>
				{#snippet cite()}Priya L., Engineering Manager{/snippet}
				Onboarding a new engineer used to take a week of design review. Now they're shipping accessible,
				polished components on day one.
			</Blockquote>
		</Card>
	</GridSpan>
</Grid>
