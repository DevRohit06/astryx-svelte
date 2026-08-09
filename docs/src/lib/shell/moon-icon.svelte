<script lang="ts">
	/**
	 * The moon glyph for the colour-mode toggle.
	 *
	 * Upstream's `SharedTopNav` imports lucide-react's `Moon`. This port's `Icon`
	 * registry is the 26 glyphs the components themselves need and has no
	 * sun/moon pair, so the toggle previously borrowed `eyeSlash` — a documented
	 * stand-in that read as an eye, not a moon.
	 *
	 * A registry substitution is the right call when the glyph is incidental; it
	 * is the wrong call here, because the icon *is* the control's whole meaning.
	 * So the artwork is inlined as docs chrome, the same way `github-logo.svelte`
	 * is: it lives outside the design system, takes its colour from `currentColor`,
	 * and does not touch the `Icon` registry that the theme oracle covers.
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
	<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
</svg>
