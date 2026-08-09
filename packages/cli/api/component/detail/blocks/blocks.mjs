/**
 * @file `component.detail.blocks` leaf — a component's example/related blocks.
 *
 * @input  a component name
 * @output the `component.detail.blocks` envelope (showcase, examples, related)
 * @position api/component/detail/blocks (projection leaf; routed by component.mjs)
 *
 * **Block discovery landed with slice 6**; `findRelatedBlocks` lives in
 * `api/template/template.mjs` and is called below, as upstream's is. The split
 * into showcase / examples / related is unchanged.
 *
 * The lists are empty for every *core* component, and that is an asset gap
 * rather than a logic one: `packages/cli/assets/templates/blocks/` does not
 * exist, so core contributes no blocks. Blocks contributed by an external
 * package (`astryx.blocks` in its package.json) or by a configured integration
 * flow through here today.
 */

import * as path from 'node:path';
import { findRelatedBlocks } from '../../../template/template.mjs';

/**
 * Project a component's related blocks into the `component.detail.blocks`
 * envelope, splitting them into the hero showcase, component-specific examples,
 * and broader related blocks.
 * @param {string} componentName
 * @returns {Promise<import('../../component.type.mjs').ComponentDetailBlocksResponse>}
 */
export async function componentDetailBlocks(componentName) {
	/** @type {any[]} */
	const allBlocks = await findRelatedBlocks(componentName);
	const toEntry = (/** @type {any} */ b) => ({
		name: b.dirName,
		displayName: b.name,
		description: b.description,
		isShowcase: b.isShowcase ?? false,
		category: b.category
	});

	// Examples: blocks in the component's own directory, or
	// componentsUsed match for sub-components without a directory.
	const ownDir = allBlocks.filter(
		(/** @type {any} */ b) => path.basename(b.category) === componentName
	);
	const examples =
		ownDir.length > 0
			? ownDir
			: allBlocks.filter((b) =>
					b.componentsUsed?.some((/** @type {string} */ c) => c === componentName)
				);
	const exampleSet = new Set(examples.map((b) => b.dirName));

	// Showcase: the single hero example from the examples list.
	const showcaseBlock = examples.find((b) => b.isShowcase) || null;

	// Related: everything else that uses this component but isn't
	// primarily about it (e.g. a Dialog block that has a Button).
	const related = allBlocks.filter((b) => !exampleSet.has(b.dirName));

	return {
		type: 'component.detail.blocks',
		data: {
			component: componentName,
			showcase: showcaseBlock ? toEntry(showcaseBlock) : null,
			examples: examples.filter((b) => b !== showcaseBlock).map(toEntry),
			related: related.map(toEntry)
		}
	};
}
