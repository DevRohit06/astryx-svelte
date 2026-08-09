/**
 * @file XLE/XLO browser barrel — the layout language without Node deps.
 *
 * The CLI builds its registry by reading `.doc.mjs` from disk (registry.mjs,
 * Node-only). A browser playground instead receives a *serialized* registry
 * (built at deploy time) and hydrates it here, then runs the same pure parse ->
 * validate -> expand -> print pipeline. Importing this module never pulls in
 * node:fs, so it bundles cleanly for the web.
 *
 * Ported unchanged apart from the package name it is published under: every
 * framework-specific decision lives one layer down, in expand.mjs.
 *
 * @input  expression string + a serialized-or-hydrated registry (+ blocks)
 * @output checkExpression / expandExpression + the raw pipeline pieces
 * @position foundation/xle — exported as `@astryx-svelte/cli/xle`
 */

import { parse, detectForm, XLEParseError } from './parse.mjs';
import { validate } from './validate.mjs';
import { expand } from './expand.mjs';
import { toCompact, toOutline } from './print.mjs';
import { hydrateRegistry } from './registry-core.mjs';

export { parse, detectForm, XLEParseError, validate, expand, toCompact, toOutline };
export {
	hydrateRegistry,
	serializeRegistry,
	ALIAS_TABLE,
	resolveComponent,
	SPACING_STEPS
} from './registry-core.mjs';

/**
 * Accept either a hydrated registry (Map fields) or serialized JSON.
 * @param {import('./xle-ast').Registry | import('./browser').SerializedRegistry | object} registry
 * @returns {import('./xle-ast').Registry}
 */
function asRegistry(registry) {
	return registry && /** @type {any} */ (registry).components instanceof Map
		? /** @type {import('./xle-ast').Registry} */ (registry)
		: hydrateRegistry(/** @type {import('./browser').SerializedRegistry} */ (registry));
}

/**
 * @param {import('./xle-ast').RawIssue | {message: string, line?: number, col?: number}} issue
 * @returns {string}
 */
function formatIssue(issue) {
	const where = issue.line != null ? `line ${issue.line}: ` : '';
	return `${where}${issue.message}`;
}

/**
 * Validate an expression and return both canonical surfaces — the browser twin
 * of `layout check`. Never throws on invalid input; returns the errors.
 *
 * @param {string} expression
 * @param {import('./xle-ast').Registry | import('./browser').SerializedRegistry | object} registry - serialized or hydrated
 * @param {object} [opts]
 * @param {import('./browser').XLEBlock[]} [opts.blocks] - block list for {hint} resolution (default [])
 * @param {'compact'|'outline'|'auto'} [opts.form]
 * @param {boolean} [opts.loose]
 * @returns {import('./browser').CheckResult}
 */
export function checkExpression(expression, registry, opts = {}) {
	const { blocks = [], form = 'auto', loose = false } = opts;
	let doc;
	try {
		doc = parse(expression, { form });
	} catch (e) {
		if (e instanceof XLEParseError) {
			return {
				ok: false,
				valid: false,
				errors: [
					{
						message: e.message,
						line: e.line,
						col: e.col,
						formatted: formatIssue(e),
						kind: 'parse'
					}
				],
				warnings: [],
				parseError: { message: e.message, line: e.line, col: e.col }
			};
		}
		throw e;
	}
	const { errors, warnings } = validate(doc, asRegistry(registry), blocks, { loose });
	return {
		ok: true,
		valid: errors.length === 0,
		form: doc.form,
		errors: errors.map((e) => ({ ...e, formatted: formatIssue(e) })),
		warnings: warnings.map(formatIssue),
		compact: toCompact(doc),
		outline: toOutline(doc)
	};
}

/**
 * Validate + expand to Svelte — the browser twin of `layout expand`.
 * Returns either {code, ...} or {errors} (never writes files).
 *
 * @param {string} expression
 * @param {import('./xle-ast').Registry | import('./browser').SerializedRegistry | object} registry
 * @param {object} [opts]
 * @param {import('./browser').XLEBlock[]} [opts.blocks]
 * @param {'compact'|'outline'|'auto'} [opts.form]
 * @param {boolean} [opts.loose]
 * @param {string} [opts.name] - generated component name (PascalCase)
 * @param {Map<string, import('./xle-ast').BlockModule>} [opts.blockModules] - prepared block references;
 *   omit in the browser (hints stay as TODO markers without sources)
 * @returns {import('./browser').ExpandResult}
 */
export function expandExpression(expression, registry, opts = {}) {
	const {
		blocks = [],
		form = 'auto',
		loose = false,
		name = 'GeneratedLayout',
		blockModules
	} = opts;
	const reg = asRegistry(registry);
	let doc;
	try {
		doc = parse(expression, { form });
	} catch (e) {
		if (e instanceof XLEParseError) {
			return {
				ok: false,
				errors: [
					{
						message: e.message,
						line: e.line,
						col: e.col,
						formatted: formatIssue(e),
						kind: 'parse'
					}
				]
			};
		}
		throw e;
	}
	const { errors, warnings } = validate(doc, reg, blocks, { loose });
	if (errors.length > 0) {
		return { ok: false, errors: errors.map((e) => ({ ...e, formatted: formatIssue(e) })) };
	}
	if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
		const message = `Component name must be PascalCase, got '${name}'`;
		return { ok: false, errors: [{ message, formatted: message }] };
	}
	const result = expand(doc, reg, { componentName: name, blockModules });
	return {
		ok: true,
		form: form === 'auto' ? detectForm(expression) : form,
		code: result.code,
		componentsUsed: result.componentsUsed,
		states: result.states,
		todos: result.todos,
		warnings: warnings.map(formatIssue)
	};
}
