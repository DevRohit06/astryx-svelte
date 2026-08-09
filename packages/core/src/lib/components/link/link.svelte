<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type {
		TextColor,
		TextDisplay,
		TextSize,
		TextType,
		TextWeight
	} from '../text/text.stylex.js';
	import type { LinkComponentType } from './types.js';

	/**
	 * `BaseProps<HTMLElement>` is left generic (as `TextArea` does), and `onclick`
	 * is omitted so the narrowed redeclaration below replaces it rather than
	 * conflicting. `href`/`target`/`rel`/`download`/`referrerPolicy` are declared
	 * explicitly because they are not on the generic element type; `download` and
	 * `referrerPolicy` are declared but not destructured, so they flow through
	 * rest onto the anchor exactly as upstream leaves them.
	 */
	export interface LinkProps extends Omit<BaseProps<HTMLElement>, 'onclick'> {
		/** A custom link component or tag, overriding any `LinkProvider`. */
		as?: LinkComponentType;
		/** Accessible name — needed when the content is icon-only. */
		label?: string;
		/** Destination. Absent (with no `onclick`) renders a `<button>`. */
		href?: string;
		/**
		 * @default false
		 */
		hasUnderline?: boolean;
		/**
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Opens in a new tab with an external-link icon and a screen-reader hint,
		 * forcing `target="_blank"` and safe `rel` tokens.
		 * @default false
		 */
		isExternalLink?: boolean;
		/** Overrides the "(opens in new tab)" screen-reader hint for localisation. */
		newTabLabel?: string;
		/** Anchor target (e.g. `'_blank'`). `isExternalLink` forces `'_blank'`. */
		target?: string;
		/** Anchor rel. Safe tokens are auto-added for `target="_blank"`. */
		rel?: string;
		/** Anchor download attribute. */
		download?: string | boolean;
		/** Anchor referrer policy. */
		referrerPolicy?: ReferrerPolicy;
		/** Click handler. Lowercase — forwarded to the element (upstream `onClick`). */
		onclick?: (event: MouseEvent) => void;
		/** Tooltip text; wraps the link in a `Tooltip`. */
		tooltip?: string;
		/**
		 * Sizes the link as standalone body text rather than inheriting from
		 * surrounding text.
		 * @default false
		 */
		isStandalone?: boolean;
		/**
		 * @default 'body'
		 */
		type?: TextType;
		/** Passed to the inner `Text`. */
		size?: TextSize;
		/** Passed to the inner `Text`. */
		weight?: TextWeight;
		/**
		 * @default 'accent'
		 */
		color?: TextColor;
		/**
		 * @default 'inline'
		 */
		display?: TextDisplay;
		/**
		 * @default 0
		 */
		maxLines?: number;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useInteractiveRole } from '../../hooks/use-interactive-role.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Icon from '../icon/icon.svelte';
	import Text from '../text/text.svelte';
	import Tooltip from '../tooltip/tooltip.svelte';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { computeTargetAndRel } from './compute-target-and-rel.js';
	import LinkElement from './link-element.svelte';
	import { useLinkComponent } from './link-context.svelte.js';
	import { linkAttrs } from './link.stylex.js';

	/**
	 * A styled, polymorphic link. Renders a real `<a>` (through the app's
	 * `LinkProvider` component when one is set), falls back to a `<button>` when
	 * there is no `href`, and degrades to an inert, unfocusable `<a>` with no
	 * `href` when disabled. Typography comes from an inner `Text`.
	 *
	 * @example
	 * ```svelte
	 * <Link href="/docs">Documentation</Link>
	 * <Link href="https://github.com" isExternalLink>GitHub</Link>
	 * <Link href="/settings" color="secondary" hasUnderline>Settings</Link>
	 * ```
	 */
	let {
		as,
		label,
		href,
		hasUnderline = false,
		isDisabled = false,
		isExternalLink = false,
		newTabLabel: newTabLabelFromProps,
		target: targetFromProps,
		rel: relFromProps,
		onclick,
		tooltip,
		isStandalone = false,
		type = 'body',
		size,
		weight,
		color = 'accent',
		display = 'inline',
		maxLines = 0,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: LinkProps = $props();

	const t = useTranslator();
	const newTabLabel = $derived(newTabLabelFromProps ?? t('@astryx.link.newTab'));

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));

	const resolveRole = useInteractiveRole();
	const role = $derived(resolveRole({ href, onclick, isDisabled }));

	const targetAndRel = $derived(
		computeTargetAndRel(isExternalLink ? '_blank' : targetFromProps, relFromProps)
	);

	// `button` (context- or onclick-driven), or an inert item with no href, both
	// render as `<button>`.
	const renderAsButton = $derived(role === 'button' || (role === 'inert' && href == null));

	const theme = $derived(themeProps('link', { color }));
	const styleAttrs = $derived(
		linkAttrs(color, { isButton: renderAsButton, hasUnderline, isStandalone, isDisabled }, xstyle)
	);
	const rootClass = $derived(cx(theme.class, styleAttrs.class, className));
	const rootStyle = $derived(mergeStyle(styleAttrs.style, styleProp as string | undefined));

	// Props for the polymorphic (non-button, non-disabled) branch. Custom
	// components also get a `to={href}` alias; the native `<a>` never does.
	const linkComponentProps = $derived({
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		target: targetAndRel.target,
		rel: targetAndRel.rel,
		onclick,
		'aria-label': label || undefined,
		'aria-disabled': isDisabled || undefined,
		tabindex: isDisabled ? -1 : undefined,
		...theme,
		class: rootClass,
		style: rootStyle,
		...rest
	});

	// A disabled anchor renders href-less; defend against synthetic clicks.
	function preventDefaultClick(event: MouseEvent): void {
		event.preventDefault();
	}
</script>

{#snippet sharedContent()}
	<Text {type} {size} {weight} {color} {display} {maxLines}>{@render children()}</Text>
	{#if isExternalLink && !renderAsButton}
		<Icon icon="externalLink" size="xsm" color="inherit" />
		<VisuallyHidden>{newTabLabel}</VisuallyHidden>
	{/if}
{/snippet}

{#snippet linkBody()}
	{#if renderAsButton}
		<button
			type="button"
			{onclick}
			aria-label={label || undefined}
			aria-disabled={isDisabled || undefined}
			tabindex={isDisabled ? -1 : undefined}
			disabled={isDisabled}
			{...theme}
			class={rootClass}
			style={rootStyle}
			{...rest}
		>
			{@render sharedContent()}
		</button>
	{:else if isDisabled}
		<!-- A disabled link is deliberately an href-less, tab-removed anchor
		     (`tabindex=-1`): unfocusable and exposing no link affordance, so no
		     navigation or consumer click can fire. Upstream's exact shape. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<a
			onclick={preventDefaultClick}
			aria-label={label || undefined}
			aria-disabled="true"
			tabindex={-1}
			{...theme}
			class={rootClass}
			style={rootStyle}
			{...rest}
		>
			{@render sharedContent()}
		</a>
	{:else}
		<LinkElement component={linkResolved.component} props={linkComponentProps}>
			{@render sharedContent()}
		</LinkElement>
	{/if}
{/snippet}

{#if tooltip}
	<Tooltip content={tooltip} placement="above">{@render linkBody()}</Tooltip>
{:else}
	{@render linkBody()}
{/if}
