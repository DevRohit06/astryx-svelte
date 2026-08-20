<script lang="ts">
	import {
		useClipboard,
		type UseClipboardOptions,
		type UseClipboardReturn
	} from '$lib/hooks/use-clipboard.svelte.js';

	/**
	 * `renderHook`'s stand-in for `useClipboard`, following
	 * `long-press-probe.svelte`: the instance export is what the test reads, in
	 * place of `result.current`.
	 *
	 * The whole return object is exported rather than its two members, because
	 * `isCopied` is a *getter* on it — destructuring here would snapshot the
	 * boolean at init and every case that watches it flip would assert against a
	 * frozen `false`. The probe renders nothing: upstream's cases observe
	 * `result.current` and the live region, never rendered output.
	 *
	 * It must still be a component. `useClipboard`'s reset-timer teardown is an
	 * `$effect`, so the hook has to run inside a component's init for upstream's
	 * unmount case to have anything to tear down.
	 */
	const { options = () => ({}) }: { options?: () => UseClipboardOptions } = $props();

	export const clipboard: UseClipboardReturn = useClipboard(() => options());
</script>
