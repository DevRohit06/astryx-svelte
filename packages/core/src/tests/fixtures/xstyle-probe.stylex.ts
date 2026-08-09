import * as stylex from '@stylexjs/stylex';

/**
 * StyleX overrides for the `xstyle` test. `overridePadding` collides with
 * `Badge`'s own `paddingInline`; `novelMargin` sets a property `Badge` never
 * touches. The two cases distinguish a correct atomic-dedup merge (override
 * *swaps* the class) from a naive append (override *adds* a second class).
 */
export const probe = stylex.create({
	overridePadding: { paddingInline: '99px' },
	novelMargin: { marginTop: '13px' }
});
