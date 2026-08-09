/**
 * @file Config parser — the load-boundary validator for `astryx-svelte.config.*`.
 *
 * Zod is sealed inside this module: the schema is module-private, never
 * exported, and never appears in a public type. Consumers call `parseConfig`
 * (or import the {@link AstryxConfig} type); they never see zod. A compile-time
 * drift-lock asserts the private schema still infers exactly `AstryxConfig`.
 *
 * The basename is renamed from upstream's `astryx.config.*`, and so is the
 * default label below. Contrast the `astryx` **package.json field** that
 * `discoverExternalPackages` reads, which this port keeps unchanged: that field
 * is a third-party authoring contract whose contents are framework-neutral. A
 * config file's *contents* are not — renaming it actively prevents this CLI
 * from picking up a React Astryx integration and reading its `.tsx` sources as
 * Svelte. Same reasoning as that earlier decision, opposite conclusion, because
 * the payload differs. There is deliberately no `.svelte.ts` basename: a config
 * is not a runes module, and jiti loads plain `.ts`.
 */

import { z } from 'zod';
import { formatZodError } from '../_shared/errors.mjs';

/** @typedef {import('./type').AstryxConfig} AstryxConfig */
/** @typedef {import('./type').PostCodemodHook} PostCodemodHook */
/** @typedef {import('./type').XleComponent} XleComponent */

// Typed `z.custom` so `z.infer` reproduces the real function type (not `unknown`).
const buildCommand = /** @type {z.ZodType<PostCodemodHook['buildCommand']>} */ (
	z.custom((value) => typeof value === 'function', { message: 'Expected a function' })
);

const postCodemodHookSchema = z
	.object({
		name: z.string().optional(),
		buildCommand
	})
	.strict();

const xleComponentSchema = z
	.object({
		from: z.string(),
		description: z.string().optional(),
		default: z.boolean().optional()
	})
	.strict();

const configSchema = z
	.object({
		integrations: z.array(z.string()).optional(),
		issuesUrl: z.string().url().optional(),
		hooks: z
			.object({ postCodemod: z.array(postCodemodHookSchema).optional() })
			.strict()
			.optional(),
		experimental: z
			.object({
				xle: z
					.object({ components: z.record(z.string(), xleComponentSchema).optional() })
					.strict()
					.optional()
			})
			.strict()
			.optional()
	})
	.strict();

/**
 * Compile-time drift-lock: the sealed schema must infer EXACTLY the public
 * {@link AstryxConfig} type. If they drift, `MutuallyAssignable` becomes `false`
 * and `Expect<false>` fails the `tsconfig.json` typecheck.
 *
 * That last clause has a precondition worth stating, because it fails silently:
 * this file must actually be IN the program. TypeScript drops a wildcard-matched
 * `.mjs` when a higher-priority extension in the same group — `.mts` or
 * `.d.mts` — matches the same basename, and every parser here has a sibling
 * `parse.d.mts` (which the `index.d.ts` barrel needs, so it cannot go). A bare
 * `authoring/**` include therefore resolves to the declaration file alone and
 * compiles all three locks as dead comments. The tsconfig has to keep `.d.mts`
 * out of its file list for the assertion to be evaluated at all.
 *
 * @typedef {import('../_shared/contract').Expect<
 *   import('../_shared/contract').MutuallyAssignable<z.infer<typeof configSchema>, AstryxConfig>
 * >} _ConfigDriftLock
 */

/**
 * Validate an unknown value as an Astryx config, or throw a readable error.
 *
 * @param {unknown} input
 * @param {string} [label]
 * @returns {AstryxConfig}
 */
export function parseConfig(input, label = 'astryx-svelte.config') {
	const result = configSchema.safeParse(input);
	if (!result.success) {
		throw new Error(formatZodError(label, result.error));
	}
	return result.data;
}
