<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { Elevation } from '../../internal/types.js';
	import type { ButtonGroupOrientation } from '../../internal/contexts.svelte.js';
	import type { ButtonSize } from '../button/button.stylex.js';

	export interface ButtonGroupProps extends BaseProps<HTMLDivElement> {
		/**
		 * Button or IconButton children.
		 */
		children: Snippet;

		/**
		 * Accessible label for the group (used as aria-label).
		 */
		label: string;

		/**
		 * Orientation of the button group.
		 * @default 'horizontal'
		 */
		orientation?: ButtonGroupOrientation;
		/**
		 * Resting elevation for the whole group. Each raised tier also rounds the
		 * group, so the shadow follows the buttons' silhouette instead of tracing
		 * square container corners around rounded content.
		 * @default 'none'
		 */
		elevation?: Elevation;

		/**
		 * Default size for buttons in the group.
		 * Individual buttons can override this with their own `size` prop.
		 * @default 'md'
		 */
		size?: ButtonSize;

		/**
		 * Whether all buttons in the group are disabled.
		 * @default false
		 */
		isDisabled?: boolean;

		/**
		 * Test ID for testing frameworks.
		 */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import {
		setButtonGroupContext,
		setSizeContext,
		useSize
	} from '../../internal/contexts.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { buttonGroupAttrs } from './button-group.stylex.js';

	/**
	 * Groups buttons with connected styling — shared borders, proper
	 * border-radius handling (only on outer edges), and horizontal or vertical
	 * orientation, ported from Astryx's `ButtonGroup/ButtonGroup.tsx`.
	 *
	 * **Almost none of the connected look is here.** Children detect the group
	 * through context and apply position-aware styles in pure CSS, so this
	 * component is a flex container, two context providers, and a keyboard
	 * handler. That is upstream's design and the reason it needs no
	 * `cloneElement`, no wrapper divs and no child introspection — which is also
	 * why it ports without meeting React's `Children` API at all.
	 *
	 * The end-cap radius rules live in `button.stylex.ts`; see `IS_LAST_ITEM`
	 * there for why the trailing edge cannot use `:last-child`.
	 *
	 * Two things translated:
	 *
	 * **`composeEventHandlers` becomes an inlined two-step**, because its
	 * short-circuit is *behaviour* rather than plumbing: the consumer's handler
	 * runs first and can opt out of arrow navigation with `preventDefault()`.
	 * Dropping the guard would make the built-in navigation unblockable.
	 *
	 * **Both providers are `set*Context` calls at init**, where upstream nests
	 * two JSX providers. The group's own value and the *resolved* size travel
	 * separately, as upstream sends them: `size` goes through `SizeProvider` so
	 * a child `Button` with no `size` inherits it while an explicit one still
	 * wins, and the group value carries only `orientation` and `isDisabled`.
	 */
	const {
		children,
		label,
		orientation = 'horizontal',
		elevation = 'none',
		size: sizeProp,
		isDisabled = false,
		class: className,
		style,
		'data-testid': testId,
		onkeydown,
		xstyle,
		...rest
	}: ButtonGroupProps = $props();

	// Read before publish, and the order is load-bearing: Svelte's `setContext` is
	// visible to the same component's `getContext`, so hoisting `setSizeContext`
	// above this line would make `size` read the getter it just published and
	// re-enter its own derived. Reading first captures the *parent's* getter,
	// which is what makes a nested group resolve outward.
	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));

	const list = useListFocus(() => ({
		itemSelector: 'button, [tabindex="0"]',
		orientation
	}));

	setButtonGroupContext(() => ({ orientation, isDisabled }));
	setSizeContext(() => size);

	const attrs = $derived(buttonGroupAttrs(orientation === 'vertical', elevation, xstyle));
	const theme = $derived(themeProps('button-group', { size, orientation }));

	/**
	 * Upstream's `composeEventHandlers(onKeyDown, handleKeyDown)` — consumer
	 * first, so it can block the list navigation by preventing default.
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		onkeydown?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (event.defaultPrevented) {
			return;
		}
		list.handleKeyDown(event);
	}
</script>

<div
	{@attach list.attachList}
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, style)}
	role="group"
	aria-label={label}
	onkeydown={handleKeyDown}
	aria-disabled={isDisabled || undefined}
	data-testid={testId}
>
	{@render children()}
</div>
