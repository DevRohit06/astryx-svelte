<script lang="ts">
	/**
	 * The Discord mark, ported from upstream's `components/logos.tsx`
	 * `DiscordLogo` — same `0 0 16 16` viewBox and the same path data.
	 *
	 * **It is the only one of upstream's brand logos that travels with the port.**
	 * `logos.tsx` also exports Facebook, Instagram, Threads and X marks, and those
	 * four are Meta's own accounts — `site-footer.svelte` records why this port
	 * ships neither Meta's trademarks nor its channels. Discord is different: the
	 * invite is the design system's community server, not a marketing account, so
	 * it is the one channel a reader of *this* site is still served by. Which is
	 * also why it is the one link on `/community` that is deliberately **not**
	 * retargeted at this repo.
	 *
	 * Props deliberately match `github-logo.svelte`: plain pixel `width`/`height`
	 * and `fill="currentColor"`, so the two are interchangeable wherever a channel
	 * row picks its mark and both take the surrounding ink.
	 */
	interface Props {
		width?: number;
		height?: number;
	}

	const { width = 20, height = 20 }: Props = $props();
</script>

<svg {width} {height} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
	<path
		d="M13.554 3.005A13.3 13.3 0 0 0 10.253 2a9 9 0 0 0-.423.85 12.5 12.5 0 0 0-3.664 0A9 9 0 0 0 5.744 2c-1.14.193-2.252.532-3.304 1.007C.351 6.066-.215 9.05.068 11.99A13.4 13.4 0 0 0 4.116 14c.328-.436.618-.9.867-1.384a8.6 8.6 0 0 1-1.365-.645q.173-.124.335-.249a9.6 9.6 0 0 0 8.094 0q.165.134.335.25c-.435.255-.894.47-1.368.646q.375.727.867 1.382a13.3 13.3 0 0 0 4.051-2.01c.332-3.41-.568-6.365-2.379-8.985m-8.212 7.176c-.789 0-1.44-.709-1.44-1.58S4.53 7.013 5.34 7.013s1.456.715 1.442 1.586-.636 1.58-1.44 1.58m5.316 0c-.79 0-1.44-.709-1.44-1.58s.63-1.587 1.44-1.587 1.452.715 1.438 1.586-.634 1.58-1.438 1.58"
	></path>
</svg>
