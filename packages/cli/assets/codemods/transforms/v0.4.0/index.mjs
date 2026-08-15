/**
 * @file v0.4.0 transform manifest — this port's **first** registered version.
 *
 * The registry was deliberately empty until now (see
 * `assets/codemods/registry.mjs`): a codemod migrates *between* two releases and
 * this port had shipped only one. 0.4.0 is the second, and it carries a breaking
 * change — `useTableRowExpansion` became a detail-panel plugin and
 * `useTableRowExpansionState` was removed — so it is exactly the transition a
 * codemod exists for.
 *
 * All three of upstream's v0.4.0 transforms are here, in upstream's order.
 * `migrate-table-rowexpansion-to-tree` landed first and the two renames
 * followed; an earlier version of this header claimed the renames "rewrite
 * `data-*` attribute selectors in a consumer's CSS against React DOM output",
 * which was simply wrong about both — one renames a **theme target string** and
 * the class it renders, the other renames **type-only imports** — and the
 * deferral it justified is now closed.
 */

import renameDropdownMenuRadioDotTarget, {
	meta as renameDropdownMenuRadioDotTargetMeta
} from './rename-dropdown-menu-radio-dot-target.mjs';
import migrateTableRowExpansionToTree, {
	meta as migrateTableRowExpansionToTreeMeta
} from './migrate-table-rowexpansion-to-tree.mjs';
import renameMenuDividerDataTypes, {
	meta as renameMenuDividerDataTypesMeta
} from './rename-menu-divider-data-types.mjs';

export default [
	{
		name: 'rename-dropdown-menu-radio-dot-target',
		transform: renameDropdownMenuRadioDotTarget,
		meta: renameDropdownMenuRadioDotTargetMeta
	},
	{
		name: 'migrate-table-rowexpansion-to-tree',
		transform: migrateTableRowExpansionToTree,
		meta: migrateTableRowExpansionToTreeMeta
	},
	{
		name: 'rename-menu-divider-data-types',
		transform: renameMenuDividerDataTypes,
		meta: renameMenuDividerDataTypesMeta
	}
];
