/**
 * @file no-physical-properties.js
 * @description Disallow physical left/right CSS properties (and physical
 *   left/right VALUES) inside `stylex.create()`. Physical properties don't flip
 *   under RTL; the CSS logical-property equivalents (inline-start/inline-end,
 *   start/end) do, so they're required for correct right-to-left rendering.
 *
 *   Two kinds of violation are detected:
 *   1. KEY-BASED — the object key is itself a banned physical property
 *      (e.g. `marginLeft`, `borderRightColor`, `left`, `borderTopLeftRadius`).
 *      The suggested fix renames the key to the logical equivalent.
 *   2. VALUE-BASED — the key is fine, but a specific physical VALUE is used
 *      (e.g. `textAlign: 'left'`, `float: 'right'`, `clear: 'left'`). The
 *      suggested fix replaces only the value; the key is left alone.
 *
 * ## Provenance
 *
 * Ported from upstream's `internal/eslint-plugin-astryx/no-physical-properties.js`
 * (added in 0.2.0 alongside the RTL migration). The rule logic is upstream's,
 * unchanged — same two maps, same conflict guard, same autofix behaviour. Only
 * the packaging differs: upstream ships an `eslint-plugin-astryx` package with
 * `strict`/`recommended` tiers, and this port has one consumer, so the rule is a
 * local module wired directly into `eslint.config.js`.
 *
 * It matters that this is upstream's rule rather than one written here: it is
 * what keeps the RTL phase-2 migration from rotting. The migration is a no-op in
 * LTR and therefore invisible — nothing renders differently, no test fails, and
 * the class oracle only notices once a `.stylex.ts` is *already* wrong. A lint
 * rule is the only mechanical guard that catches `left:` being reintroduced by
 * the next component ported by hand.
 *
 * ## Severity
 *
 * Shipped at **`error`** since batch 17a closed the A2 migration (99 sites, 27
 * modules → 0). That is stricter than upstream, which keeps the rule at `warn`
 * because its own core still has un-migrated physical properties.
 *
 * The port has no un-migrated ones — only *deliberate* ones. Roughly 19
 * declarations stay physical to keep byte-parity with upstream's compiled
 * classes, and each carries an inline `eslint-disable` naming the reason
 * (symmetric pairs whose logical spelling emits identical CSS; a published
 * physical API like `DialogProps.position`; a Markdown table's author-specified
 * `textAlign: 'right'`, which means the literal right edge, not the line end).
 *
 * Those disables are checked by something other than themselves: if upstream
 * migrates one, the emitted atomic class changes and the **class oracle**
 * reports a mismatch. The rule guards against *new* physical properties; the
 * oracle guards the exceptions.
 *
 * ## Autofix
 *
 * Fixable (`meta.fixable: 'code'`).
 *   - VALUE-BASED fixes are always safe: only the value literal is replaced.
 *   - KEY-BASED fixes rename the key token, but ONLY when the logical key is not
 *     already present in the same style object. If BOTH the physical and logical
 *     key are present, renaming would produce a duplicate property (and the two
 *     silently collide — last one wins in LTR), so instead of autofixing we
 *     surface a distinct `physicalKeyConflict` message for a human to resolve.
 */

/**
 * Physical property KEYS → their CSS logical equivalent.
 * When one of these appears as an object key inside `stylex.create()`, flag it
 * and suggest the logical rename.
 *
 * The corner-radius mappings are diagonal-aware: a physical corner is named
 * <vertical><horizontal>, while the logical corner is named <block><inline>.
 *   top-left     → start(block) start(inline) → borderStartStartRadius
 *   top-right    → start(block) end(inline)   → borderStartEndRadius
 *   bottom-left  → end(block)   start(inline) → borderEndStartRadius
 *   bottom-right → end(block)   end(inline)   → borderEndEndRadius
 */
const PHYSICAL_KEY_MAP = {
	// Margin
	marginLeft: 'marginInlineStart',
	marginRight: 'marginInlineEnd',
	// Padding
	paddingLeft: 'paddingInlineStart',
	paddingRight: 'paddingInlineEnd',
	// Border side shorthands
	borderLeft: 'borderInlineStart',
	borderRight: 'borderInlineEnd',
	// Border side longhands (left)
	borderLeftWidth: 'borderInlineStartWidth',
	borderLeftStyle: 'borderInlineStartStyle',
	borderLeftColor: 'borderInlineStartColor',
	// Border side longhands (right)
	borderRightWidth: 'borderInlineEndWidth',
	borderRightStyle: 'borderInlineEndStyle',
	borderRightColor: 'borderInlineEndColor',
	// Inset
	left: 'insetInlineStart',
	right: 'insetInlineEnd',
	// Corner radii (diagonal-aware: vertical+horizontal → block+inline)
	borderTopLeftRadius: 'borderStartStartRadius',
	borderTopRightRadius: 'borderStartEndRadius',
	borderBottomLeftRadius: 'borderEndStartRadius',
	borderBottomRightRadius: 'borderEndEndRadius'
};

/**
 * Property KEYS whose physical left/right VALUES should be flagged. The key
 * itself is fine — only the specific physical value literal is a violation.
 * Maps `key → { physicalValue → logicalValue }`.
 */
const PHYSICAL_VALUE_MAP = {
	textAlign: { left: 'start', right: 'end' },
	float: { left: 'inline-start', right: 'inline-end' },
	clear: { left: 'inline-start', right: 'inline-end' }
};

function isInsideStylexCreate(node) {
	let current = node;
	while (current) {
		if (
			current.type === 'CallExpression' &&
			current.callee?.type === 'MemberExpression' &&
			current.callee.object?.name === 'stylex' &&
			current.callee.property?.name === 'create'
		) {
			return true;
		}
		current = current.parent;
	}
	return false;
}

function getStaticValue(node) {
	if (!node) return null;
	if (node.type === 'Literal' && typeof node.value === 'string') {
		return node.value;
	}
	return null;
}

/**
 * Does the given ObjectExpression already contain a Property whose key is
 * `keyName`? Handles both identifier keys (`marginLeft`) and string-literal
 * keys (`'marginLeft'`).
 */
function objectHasKey(objectExpression, keyName) {
	if (!objectExpression || objectExpression.type !== 'ObjectExpression') {
		return false;
	}
	return objectExpression.properties.some((prop) => {
		if (prop.type !== 'Property') return false;
		const name = prop.key?.name ?? prop.key?.value;
		return name === keyName;
	});
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: 'problem',
		fixable: 'code',
		docs: {
			description:
				'Disallow physical left/right CSS properties and values inside ' +
				'stylex.create(). Use the CSS logical equivalents ' +
				'(inline-start/inline-end, start/end) for RTL support.'
		},
		messages: {
			physicalKey: 'Use `{{logical}}` instead of `{{physical}}` for RTL support.',
			physicalValue:
				"Use `{{prop}}: '{{logical}}'` instead of `{{prop}}: '{{physical}}'` for RTL support.",
			physicalKeyConflict:
				'`{{physical}}` conflicts with `{{logical}}` already set on this ' +
				'style object — remove `{{physical}}`.'
		},
		schema: []
	},
	create(context) {
		return {
			Property(node) {
				if (!isInsideStylexCreate(node)) return;

				const propName = node.key?.name || node.key?.value;
				if (!propName) return;

				// KEY-BASED: the object key is itself a physical property.
				const logicalKey = PHYSICAL_KEY_MAP[propName];
				if (logicalKey) {
					// Guard: if the logical key is ALSO present in the same object,
					// renaming would create a duplicate/silent collision. Ambiguous
					// which value the author meant — surface a distinct message, no fix.
					if (objectHasKey(node.parent, logicalKey)) {
						context.report({
							node: node.key,
							messageId: 'physicalKeyConflict',
							data: { physical: propName, logical: logicalKey }
						});
						return;
					}

					// Preserve the original key's quoting: a string-literal key is
					// replaced with a quoted string; an identifier key stays unquoted.
					// All logical names are valid identifiers.
					const isStringLiteralKey =
						node.key.type === 'Literal' && typeof node.key.value === 'string';
					const newKeyText = isStringLiteralKey ? `'${logicalKey}'` : logicalKey;

					context.report({
						node: node.key,
						messageId: 'physicalKey',
						data: { physical: propName, logical: logicalKey },
						fix(fixer) {
							return fixer.replaceText(node.key, newKeyText);
						}
					});
					return;
				}

				// VALUE-BASED: the key is fine, but the value may be physical.
				const valueMap = PHYSICAL_VALUE_MAP[propName];
				if (valueMap) {
					const value = getStaticValue(node.value);
					if (value !== null && valueMap[value]) {
						const logicalValue = valueMap[value];
						context.report({
							node: node.value,
							messageId: 'physicalValue',
							data: { prop: propName, physical: value, logical: logicalValue },
							fix(fixer) {
								return fixer.replaceText(node.value, `'${logicalValue}'`);
							}
						});
					}
				}
			}
		};
	}
};

export default rule;
