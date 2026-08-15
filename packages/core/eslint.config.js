import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import noPhysicalProperties from './eslint-rules/no-physical-properties.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {
			// The `_`-prefix convention marks an intentionally-unused binding — e.g. a
			// prop destructured only to keep it out of `...rest` (ToggleButton drops
			// `class` this way, matching upstream), or an ignored callback arg.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		// Upstream's RTL guard, ported verbatim in `eslint-rules/`. It self-scopes
		// to `stylex.create()` calls, so it is registered everywhere rather than
		// globbed at `*.stylex.ts` — a `stylex.create` in any module is caught, and
		// the rule is inert in every file that has none.
		//
		// **At `error`** — batch 17a's A2 migration closed the 99 sites it opened
		// with, so there is nothing left for a `warn` to be lenient about.
		//
		// This is stricter than upstream, which ships the rule at `warn` because
		// its own core still has un-migrated physical properties. The port has
		// none *unaccounted for*: the ~19 declarations that stay physical for
		// parity with upstream's compiled classes each carry an inline
		// `eslint-disable` with the reason, so every exception is justified where
		// it lives rather than absorbed into a warning count nobody reads.
		//
		// Those disables cannot rot silently: if upstream migrates one of them,
		// its emitted atomic class changes and the **class oracle** reports the
		// mismatch. The lint rule guards new physical properties; the oracle
		// guards the exceptions. See `port/research/08-upstream-0.2.0.md` §2.
		plugins: { astryx: { rules: { 'no-physical-properties': noPhysicalProperties } } },
		rules: { 'astryx/no-physical-properties': 'error' }
	},
	{
		// Tests must not live under `src/lib`.
		//
		// `svelte-package` copies everything in `src/lib` into `dist/`, tests
		// included, so a co-located suite becomes a build artifact — and pulls
		// `vitest` imports into a published tree that has no dev dependencies.
		// `package.json`'s `files` field denies `dist/**/*.test.*` from the
		// tarball, which is why none of this ever reached a consumer, but a
		// denylist is a second line of defence, not the rule: `CLAUDE.md` states
		// the rule as *location*, and nine suites had quietly drifted out of it.
		//
		// Location is what this enforces, so the two mechanisms stop disagreeing.
		files: ['src/lib/**/*.{test,spec}.{js,ts}', 'src/lib/**/*.svelte.{test,spec}.{js,ts}'],
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: 'Program',
					message:
						'Tests must live in `src/tests/`, not under `src/lib` — `svelte-package` ' +
						'copies `src/lib` into `dist/`, so a co-located suite ships as a build ' +
						'artifact. Move the file to `src/tests/` and import through `$lib/…`.'
				}
			]
		}
	}
);
