<!--
	Neutral's icon registry — ported from Astryx's
	`packages/themes/neutral/src/icons.tsx`.

	Maps the 28 semantic icon names to Lucide glyphs. These icons are bundled with
	the theme, not with `@astryx-svelte/core`, which is upstream's arrangement and
	the reason core ships its own dependency-free placeholders instead.

	## Why this is a `.svelte` file

	Upstream's registry holds React *elements* — `<X size="1em" aria-hidden />` —
	so the theme can preset props on the glyphs it registers. Core's
	`IconRegistry` is `Record<IconName, Snippet>` for exactly that reason (see
	`icon-registry.ts`: a bare component reference cannot carry preset props). A
	`Snippet` is a compiler construct, so it cannot be built in a `.ts` module —
	hence markup, and hence a theme package that ships one `.svelte` file. Core's
	`components/icon/default-icons.svelte` is the same shape.

	Top-level snippets compile to module-scope functions, so `<script module>`
	collects them into the registry record directly. This file is a snippet
	library, not a component: its default export renders nothing.

	## The six deprecated Lucide names

	`CheckCircle`, `XCircle`, `AlertTriangle`, `MoreHorizontal`, `Filter` and
	`Columns` carry an `@deprecated` JSDoc tag in Lucide, which renamed them to
	`CircleCheckBig`, `CircleX`, `TriangleAlert`, `Ellipsis`, `Funnel` and
	`Columns2`. They are still real exports and still resolve to the same glyphs,
	and `lucide-react` carries the identical alias table — so upstream's file and
	this one draw the same icons. **They are kept under upstream's names on
	purpose.** Renaming them to the canonical ones would change nothing visible
	and would make this file stop matching the source it is transcribed from.
-->
<script module lang="ts">
	import type { IconRegistry } from '@astryx-svelte/core';
	import {
		X,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		ChevronsLeft,
		ChevronsRight,
		Check,
		CheckCircle,
		XCircle,
		AlertTriangle,
		Info,
		Calendar,
		Clock,
		ExternalLink,
		Menu,
		MoreHorizontal,
		Search,
		ArrowUp,
		ArrowDown,
		ArrowUpDown,
		Filter,
		EyeOff,
		Columns,
		Copy,
		CheckCheck,
		Wrench,
		Square,
		Mic
	} from '@lucide/svelte';

	// Upstream's `iconProps`, verbatim. `size` accepts a string, and Lucide
	// applies it as `width`/`height`, so `1em` makes every glyph track the
	// font-size the `Icon` wrapper sets. `aria-hidden` is redundant with Lucide's
	// own default but is passed anyway, as upstream passes it.
	const iconProps = { size: '1em', 'aria-hidden': true } as const;

	export const neutralIconRegistry: IconRegistry = {
		close,
		chevronDown,
		chevronLeft,
		chevronRight,
		chevronsLeft,
		chevronsRight,
		check,
		success,
		error,
		warning,
		info,
		calendar,
		clock,
		externalLink,
		menu,
		moreHorizontal,
		search,
		arrowUp,
		arrowDown,
		arrowsUpDown,
		funnel,
		eyeSlash,
		viewColumns,
		copy,
		checkDouble,
		wrench,
		stop,
		microphone
	};
</script>

{#snippet close()}<X {...iconProps} />{/snippet}
{#snippet chevronDown()}<ChevronDown {...iconProps} />{/snippet}
{#snippet chevronLeft()}<ChevronLeft {...iconProps} />{/snippet}
{#snippet chevronRight()}<ChevronRight {...iconProps} />{/snippet}
{#snippet chevronsLeft()}<ChevronsLeft {...iconProps} />{/snippet}
{#snippet chevronsRight()}<ChevronsRight {...iconProps} />{/snippet}
{#snippet check()}<Check {...iconProps} />{/snippet}
{#snippet success()}<CheckCircle {...iconProps} />{/snippet}
{#snippet error()}<XCircle {...iconProps} />{/snippet}
{#snippet warning()}<AlertTriangle {...iconProps} />{/snippet}
{#snippet info()}<Info {...iconProps} />{/snippet}
{#snippet calendar()}<Calendar {...iconProps} />{/snippet}
{#snippet clock()}<Clock {...iconProps} />{/snippet}
{#snippet externalLink()}<ExternalLink {...iconProps} />{/snippet}
{#snippet menu()}<Menu {...iconProps} />{/snippet}
{#snippet moreHorizontal()}<MoreHorizontal {...iconProps} />{/snippet}
{#snippet search()}<Search {...iconProps} />{/snippet}
{#snippet arrowUp()}<ArrowUp {...iconProps} />{/snippet}
{#snippet arrowDown()}<ArrowDown {...iconProps} />{/snippet}
{#snippet arrowsUpDown()}<ArrowUpDown {...iconProps} />{/snippet}
{#snippet funnel()}<Filter {...iconProps} />{/snippet}
{#snippet eyeSlash()}<EyeOff {...iconProps} />{/snippet}
{#snippet viewColumns()}<Columns {...iconProps} />{/snippet}
{#snippet copy()}<Copy {...iconProps} />{/snippet}
{#snippet checkDouble()}<CheckCheck {...iconProps} />{/snippet}
{#snippet wrench()}<Wrench {...iconProps} />{/snippet}
{#snippet stop()}<Square {...iconProps} />{/snippet}
{#snippet microphone()}<Mic {...iconProps} />{/snippet}
