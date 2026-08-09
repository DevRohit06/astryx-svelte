<script lang="ts">
	import KeyboardHintLayer from '$lib/hooks/keyboard-hint-layer.svelte';
	import {
		useKeyboardHint,
		type KeyboardHintOrientation
	} from '$lib/hooks/use-keyboard-hint.svelte.js';

	/**
	 * Upstream's `TestHint` — `const {hintElement} = useKeyboardHint({orientation});
	 * return <div>{hintElement}</div>;` — as a probe fixture.
	 *
	 * The hook cannot return markup here, so `hintElement` is
	 * `<KeyboardHintLayer {hint} />`; the probe renders nothing else, which is
	 * upstream's shape exactly. The wrapping `<div>` is kept so the queries run
	 * against the same tree depth.
	 *
	 * `id` has no upstream counterpart and is minted here rather than passed in:
	 * `$props.id()` is only callable at the top level of a component, which is why
	 * the hook takes it as a required option in the first place.
	 */
	const { orientation }: { orientation?: KeyboardHintOrientation } = $props();

	const id = $props.id();
	const hint = useKeyboardHint(() => ({ id, orientation }));
</script>

<div>
	<KeyboardHintLayer {hint} />
</div>
