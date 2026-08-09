<script lang="ts" module>
	import type { PartialFilter } from './types.js';
	import type { InternalConfig } from './use-internal-config.svelte.js';

	export interface NestedEditorProps {
		config: InternalConfig;
		partialFilter: PartialFilter;
		operatorOptions: { value: string; label: string }[];
		onOperatorChange: (operatorKey: string) => void;
		onPartialFilterChange: (filter: PartialFilter) => void;
		isReadOnly: boolean;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import TreeList from '../tree-list/tree-list.svelte';
	import type { TreeListItemData } from '../tree-list/tree-list-types.js';
	import { createSlotBinder } from '../../internal/bind-snippet.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		addAtPath,
		editableToCompleteFilter,
		initEditableFilter,
		isEditableFilterComplete,
		removeAtPath,
		updateAtPath,
		type EditablePartialFilter
	} from './editable-filter.js';
	import {
		addFilterButton,
		nestedRootLabel,
		removeFilterButton,
		subFilterRow,
		type ActionButtonArg,
		type RootLabelArg,
		type SubFilterRowArg
	} from './nested-editor-slots.svelte';
	import type { PowerSearchFilter } from './types.js';

	/**
	 * Ported from `NestedEditor` in Astryx's `PowerSearchEditPopover.tsx`.
	 *
	 * A recursive group editor rendered as a `TreeList` with one synthetic root.
	 *
	 * ## The three things that changed
	 *
	 * - **Every tree slot is a keyed bound snippet.** Upstream's `buildTreeItems`
	 *   returns `TreeListItemData` whose `label` and `endContent` are JSX closing
	 *   over the node's path and handlers. Those are per-node data no context can
	 *   carry, so they travel through `createSlotBinder` keyed by the node's path
	 *   — the mechanism batch 13 settled, and the keying is what keeps a nested
	 *   row's focused `Selector` alive across an edit. One binder per source
	 *   snippet: sharing one would let a row's key collide with its remove
	 *   button's.
	 * - **`syncToParent` is called after the state write, not inside it.**
	 *   Upstream calls it from inside `setSubFilters(prev => …)`, so it runs
	 *   during React's render phase and reaches into the *parent's* setter from a
	 *   child's updater — a pattern React itself warns about and StrictMode
	 *   double-invokes. Here `subFilters` is `$state`, the write is synchronous,
	 *   and the sync follows it on the next line. Same ordering, same observable
	 *   result, no render-phase side effect.
	 * - **The root's operator labels are resolved before they reach the snippet.**
	 *   `useTranslator` reads component context and a module-scope snippet has no
	 *   instance to read it from, so the four strings are passed in.
	 *
	 * `buildTreeItems` stays a plain recursive function called during derivation,
	 * exactly where upstream calls it.
	 */

	const {
		config,
		partialFilter,
		operatorOptions,
		onOperatorChange,
		onPartialFilterChange,
		isReadOnly
	}: NestedEditorProps = $props();

	const t = useTranslator();

	// Seeded once from the incoming value, as upstream's lazy `useState` initialiser
	// is. Thereafter this component owns the sub-filters and pushes them *up*
	// through `syncToParent`; re-deriving them from the prop would fight that.
	let subFilters = $state<EditablePartialFilter[]>(
		untrack(() =>
			partialFilter.value && partialFilter.value.type === 'nested'
				? partialFilter.value.value.map((f) => initEditableFilter(config, f))
				: []
		)
	);

	// One binder per source snippet, bound once for this component's lifetime.
	const bindRow = createSlotBinder<SubFilterRowArg>(subFilterRow);
	const bindAdd = createSlotBinder<ActionButtonArg>(addFilterButton);
	const bindRemove = createSlotBinder<ActionButtonArg>(removeFilterButton);
	const bindRootLabel = createSlotBinder<RootLabelArg>(nestedRootLabel);

	function syncToParent(newSubFilters: EditablePartialFilter[]): void {
		if (
			newSubFilters.length > 0 &&
			newSubFilters.every((sf) => isEditableFilterComplete(config, sf))
		) {
			onPartialFilterChange({
				...partialFilter,
				value: {
					type: 'nested',
					value: newSubFilters
						.map((sf) => editableToCompleteFilter(config, sf))
						.filter((sf): sf is PowerSearchFilter => sf != null)
				}
			});
		} else {
			onPartialFilterChange({
				...partialFilter,
				value: undefined
			});
		}
	}

	function handleUpdate(path: number[], updated: EditablePartialFilter): void {
		const next = updateAtPath(subFilters, path, () => updated);
		subFilters = next;
		syncToParent(next);
	}

	function handleRemove(path: number[]): void {
		const next = removeAtPath(subFilters, path);
		subFilters = next;
		syncToParent(next);
	}

	function handleAdd(parentPath: number[]): void {
		const fields = config.getVisibleFields();
		const defaultField = fields[0];
		if (!defaultField) {
			return;
		}

		const defaultOp = config.getDefaultOperator(defaultField.key);
		const op = defaultOp ? config.getOperator(defaultField.key, defaultOp.key) : undefined;

		const newSubFilter: EditablePartialFilter = {
			field: defaultField.key,
			operator: defaultOp?.key,
			value: undefined,
			_subFilters: op?.value.type === 'nested' ? [] : undefined
		};

		const next = addAtPath(subFilters, parentPath, newSubFilter);
		subFilters = next;
		syncToParent(next);
	}

	/**
	 * The getters below deliberately re-read `subFilters` through the path rather
	 * than closing over the node the recursion is looking at. A bound snippet's
	 * identity is stable by design, so the `{@const a = unwrapSlotArg(arg)}`
	 * derived inside the slot body is the only channel a new argument can travel
	 * — and a getter handed a pre-resolved value has an empty dependency set and
	 * never re-runs. That is `bind-snippet.ts`'s stated rule, and the four bugs
	 * it has already cost are named there.
	 */
	function readAtPath(path: number[]): EditablePartialFilter | undefined {
		let current: EditablePartialFilter[] | undefined = subFilters;
		let node: EditablePartialFilter | undefined;
		for (const idx of path) {
			node = current?.[idx];
			current = node?._subFilters;
		}
		return node;
	}

	function buildTreeItems(
		filters: EditablePartialFilter[],
		parentPath: number[]
	): TreeListItemData[] {
		const items: TreeListItemData[] = filters.map((sf, idx) => {
			const itemPath = [...parentPath, idx];
			const pathKey = itemPath.join('-');
			const op = sf.operator ? config.getOperator(sf.field, sf.operator) : undefined;
			const isNested = op?.value.type === 'nested';

			const label = bindRow(`filter-${pathKey}`, () => ({
				config,
				subFilter: readAtPath(itemPath) ?? sf,
				onChange: (updated: EditablePartialFilter) => handleUpdate(itemPath, updated),
				isReadOnly
			}));

			const endContent = !isReadOnly
				? bindRemove(`remove-${pathKey}`, () => ({
						label: t('@astryx.powersearch.editor.removeFilter'),
						onclick: () => handleRemove(itemPath)
					}))
				: undefined;

			if (isNested) {
				const children = buildTreeItems(sf._subFilters ?? [], itemPath);

				if (!isReadOnly) {
					children.push({
						id: `${pathKey}-add`,
						label: bindAdd(`add-${pathKey}`, () => ({
							label: t('@astryx.powersearch.editor.addFilter'),
							onclick: () => handleAdd(itemPath)
						}))
					});
				}

				return {
					id: `filter-${pathKey}`,
					label,
					isExpanded: true,
					children,
					endContent
				};
			}

			return {
				id: `filter-${pathKey}`,
				isExpanded: true,
				label,
				endContent
			};
		});

		return items;
	}

	const items = $derived.by<TreeListItemData[]>(() => {
		const treeChildren = buildTreeItems(subFilters, []);

		if (!isReadOnly) {
			treeChildren.push({
				id: 'add-filter',
				label: bindAdd('add-root', () => ({
					label: t('@astryx.powersearch.editor.addFilter'),
					onclick: () => handleAdd([])
				}))
			});
		}

		const rootLabel = bindRootLabel('nested-root', () => ({
			operatorOptions,
			groupOperatorLabel: t('@astryx.powersearch.editor.groupOperator'),
			groupFallbackLabel: t('@astryx.powersearch.editor.group'),
			value: partialFilter.operator,
			onChange: onOperatorChange,
			isReadOnly
		}));

		return [
			{
				id: 'nested-root',
				label: rootLabel,
				isExpanded: true,
				children: treeChildren
			}
		];
	});
</script>

<TreeList {items} density="balanced" />
