import * as stylex from '@stylexjs/stylex';

/**
 * A *dynamic* StyleX style for the Table suite's `xstyle` case — upstream
 * declares the same `stylex.create({opacity: value => ({opacity: value})})`
 * inline in its test file. StyleX may only be imported from a `.ts` module, so
 * it lives here (the `xstyle-probe.stylex.ts` precedent).
 */
export const dynamic = stylex.create({
	opacity: (value: number) => ({ opacity: value })
});
