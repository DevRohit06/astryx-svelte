<script lang="ts" module>
	import type { IconName } from '../icon/icon-registry.js';
	import type { ChatToolCallItem } from './chat-tool-calls.svelte';
	import type { ChatToolCallStatus } from './chat-tool-calls.stylex.js';

	interface ChatToolCallRowProps {
		/** The call to render. */
		call: ChatToolCallItem;
	}

	/**
	 * Upstream declares this beside `CallRow` in `ChatToolCalls.tsx`, and both it
	 * and the group header read it. It lives here rather than in
	 * `chat-tool-calls.svelte` because the dependency between the two files only
	 * runs one way at runtime: the group imports this component, and this
	 * component's import of `ChatToolCallItem` is type-only and erased. Putting
	 * the table in the group would make that a real cycle.
	 */
	export const STATUS_ICON_NAMES: Record<ChatToolCallStatus, IconName | null> = {
		pending: 'clock',
		running: null,
		complete: 'check',
		error: 'close'
	};
</script>

<script lang="ts">
	import Badge from '../badge/badge.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		chatToolCallAdditionsAttrs,
		chatToolCallDeletionsAttrs,
		chatToolCallDetailChevronAttrs,
		chatToolCallDetailContentAttrs,
		chatToolCallDurationAttrs,
		chatToolCallLabelAttrs,
		chatToolCallNameAttrs,
		chatToolCallNodePillStyle,
		chatToolCallRowAttrs,
		chatToolCallStatsAttrs,
		chatToolCallStatusCircleAttrs,
		chatToolCallStatusIconAttrs,
		chatToolCallStatusInnerAttrs
	} from './chat-tool-calls.stylex.js';

	/**
	 * One tool-call row — upstream's module-private `CallRow`, which lives in
	 * `ChatToolCalls.tsx` alongside the exported component. Svelte has one
	 * component per file, so it moves to its own; it is exported from neither
	 * barrel, and its props interface is deliberately *not* exported, matching a
	 * function component upstream publishes no props type for.
	 */
	const { call }: ChatToolCallRowProps = $props();

	const t = useTranslator();

	const status = $derived(call.status ?? 'complete');
	const hasDetail = $derived(call.resultDetail != null);

	let isDetailOpen = $state(false);
	const detailId = $props.id();

	function toggleDetail(): void {
		isDetailOpen = !isDetailOpen;
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleDetail();
		}
	}

	const rowAttrs = $derived(chatToolCallRowAttrs(hasDetail));
	const statusIcon = $derived(chatToolCallStatusIconAttrs(status));
	const statusCircle = $derived(chatToolCallStatusCircleAttrs());
	const statusInner = $derived(chatToolCallStatusInnerAttrs());
	const nameAttrs = $derived(chatToolCallNameAttrs());
	const labelAttrs = $derived(chatToolCallLabelAttrs());
	const statsAttrs = $derived(chatToolCallStatsAttrs());
	const additionsAttrs = $derived(chatToolCallAdditionsAttrs());
	const deletionsAttrs = $derived(chatToolCallDeletionsAttrs());
	const durationAttrs = $derived(chatToolCallDurationAttrs());
	const detailChevron = $derived(chatToolCallDetailChevronAttrs(isDetailOpen));
	const detailContent = $derived(chatToolCallDetailContentAttrs());

	const hasStats = $derived(call.additions != null || call.deletions != null || call.stats != null);
</script>

{#snippet row()}
	<!--
		No `svelte-ignore` here: `role`, `tabindex` and both handlers are
		conditional on `hasDetail`, so the compiler cannot decide the element is
		static and never raises the interaction warnings — and an unused
		`svelte-ignore` is itself a lint error.
	-->
	<div
		role={hasDetail ? 'button' : undefined}
		tabindex={hasDetail ? 0 : undefined}
		aria-expanded={hasDetail ? isDetailOpen : undefined}
		aria-controls={hasDetail && isDetailOpen ? detailId : undefined}
		onclick={hasDetail ? toggleDetail : undefined}
		onkeydown={hasDetail ? handleKeyDown : undefined}
		class={rowAttrs.class}
		style={rowAttrs.style}
	>
		<span
			title={status === 'error' ? call.errorMessage : undefined}
			class={statusIcon.class}
			style={statusIcon.style}
		>
			<!--
				Upstream branches `running` and `pending` separately onto the same
				spinner; one test covers both.
			-->
			{#if status === 'running' || status === 'pending'}
				<Spinner size="sm" shade="subtle" />
			{:else}
				<span class={statusCircle.class} style={statusCircle.style}></span>
				<span class={statusInner.class} style={statusInner.style}>
					<Icon icon={STATUS_ICON_NAMES[status] ?? 'check'} size="xsm" color="inherit" />
				</span>
			{/if}
			{#if status === 'error' && call.errorMessage != null}
				<!--
					The `title` attribute above is hover-only; expose the error detail as
					real text so it reaches screen readers, keyboard and touch users.
					Rendering it inside the row also folds it into the accessible name of
					expandable (`role="button"`) rows.
				-->
				<VisuallyHidden>
					{t('@astryx.chatToolCalls.error', { message: call.errorMessage ?? '' })}
				</VisuallyHidden>
			{/if}
		</span>
		<span class={nameAttrs.class} style={nameAttrs.style}>{call.name}</span>
		{#if call.node != null}
			<Badge label={call.node} variant="neutral" xstyle={chatToolCallNodePillStyle} />
		{/if}
		{#if call.target != null}
			<span class={labelAttrs.class} style={labelAttrs.style}>{call.target}</span>
		{/if}
		{#if hasStats}
			<span class={statsAttrs.class} style={statsAttrs.style}>
				{#if call.additions != null}
					<span class={additionsAttrs.class} style={additionsAttrs.style}>+{call.additions}</span>
				{/if}
				{#if call.deletions != null}
					<span class={deletionsAttrs.class} style={deletionsAttrs.style}>-{call.deletions}</span>
				{/if}
				{#if typeof call.stats === 'function'}{@render call.stats()}{:else}{call.stats ?? ''}{/if}
			</span>
		{/if}
		{#if call.duration != null && status === 'complete'}
			<span class={durationAttrs.class} style={durationAttrs.style}>{call.duration}</span>
		{/if}
		{#if hasDetail}
			<span class={detailChevron.class} style={detailChevron.style}>
				<Icon icon="chevronDown" size="xsm" color="inherit" />
			</span>
		{/if}
	</div>
{/snippet}

{#if !hasDetail}
	{@render row()}
{:else}
	<div>
		{@render row()}
		{#if isDetailOpen}
			<div id={detailId} class={detailContent.class} style={detailContent.style}>
				{#if typeof call.resultDetail === 'function'}
					{@render call.resultDetail()}
				{:else}
					{call.resultDetail}
				{/if}
			</div>
		{/if}
	</div>
{/if}
