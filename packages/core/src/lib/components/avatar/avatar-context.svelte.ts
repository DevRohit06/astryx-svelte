import { Context } from '../../internal/context.js';
import type { AvatarShape, AvatarSize } from './avatar.stylex.js';

/**
 * The two contexts the Avatar family passes down, ported from Astryx's
 * `Avatar/AvatarSizeContext.ts` and `AvatarGroup/AvatarGroupContext.ts`.
 *
 * They live here rather than in `internal/contexts.svelte.ts` because that file
 * holds the contexts any component may take part in (size, ButtonGroup), while
 * these two are private to this family and typed against `AvatarSize` — putting
 * them there would point a shared internal module at one component's styles.
 *
 * Both store getters, for the reason `internal/contexts.svelte.ts` explains at
 * length: Svelte reads context once at init, so a plain value would freeze
 * descendants at whatever the provider held on mount.
 */

/**
 * The resolved numeric avatar size, in pixels, for size-aware children such as
 * AvatarStatusDot. Outside an Avatar the default is 36 — the `small` size.
 */
const avatarSizeContext = new Context<() => number>('astryx.avatarSize');

export function setAvatarSizeContext(get: () => number): void {
	avatarSizeContext.set(get);
}

/** Returns a getter that falls back to the default `md` avatar's 36px. */
export function useAvatarSize(): () => number {
	return avatarSizeContext.getOr(() => 36);
}

/**
 * How a status element's accessible label reaches the Avatar that contains it.
 *
 * **This is a translation, not an invention.** Upstream reads the label
 * straight off the `status` element — `getStatusLabel()` calls
 * `isValidElement(status)` and then `status.props.label`. A Svelte `Snippet` is
 * an opaque render function with no inspectable props, so there is nothing to
 * read; the child has to hand its label *up* instead. That makes this the
 * registration-based substitute for React introspection the port already uses
 * for `MetadataList`'s children.
 *
 * The label matters because the avatar root is `role="img"`, which prunes every
 * descendant from the accessibility tree. A label rendered inside the status
 * subtree is therefore never announced on its own — composing it into the
 * avatar's own accessible name ("Jane Doe, Online") is the only way assistive
 * tech can reach it at all (WCAG 4.1.2).
 */
const avatarStatusLabelContext = new Context<(label: string | undefined) => void>(
	'astryx.avatarStatusLabel'
);

export function setAvatarStatusLabelSink(register: (label: string | undefined) => void): void {
	avatarStatusLabelContext.set(register);
}

/** No-op outside an Avatar, so a stray status dot still renders. */
export function useAvatarStatusLabelSink(): (label: string | undefined) => void {
	return avatarStatusLabelContext.getOr(() => {});
}

export interface AvatarGroupContextValue {
	size: AvatarSize;
	/** Overrides each avatar's own `shape`, so a group stays visually uniform. */
	shape: AvatarShape;
	/** Pixels each avatar pulls back over its predecessor. */
	overlap: number;
	numericSize: number;
}

const avatarGroupContext = new Context<() => AvatarGroupContextValue>('astryx.avatarGroup');

export function setAvatarGroupContext(get: () => AvatarGroupContextValue): void {
	avatarGroupContext.set(get);
}

/** Returns a getter, or null when the component is not inside an AvatarGroup. */
export function useAvatarGroup(): (() => AvatarGroupContextValue) | null {
	return avatarGroupContext.getOr(null);
}
