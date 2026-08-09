<script lang="ts" module>
	import type { ComponentProps } from 'svelte';
	import type { StackCrossAlignment, StackMainAlignment } from './stack.stylex.js';

	export interface VStackProps extends Omit<
		ComponentProps<typeof Stack>,
		'direction' | 'hAlign' | 'vAlign'
	> {
		/**
		 * Cross-axis alignment.
		 * @default 'stretch'
		 */
		hAlign?: StackCrossAlignment;
		/** Main-axis alignment. */
		vAlign?: StackMainAlignment;
		/** Alias for `vAlign`. Mirrors `justify-content`. */
		justify?: StackMainAlignment;
		/** Alias for `hAlign`. Mirrors `align-items`. */
		align?: StackCrossAlignment;
	}
</script>

<script lang="ts">
	import Stack from './stack.svelte';

	/**
	 * `Stack` with `direction="vertical"` — the default direction, so this exists
	 * for symmetry with `HStack` and to narrow the alignment props to the axis
	 * they control.
	 */
	const { hAlign, vAlign, justify, align, ...rest }: VStackProps = $props();
</script>

<Stack {...rest} direction="vertical" hAlign={hAlign ?? align} vAlign={vAlign ?? justify} />
