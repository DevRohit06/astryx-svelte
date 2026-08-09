<script lang="ts">
	/**
	 * The sun glyph for the colour-mode toggle. See `moon-icon.svelte` for why
	 * these two are inlined as docs chrome rather than resolved from the `Icon`
	 * registry.
	 *
	 * Path data from Lucide (ISC), the icon set upstream itself uses.
	 */
	interface Props {
		size?: number;
	}

	const { size = 20 }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<circle cx="12" cy="12" r="4"></circle>
	<path d="M12 2v2"></path>
	<path d="M12 20v2"></path>
	<path d="m4.93 4.93 1.41 1.41"></path>
	<path d="m17.66 17.66 1.41 1.41"></path>
	<path d="M2 12h2"></path>
	<path d="M20 12h2"></path>
	<path d="m6.34 17.66-1.41 1.41"></path>
	<path d="m19.07 4.93-1.41 1.41"></path>
</svg>
