/**
 * @file Integration-manifest parser — the load-boundary validator for
 * `astryx-svelte.integration.*`. Zod is sealed here; consumers call
 * `parseIntegration` or import the {@link AstryxIntegration} type.
 *
 * The basename (and the default label below) is renamed from upstream's
 * `astryx.integration.*` for the reason spelled out in `../config/parse.mjs`: a
 * manifest's contents are framework-specific, so the rename is what stops this
 * CLI from adopting a React Astryx integration and reading its `.tsx` sources
 * as Svelte.
 */

import { z } from 'zod';
import { formatZodError } from '../_shared/errors.mjs';

/** @typedef {import('./type').AstryxIntegration} AstryxIntegration */

const integrationSchema = z
	.object({
		components: z.string().optional(),
		templates: z.string().optional(),
		codemods: z.string().optional(),
		issuesUrl: z.string().url().optional()
	})
	.strict();

/**
 * Compile-time drift-lock: sealed schema must infer exactly {@link AstryxIntegration}.
 * Only evaluated when this file is in the program — see the sibling note in
 * `../config/parse.mjs` about `parse.d.mts` shadowing it out of a wildcard include.
 *
 * @typedef {import('../_shared/contract').Expect<
 *   import('../_shared/contract').Equal<z.infer<typeof integrationSchema>, AstryxIntegration>
 * >} _IntegrationDriftLock
 */

/**
 * Validate an unknown value as an Astryx integration manifest, or throw.
 *
 * @param {unknown} input
 * @param {string} [label]
 * @returns {AstryxIntegration}
 */
export function parseIntegration(input, label = 'astryx-svelte.integration') {
	const result = integrationSchema.safeParse(input);
	if (!result.success) {
		throw new Error(formatZodError(label, result.error));
	}
	return result.data;
}
