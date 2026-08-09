<script lang="ts">
	import LinkElement from '$lib/components/link/link-element.svelte';
	import { useLinkComponent } from '$lib/components/link/link-context.svelte.js';
	import type { LinkComponentType } from '$lib/components/link/types.js';

	/**
	 * Upstream's `TestConsumer`, and the `renderHook` stand-in for
	 * `useLinkComponent`. It resolves the link component, then renders it through
	 * `link-element.svelte` exactly as `link.svelte`/`item.svelte` do — injecting
	 * `to={href}` for a custom component and never for the native `'a'`. So the
	 * rendered element carries (or omits) `to` precisely as a real consumer makes
	 * it, which is what upstream's `to`-prop cases assert against.
	 */
	interface Props {
		as?: LinkComponentType;
	}

	// Renamed off `as` locally — bare `as` is a TS contextual keyword that
	// svelte-check misreads in the generated code — while the prop stays `as`.
	const { as: asProp }: Props = $props();

	const resolve = useLinkComponent();
	const resolved = $derived(resolve(asProp));
	const elementProps = $derived<Record<string, unknown>>({
		href: '/test',
		'data-testid': 'resolved-link',
		...(resolved.isNative ? {} : { to: '/test' })
	});
</script>

<LinkElement component={resolved.component} props={elementProps}>Link</LinkElement>
