<script lang="ts">
	import AspectRatio, {
		type AspectRatioProps
	} from '$lib/components/aspect-ratio/aspect-ratio.svelte';

	/**
	 * Renders an `AspectRatio` around exactly one child element.
	 *
	 * `children` is a `Snippet` here, so upstream's inline `<div>Content</div>`,
	 * `<img …/>` and `<video …/>` children cannot be handed over as values — a
	 * snippet can only be authored in a template. `child` picks which of the
	 * three, and `childClass`/`childStyle` exist for the two cases that assert
	 * the child's own attributes reach the DOM untouched.
	 *
	 * The shared `slot-probe` cannot stand in: it always renders a `<span>`, and
	 * six of these cases need a real `<img>` or `<video>` for the `object-fit`
	 * baseline rules to be about anything.
	 */
	interface Props {
		/** The `AspectRatio`'s own props, `ratio` included. */
		rest: Omit<AspectRatioProps, 'children'>;
		/** Which element to render inside the ratio box. */
		child?: 'div' | 'img' | 'video';
		/** `data-testid` on the child, when the case needs to find it. */
		testid?: string;
		/** Text content, for the `div` child. */
		text?: string;
		/** The child's own `class`. */
		childClass?: string;
		/** The child's own inline `style`. */
		childStyle?: string;
	}

	const { rest, child = 'div', testid, text = 'Content', childClass, childStyle }: Props = $props();

	/**
	 * Assembled as one object and spread, rather than written as `class={…}`
	 * attributes: an unset value then emits no attribute at all, which is what
	 * two cases assert with `not.toHaveAttribute('class')`.
	 */
	const childAttrs = $derived({
		...(testid == null ? {} : { 'data-testid': testid }),
		...(childClass == null ? {} : { class: childClass }),
		...(childStyle == null ? {} : { style: childStyle })
	});
</script>

<AspectRatio {...rest}>
	{#if child === 'img'}
		<img src="test.jpg" alt="Test" {...childAttrs} />
	{:else if child === 'video'}
		<video src="test.mp4" {...childAttrs}></video>
	{:else}
		<div {...childAttrs}>{text}</div>
	{/if}
</AspectRatio>
