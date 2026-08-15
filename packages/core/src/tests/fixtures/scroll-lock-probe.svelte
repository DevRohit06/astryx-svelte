<script lang="ts">
	import { useScrollLock } from '$lib/hooks/use-scroll-lock.svelte.js';

	/**
	 * `renderHook`'s stand-in for `useScrollLock`. The hook returns nothing and
	 * exists only for its effect, so the probe renders nothing and needs no
	 * instance export: the observable surface is `document.body`'s inline style
	 * and `window.scrollTo`, which is exactly what upstream's cases assert on.
	 *
	 * Mounting the probe is the lock; unmounting it is the release. Two mounted
	 * probes are two concurrent locks — a Dialog that opened a Drawer — which is
	 * what the second and third cases need and what upstream builds with two
	 * `renderHook` calls.
	 *
	 * `locked` is a prop so the getter the hook takes has something live to read;
	 * upstream passes the literal `true` in all three cases, and so does the
	 * default here.
	 */
	const { locked = true }: { locked?: boolean } = $props();

	useScrollLock(() => locked);
</script>
