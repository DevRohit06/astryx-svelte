/**
 * Compiles `dist/**\/*.stylex.js` in place, after `svelte-package` has written it.
 *
 * `svelte-package` transpiles TypeScript and does not run StyleX, so without this
 * step `dist` ships raw `stylex.create` calls — and `stylex.create` does not
 * degrade at runtime, it *throws* (`Unexpected 'stylex.create' call at runtime`).
 * That is what made `astryx.css` unusable on its own: the stylesheet was correct,
 * but importing it without also compiling the package crashed rather than
 * rendering unstyled.
 *
 * Only the `.stylex.js` modules need this. `create`, `defineVars` and `keyframes`
 * are compile-time; `props` is genuinely a runtime function, and a `.svelte` file
 * only ever reaches StyleX through `sx()` → `stylex.props()`. So compiling these
 * modules is sufficient to make the whole package run with no compiler present.
 *
 * The options match `lib/collect-stylex-rules.mjs` exactly — same `rootDir` above
 * all — because the class names baked in here must be the class names
 * `build-css.mjs` wrote into `astryx.css`. Two configurations would produce two
 * sets of hashes and a package whose markup and stylesheet do not refer to the
 * same rules. `compare-dist-classes` below is what proves they agree.
 */

import { transformAsync } from '@babel/core';
import styleXPlugin from '@stylexjs/babel-plugin';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './lib/collect-stylex-rules.mjs';

const dist = path.join(root, 'dist');

/** @param {string} dir @returns {string[]} */
function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (entry.name.endsWith('.stylex.js')) out.push(full);
	}
	return out;
}

/**
 * The `src/lib` module a `dist` file was built from.
 *
 * `svelte-package` maps `src/lib/**` onto `dist/**` one-for-one, so this is a
 * prefix swap and an extension swap. It is asserted rather than assumed: a
 * missing counterpart means the layout changed and the hashes would silently
 * fork.
 *
 * @param {string} file
 */
function sourceIdentityOf(file) {
	const relative = path.relative(dist, file).replace(/\.js$/, '.ts');
	const source = path.join(root, 'src', 'lib', relative);
	if (!existsSync(source)) {
		console.error(`No source module for ${path.relative(root, file)} (looked for ${source}).`);
		process.exit(1);
	}
	return source;
}

const files = walk(dist);
if (files.length === 0) {
	console.error(`No .stylex.js modules under ${dist} — run svelte-package first.`);
	process.exit(1);
}

/** Every atomic class the compiled output actually references. */
const emitted = new Set();

for (const file of files) {
	const { code } = await transformAsync(readFileSync(file, 'utf8'), {
		// Compiled under its *source* identity, not its dist path. StyleX derives
		// `defineVars` companion classes from the module's path, so compiling
		// `dist/foo.stylex.js` as itself yields different hashes than
		// `build-css.mjs` wrote from `src/lib/foo.stylex.ts` — 26 of them, which is
		// exactly what the check below caught the first time this ran.
		filename: sourceIdentityOf(file),
		babelrc: false,
		configFile: false,
		plugins: [
			[
				styleXPlugin,
				{
					dev: false,
					runtimeInjection: false,
					treeshakeCompensation: true,
					unstable_moduleResolution: { type: 'commonJS', rootDir: root }
				}
			]
		]
	});
	writeFileSync(file, code, 'utf8');
	for (const match of code.matchAll(/"(x[a-z0-9]{5,})"/g)) emitted.add(match[1]);
}

// The stylesheet and the compiled markup have to name the same rules. This is
// cheap and catches the one failure that would otherwise ship silently: a
// `rootDir` or option drift between this script and `build-css.mjs`.
const css = readFileSync(path.join(dist, 'astryx.css'), 'utf8');
const missing = [...emitted].filter((className) => !css.includes(`.${className}`));

console.log(`compiled ${files.length} dist modules, ${emitted.size} distinct classes referenced`);

if (missing.length > 0) {
	console.error(
		`${missing.length} class(es) referenced by dist are absent from astryx.css — ` +
			'the two builds disagree. First few: ' +
			missing.slice(0, 8).join(', ')
	);
	process.exit(1);
}

console.log('every class dist references is present in astryx.css.');
