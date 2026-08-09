/**
 * @file `astryx-svelte layout expand` leaf — expand a validated layout
 * expression into a Svelte component (optionally written to disk). Resolution +
 * validation come from ../_adapter.mjs (analyze); this leaf owns block-module
 * assembly, code generation, and the path-safe write, and projects the
 * `layout.expand` envelope.
 *
 * @input  expression string (+ options)
 * @output {type:'layout.expand', data}
 * @position api — leaf over ../_adapter.mjs + foundation/xle/expand
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { AstryxError } from '../../error.mjs';
import { ERROR_CODES } from '../../../foundation/response/error-codes.mjs';
import {
	assertWithin,
	isFilePathArg,
	PathSafetyError
} from '../../../foundation/fs/path-safety.mjs';
import { detectForm } from '../../../foundation/xle/parse.mjs';
import { expand } from '../../../foundation/xle/expand.mjs';
import { analyze, formatIssue } from '../_adapter.mjs';

/** @param {string} name */
const normKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Collect the block names referenced by {hints} anywhere in the doc.
 * @param {import('../../../foundation/xle/xle-ast').XLEDoc} doc
 */
function collectHintNames(doc) {
	/** @type {Set<string>} */
	const names = new Set();
	/** @param {import('../../../foundation/xle/xle-ast').XLEItem} node */
	const visitNode = (node) => {
		if (!node || node.kind === 'group') {
			(node?.children || []).forEach(visit);
			return;
		}
		if (node.hint?.block) names.add(node.hint.block.name);
		for (const slot of node.slots || []) {
			const value = slot.value;
			if (value && typeof value === 'object' && 'hint' in value && value.hint?.block) {
				names.add(value.hint.block.name);
			}
			if (value && typeof value === 'object' && 'subexpr' in value) {
				(value.subexpr || []).forEach(visit);
			}
		}
		(node.children || []).forEach(visit);
	};
	/** @param {import('../../../foundation/xle/xle-ast').XLEItem} item */
	const visit = (item) => (item?.kind === 'group' ? item.children.forEach(visit) : visitNode(item));
	doc.roots.forEach(visit);
	doc.overlays.forEach(visit);
	return names;
}

/**
 * Build the blockModules map expand() needs: import-mode for app components.
 * Only blocks actually referenced are read.
 *
 * **Splice-mode template blocks are not ported, and this is settled rather than
 * pending.** Upstream's second branch reads `block.filePath`, runs it through
 * `stripTemplateAssetRefs`, and hands the source to the expander to co-define
 * as a second component in the generated module. Slice 6 landed template
 * discovery, so `filePath` is now populated (see ../_adapter.mjs) — but a
 * `.svelte` file holds exactly one component, so there is nothing to co-define
 * *into*. A `{hint}` naming a template block therefore falls through to the
 * expander's pointer marker, which is the same output upstream produces when a
 * block's source is unavailable. See foundation/xle/splice.mjs.
 *
 * @param {import('../../../foundation/xle/xle-ast').XLEDoc} doc
 * @param {import('../_adapter.mjs').LayoutBlock[]} blocks
 * @returns {Map<string, import('../../../foundation/xle/xle-ast').BlockModule>}
 */
function buildBlockModules(doc, blocks) {
	const referenced = collectHintNames(doc);
	if (referenced.size === 0) return new Map();
	const byKey = new Map(blocks.map((b) => [normKey(b.dirName), b]));
	/** @type {Map<string, import('../../../foundation/xle/xle-ast').BlockModule>} */
	const modules = new Map();
	for (const name of referenced) {
		const block = byKey.get(normKey(name));
		if (!block) continue;
		if (block.kind === 'component') {
			modules.set(
				name,
				/** @type {import('../../../foundation/xle/xle-ast').BlockModule} */ (
					/** @type {unknown} */ ({
						mode: 'import',
						componentName: block.name,
						importPath: block.importPath,
						isDefault: block.isDefault
					})
				)
			);
		}
	}
	return modules;
}

/**
 * `astryx-svelte layout expand "<expr>" [path]`
 *
 * @param {string} expression
 * @param {object} [options]
 * @param {string} [options.targetPath] - write the component here (validated against cwd)
 * @param {'compact'|'outline'|'auto'} [options.form]
 * @param {boolean} [options.loose] - downgrade unknown {hints} to TODO warnings
 * @param {string} [options.name] - generated component name
 * @param {string} [options.cwd]
 * @returns {Promise<import('../layout.type.mjs').LayoutExpandResponse>}
 */
export async function layoutExpand(expression, options = {}) {
	const { targetPath, form = 'auto', loose = false, name, cwd = process.cwd() } = options;
	const { doc, registry, blocks, errors, warnings } = await analyze(expression, {
		form,
		loose,
		cwd
	});

	if (errors.length > 0) {
		throw new AstryxError(
			`Layout expression is invalid:\n` + errors.map((e) => `  - ${formatIssue(e)}`).join('\n'),
			errors.flatMap((e) =>
				(e.suggestions || []).map((s) => ({ name: s, reason: 'did you mean this?' }))
			),
			ERROR_CODES.ERR_LAYOUT_INVALID
		);
	}

	const componentName = name || 'GeneratedLayout';
	if (!/^[A-Z][A-Za-z0-9]*$/.test(componentName)) {
		throw new AstryxError(
			`--name must be a PascalCase component name, got '${componentName}'`,
			undefined,
			ERROR_CODES.ERR_INVALID_ARGUMENT
		);
	}
	const blockModules = buildBlockModules(doc, blocks);
	const result = expand(doc, registry, { componentName, blockModules });

	let written = null;
	if (targetPath) {
		let resolved;
		try {
			resolved = assertWithin(targetPath, cwd, { label: 'layout target path' });
		} catch (err) {
			if (err instanceof PathSafetyError) {
				throw new AstryxError(err.message, undefined, ERROR_CODES.ERR_PATH_TRAVERSAL);
			}
			throw err;
		}
		// `.svelte` where upstream writes `.tsx` — the artifact is a component
		// file, and `isFilePathArg` already treats `.svelte` as a file (slice 2).
		const filePath = isFilePathArg(targetPath)
			? resolved
			: path.join(resolved, `${componentName}.svelte`);
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, result.code);
		written = path.relative(cwd, filePath);
	}

	return {
		type: 'layout.expand',
		data: {
			form: form === 'auto' ? detectForm(expression) : form,
			code: result.code,
			componentsUsed: result.componentsUsed,
			states: result.states,
			todos: result.todos,
			blocksReferenced: [...blockModules.entries()].map(([name, m]) => ({ name, mode: m.mode })),
			warnings: warnings.map(formatIssue),
			written
		}
	};
}
