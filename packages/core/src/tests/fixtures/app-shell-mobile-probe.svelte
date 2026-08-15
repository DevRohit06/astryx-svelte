<script lang="ts">
	import { useAppShellMobile } from '$lib/components/app-shell/app-shell-mobile-context.svelte.js';

	/**
	 * Upstream's `MobileProbe` from `AppShell.test.tsx`: it calls
	 * `useAppShellMobile()` and renders the result as JSON so a test can read
	 * hook state out of the DOM. Svelte has no `renderHook`, and this is the
	 * probe-fixture substitute CLAUDE.md describes.
	 *
	 * The hook returns a **getter**, so the JSON is `$derived` rather than
	 * computed once — reading it inside the derived is what makes the probe
	 * re-render when the drawer opens, which upstream gets from React re-running
	 * the component.
	 */
	const appShellMobile = useAppShellMobile();

	const state = $derived.by(() => {
		const { isMobile, isMobileNavOpen, isMobileNavEnabled, mobileNavId } = appShellMobile();
		return JSON.stringify({
			isMobile,
			isMobileNavOpen,
			isMobileNavEnabled,
			hasId: mobileNavId != null
		});
	});
</script>

<span data-testid="probe">{state}</span>
