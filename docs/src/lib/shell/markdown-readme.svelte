<script lang="ts">
	import { Markdown } from '@astryx-svelte/core';
	import MarkdownHeading from './markdown-heading.svelte';
	import { setHeadingIds } from './markdown-heading-ids.js';

	/**
	 * A README rendered through `Markdown`, with the outline's ids on its
	 * headings.
	 *
	 * This is the provider half of `markdown-heading-ids.ts`, and it is a
	 * separate component only so that the id cursor it owns is created and
	 * destroyed with one README. `package-stub-page.svelte` renders it inside a
	 * `{#key body}`.
	 */
	const { body, headingIds }: { body: string; headingIds: string[] } = $props();

	setHeadingIds(() => headingIds);

	const components = { heading: MarkdownHeading };
</script>

<!-- `Markdown`'s `children` is the source **string**, not a snippet, so it is
     passed as a prop rather than as component content. -->
<Markdown headingLevelStart={1} contentWidth={800} {components} children={body} />
