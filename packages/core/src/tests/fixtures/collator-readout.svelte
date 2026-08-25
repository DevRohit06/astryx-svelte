<script lang="ts" module>
	/**
	 * Collator **identity**, made observable in the DOM.
	 *
	 * Upstream's memoization cases compare `result.current` between renders.
	 * There is nothing here to compare: `useCollator` returns a getter, so an
	 * instance `export const` would snapshot one instance forever, and `render()`
	 * hands back the *root* component — this readout is a child, so its instance
	 * exports are unreachable anyway. A stable per-instance number rendered
	 * beside the order turns "the same collator" into "the same text", which the
	 * suite can read the way it reads everything else.
	 */
	let nextId = 0;
	const ids = new WeakMap<Intl.Collator, number>();

	function idOf(collator: Intl.Collator): number {
		let id = ids.get(collator);
		if (id === undefined) {
			id = ++nextId;
			ids.set(collator, id);
		}
		return id;
	}
</script>

<script lang="ts">
	import { useCollator } from '$lib/i18n/use-collator.svelte.js';

	/**
	 * The consumer half of `use-collator-probe.svelte`. Separate component, not a
	 * snippet: `useCollator()` reads Svelte context and so must run during a
	 * component's *initialisation*, which a snippet body is too late for, and it
	 * has to sit below the provider for the context to reach it at all. Same
	 * arrangement as `direction-readout.svelte`.
	 */
	interface Props {
		/** The hook's own argument, passed straight through. */
		options?: () => Intl.CollatorOptions | undefined;
		/** The two strings every upstream case compares. */
		words?: string[];
		/**
		 * An input the collator does not depend on. `stamp` reads it, so changing
		 * it re-runs that derived and re-reads the collator — which is how the
		 * memoization case can tell a memoized getter from one that constructs on
		 * every call. Without it nothing would force a second read.
		 */
		label?: string;
	}

	const { options = () => undefined, words = ['z', 'ä'], label = 'a' }: Props = $props();

	// `useCollator(options)` would read the prop once, at initialisation, and hold
	// that arrow forever — the compiler says so (`state_referenced_locally`).
	// Wrapping keeps the prop read inside the hook's own `$derived`, which is
	// `clipboard-probe.svelte`'s `useClipboard(() => options())` for the same
	// reason.
	const collator = useCollator(() => options());

	const order = $derived([...words].sort((a, b) => collator().compare(a, b)).join(','));
	const compared = $derived(Math.sign(collator().compare(words[0], words[1])));
	const stamp = $derived(`${label}:${idOf(collator())}`);
</script>

<span data-testid="order">{order}</span>
<span data-testid="compare">{compared}</span>
<span data-testid="stamp">{stamp}</span>
