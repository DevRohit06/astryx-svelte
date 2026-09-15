<script lang="ts" module>
	import type { TableRowStatusResult } from './use-table-row-status.js';

	export interface RowStatusCellContentProps {
		/** The row's status, already resolved by the config's `getStatus`. */
		status: TableRowStatusResult;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import Tooltip from '../../../tooltip/tooltip.svelte';
	import { warnOnce } from '../../../../utils/dev-warning.js';
	import type { IconColor } from '../../../icon/icon.stylex.js';
	import type { IconName } from '../../../icon/icon-registry.js';
	import {
		rowStatusDotAttrs,
		rowStatusWrapAttrs,
		type TableRowStatusColor
	} from './row-status.stylex.js';

	/**
	 * The status column's cell body, ported from the `renderCell` closure in
	 * Astryx's `Table/plugins/rowStatus/useTableRowStatus.tsx`.
	 *
	 * It is a component rather than markup inside the hook for the standing
	 * reason: a `.ts` plugin module cannot author a snippet, and this markup needs
	 * both `Icon` and `Tooltip`. The `null` branch stays with the *slot* — a
	 * component that renders nothing still costs an anchor comment per row, and
	 * upstream's `return null` produces no node at all.
	 */
	const { status }: RowStatusCellContentProps = $props();

	/**
	 * The released mapping from a named marker colour to an `IconColor`. Two names
	 * have no same-named icon colour and fall back to upstream's choice:
	 * `orange` and `yellow` both render `warning`.
	 */
	const ICON_COLOR_BY_NAMED_COLOR: Record<TableRowStatusColor, IconColor> = {
		accent: 'accent',
		success: 'success',
		error: 'error',
		warning: 'warning',
		red: 'red',
		orange: 'warning',
		green: 'green',
		yellow: 'warning',
		blue: 'blue',
		gray: 'gray'
	};

	type Resolved =
		| { variant: 'dot'; color: string }
		| { variant: 'icon'; icon: IconName; iconColor: IconColor }
		| { variant: 'icon'; icon: IconName; customColor: string };

	function isSemanticStatus(value: unknown): value is 'success' | 'warning' | 'error' {
		return value === 'success' || value === 'warning' || value === 'error';
	}

	/**
	 * Upstream 0.5.3 (#5832) split a *semantic* outcome from a *custom* marker.
	 * A semantic status resolves both glyph and colour through the theme; a
	 * custom one carries its own colour, and a raw CSS colour with no `IconColor`
	 * counterpart is spent on the wrapper so the icon inherits it.
	 */
	function resolve(value: NonNullable<TableRowStatusResult>): Resolved | null {
		const untyped = value as { status?: unknown; color?: unknown; icon?: unknown };

		if (isSemanticStatus(untyped.status)) {
			if (
				Object.prototype.hasOwnProperty.call(untyped, 'color') ||
				Object.prototype.hasOwnProperty.call(untyped, 'icon')
			) {
				warnOnce(
					'useTableRowStatus:semantic-custom-conflict',
					'useTableRowStatus',
					'status cannot be combined with color or icon. The semantic status takes precedence and the custom marker fields are ignored.'
				);
			}
			return { variant: 'icon', icon: untyped.status, iconColor: untyped.status };
		}

		if (typeof untyped.color !== 'string') return null;

		if (typeof untyped.icon === 'string') {
			const namedIconColor = (ICON_COLOR_BY_NAMED_COLOR as Record<string, IconColor | undefined>)[
				untyped.color
			];
			return namedIconColor == null
				? { variant: 'icon', icon: untyped.icon as IconName, customColor: untyped.color }
				: { variant: 'icon', icon: untyped.icon as IconName, iconColor: namedIconColor };
		}

		return { variant: 'dot', color: untyped.color };
	}

	const resolved = $derived(status == null ? null : resolve(status));
	const customColor = $derived(
		resolved != null && resolved.variant === 'icon' && 'customColor' in resolved
			? resolved.customColor
			: undefined
	);
	const wrap = $derived(rowStatusWrapAttrs(customColor));
</script>

{#if status != null && resolved != null}
	<Tooltip content={status.label}>
		<span class={wrap.class} style={wrap.style} role="img" aria-label={status.label}>
			{#if resolved.variant === 'icon'}
				<Icon
					icon={resolved.icon}
					size="xsm"
					color={'iconColor' in resolved ? resolved.iconColor : 'inherit'}
				/>
			{:else}
				{@const dot = rowStatusDotAttrs(resolved.color)}
				<span class={dot.class} style={dot.style}></span>
			{/if}
		</span>
	</Tooltip>
{/if}
