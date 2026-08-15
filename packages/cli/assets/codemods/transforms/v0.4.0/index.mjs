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
 * **One entry, not upstream's three.** Upstream's v0.4.0 folder also stages
 * `rename-dropdown-menu-radio-dot-target` and `rename-menu-divider-data-types`,
 * both of which rewrite `data-*` attribute selectors in a consumer's CSS against
 * React DOM output. Neither is ported here yet; they are separate migrations
 * with their own parity work, and inventing them alongside this one would be
 * shipping untested rewrites over consumer stylesheets.
 */

import migrateTableRowExpansionToTree, {
	meta as migrateTableRowExpansionToTreeMeta
} from './migrate-table-rowexpansion-to-tree.mjs';

export default [
	{
		name: 'migrate-table-rowexpansion-to-tree',
		transform: migrateTableRowExpansionToTree,
		meta: migrateTableRowExpansionToTreeMeta
	}
];
