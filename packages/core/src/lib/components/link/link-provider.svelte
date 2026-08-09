<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LinkComponentType } from './types.js';

	export interface LinkProviderProps {
		/** The link component every descendant `Link`/`Item` should route through. */
		component: LinkComponentType;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { setLinkContext } from './link-context.svelte.js';

	/**
	 * Publishes a custom link component to every Astryx `Link` and `Item` below
	 * it, so navigation goes through the app's router instead of a full-page
	 * `<a>`. Renders only its children — no DOM wrapper.
	 *
	 * @example
	 * ```svelte
	 * <LinkProvider component={SvelteKitLink}>
	 *   <App />
	 * </LinkProvider>
	 * ```
	 */
	let { component, children }: LinkProviderProps = $props();

	setLinkContext(() => ({ component }));
</script>

{@render children()}
