<script lang="ts">
	/**
	 * A `MarkdownComponents['image']` override.
	 *
	 * Upstream writes it inline in the test as
	 * `({src, alt}) => <span data-testid="custom-image" data-src={src}>{alt}</span>`;
	 * `MarkdownComponents.image` is a `Component<{src, alt}>` here, so it has to be
	 * a real component file.
	 */
	const { src, alt }: { src: string; alt: string } = $props();
</script>

<span data-testid="custom-image" data-src={src}>{alt}</span>
