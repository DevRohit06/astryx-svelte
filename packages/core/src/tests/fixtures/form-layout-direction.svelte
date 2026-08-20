<script lang="ts">
	import { useFormLayout } from '$lib/components/form-layout/form-layout-context.svelte.js';

	/**
	 * Upstream's `DirectionReader` — a child that reports the direction its
	 * enclosing `FormLayout` published, so the context can be asserted from the
	 * DOM rather than reached into.
	 */
	// `useFormLayout()` returns a getter for the whole context *value*, not the
	// bare direction — upstream's shape, restored when 0.4.5 added
	// `defaultOptionality` beside it. Rendering the getter's result directly
	// printed `[object Object]` and failed six cases from the moment the shape
	// changed, because `pnpm verify --fast` skips the browser project.
	const formLayout = useFormLayout();
</script>

<span data-testid="direction">{formLayout().direction}</span>
