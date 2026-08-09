<script lang="ts">
	import { HStack, Icon, IconButton, Text, VStack } from '@astryx-svelte/core';

	/**
	 * Live, theme-aware chat composer, ported from upstream's
	 * `_landing/CliPreview.tsx`.
	 *
	 * Same reasoning as `components-preview.svelte`: it replaced a baked
	 * `/feature-cli.png` that stayed light on the dark surface.
	 *
	 * This one is deliberately *not* the real `ChatComposer` — upstream builds it
	 * out of `HStack` + `Text` + `IconButton` with its own pill styling, so the
	 * unported `Chat` family is not a blocker here.
	 */
</script>

<!--
	Upstream's send glyph is lucide's `Send`. Registry substitution: this port's
	built-in set is the 26 the components themselves need, and `arrowUp` is the
	nearest reading of "submit this message". Retires with the icon registry
	(TODO.md → Phase 3).
-->
{#snippet sendIcon()}<Icon icon="arrowUp" size="sm" />{/snippet}

<div class="root" inert>
	<VStack gap={3} align="stretch">
		<div class="helper">
			<Text type="supporting" color="secondary">How can i help you today?</Text>
		</div>

		<div class="pill">
			<HStack gap={2} vAlign="center" hAlign="between">
				<div class="message">
					<Text type="body" color="primary" maxLines={1}>Can you create me a table page</Text>
				</div>
				<IconButton label="Send message" icon={sendIcon} size="md" class="send-button" />
			</HStack>
		</div>
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

	.helper {
		padding-inline-start: var(--spacing-3);
	}

	.pill {
		width: 100%;
		background-color: var(--color-background-surface);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-low);
		padding-block: var(--spacing-2);
		padding-inline-start: var(--spacing-5);
		padding-inline-end: var(--spacing-2);
	}

	.message {
		min-width: 0;
		flex: 1;
	}

	.root :global(.send-button) {
		border-radius: var(--radius-full);
		flex-shrink: 0;
		background-color: var(--color-background-inverted);
		color: var(--color-background-surface);
	}
</style>
