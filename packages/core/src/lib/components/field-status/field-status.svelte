<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { InputStatusType } from '../field/types.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { FieldStatusVariant } from './field-status.stylex.js';

	export interface FieldStatusProps extends BaseProps<HTMLDivElement> {
		type: InputStatusType;
		/** The status message. */
		message: string;
		/**
		 * - `attached`: overlaps the input above it, as `Field` uses it
		 * - `detached`: floats below with spacing, as `Switch` and `CheckboxInput` use it
		 * @default 'attached'
		 */
		variant?: FieldStatusVariant;
	}

	/**
	 * Maps each status type to its status glyph. Mirrors the mapping the input
	 * controls already use for the on-field status affordance, so the detached
	 * message shows the same icon a consumer sees elsewhere for that status.
	 */
	const statusIconMap: Record<InputStatusType, IconName> = {
		warning: 'warning',
		error: 'error',
		success: 'success'
	};
</script>

<script lang="ts">
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useEntryAnimation } from '../../hooks/use-entry-animation.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Icon from '../icon/icon.svelte';
	import {
		fieldStatusAttrs,
		fieldStatusDetachedContentAttrs,
		fieldStatusDetachedIconAttrs
	} from './field-status.stylex.js';

	/**
	 * A validation message for a form field.
	 *
	 * The `detached` variant renders a leading status icon before the message so
	 * status is not conveyed by color or position alone (WCAG 1.4.1). The icon is
	 * decorative for assistive tech (`aria-hidden`): the message text already
	 * names the status in words and is announced through the live region. The
	 * `attached` variant keeps its status affordance on the bordered input, so it
	 * renders no icon here to avoid a duplicate. The `tooltip` variant renders no
	 * message box at all — the input surfaces the status through a tooltip on its
	 * on-field icon — so callers skip rendering FieldStatus for it.
	 *
	 * Announcements go through `useAnnounce`'s persistent live regions rather than
	 * `role`/`aria-live` on the rendered element. A live region that mounts
	 * together with its content is not reliably announced, and FieldStatus is
	 * almost always conditionally rendered by its callers. The message is
	 * announced whenever it appears — including on first mount — and whenever it
	 * changes. The entry animation stays mount-only, so a message present at first
	 * paint appears settled and only one that arrives later slides in.
	 *
	 * @example
	 * ```svelte
	 * <FieldStatus type="error" message="This field is required" />
	 * <FieldStatus type="warning" message="Visible to others" variant="detached" />
	 * ```
	 */
	const {
		type,
		message,
		variant = 'attached',
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: FieldStatusProps = $props();

	const entryStyle = useEntryAnimation('slideDown');
	const announce = useAnnounce();

	// Announce-on-mount is intentional and matches upstream: callers mount
	// FieldStatus when a status appears, and a whole form can mount with a
	// server-side validation error already present. Both must be heard.
	$effect(() => {
		if (message) {
			announce(message, type === 'error' ? 'assertive' : 'polite');
		}
	});

	const attrs = $derived(fieldStatusAttrs(type, variant, entryStyle, xstyle));
	const theme = $derived(themeProps('field-status', { type, variant }));
	// Stable theme target on the detached message box's leading glyph itself, so
	// a theme can restyle just this icon (color, size) — and each status — via
	// `defineTheme`. Same-element rules in @layer astryx-theme win over the icon's
	// own base width/height/fontSize, which a field-level target could not reach.
	const iconTheme = $derived(themeProps('field-status-icon', { type }));

	const detachedContentAttrs = fieldStatusDetachedContentAttrs();
	const detachedIconAttrs = fieldStatusDetachedIconAttrs();
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{#if variant === 'detached'}
		<span class={detachedContentAttrs.class} style={detachedContentAttrs.style}>
			<span class={detachedIconAttrs.class} style={detachedIconAttrs.style}>
				<Icon icon={statusIconMap[type]} size="sm" color="inherit" {...iconTheme} />
			</span>
			<span>{message}</span>
		</span>
	{:else}
		{message}
	{/if}
</div>
