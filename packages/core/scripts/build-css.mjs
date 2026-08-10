/**
 * Compiles this package's StyleX and writes `dist/astryx.css` — the pre-built
 * stylesheet a consumer can import instead of running the compiler themselves.
 *
 * This is a port of upstream's `scripts/build-css.mjs`, which produces
 * `@astryxdesign/core`'s `dist/astryx.css`, and the output format is copied from
 * it deliberately: the same banner, the same single `@layer astryx-base`
 * wrapper, and `processStylexRules(rules, false)` — *false*, so priority is
 * expressed as `:not(#\#)` specificity padding rather than `@layer priority1…9`.
 * A consumer who orders layers around Astryx orders around one layer name, and
 * it has to be upstream's name or their cascade does not transfer.
 *
 * Two deliberate differences from upstream's script, both in
 * `lib/collect-stylex-rules.mjs`: it compiles from `src/lib` rather than a build
 * output, and a module that fails to compile is fatal rather than a warning.
 *
 * `compare-upstream-css.mjs` checks the result against upstream's published
 * sheet, so this script is not trusted on its own.
 */

import styleXPlugin from '@stylexjs/babel-plugin';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collectStyleXRules, root } from './lib/collect-stylex-rules.mjs';

const BANNER = 'Astryx Pre-compiled StyleX CSS — all components';

const { rules, fileCount } = await collectStyleXRules();
console.log(`Processing ${fileCount} source files…`);

const css = styleXPlugin.processStylexRules(rules, false);
const indented = css
	.split('\n')
	.map((line) => `  ${line}`)
	.join('\n');
const contents = `/* ${BANNER} */\n/* Auto-generated. Do not edit manually. */\n\n@layer astryx-base {\n${indented}\n}\n`;

const dist = path.join(root, 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(path.join(dist, 'astryx.css'), contents, 'utf8');

console.log(`Collected ${rules.length} StyleX rules`);
console.log(`astryx.css: ${(css.length / 1024).toFixed(1)} KB`);
