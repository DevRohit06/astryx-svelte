export type Key = string | number;
export type KeyFallback = Key | (() => Key);

/**
 * Builds a stable key for a keyed list.
 *
 * Upstream's header says "React list keys"; the need is identical in Svelte's
 * `{#each items as item (getKey(item.id, item.label))}`. The prefixes are what
 * matter: an id-derived key and a fallback-derived key can never collide, so an
 * item that gains an id later does not silently reuse another item's identity.
 */
export function getKey(idKey: Key | null | undefined, fallback: KeyFallback): string {
	if (idKey != null) {
		return `id:${idKey}`;
	}

	const fallbackKey = typeof fallback === 'function' ? fallback() : fallback;
	return `fallback:${fallbackKey}`;
}
