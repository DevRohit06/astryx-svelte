<script lang="ts">
	/**
	 * The heart-handshake glyph for the top nav's Community button.
	 *
	 * Upstream's `SharedTopNav` imports lucide-react's `HeartHandshake`. This is a
	 * docs-local mark for the same reason `moon-icon.svelte` and `sun-icon.svelte`
	 * are: the `Icon` registry is the 26 glyphs the components themselves need,
	 * and it has no handshake — but more to the point, a registry substitution is
	 * only right when the glyph is incidental, and here the icon *is* the control's
	 * whole meaning. So the artwork lives outside the design system, takes its
	 * colour from `currentColor`, and never touches the registry the theme oracle
	 * covers.
	 *
	 * Path data from Lucide (ISC) — verified byte-identical between
	 * `lucide-react@1.25.0`, which is what upstream resolves, and
	 * `@lucide/svelte@1.30.0`.
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
	<path
		d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"
	></path>
</svg>
