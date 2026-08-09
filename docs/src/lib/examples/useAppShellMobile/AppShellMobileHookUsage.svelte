<!--
	Ported from upstream's `templates/blocks/components/AppShell/AppShellMobileHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, Text, useAppShellMobile, VStack } from '@astryx-svelte/core';

	/**
	 * `useAppShellMobile()` returns a **getter**, so upstream's
	 * `const {closeMobileNav, isMobile, …} = useAppShellMobile()` must not be
	 * destructured here — destructuring would snapshot the values at init and
	 * stop tracking the surrounding `AppShell`'s state, which is exactly what
	 * `useThemeHookUsage` had to avoid too. Every read goes through `mobile()`.
	 *
	 * Upstream's three `return` branches become an `{#if}` chain, the standing
	 * translation of a React early return.
	 */
	const mobile = useAppShellMobile();
</script>

{#if !mobile().isMobileNavEnabled}
	<VStack gap={2}>
		<Button label="Open navigation" variant="secondary" isDisabled />
		<Text type="body" color="secondary">
			No active AppShell mobile navigation context was detected. This hook returns safe defaults
			outside AppShell, or when the surrounding AppShell has mobile navigation disabled.
		</Text>
	</VStack>
{:else if !mobile().isMobile}
	<VStack gap={2}>
		<Button label="Open navigation" variant="secondary" isDisabled />
		<Text type="body" color="secondary">
			AppShell mobile navigation context is available. Narrow the viewport below the AppShell mobile
			breakpoint to make the custom trigger active.
		</Text>
	</VStack>
{:else}
	<VStack gap={2}>
		<HStack gap={2} vAlign="center">
			<Button
				label={mobile().isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
				variant="secondary"
				onclick={mobile().isMobileNavOpen ? mobile().closeMobileNav : mobile().openMobileNav}
			/>
			<Text type="body" color="secondary">
				{mobile().isMobileNavOpen ? 'Mobile nav is open' : 'Mobile nav is closed'}
			</Text>
		</HStack>
		<Text type="body" color="secondary">
			This button controls the nearest AppShell mobile nav from context; in the docsite it opens and
			closes the surrounding page navigation.
		</Text>
	</VStack>
{/if}
