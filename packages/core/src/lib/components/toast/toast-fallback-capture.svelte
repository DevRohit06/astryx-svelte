<script lang="ts">
	import { useToastContext } from './toast-context.js';
	import { setFallbackCapture } from './fallback-slot.js';

	/**
	 * Upstream's `FallbackCapture`: a child of the fallback `ToastViewport` whose
	 * only job is to read the context the viewport just published and hand it back
	 * out to the module-level singleton in `use-toast.svelte.ts`.
	 *
	 * Upstream captures in a `useEffect` guarded by a `doneRef`; here the context
	 * read at init is already once-per-instance, and `mount()` being synchronous
	 * means it has happened before `getFallbackContext()` resumes. See
	 * `fallback-slot.ts` for why the handoff is a module slot and not a prop.
	 */
	const ctx = useToastContext();
	if (ctx) {
		setFallbackCapture(ctx());
	}
</script>
