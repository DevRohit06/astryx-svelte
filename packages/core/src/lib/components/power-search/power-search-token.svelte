<script lang="ts">
	import Token from '../token/token.svelte';
	import type { PowerSearchTokenProps } from './types.js';
	import { useLocale } from '../../i18n/use-locale.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { formatFilterValue } from './format-filter-value.js';
	import { powerSearchTokenValueAttrs } from './power-search-token.stylex.js';
	import { resolveOperatorLabel } from './resolve-operator-label.js';
	import { useInternalConfig } from './use-internal-config.svelte.js';

	/**
	 * Ported from Astryx's `PowerSearchToken.tsx`.
	 *
	 * Default token pill for PowerSearch filters. Renders a field label, operator
	 * label, and formatted value inside a `Token`. Published so consumers can use
	 * it as a base when providing a `components[type].Token` override.
	 *
	 * ## It is not what `PowerSearch` renders
	 *
	 * Upstream's own docstring calls this "the built-in implementation used by
	 * PowerSearch". **It is not** — `PowerSearch.tsx` never imports it, and
	 * inlines a different renderer whose truncation rule, `enum_list` join
	 * behaviour and date formatting all differ (see `power-search.svelte`'s note
	 * on the two truncators). The docstring is transcribed rather than corrected
	 * because it is upstream's published prose, but the divergence is real and is
	 * recorded in port/debts.md's Known debts. A consumer composing on top of this
	 * component gets *this* behaviour, not the default token's.
	 *
	 * `config` arrives as the public `PowerSearchConfig` and is wrapped here, as
	 * upstream does — the override contract passes the raw config, not the
	 * internal one.
	 *
	 * **No `<script module>` block, deliberately.** The repo convention is that a
	 * component declares its props interface there and the barrel re-exports it;
	 * this component *has* no props type of its own on either side — upstream
	 * types it with `PowerSearchTokenProps` out of `types.ts`, which is where the
	 * barrel already publishes it from. Re-exporting it here would give one type
	 * two declaration sites for no gain. `PowerSearchFilterEditor` is the same
	 * case, and they are the only two.
	 */

	const {
		config: configProp,
		filter,
		field,
		operator,
		maxLength,
		onClick,
		onRemove,
		isDisabled
	}: PowerSearchTokenProps = $props();

	const config = useInternalConfig(() => configProp);
	const t = useTranslator();
	const locale = useLocale();

	const fieldLabel = $derived(field.label);
	const resolvedOperatorLabel = $derived(resolveOperatorLabel(operator, t));
	const operatorLabel = $derived(resolvedOperatorLabel ? `: ${resolvedOperatorLabel}` : '');
	const tokenLabel = $derived(`${fieldLabel}${operatorLabel}`);

	const adjustedMaxLength = $derived(
		Math.max(maxLength - fieldLabel.length - resolvedOperatorLabel.length, 10)
	);

	const valueStr = $derived(
		formatFilterValue(config, operator.value, filter.value, adjustedMaxLength, t, locale())
	);
</script>

{#snippet valueContent()}
	<span {...powerSearchTokenValueAttrs()}>{valueStr}</span>
{/snippet}

<Token
	label={tokenLabel}
	endContent={valueStr ? valueContent : undefined}
	onclick={onClick
		? (e: MouseEvent) => {
				e.stopPropagation();
				onClick();
			}
		: undefined}
	{onRemove}
	{isDisabled}
/>
