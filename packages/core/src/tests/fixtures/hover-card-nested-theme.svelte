<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';
	import Button from '$lib/components/button/button.svelte';
	import Theme from '$lib/theme/theme.svelte';
	import { defineTheme } from '$lib/theme/define-theme.js';

	/**
	 * Upstream's nested-theme tree, verbatim. The point is that the corrective
	 * portal must stop at the *inner* theme scope: a layer hoisted past it renders
	 * under a theme its trigger was never written under.
	 *
	 * Needs a fixture rather than an inline tree for the reason
	 * `icon-nested-theme.svelte` records — `render()` takes one component.
	 */
	interface Props {
		/** Hover-open delay, in ms. */
		delay?: number;
	}

	const { delay }: Props = $props();

	const outerTheme = defineTheme({ name: 'hovercard-outer-test' });
	const innerTheme = defineTheme({
		name: 'hovercard-inner-test',
		components: {
			hovercard: { base: { borderWidth: '7px' } },
			button: { base: { fontWeight: '700' } }
		}
	});
</script>

{#snippet content()}<Button label="View profile" />{/snippet}

<Theme theme={outerTheme}>
	<Theme theme={innerTheme}>
		<!--
			`children` as a prop is the only form that reaches the text branch — the
			identical constraint `hover-card-in-link.svelte` records.
		-->
		<p><HoverCard {content} {delay} children="Trigger" /></p>
	</Theme>
</Theme>
