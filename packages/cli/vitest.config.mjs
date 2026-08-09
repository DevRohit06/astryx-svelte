import { defineConfig } from 'vitest/config';

/**
 * One project, node environment. The CLI has no DOM surface, so it needs
 * nothing like `packages/core`'s two-project client/server split — every suite
 * here is a `*.test.mjs` run in Node.
 *
 * Suites are colocated with the module they cover, as upstream's are, which
 * keeps the ~50 upstream test files a straight path-for-path port in later
 * slices. They stay out of the tarball via the negated `*.test.mjs` pattern in
 * `package.json#files`, rather than by living in a separate tree —
 * `packages/core` needs the separate tree because `svelte-package` copies
 * `src/lib` wholesale and cannot be told otherwise; npm's `files` can.
 */
export default defineConfig({
	test: {
		environment: 'node',
		include: ['**/*.test.mjs'],
		exclude: ['node_modules/**']
	}
});
