<!--
	Ported from upstream's `templates/blocks/components/Tooltip/TooltipHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Center, TooltipLayer, useTooltip } from '@astryx-svelte/core';

	/**
	 * Two translations, both this port's standing shapes rather than changes to
	 * the example: `useTooltip` takes its options as a getter, and its render half
	 * is a `<TooltipLayer>` component instead of upstream's `renderTooltip()` —
	 * a hook cannot return markup in Svelte. Upstream's `ref` is `attachTrigger`.
	 *
	 * `id` is required here and absent upstream: `useLayer` cannot mint an
	 * SSR-stable id from inside a hook, so the caller passes `$props.id()`.
	 */
	const id = $props.id();

	const tooltip = useTooltip(() => ({
		id,
		placement: 'above',
		delay: 100
	}));
</script>

<Center>
	<Button
		label="Using hook directly"
		aria-describedby={tooltip.describedBy}
		{@attach tooltip.attachTrigger}
	/>
	<TooltipLayer {tooltip}>Tooltip via hook</TooltipLayer>
</Center>
