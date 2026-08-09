<script lang="ts" module>
	import type { ComponentProps } from 'svelte';
	import type { StackCrossAlignment, StackMainAlignment } from './stack.stylex.js';

	export interface HStackProps extends Omit<
		ComponentProps<typeof Stack>,
		'direction' | 'hAlign' | 'vAlign'
	> {
		/** Main-axis alignment. */
		hAlign?: StackMainAlignment;
		/**
		 * Cross-axis alignment.
		 * @default 'stretch'
		 */
		vAlign?: StackCrossAlignment;
		/** Alias for `hAlign`. Mirrors `justify-content`. */
		justify?: StackMainAlignment;
		/** Alias for `vAlign`. Mirrors `align-items`. */
		align?: StackCrossAlignment;
	}
</script>

<script lang="ts">
	import Stack from './stack.svelte';

	/**
	 * `Stack` with `direction="horizontal"`. The alignment props narrow to the
	 * axis they actually control, which is the whole reason to reach for it over
	 * `Stack` — an `hAlign="stretch"` that only makes sense vertically stops
	 * type-checking.
	 */
	const { hAlign, vAlign, justify, align, ...rest }: HStackProps = $props();
</script>

<Stack {...rest} direction="horizontal" hAlign={hAlign ?? justify} vAlign={vAlign ?? align} />
