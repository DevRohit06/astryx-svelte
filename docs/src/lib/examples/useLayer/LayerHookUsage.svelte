<!--
	Ported from upstream's `templates/blocks/components/Layer/LayerHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Center, Layer, Text, useLayer, VStack } from '@astryx-svelte/core';

	/**
	 * Upstream's `layer.render(node, {placement, alignment})` is the `<Layer>`
	 * component here — a Svelte hook cannot return markup, which is the split
	 * `useTooltip`/`useHoverCard`/`usePopover` all make. `ref` is `attachTrigger`,
	 * and `id` is required because `useLayer` cannot mint an SSR-stable one from
	 * inside a hook.
	 */
	const id = $props.id();

	const layer = useLayer(() => ({ id, mode: 'context', lightDismiss: true }));
</script>

<Center height={220}>
	<Button
		label={layer.isOpen ? 'Hide layer' : 'Show layer'}
		onclick={layer.isOpen ? layer.hide : layer.show}
		{@attach layer.attachTrigger}
	/>
	<Layer {layer} placement="below" alignment="center">
		<Card padding={3}>
			<VStack gap={1}>
				<Text type="body" weight="bold">Anchored content</Text>
				<Text type="body" color="secondary">
					useLayer provides positioning; you own semantics and surface.
				</Text>
			</VStack>
		</Card>
	</Layer>
</Center>
