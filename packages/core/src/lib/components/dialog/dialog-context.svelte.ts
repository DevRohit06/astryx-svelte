import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `Dialog/DialogContext.ts`.
 *
 * Provided by `Dialog`, read by `DialogHeader` for two things: whether to
 * autofocus its title (inline dialogs are documentation/showcase previews, so
 * they suppress the focus that would otherwise steal the surrounding page's
 * scroll position), and which id to put on that title so the dialog can name
 * itself from it. Stored as a getter so both stay reactive, per the port's
 * context convention.
 */

export interface DialogContextValue {
	/** Whether the dialog is rendered inline for docs/showcases. */
	isInline: boolean;
	/**
	 * Id the enclosing `Dialog` will point `aria-labelledby` at. `DialogHeader`
	 * applies it to its heading; the dialog checks whether an element carrying it
	 * actually rendered before referencing it, so a dialog with no header never
	 * points at a missing id.
	 */
	titleId: string;
}

const dialogContext = new Context<() => DialogContextValue>('astryx.dialog');

export function setDialogContext(get: () => DialogContextValue): void {
	dialogContext.set(get);
}

/**
 * Returns a getter for the enclosing dialog's context, or `null` outside one —
 * upstream's context defaults to `null`.
 */
export function useDialogContext(): () => DialogContextValue | null {
	return dialogContext.getOr(() => null);
}
