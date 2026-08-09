import type { PowerSearchConfig, PowerSearchField, PowerSearchOperator } from './types.js';

/**
 * Ported from Astryx's `PowerSearch/useInternalConfig.ts`.
 *
 * Upstream is one `useMemo(…, [config])` that builds two lookup `Map`s and
 * returns an object of closures over them. Two things change:
 *
 * - **`config` is a getter.** The memo's dependency array is the whole config's
 *   reference identity, so a new config produces new maps and a new object;
 *   a closure over a getter plus a `$derived` is the same statement, and it is
 *   what keeps `PowerSearchToken`/`PowerSearchFilterEditor` — both of which take
 *   the config as a *prop* — from stranding on their mount-time value.
 * - **`config` on the result is a getter too.** Upstream returns a fresh object
 *   per rebuild, so a consumer reading `.config` always sees the current one. A
 *   Svelte hook returns one object for the caller's lifetime, and a plain
 *   property would freeze it — the `useTableColumnSettingsState` precedent.
 *
 * The `Map`s are plain rather than `SvelteMap`, with
 * `svelte/prefer-svelte-reactivity` disabled at each site: each is built fresh
 * inside the `$derived` and never mutated afterwards, so the derived is already
 * the reactive boundary — the `useTableColumnSettingsState` precedent.
 *
 * Two upstream behaviours the method table below preserves deliberately, both
 * of which read as bugs and are neither:
 *
 * - **`getDefaultOperator` does not fall back.** A field carrying a
 *   `defaultOperator` key that no operator matches yields `undefined`, *not*
 *   `operators[0]` — the fallback applies only when `defaultOperator` is absent.
 * - **`getVisibleFields`/`getVisibleOperators` filter nothing.** Despite the
 *   names, they return `config.fields` and the field's operators unmodified.
 *   Upstream has no visibility predicate; the names anticipate one.
 */

export interface InternalConfig {
	readonly config: PowerSearchConfig;
	getField(key: string): PowerSearchField | undefined;
	getOperator(fieldKey: string, operatorKey: string): PowerSearchOperator | undefined;
	getDefaultOperator(fieldKey: string): PowerSearchOperator | undefined;
	getVisibleFields(): ReadonlyArray<PowerSearchField>;
	getVisibleOperators(fieldKey: string): ReadonlyArray<PowerSearchOperator>;
}

export function useInternalConfig(config: () => PowerSearchConfig): InternalConfig {
	const maps = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const fieldMap = new Map<string, PowerSearchField>();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const operatorMap = new Map<string, Map<string, PowerSearchOperator>>();

		for (const field of config().fields) {
			fieldMap.set(field.key, field);
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const opMap = new Map<string, PowerSearchOperator>();
			for (const op of field.operators) {
				opMap.set(op.key, op);
			}
			operatorMap.set(field.key, opMap);
		}

		return { fieldMap, operatorMap };
	});

	return {
		get config() {
			return config();
		},

		getField(key: string) {
			return maps.fieldMap.get(key);
		},

		getOperator(fieldKey: string, operatorKey: string) {
			return maps.operatorMap.get(fieldKey)?.get(operatorKey);
		},

		getDefaultOperator(fieldKey: string) {
			const field = maps.fieldMap.get(fieldKey);
			if (!field) {
				return undefined;
			}
			if (field.defaultOperator) {
				return maps.operatorMap.get(fieldKey)?.get(field.defaultOperator);
			}
			return field.operators[0];
		},

		getVisibleFields() {
			return config().fields;
		},

		getVisibleOperators(fieldKey: string) {
			const field = maps.fieldMap.get(fieldKey);
			return field?.operators ?? [];
		}
	};
}
