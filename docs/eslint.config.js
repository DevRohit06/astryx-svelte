import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

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
		rules: {
			/**
			 * Off, deliberately, and not because the property it checks does not
			 * matter: every internal link on this site is built by
			 * `src/lib/shell/links.ts`, which *does* call SvelteKit's `resolve()`
			 * and typechecks the route id against its params.
			 *
			 * The rule is syntactic — it wants to see `resolve(...)` at the `href`
			 * itself and cannot see through a helper. Satisfying it literally would
			 * mean inlining the route id at ~25 call sites, so a route rename
			 * becomes twenty-five edits instead of one, and the *reason* the rule
			 * exists (base-path correctness) would be no better served. So: one
			 * module owns link construction, and this rule is off.
			 *
			 * If a link ever bypasses `links.ts`, that is the thing to catch — in
			 * review, or by making `links.ts` the only importer of `$app/paths`.
			 */
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
