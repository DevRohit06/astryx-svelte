import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import ts from 'typescript-eslint';

/**
 * The CLI is plain Node ESM (`.mjs` with JSDoc types) plus a few ambient `.d.ts`
 * declarations — no Svelte, no browser globals, no StyleX. So this config is
 * `packages/core`'s minus the three Svelte-specific layers and the two
 * repo-local rules (`no-physical-properties` guards `stylex.create`; the
 * tests-outside-`src/lib` rule guards `svelte-package`), neither of which has
 * anything to act on here.
 */
export default defineConfig(
	{
		// The second entry covers every suite's transient fixture dir — see the
		// note in .gitignore for why it is one glob rather than a list.
		ignores: ['node_modules/**', '.astryx-*/**']
	},
	js.configs.recommended,
	ts.configs.recommended,
	prettier,
	{
		languageOptions: {
			globals: { ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef
			// lint rule on TypeScript projects.
			'no-undef': 'off',
			// The `_`-prefix convention marks an intentionally-unused binding — e.g.
			// a Commander hook parameter the body does not read, or a reserved
			// options bag kept for signature parity with upstream.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			// Commander exposes the metadata the manifest is derived from
			// (`registeredArguments`, `_hidden`, `argChoices`) partly off its public
			// types, and the json-shim monkeypatches instances. Upstream casts each
			// site through `any` with a comment; the rule would flag every one.
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	{
		// Vitest globals are enabled via `globals: true` in vitest.config.mjs, but
		// each suite imports describe/it/expect explicitly (as upstream's do), so
		// only the Node environment is needed here.
		files: ['**/*.test.mjs', 'test-utils/**/*.mjs'],
		rules: {
			// The in-process harness monkeypatches console/stdout/exit and restores
			// them in `finally`; that is the point of the file.
			'no-console': 'off'
		}
	}
);
