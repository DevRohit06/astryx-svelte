/**
 * Diffs the stylesheet `build-css.mjs` produces against upstream's published
 * `@astryxdesign/core/dist/astryx.css`.
 *
 * `compare-upstream-classes.mjs` already proves our `.stylex.ts` modules emit
 * upstream's atomic classes — but it reads them *statically*, so it cannot see
 * inside a `stylex.create` function style, and there are 54 of those. This check
 * is blind to none of them: it compares the CSS the compiler actually emitted,
 * which is the same evidence either way. That is not a hypothetical gain — it
 * is how Avatar's status dot was found still positioned with a physical `right`
 * against upstream 0.2.0, months after 0.3.0 mirrored it for RTL.
 *
 * Three kinds of difference are expected and handled rather than ignored:
 *
 * 1. **Marker-scoped rules.** A rule scoped by a `defineMarker()` class embeds
 *    that class, and a marker class is a hash of its module's *path*, which
 *    cannot agree across two repos with different layouts. Such rules are paired
 *    by their class-blinded shape instead — same selector structure, same
 *    declarations, different hash.
 * 2. **`:not(#\#)` padding.** Upstream's build pads specificity where a
 *    layer-based build would not. It expresses ordering, not style, and is
 *    stripped from both sides.
 * 3. **Named skips.** Classes upstream ships that we deliberately do not. Each
 *    carries its reason, and the list cannot rot: a skip that stops being
 *    upstream-only fails the run, exactly as in the other two oracles.
 *
 * Anything else is a finding. A rule we emit that upstream does not is an
 * invented style; a rule upstream emits that we do not is a missing one.
 */

import styleXPlugin from '@stylexjs/babel-plugin';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { collectStyleXRules, root } from './lib/collect-stylex-rules.mjs';

const upstreamSheet = path.join(root, 'node_modules/@astryxdesign/core/dist/astryx.css');

/**
 * Classes upstream's stylesheet carries that ours deliberately does not.
 *
 * All ten are upstream's own ESLint-plugin fixture,
 * `packages/core/src/Badge/Badge.test-violations.tsx`, a file of *intentional*
 * token violations ("VIOLATION: hardcoded color") used to test their lint rules.
 * Their `build-css.mjs` ignores `**\/*.test.*`, and `Badge.test-violations.tsx`
 * does not match that glob — `.test-violations.` is not `.test.` — so the
 * fixture compiles into the published stylesheet and every consumer downloads
 * `color:#FF0000`. An upstream bug, reproduced nowhere: per the porting rule,
 * upstream bugs are written down rather than replicated.
 *
 * Retires by itself the day upstream fixes their glob.
 *
 * @type {Array<{ class: string, rule: string, reason: string }>}
 */
const SKIP = [
	{ class: 'xkib98w', rule: '{margin:8px}', reason: 'Badge.test-violations fixture' },
	{ class: 'x1tamke2', rule: '{padding:16px}', reason: 'Badge.test-violations fixture' },
	{ class: 'xur7f20', rule: '{border-radius:8px}', reason: 'Badge.test-violations fixture' },
	{ class: 'x1jnr06f', rule: '{gap:4px}', reason: 'Badge.test-violations fixture' },
	{
		class: 'xcpsgoo',
		rule: '{background-color:rgba(0,0,0,.5)}',
		reason: 'Badge.test-violations fixture'
	},
	{ class: 'xj8ax7g', rule: '{color:#FF0000}', reason: 'Badge.test-violations fixture' },
	{ class: 'xfifm61', rule: '{font-size:12px}', reason: 'Badge.test-violations fixture' },
	{ class: 'xif65rj', rule: '{font-size:14px}', reason: 'Badge.test-violations fixture' },
	{ class: 'xk50ysn', rule: '{font-weight:500}', reason: 'Badge.test-violations fixture' },
	{ class: 'x1s688f', rule: '{font-weight:600}', reason: 'Badge.test-violations fixture' }
];

const LAYER_OPEN = '@layer astryx-base {';

/**
 * Split a sheet into its top-level rules, normalised.
 *
 * Returns class rules keyed by their own atomic class, and everything else
 * (`@property`, `@media`, `@keyframes`, and the `:root, .xNNNN{…}` blocks
 * `defineVars` emits) as a set of whole rule texts.
 *
 * @param {string} text
 * @returns {{ classes: Map<string, string>, others: Set<string> }}
 */
function parseSheet(text) {
	const classes = new Map();
	const others = new Set();
	const start = text.indexOf(LAYER_OPEN);
	const inner = start === -1 ? text : text.slice(start + LAYER_OPEN.length, text.lastIndexOf('}'));

	let depth = 0;
	let from = 0;
	for (let i = 0; i < inner.length; i++) {
		if (inner[i] === '{') depth++;
		else if (inner[i] === '}') {
			depth--;
			if (depth !== 0) continue;
			const chunk = inner.slice(from, i + 1).trim();
			from = i + 1;
			if (chunk === '') continue;
			const rule = chunk.replaceAll(':not(#\\#)', '').replace(/\s+/g, ' ').trim();
			const own = /^\.([A-Za-z0-9_-]+)/.exec(rule);
			if (own === null) others.add(rule);
			else classes.set(own[1], rule);
		}
	}
	return { classes, others };
}

/** A rule scoped by another atomic class — i.e. by a `defineMarker()`. */
const isMarkerScoped = (rule) => /:where\(\./.test(rule);

/** The same rule with every atomic class replaced, so two hashes can be compared. */
const blindClasses = (rule) => rule.replace(/\.[A-Za-z0-9_-]+/g, '.C');

/** @param {string[]} list */
const tally = (list) => {
	const counts = new Map();
	for (const item of list) counts.set(item, (counts.get(item) ?? 0) + 1);
	return counts;
};

if (!existsSync(upstreamSheet)) {
	console.error(
		`@astryxdesign/core is not installed at ${upstreamSheet}.\n` +
			'It is a devDependency and this check needs it. Never install with --prod.'
	);
	process.exit(1);
}

const { rules, fileCount } = await collectStyleXRules();
const ours = parseSheet(`${LAYER_OPEN}\n${styleXPlugin.processStylexRules(rules, false)}\n}`);
const upstream = parseSheet(readFileSync(upstreamSheet, 'utf8'));

/** @type {string[]} */
const findings = [];

// --- 1. classes both sheets carry must say the same thing ------------------
const shared = [...ours.classes.keys()].filter((name) => upstream.classes.has(name));
const differing = shared.filter((name) => ours.classes.get(name) !== upstream.classes.get(name));
for (const name of differing) {
	findings.push(
		`.${name} differs\n    ours    : ${ours.classes.get(name)}\n    upstream: ${upstream.classes.get(name)}`
	);
}

// --- 2. marker-scoped rules pair by shape, not by hash ---------------------
const upstreamOnly = [...upstream.classes.keys()].filter((name) => !ours.classes.has(name));
const oursOnly = [...ours.classes.keys()].filter((name) => !upstream.classes.has(name));

const markerUp = tally(
	upstreamOnly
		.map((n) => upstream.classes.get(n))
		.filter(isMarkerScoped)
		.map(blindClasses)
);
const markerOurs = tally(
	oursOnly
		.map((n) => ours.classes.get(n))
		.filter(isMarkerScoped)
		.map(blindClasses)
);
for (const [shape, count] of markerUp) {
	const mine = markerOurs.get(shape) ?? 0;
	if (mine < count) findings.push(`marker-scoped rule missing (${count - mine}×): ${shape}`);
}
for (const [shape, count] of markerOurs) {
	const theirs = markerUp.get(shape) ?? 0;
	if (theirs < count) findings.push(`marker-scoped rule invented (${count - theirs}×): ${shape}`);
}

// --- 3. everything else must be a named skip, and every skip must still hit -
const skipByClass = new Map(SKIP.map((entry) => [entry.class, entry]));
const plainUpstreamOnly = upstreamOnly.filter((n) => !isMarkerScoped(upstream.classes.get(n)));
const plainOursOnly = oursOnly.filter((n) => !isMarkerScoped(ours.classes.get(n)));

for (const name of plainUpstreamOnly) {
	const skip = skipByClass.get(name);
	if (skip === undefined) {
		findings.push(`missing rule upstream ships: ${upstream.classes.get(name)}`);
		continue;
	}
	const declaration = upstream.classes.get(name).slice(upstream.classes.get(name).indexOf('{'));
	if (declaration !== skip.rule) {
		findings.push(
			`skip .${name} still applies but its rule changed\n` +
				`    recorded: ${skip.rule}\n    upstream: ${declaration}`
		);
	}
}
for (const name of plainOursOnly) {
	findings.push(`invented rule upstream does not ship: ${ours.classes.get(name)}`);
}

// A skip that no longer matches is a skip that has rotted.
const stillUpstreamOnly = new Set(plainUpstreamOnly);
for (const skip of SKIP) {
	if (!stillUpstreamOnly.has(skip.class)) {
		findings.push(
			`skip .${skip.class} (${skip.reason}) no longer applies — ` +
				(ours.classes.has(skip.class)
					? 'we now emit it too; delete the skip'
					: 'upstream no longer ships it; delete the skip')
		);
	}
}

// --- 4. the non-class rules ------------------------------------------------
// `:root, .xNNNN{…}` blocks are `defineVars` output: the declarations are the
// contract, the companion class is a path hash. Compare them blinded, like the
// marker rules.
const blindOthers = (set) => tally([...set].map(blindClasses));
const othersUp = blindOthers(upstream.others);
const othersOurs = blindOthers(ours.others);
for (const [shape, count] of othersUp) {
	const mine = othersOurs.get(shape) ?? 0;
	if (mine < count) findings.push(`missing at-rule/declaration (${count - mine}×): ${shape}`);
}
for (const [shape, count] of othersOurs) {
	const theirs = othersUp.get(shape) ?? 0;
	if (theirs < count) findings.push(`invented at-rule/declaration (${count - theirs}×): ${shape}`);
}

// --- report ----------------------------------------------------------------
console.log(`compiled ${fileCount} modules into ${rules.length} rules`);
console.log(
	`${shared.length} classes shared with upstream, ` +
		`${markerUp.size} marker-scoped shapes paired, ${SKIP.length} skips`
);

if (findings.length > 0) {
	console.error(`\n${findings.length} mismatch(es):\n`);
	for (const finding of findings) console.error(`  ${finding}`);
	process.exit(1);
}

console.log('astryx.css matches upstream.');
