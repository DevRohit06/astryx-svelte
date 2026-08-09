<script lang="ts">
	/**
	 * The Astryx mark, drawn in this port's brand colour (`--color-brand`, Svelte
	 * orange) rather than Astryx blue — the same identity the favicon already
	 * carries.
	 *
	 * It is **docs chrome**, not a component: `docs.css`'s contract is that
	 * nothing in the docs app restyles a core component, so the mark lives here
	 * and takes its colour from a docs-level token instead of `--color-accent`,
	 * which belongs to the theme and is byte-matched against upstream by the
	 * theme oracle.
	 *
	 * `fill="currentColor"` so the colour is set in CSS by the consumer; `size` is
	 * a plain number of px.
	 */
	interface Props {
		size?: number;
		/** Rendered decoratively (`aria-hidden`) when the adjacent text names it. */
		isDecorative?: boolean;
	}

	const { size = 24, isDecorative = false }: Props = $props();
</script>

<svg
	class="astryx-logo"
	viewBox="0 0 40 40"
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	role={isDecorative ? undefined : 'img'}
	aria-label={isDecorative ? undefined : 'Astryx'}
	aria-hidden={isDecorative ? 'true' : undefined}
>
	<path
		d="M11.2002 0C14.7347 0.000105757 17.6 2.8654 17.6001 6.3999V11.2002C17.6002 12.3047 18.4956 13.2002 19.6001 13.2002H20.3999C21.5044 13.2002 22.3998 12.3047 22.3999 11.2002V6.3999C22.4 2.8654 25.2653 0.000106275 28.7998 0H37.6001C38.9255 5.15369e-05 39.9999 1.07451 40 2.3999V11.2002C39.9999 14.7347 37.1346 17.6 33.6001 17.6001H28.7998C27.6953 17.6002 26.7998 18.4956 26.7998 19.6001V20.3999C26.7998 21.5044 27.6953 22.3998 28.7998 22.3999H33.6001C37.1346 22.4 39.9999 25.2653 40 28.7998V37.6001C40 38.9255 38.9255 39.9999 37.6001 40H28.7998C25.2653 39.9999 22.3999 37.1346 22.3999 33.6001V28.7998C22.3998 27.6953 21.5044 26.7998 20.3999 26.7998H19.6001C18.4956 26.7998 17.6002 27.6953 17.6001 28.7998V33.6001C17.6001 37.1346 14.7347 39.9999 11.2002 40H2.39991C1.07449 39.9999 3.97232e-05 38.9255 0 37.6001V28.7998C0.000118127 25.2653 2.86539 22.4 6.3999 22.3999H11.2002C12.3047 22.3998 13.2002 21.5044 13.2002 20.3999V19.6001C13.2002 18.4956 12.3047 17.6002 11.2002 17.6001H6.3999C2.86538 17.6 9.39063e-05 14.7347 0 11.2002V2.3999C6.46793e-05 1.07451 1.07451 5.28641e-05 2.39991 0H11.2002Z"
	></path>
</svg>

<style>
	.astryx-logo {
		display: block;
		color: var(--color-brand);
	}
</style>
