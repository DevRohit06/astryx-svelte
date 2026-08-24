/**
 * @file Regression tests for theme-build component-override keys.
 *
 * `astryx-svelte theme build` emits a component override as a `.astryx-<key>`
 * rule, where `<key>` is the theme's `components` key passed through verbatim
 * (the generator re-adds the `astryx-` prefix). The validator reads the same
 * documented theming targets that component docs expose, so the docs must stay
 * aligned with the classes components actually render.
 *
 * Two adaptations, and one of them is a finding rather than a translation:
 *
 * 1. **Source shapes.** Docs live at `<core>/src/lib/**\/<Export>.doc.mjs`
 *    rather than `<core>/src/<Pascal>/<Pascal>.doc.mjs`, and the rendered class
 *    literals are in `.svelte` and `.ts` rather than `.tsx`. Same two sets,
 *    read from where this port keeps them.
 * 2. **The subtarget fixture names different components.** Upstream's uses
 *    `chat-composer` and `chat-message-bubble`; this port renders both classes
 *    but documents neither, so the fixture would trip the very
 *    "Unknown component" warning the case asserts is absent. The substitutes —
 *    `banner-content` (a documented sub-target) and `avatar-status-dot` with a
 *    `variant:` key (a documented sub-target with a visual prop) — exercise the
 *    identical mechanism against docs this port has.
 *
 *    **The gap is real and belongs to the docs emitter, not to `theme build`.**
 *    Measured: core renders 214 stable class tokens and documents 199. The 15
 *    missing ones are the 12 `chat-*` classes plus `trigger-menu`,
 *    `resize-handle` and `resize-handle-pill` — and every one of them is
 *    documented upstream in exactly two files, `Chat.doc.mjs` and
 *    `Resizable.doc.mjs`, both *umbrella* docs for a component family that has
 *    no same-named export here, so `docs/scripts/emit-core-docs.mjs` (which
 *    emits one file per documented **export**) has nowhere to put them.
 *    Upstream is 214/214 with zero undocumented; the direction this suite's
 *    first case checks — documented targets that nothing renders — is 0 here
 *    too, so that case is ported unchanged and passes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { ensureCoreBuilt } from '../../../test-utils/ensure-core-built.mjs';
import { runCli } from '../../../test-utils/run-cli.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORE_SRC = path.resolve(HERE, '../../../../core/src/lib');

/**
 * The set of real override keys: every `theming.targets[].className` across the
 * component docs, with the `astryx-` prefix stripped. This is the canonical
 * source of truth for what selectors the theme build should emit.
 */
function realOverrideKeys() {
	const keys = new Set();
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.name.endsWith('.doc.mjs')) {
				const text = fs.readFileSync(full, 'utf8');
				const themingIdx = text.indexOf('theming');
				if (themingIdx === -1) continue;
				const scoped = text.slice(themingIdx);
				const re = /className:\s*'astryx-([a-z0-9-]+)'/g;
				let m;
				while ((m = re.exec(scoped)) !== null) {
					keys.add(m[1]);
				}
			}
		}
	};
	walk(CORE_SRC);
	return keys;
}

/**
 * The stable classes components ACTUALLY render: the literal first argument of
 * every `themeProps('<class>', …)` and `stableClassName('<class>')` call across
 * the core source (excluding tests). This is the truest source of truth — the
 * doc `theming.targets` are hand-authored metadata that can drift from it, so
 * the targets are validated against these literals. Every call site uses a
 * plain string literal (no dynamic/interpolated names), so this is fully static.
 */
function renderedClassLiterals() {
	const classes = new Set();
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (
				(entry.name.endsWith('.svelte') || entry.name.endsWith('.ts')) &&
				!entry.name.endsWith('.test.ts')
			) {
				const text = fs.readFileSync(full, 'utf8');
				for (const re of [/themeProps\(\s*'([^']+)'/g, /stableClassName\(\s*'([^']+)'/g]) {
					let m;
					while ((m = re.exec(text)) !== null) {
						classes.add(m[1]);
					}
				}
				// `themeProps`' third argument can emit further stable classes that
				// appear in no literal of their own: `legacyNames` is how a RENAMED
				// target keeps emitting its old class through a deprecation window
				// (the indicator layer renamed `checkbox` -> `checkbox-indicator`,
				// `radio` -> `radio-indicator`, `radio-dot` -> `radio-indicator-dot`).
				// Without this the old names read as orphans and the check fails on
				// docs that are correct — the rename is exactly what it exists to
				// keep honest, so it has to see both halves.
				const legacy = /legacyNames:\s*\[([^\]]*)\]/g;
				let block;
				while ((block = legacy.exec(text)) !== null) {
					for (const name of block[1].matchAll(/'([^']+)'/g)) {
						classes.add(name[1]);
					}
				}
				// `usePopover`'s `surfaceTarget` is the same shape of problem. The
				// popup SURFACE is created by the hook, not by the calling component,
				// so the component cannot stamp a target on it directly — it names one
				// through this option and `popover-layer.svelte` applies
				// `stableClassName(popover.surfaceTarget)`, a variable. The literal
				// therefore only ever appears at the call site, as an option value.
				const surfaceTarget = /surfaceTarget:\s*'([^']+)'/g;
				let surface;
				while ((surface = surfaceTarget.exec(text)) !== null) {
					classes.add(surface[1]);
				}
			}
		}
	};
	walk(CORE_SRC);
	return classes;
}

describe('theme-build documented target validation', () => {
	// Targets upstream documents for a feature this port has not ported yet. They
	// are orphaned here because the component that would render them does not
	// exist, not because a literal disagrees with its doc.
	//
	// Hygiene runs in both directions, exactly as the class oracle's `skip` list
	// does: an entry that stops being orphaned fails the run, so porting the
	// feature forces the entry out rather than leaving a dead exemption behind.
	const UNPORTED_FEATURE_TARGETS = new Map([
		[
			'date-time-input-time-listbox',
			'DateTimeInput `timeOptionInterval` (upstream #4837) is not ported — the time ' +
				'field has no combobox/listbox to carry the target'
		],
		[
			'date-time-input-time-option',
			'DateTimeInput `timeOptionInterval` (upstream #4837) is not ported — there are ' +
				'no preset time options to carry the target'
		]
	]);

	it('every documented theming target is backed by a real themeProps literal', () => {
		// Guards against a component whose doc target className and rendered
		// themeProps()/stableClassName() literal disagree. The docs are what theme
		// build validates against; the literals are what actually matches the DOM.
		const targets = realOverrideKeys();
		const rendered = renderedClassLiterals();

		const orphanTargets = [...targets].filter((k) => !rendered.has(k));

		const stale = [...UNPORTED_FEATURE_TARGETS.keys()].filter((k) => !orphanTargets.includes(k));
		expect(
			stale,
			`UNPORTED_FEATURE_TARGETS lists ${stale.length} target(s) that are no longer ` +
				`orphaned: ${stale.join(', ')}. Remove them — the list may only shrink.`
		).toEqual([]);

		expect(orphanTargets.filter((k) => !UNPORTED_FEATURE_TARGETS.has(k))).toEqual([]);
	});
});

describe('theme build emits a live TextInput selector (#4109)', () => {
	let tmpDir;
	beforeAll(() => {
		ensureCoreBuilt();
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-4109-'));
	}, 200_000);

	it('accepts documented subtargets from component docs', async () => {
		const themeFile = path.join(tmpDir, 'subtargets.mjs');
		const outFile = path.join(tmpDir, 'subtargets.css');
		fs.writeFileSync(
			themeFile,
			`export default {\n` +
				`  name: 'subtargets-4109',\n` +
				`  tokens: {},\n` +
				`  components: {\n` +
				`    'side-nav-item': { base: { borderRadius: '12px' } },\n` +
				`    'banner-content': { base: { padding: '10px' } },\n` +
				`    'avatar-status-dot': { 'variant:ghost': { borderRadius: '18px' } },\n` +
				`  },\n` +
				`};\n`
		);

		const result = await runCli(['theme', 'build', themeFile, '-o', outFile]);
		const css = fs.readFileSync(outFile, 'utf8');

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain('Unknown component');
		expect(css).toContain('.astryx-side-nav-item');
		expect(css).toContain('.astryx-banner-content');
		expect(css).toContain('.astryx-avatar-status-dot.ghost');
	});

	it('emits .astryx-text-input (the rendered class), not the dead .astryx-textinput', async () => {
		const themeFile = path.join(tmpDir, 'theme.mjs');
		const outFile = path.join(tmpDir, 'theme.css');
		fs.writeFileSync(
			themeFile,
			`export default {\n` +
				`  name: 'input-4109',\n` +
				`  tokens: {},\n` +
				`  components: { 'text-input': { base: { borderRadius: '16px' } } },\n` +
				`};\n`
		);

		await runCli(['theme', 'build', themeFile, '-o', outFile]);
		const css = fs.readFileSync(outFile, 'utf8');

		expect(css).toContain('.astryx-text-input');
		expect(css).not.toContain('.astryx-textinput');
	});
});
