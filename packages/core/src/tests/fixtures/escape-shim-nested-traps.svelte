<script lang="ts">
	import EscapeShimTrap from './escape-shim-trap.svelte';

	/**
	 * Upstream's `<Trap><Trap /></Trap>` for the nested-traps case: two active
	 * Escape traps, the inner one inside the outer one's subtree, mounted and
	 * unmounted together.
	 *
	 * A fixture because the nesting is component *content*, which is a snippet
	 * here and cannot be written in a `render()` props object.
	 */
</script>

<EscapeShimTrap>
	<EscapeShimTrap />
</EscapeShimTrap>
