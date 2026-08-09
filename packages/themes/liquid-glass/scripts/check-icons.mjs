// Checks this package's icon registry — `src/icons.svelte` — against core's
// `IconName` union, the export name the build imports, and the real
// `@lucide/svelte` exports. The check lives in `packages/themes/shared`, which
// every theme package calls the same way; see that file for what it catches and
// why it is textual rather than importing the registry.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkIconRegistry } from '../../shared/check-icon-registry.mjs';

await checkIconRegistry({
	packageDir: join(dirname(fileURLToPath(import.meta.url)), '..'),
	themeName: 'liquid-glass',
	registryExport: 'liquidGlassIconRegistry',
	resolveLucide: () => import.meta.resolve('@lucide/svelte')
});
