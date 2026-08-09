<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/**
	 * Upstream types this `BaseProps<HTMLLIElement>` with **no** `Omit` — its
	 * `onClick` is inherited and composed with the toggle handler rather than
	 * replaced. `onclick` is omitted here only so the narrowed redeclaration
	 * matches `ListItem`'s, which is the element these props actually reach.
	 */
	export interface CheckboxListItemProps extends Omit<BaseProps<HTMLLIElement>, 'onclick'> {
		/**
		 * Primary text label for the item.
		 *
		 * A plain string gets single-line truncation automatically; a snippet is
		 * rich content with no truncation constraints — the child components
		 * control their own text behaviour. When it is *not* a string, the hidden
		 * checkbox falls back to the translated `"Checkbox"` for its accessible
		 * name, since it needs a string label — pass `aria-label` to avoid that.
		 */
		label: string | Snippet;
		/**
		 * Plain-text accessible name for the checkbox when `label` is a snippet.
		 *
		 * A string `label` names the checkbox automatically. A rich (snippet)
		 * `label` cannot, so pass a concise string equivalent via the standard
		 * `aria-label` — otherwise the checkbox falls back to the generic name
		 * "Checkbox" and every rich-label item in a list announces identically to
		 * screen readers. Applied to the checkbox control, not the row.
		 *
		 * @example
		 * ```svelte
		 * <CheckboxListItem aria-label="Pro plan" value="pro">
		 *   {#snippet label()}<span>Pro plan <Badge label="Recommended" /></span>{/snippet}
		 * </CheckboxListItem>
		 * ```
		 */
		'aria-label'?: string;
		/**
		 * Identity key for collection mode (REQUIRED inside `CheckboxList`).
		 * Throws a runtime error if missing when used inside a `CheckboxList` that
		 * has a `value` array.
		 */
		value?: string;
		/** Secondary text below the label. */
		description?: string;
		/** Content rendered after the label area. */
		endContent?: Snippet;
		/**
		 * Whether this individual item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Whether this item is in a loading state. Renders a spinner inside the
		 * checkbox and blocks interaction on this item only.
		 *
		 * In collection mode, this is also driven automatically: when the parent
		 * `CheckboxList` has a `changeAction`, the toggled item shows its spinner
		 * while that promise is pending.
		 * @default false
		 */
		isLoading?: boolean;
		/**
		 * Direct checked state (standalone mode only).
		 * Ignored when inside a `CheckboxList` with a `value` array.
		 */
		isChecked?: boolean | 'indeterminate';
		/**
		 * Direct check handler (standalone mode only).
		 * Ignored when inside a `CheckboxList` with a `value` array.
		 */
		onCheck?: (checked: boolean) => void;
		/**
		 * Click handler. Rides on the checkbox itself, so it fires for both a direct
		 * click on the control and a delegated click on the row surface, and
		 * `preventDefault()` still opts out of the toggle (cancelling a checkbox's
		 * click cancels its activation behaviour, so no `change` event follows).
		 */
		onclick?: (event: MouseEvent) => void;
	}
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import CheckboxInput from '../checkbox-input/checkbox-input.svelte';
	import { useList } from '../list/list-context.svelte.js';
	import ListItem from '../list/list-item.svelte';
	import { useCheckboxList } from './checkbox-list-context.svelte.js';
	import { checkboxListItemXstyle } from './checkbox-list-item.stylex.js';

	/**
	 * A checkbox item for use within `CheckboxList` (collection mode) or a plain
	 * `List` (standalone mode), ported from Astryx's
	 * `CheckboxList/CheckboxListItem.tsx`.
	 *
	 * In collection mode the checked state is derived from the parent's `value`
	 * array; in standalone mode it comes from `isChecked`/`onCheck`. Composes
	 * `ListItem`, so density, dividers, hover/press, focus and container alignment
	 * come for free.
	 *
	 * @example
	 * ```svelte
	 * <CheckboxListItem label="Email" value="email" />
	 * <CheckboxListItem label="Accept terms" isChecked={accepted} onCheck={(v) => (accepted = v)} />
	 * ```
	 */
	let {
		label,
		value,
		description,
		endContent,
		isDisabled: isItemDisabled = false,
		isLoading: isItemLoading = false,
		isChecked,
		onCheck,
		xstyle,
		class: className,
		style: styleProp,
		onclick: onclickProp,
		'aria-label': ariaLabel,
		...rest
	}: CheckboxListItemProps = $props();

	const t = useTranslator();

	// Accessible name for the (visually hidden) checkbox label. A string `label`
	// names it directly; a rich label needs `aria-label`.
	const checkboxLabel = $derived(
		ariaLabel ?? (typeof label === 'string' ? label : t('@astryx.checkboxList.item.checkbox'))
	);

	// Dev-time guardrail: a rich label without `aria-label` leaves the checkbox
	// with the generic name "Checkbox".
	//
	// This was a bare init-time `console.warn` justified by a comment claiming it
	// "warns during SSR as upstream's render-time `useDevWarning` does". **That was
	// false on both halves**: upstream's `useDevWarning` is `useEffect`-based, so it
	// never warns during SSR, and the init statement therefore diverged rather than
	// matched — emitting twice (server + hydrate) where upstream emits once, never
	// firing when props *become* the bad combination, and bypassing `devWarn`'s
	// `NODE_ENV` gate so it shipped to production. `useDevWarning` landed with
	// `useContainerReveal` this batch, so the real counterpart now exists.
	useDevWarning(
		'CheckboxListItem',
		'`label` is a snippet, so the checkbox falls back to the generic accessible ' +
			'name "Checkbox". Pass `aria-label` with a concise string equivalent of the ' +
			'visible label so screen readers can tell items apart.',
		() => typeof label !== 'string' && ariaLabel == null
	);
	const checkboxList = useCheckboxList();
	const ctx = $derived(checkboxList?.() ?? null);

	// Density from the list context drives the checkbox size. Only `compact` maps
	// to `sm` — `balanced` and `spacious` both give `md`.
	const list = useList();
	const density = $derived(list?.().density ?? 'balanced');
	const checkboxSize = $derived(density === 'compact' ? 'sm' : 'md');

	// Disabled is parent-level OR item-level; read-only is parent-level only.
	const effectiveDisabled = $derived((ctx?.isDisabled ?? false) || isItemDisabled);
	const effectiveReadOnly = $derived(ctx?.isReadOnly ?? false);

	// Loading is per-item: the explicit item prop OR (collection mode) the item
	// whose `changeAction` is currently pending in the parent.
	const isBusy = $derived(
		isItemLoading ||
			(ctx?.loadingValue != null && value !== undefined ? ctx.loadingValue === value : false)
	);

	// Resolve checked state: collection mode, then standalone, then unchecked.
	// `isChecked` is silently ignored in collection mode, as upstream's is.
	//
	// The value-required guard lives here rather than in an init-time statement
	// because upstream throws on *every* render, not just the first: a
	// `CheckboxList` whose `value` arrives after mount must fail its value-less
	// children then, not silently render them as dead interactive rows. The
	// template reads `resolvedChecked` on every render (and on the server, where
	// a `$derived` is evaluated on first read), so putting it here is what makes
	// the timing match.
	const resolvedChecked = $derived.by<boolean | 'indeterminate'>(() => {
		if (ctx && ctx.value !== undefined && value === undefined) {
			throw new Error(
				'CheckboxListItem requires a `value` prop when used inside CheckboxList with a value array.'
			);
		}
		return ctx && ctx.value !== undefined && value !== undefined
			? ctx.value.includes(value)
			: (isChecked ?? false);
	});

	// Whether this item has a toggle handler at all. Note that an item inside a
	// `CheckboxList` counts as interactive even with no `onCheck` and no group
	// `value` — an upstream quirk, replicated: the row takes `role="button"` and
	// hover/press affordances for a click that does nothing.
	const isInteractive = $derived(!effectiveReadOnly && (ctx != null || onCheck != null));

	function handleToggle(): void {
		if (effectiveDisabled || effectiveReadOnly || isBusy) {
			return;
		}

		if (ctx && ctx.value !== undefined && value !== undefined) {
			// Collection mode — pass the toggled value up so the list can show a
			// spinner on this item while a changeAction is pending. Appended, not
			// sorted.
			if (ctx.value.includes(value)) {
				ctx.onChange?.(
					ctx.value.filter((v) => v !== value),
					value
				);
			} else {
				ctx.onChange?.([...ctx.value, value], value);
			}
		} else {
			// Standalone mode — `'indeterminate'` resolves to checked.
			onCheck?.(resolvedChecked === true ? false : true);
		}
	}

	/**
	 * The checkbox is the row's single keyboard control and action. The row is an
	 * enlarged click/tap target that delegates surface clicks to it through
	 * `ListItem`'s `interactiveRef` (`useClickableContainer`), so each option is
	 * exactly one tab stop (WCAG 4.1.2 / APG checkbox pattern). Delegate whenever
	 * the row should respond to clicks: a toggleable item, or one carrying a
	 * consumer `onclick`.
	 *
	 * Upstream holds `checkboxRef` and hands it to `CheckboxInput`'s `ref`. Our
	 * `CheckboxInput` publishes no `ref` prop — it spreads its rest props onto the
	 * native `<input>` — so the element is captured by an attachment travelling
	 * through that same spread, the seam `ClickableCard` already uses. The key is
	 * created once so the attachment identity is stable across re-renders.
	 */
	let checkboxEl = $state<HTMLElement | null>(null);
	const checkboxAttach = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			checkboxEl = node;
			return () => {
				checkboxEl = null;
			};
		}
	};
	const hasRowInteraction = $derived(isInteractive || onclickProp != null);
	// A getter, not the element: upstream passes a `RefObject` read at use time,
	// and `Item`'s `interactiveRef` is this port's getter counterpart.
	const interactiveRef = $derived(hasRowInteraction ? () => checkboxEl : undefined);

	const isSelected = $derived(resolvedChecked === true && !effectiveDisabled && !effectiveReadOnly);
</script>

{#snippet checkbox()}
	<CheckboxInput
		{...checkboxAttach}
		label={checkboxLabel}
		isLabelHidden
		value={resolvedChecked}
		onChange={() => handleToggle()}
		onclick={onclickProp}
		isDisabled={effectiveDisabled}
		isReadOnly={effectiveReadOnly}
		isLoading={isBusy}
		size={checkboxSize}
	/>
{/snippet}

<!--
	No `onclick` on the row: wiring one would render `Item`'s invisible row
	button, i.e. a second tab stop for the same action. The consumer's `onclick`
	rides on the checkbox instead (above), so it still fires for both a direct
	click and a delegated row-surface click.
-->
<ListItem
	{...rest}
	{label}
	{description}
	{endContent}
	isDisabled={effectiveDisabled}
	{interactiveRef}
	aria-busy={isBusy || undefined}
	xstyle={checkboxListItemXstyle(isSelected, xstyle)}
	class={className}
	style={styleProp}
	startContent={checkbox}
/>
