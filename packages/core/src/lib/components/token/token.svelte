<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { TokenColor, TokenSize } from './token.stylex.js';

	export interface TokenProps extends BaseProps<HTMLElement> {
		/** The text label displayed in the token. */
		label: string;
		/** @default 'md' */
		size?: TokenSize;
		/** @default 'default' */
		color?: TokenColor;
		/** Optional icon rendered before the label. */
		icon?: Snippet;
		/** @default false */
		isDisabled?: boolean;
		/** When provided, a remove (X) button is rendered. */
		onRemove?: (event: MouseEvent) => void;
		/**
		 * Click handler. When provided (or when an interactive-role context
		 * supplies `button`), the token renders as a `<span>` container with an
		 * invisible `<button>` inside for accessibility.
		 */
		onclick?: (event: MouseEvent) => void;
		/** Link URL. When provided, the token renders as an `<a>`. */
		href?: string;
		/** Accessible description for the token. */
		description?: string;
		/** Content rendered after the label (before the remove button, if present). */
		endContent?: Snippet;
		/** Visually hide the label while keeping it accessible. @default false */
		isLabelHidden?: boolean;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useInteractiveRole } from '../../hooks/use-interactive-role.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Icon from '../icon/icon.svelte';
	import TokenLink from './token-link.svelte';
	import {
		tokenInvisibleButtonAttrs,
		tokenLabelAttrs,
		tokenRemoveButtonAttrs,
		tokenRootAttrs
	} from './token.stylex.js';

	/**
	 * A chip/tag for displaying entities inline. Renders as a `<span>` by default,
	 * an `<a>` when `href` is set, or a `<span>` container with an invisible
	 * `<button>` when `onclick` is set (so focus outlines wrap the whole token).
	 * When both `href` and `onRemove` are set the same container pattern is used
	 * with an invisible `<a>`, so the remove `<button>` is a *sibling* of the link
	 * rather than nested inside it (`token-link.svelte`).
	 *
	 * Like upstream, `TokenProps` extends `BaseProps` but the component reads a
	 * closed list of props — `id`/`role`/`aria-*`/handlers passed on top are
	 * accepted by the type and dropped at runtime (documented under Known debts).
	 */
	const {
		label,
		size = 'md',
		color = 'default',
		icon,
		isDisabled = false,
		onRemove,
		onclick,
		href,
		description,
		endContent,
		isLabelHidden = false,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId
	}: TokenProps = $props();

	const resolveRole = useInteractiveRole();
	const resolveLink = useLinkComponent();
	const t = useTranslator();

	const role = $derived(resolveRole({ href, onclick, isDisabled }));
	// A context-provided 'button' role with no explicit onclick still takes the
	// onClick branch, with a noop handler (the popover attaches its own).
	const effectiveOnClick = $derived(onclick ?? (role === 'button' ? () => {} : null));
	const linkResolved = $derived(resolveLink());

	// With a remove button the link cannot be the root — nesting a `<button>`
	// inside an `<a>` is invalid HTML (WCAG 4.1.2) — so the token surface becomes
	// a clickable container delegating to an inner link. See `token-link.svelte`.
	const isLinkWithRemove = $derived(role === 'link' && onRemove != null);

	const theme = $derived(themeProps('token', { color, size }));
	const rootAttrs = $derived.by(() => {
		if (role === 'link') {
			// The container branch takes the `:has(:focus-visible)` outline so the
			// ring wraps the whole token when the inner link takes focus, exactly as
			// the onClick container branch does.
			return tokenRootAttrs(
				{ color, size, interactive: true, focusWithin: isLinkWithRemove, isDisabled },
				xstyle
			);
		}
		if (effectiveOnClick != null) {
			return tokenRootAttrs(
				{ color, size, interactive: true, focusWithin: true, isDisabled },
				xstyle
			);
		}
		return tokenRootAttrs(
			{ color, size, interactive: false, focusWithin: false, isDisabled },
			xstyle
		);
	});
	const labelAttrs = $derived(tokenLabelAttrs(isLabelHidden));
	const invisibleButtonAttrs = tokenInvisibleButtonAttrs();
	const removeButtonAttrs = tokenRemoveButtonAttrs();

	const rootClass = $derived(cx(theme.class, rootAttrs.class, className));
	const rootStyle = $derived(mergeStyle(rootAttrs.style, styleProp as string | undefined));
	const ariaLabel = $derived(isLabelHidden ? label : undefined);
	// `data-testid` + the two conditional ARIA attrs, spread as a record so
	// `aria-description` (ARIA 1.3, absent from Svelte's element typings) type-checks.
	const sharedAria: Record<string, string | undefined> = $derived({
		'data-testid': testId,
		'aria-label': ariaLabel,
		'aria-description': description
	});

	// Container attributes for the link-with-remove branch — the same theme, ARIA,
	// class and style the root anchor would have carried.
	const tokenLinkContainerProps = $derived({
		...theme,
		...sharedAria,
		class: rootClass,
		style: rootStyle
	});

	// The polymorphic link props; a custom component also gets a `to={href}` alias.
	const linkProps = $derived({
		...theme,
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		'aria-disabled': isDisabled || undefined,
		'data-testid': testId,
		'aria-label': ariaLabel,
		'aria-description': description,
		class: rootClass,
		style: rootStyle
	});

	function handleContainerClick(event: MouseEvent): void {
		if ((event.target as HTMLElement).closest('button, a')) {
			return;
		}
		effectiveOnClick?.(event);
	}
</script>

{#snippet labelSpan()}
	<span class={labelAttrs.class} style={labelAttrs.style}>{label}</span>
{/snippet}

{#snippet removeButton()}
	{#if onRemove != null}
		<button
			type="button"
			aria-label={t('@astryx.token.remove', { label })}
			onclick={(event) => {
				event.stopPropagation();
				onRemove(event);
			}}
			disabled={isDisabled}
			class={removeButtonAttrs.class}
			style={removeButtonAttrs.style}
		>
			<Icon icon="close" size="xsm" color="inherit" />
		</button>
	{/if}
{/snippet}

{#snippet content()}
	{#if icon}{@render icon()}{/if}
	{@render labelSpan()}
	{#if endContent}{@render endContent()}{/if}
	{@render removeButton()}
{/snippet}

{#if isLinkWithRemove}
	<TokenLink
		href={href as string}
		{isDisabled}
		{linkResolved}
		linkAttrs={invisibleButtonAttrs}
		containerProps={tokenLinkContainerProps}
		label={labelSpan}
		{icon}
		{endContent}
		{removeButton}
	/>
{:else if role === 'link'}
	<LinkElement component={linkResolved.component} props={linkProps}>
		{@render content()}
	</LinkElement>
{:else if effectiveOnClick != null}
	<!--
		Keyboard access lives on the inner invisible <button>, not this span — the
		span click just delegates to it. Upstream renders a bare <span onClick> with
		no role; we match that DOM exactly.
	-->
	<span
		{...theme}
		{...sharedAria}
		onclick={isDisabled ? undefined : handleContainerClick}
		class={rootClass}
		style={rootStyle}
	>
		{#if icon}{@render icon()}{/if}
		<button
			type="button"
			onclick={effectiveOnClick}
			disabled={isDisabled}
			class={invisibleButtonAttrs.class}
			style={invisibleButtonAttrs.style}
		>
			{@render labelSpan()}
		</button>
		{#if endContent}{@render endContent()}{/if}
		{@render removeButton()}
	</span>
{:else}
	<span {...theme} {...sharedAria} class={rootClass} style={rootStyle}>
		{@render content()}
	</span>
{/if}
