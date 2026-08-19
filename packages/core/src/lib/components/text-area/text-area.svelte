<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ClipboardEventHandler, FocusEventHandler, FormEventHandler } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';
	// `TextAreaSize` is published from `text-area.stylex.ts`, where it is derived
	// from the style keys — the arrangement `FieldStatusVariant` already uses.
	import type { TextAreaSize } from './text-area.stylex.js';

	export type TextAreaStatusType = 'warning' | 'error' | 'success';

	export interface TextAreaStatus {
		/** The type of status to display. */
		type: TextAreaStatusType;
		/** Optional message to display below the textarea. */
		message?: string;
	}

	/**
	 * `BaseProps` is left unparameterised, as upstream leaves it — so `rest` is
	 * typed as generic HTML attributes and `cols`/`wrap`/`autocomplete` are
	 * deliberately absent from the public type even though they reach the
	 * element.
	 *
	 * The four handlers are omitted so the narrowed redeclarations below can
	 * replace rather than conflict with them. Upstream needs no such omit: its
	 * `onPaste`/`onFocus`/`onBlur` are already the *same keys* React's
	 * `HTMLAttributes` declares, so writing them narrows in place.
	 */
	export interface TextAreaProps extends Omit<
		BaseProps<HTMLElement>,
		'onchange' | 'oninput' | 'onfocus' | 'onblur' | 'onpaste'
	> {
		/** Label text for the field (always rendered for accessibility). */
		label: string;
		/** The textarea's value. */
		value: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/** Description text displayed between the label and textarea. */
		description?: string;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/** Fired on every edit, with the new value and the originating event. */
		onChange?: (value: string, e: Event) => void;
		/**
		 * Async action fired after `onChange`, when it did not `preventDefault`.
		 * Shows the new value optimistically and a spinner while it is in flight.
		 */
		changeAction?: (value: string, e: Event) => void | Promise<void>;
		/**
		 * Shows the busy state without an action in flight.
		 * @default false
		 */
		isLoading?: boolean;
		/** Placeholder text. */
		placeholder?: string;
		/**
		 * Visible rows. There is deliberately no auto-resize — the control grows
		 * only by the user's drag, via `resize: vertical`.
		 * @default 3
		 */
		rows?: number;
		/**
		 * Whether the textarea is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Whether the textarea is read-only.
		 * The value is shown at full opacity and still submits with the form, but
		 * cannot be edited. Unlike `isDisabled`, a read-only textarea is not dimmed
		 * and stays in the tab order — use it for a value the user should see and
		 * send but not change. `isDisabled` takes precedence when both are set.
		 * @default false
		 */
		isReadOnly?: boolean;
		/**
		 * Why the field is disabled, shown in a tooltip. Setting it keeps the
		 * control focusable — it takes `aria-disabled` and `readonly` instead of the
		 * native `disabled`, so the reason stays discoverable by keyboard.
		 */
		disabledMessage?: string;
		/** Validation status, rendered as a border, an icon and an optional message. */
		status?: TextAreaStatus;
		/**
		 * How the status message is placed relative to the textarea.
		 * - `attached`: message overlaps directly below the textarea (bordered treatment)
		 * - `detached`: message floats below as a separate element with spacing
		 * - `tooltip`: no message box; the status icon becomes a focusable info-tip
		 *   button that reveals the message on hover, keyboard focus, or tap
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/** Width of the whole field — label, control and status. */
		width?: SizeValue;
		/** Tooltip text shown from an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Icon shown before the textarea.
		 *
		 * Upstream applies `size="sm" color="secondary"` for you; a snippet is
		 * authored by the caller, so set them yourself to match:
		 * `{#snippet startIcon()}<Icon icon="search" size="sm" color="secondary" />{/snippet}`
		 */
		startIcon?: Snippet;
		/**
		 * @default true
		 */
		hasSpellCheck?: boolean;
		/**
		 * Upstream names this `onPaste`. It is lowercase here for the reason
		 * `Thumbnail` established: a handler that is *forwarded to an element*
		 * takes the DOM event name, and React's `onPaste` **is** the DOM name in
		 * React's casing. Keeping the camelCase spelling would leave `onpaste` —
		 * which `BaseProps` already declares — advertised alongside it and
		 * silently clobbered by the forwarded one. Same for `oninput`,
		 * `onfocus` and `onblur` below.
		 */
		onpaste?: ClipboardEventHandler<HTMLTextAreaElement>;
		/**
		 * Fired on every keystroke, alongside `onChange`. Composed rather than
		 * replaced: upstream's `onInput` arrives through rest props and fires
		 * next to its `onChange`, so ours must too.
		 */
		oninput?: FormEventHandler<HTMLTextAreaElement>;
		/**
		 * Character limit for the counter, counted as user-perceived characters —
		 * an emoji or flag sequence counts as one. Deliberately **not** emitted as
		 * the native `maxlength` attribute — the field accepts over-limit text and
		 * reports it, rather than silently truncating what was typed or pasted.
		 * Validate with `characterCount` (exported from this package) rather than
		 * `value.length`, so enforcement matches the displayed count.
		 */
		maxLength?: number;
		/**
		 * @default false
		 */
		hasAutoFocus?: boolean;
		/**
		 * Size of the control. Inherited from an enclosing `SizeContext` when unset.
		 * @default 'md'
		 */
		size?: TextAreaSize;
		/** `name` attribute, for form submission. */
		htmlName?: string;
		onfocus?: FocusEventHandler<HTMLTextAreaElement>;
		onblur?: FocusEventHandler<HTMLTextAreaElement>;
	}
</script>

<script lang="ts">
	import { useSize } from '../../internal/contexts.svelte.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import Field from '../field/field.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import { useResolvedRequired } from '../../hooks/use-resolved-required.svelte.js';
	import { characterCount } from '../../utils/characters.js';
	import {
		COUNTER_WARNING_THRESHOLD,
		textAreaAttrs,
		textAreaCounterAttrs,
		textAreaEndSlotAttrs,
		textAreaStartIconAttrs,
		textAreaWrapperAttrs
	} from './text-area.stylex.js';

	/**
	 * A multi-line text field, with the whole `Field` shell around it.
	 *
	 * Controlled, as upstream is: `value` in, `onChange` out. `value` is
	 * `$bindable()`, so `bind:value` works as the idiomatic Svelte spelling of
	 * `value` + `onChange` — an additive convenience that leaves upstream's
	 * `value`-in / `onChange`-out API untouched (both keep working unbound).
	 *
	 * The two-way write is deliberately confined to the plain edit path: with a
	 * `changeAction` in flight, `value` is *not* written, so the optimistic
	 * override drives the display and reverts on settle exactly as upstream's
	 * `useOptimistic` does. Committing the value there is the action's job (or
	 * the parent's), which is what keeps `isBusy` — `optimistic.current !== value`
	 * — true during the action rather than instantly false.
	 *
	 * @example
	 * ```svelte
	 * <TextArea label="Bio" bind:value />
	 * <TextArea label="Notes" {value} onChange={(v) => (value = v)} maxLength={280} />
	 * ```
	 */
	let {
		label,
		value = $bindable(),
		isLabelHidden = false,
		description,
		isOptional = false,
		isRequired = false,
		onChange,
		changeAction,
		isLoading = false,
		placeholder,
		rows = 3,
		isDisabled = false,
		isReadOnly = false,
		disabledMessage,
		status,
		statusVariant = 'attached',
		width,
		labelTooltip,
		startIcon,
		hasSpellCheck = true,
		onpaste,
		oninput,
		maxLength,
		hasAutoFocus = false,
		size: sizeProp,
		htmlName,
		onfocus,
		onblur,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: TextAreaProps = $props();

	// Announce the effective required state (form default included) while the
	// native `required` stays bound to the explicit `isRequired`, so a layout
	// default never switches on browser validation.
	const isEffectivelyRequired = useResolvedRequired({
		isRequired: () => isRequired,
		isOptional: () => isOptional
	});

	const resolveSize = useSize();
	const size = $derived(resolveSize(sizeProp, 'md'));
	const t = useTranslator();
	const announce = useAnnounce();

	// Upstream mints four ids with four `useId` calls, plus a fifth inside
	// `useTooltip`. `$props.id()` may be called **once** per component, so the
	// counterpart is one base id with derived suffixes. That is equivalent for
	// everything the ids are for — uniqueness per instance and stability across
	// the SSR/hydration boundary, which is the whole reason `useId` exists — and
	// the suffixes make the rendered markup easier to read than four opaque ones.
	// Deriving rather than counting also keeps them stable when a conditional id
	// goes unused, where a module-level counter would drift between server and
	// client. `Field` derives its own fallbacks the same way (`{inputID}-desc`).
	const uid = $props.id();
	const id = `${uid}-input`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const counterID = `${uid}-counter`;
	const tooltipID = `${uid}-tooltip`;
	const statusTooltipID = `${uid}-status-tip`;

	let container = $state<HTMLDivElement | null>(null);
	let textarea = $state<HTMLTextAreaElement | null>(null);

	// Tracks the counter "zone" last announced (under / near / over) so we only
	// announce on a zone change, not on every keystroke. Upstream's `useRef`
	// counterpart: a plain local, deliberately not `$state` — nothing renders
	// from it, so a write must not schedule an update.
	let counterZone: 'under' | 'near' | 'over' | null = null;

	const optimistic = createOptimistic(() => value);

	// Upstream discards `useTransition`'s `isPending` and derives busyness from
	// the optimistic value differing from the committed one. That is *not* the
	// same as `optimistic.isPending`: in the ordinary controlled case `onChange`
	// commits the new value synchronously, so the two are equal for the whole
	// action and no spinner appears. Using `isPending` would show one upstream
	// never shows.
	const isBusy = $derived(isLoading || optimistic.current !== value);
	const effectivelyDisabled = $derived(isDisabled || isBusy);

	// Disabled controls swallow pointer events, so the tooltip listeners attach
	// to the container (which always exists) and the textarea stays perceivable
	// via aria-disabled instead of the native disabled attribute. The field is
	// made read-only so it can't be typed into, and value mutation is blocked by
	// the isDisabled guard in handleChange.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		// The container div is not naturally focusable; focusin bubbles up from
		// the textarea, so always attach focus listeners.
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant
	}));

	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
			// The tooltip variant renders no message box; describe the textarea by
			// the tooltip's content instead so the status is still announced.
			statusIcon.describedBy ?? null,
			maxLength != null ? counterID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Counter semantics count user-perceived characters, so an emoji or flag
	// sequence counts as one character, not its code units. Only measured when a
	// counter exists — segmentation is O(value length), and `$derived` caches it
	// so a re-render that keeps the same value skips it entirely, which is what
	// upstream's `useMemo` buys.
	const valueLength = $derived(maxLength != null ? characterCount(optimistic.current) : 0);

	const isOverLimit = $derived(maxLength != null && valueLength > maxLength);

	/**
	 * Announce the character-count status through the shared live region, but
	 * only when the value crosses into a new zone (near the limit / over the
	 * limit) so we don't speak on every keystroke. Over-limit is assertive (an
	 * error the user should hear immediately); nearing the limit is polite.
	 */
	function announceCounter(length: number): void {
		if (maxLength == null) {
			return;
		}
		const zone: 'under' | 'near' | 'over' =
			length > maxLength
				? 'over'
				: length >= maxLength * COUNTER_WARNING_THRESHOLD
					? 'near'
					: 'under';
		if (zone === counterZone) {
			return;
		}
		counterZone = zone;
		if (zone === 'over') {
			announce(
				t('@astryx.textArea.charactersOverLimit', { count: length - maxLength }),
				'assertive'
			);
		} else if (zone === 'near') {
			announce(t('@astryx.textArea.charactersRemaining', { count: maxLength - length }));
		}
	}

	// Bound to `oninput`, not `onchange`. React's `onChange` on a textarea *is*
	// the native `input` event — it fires per keystroke — where Svelte's
	// `onchange` is the native change event and fires on blur. Binding the DOM
	// name of the same word would call this once per field visit instead of once
	// per edit, and would break the counter, the optimistic value and every
	// `onChange`-per-character assertion in upstream's suite.
	function handleChange(e: Event): void {
		// Value can't change while showing a disabled message or while read-only
		// (the field is `readonly` and non-native-disabled), but guard the handler
		// too so the optimistic value and callbacks never fire.
		if (isDisabled || isReadOnly) {
			return;
		}
		const newValue = (e.target as HTMLTextAreaElement).value;
		// Guarded here, not just inside `announceCounter`, so textareas without a
		// `maxLength` never pay for segmenting the whole value on each keystroke.
		if (maxLength != null) {
			announceCounter(characterCount(newValue));
		}
		onChange?.(newValue, e);
		oninput?.(e as Parameters<NonNullable<typeof oninput>>[0]);
		if (changeAction && !e.defaultPrevented) {
			// Optimistic path: leave `value` uncommitted so the override drives
			// the display and `isBusy` stays true for the action's duration. The
			// action (or the parent) commits on success; the override reverts on
			// settle. Writing `value` here would make `optimistic.current === value`
			// instantly and suppress the spinner upstream shows.
			void optimistic.run(newValue, () => changeAction(newValue, e));
		} else {
			// Plain edit path: commit the two-way binding. This is what makes
			// `bind:value` work and, for a `value`/`onChange` consumer, is a
			// harmless second write of the same value the parent commits through
			// `onChange`. It also removes the need for React's controlled
			// force-reset: the value the DOM already holds is now the committed one.
			value = newValue;
		}
	}

	// Focus the textarea when clicking anywhere on the wrapper (icons, padding).
	const inputContainer = useInputContainer(() => ({
		container,
		input: textarea,
		disabled: effectivelyDisabled
	}));

	// `disabled` / `readonly` reflect as `data-disabled` / `data-readonly` (and as
	// bare state classes) so a theme can reach both states without duplicating the
	// component's own conditionals. `readonly` selects no style key — the point of
	// the state is that it is NOT dimmed.
	const theme = $derived(
		themeProps('textarea', {
			size,
			status: status?.type ?? null,
			disabled: isDisabled ? 'disabled' : null,
			readonly: isReadOnly ? 'readonly' : null
		})
	);
	const wrapperAttrs = $derived(textAreaWrapperAttrs(status?.type, isDisabled, xstyle));
	const areaAttrs = $derived(
		textAreaAttrs(
			size,
			isDisabled,
			startIcon != null,
			// The end slot's own render condition, not `status != null`: `detached`
			// suppresses the on-field glyph, so gating on the prop would reserve
			// trailing space for an icon that never appears.
			isBusy || statusIcon.hasIcon,
			isBusy && statusIcon.hasIcon,
			maxLength != null
		)
	);
	const startIconAttrs = textAreaStartIconAttrs();
	const endSlotAttrs = textAreaEndSlotAttrs();
	const counterAttrs = $derived(textAreaCounterAttrs(isOverLimit));
</script>

<Field
	{label}
	{isLabelHidden}
	{description}
	inputID={id}
	descriptionID={description ? descriptionID : undefined}
	{isOptional}
	{isRequired}
	{isDisabled}
	status={status
		? {
				type: status.type,
				message: status.message,
				messageID: status.message ? statusMessageID : undefined
			}
		: undefined}
	{statusVariant}
	{labelTooltip}
	{width}
>
	<div
		bind:this={container}
		{...inputContainer}
		{...theme}
		class={cx(theme.class, wrapperAttrs.class, className)}
		style={mergeStyle(wrapperAttrs.style, styleProp as string | undefined)}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		{#if startIcon}
			<span class={startIconAttrs.class} style={startIconAttrs.style}>{@render startIcon()}</span>
		{/if}
		<!-- `hasAutoFocus` is upstream's published prop, defaulting to false. The
		     a11y rule is about authors reaching for autofocus, not about a library
		     offering it — declining to forward it would drop documented API. -->
		<!-- svelte-ignore a11y_autofocus -->
		<textarea
			{...rest}
			bind:this={textarea}
			{id}
			name={isDisabled ? undefined : htmlName}
			value={optimistic.current}
			oninput={handleChange}
			{onpaste}
			{onfocus}
			{onblur}
			{placeholder}
			{rows}
			disabled={isDisabled && !showsDisabledMessage}
			aria-disabled={showsDisabledMessage ? 'true' : undefined}
			readonly={isReadOnly || showsDisabledMessage || undefined}
			spellcheck={hasSpellCheck}
			autofocus={hasAutoFocus}
			data-autofocus={hasAutoFocus || undefined}
			aria-describedby={ariaDescribedBy}
			aria-required={isEffectivelyRequired() ? 'true' : undefined}
			aria-invalid={status?.type === 'error' || isOverLimit ? 'true' : undefined}
			aria-busy={isBusy || undefined}
			class={areaAttrs.class}
			style={areaAttrs.style}></textarea>
		{#if isBusy || statusIcon.hasIcon}
			<span class={endSlotAttrs.class} style={endSlotAttrs.style}>
				{#if isBusy}<Spinner size="sm" />{/if}
				<InputStatusIcon {statusIcon} />
			</span>
		{/if}
		{#if maxLength != null}
			<div id={counterID} class={counterAttrs.class} style={counterAttrs.style}>
				{#if isOverLimit}
					<!-- Non-color cue so the over-limit state isn't conveyed by the red
					     color alone (WCAG 1.4.1). Decorative — the count text and the
					     live-region announcement carry the meaning. -->
					<Icon icon="warning" size="sm" />
				{/if}
				{valueLength}/{maxLength}
			</div>
		{/if}
	</div>
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
