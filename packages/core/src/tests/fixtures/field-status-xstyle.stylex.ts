import * as stylex from '@stylexjs/stylex';

/**
 * Upstream's `testStyles` from `FieldStatus/FieldStatus.test.tsx`, verbatim —
 * a compiled StyleX style the `xstyle` case passes to `FieldStatus`.
 *
 * StyleX may not be imported from a `.svelte` file, and a test module is no
 * different in principle, so the style lives in its own `.stylex.ts` fixture the
 * way every other `xstyle` case in this suite family does.
 */
export const testStyles = stylex.create({
	custom: { color: 'rebeccapurple' }
});
