import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import NavIcon from '$lib/components/nav-icon/nav-icon.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `NavIcon/NavIcon.test.tsx` at the **0.5.0** pin, ported case for case.
 *
 * The count is the contract: upstream declares **3** `it` blocks at this pin,
 * and **3** are here. **Nothing is dropped.** Upstream's suite has no
 * `displayName` case, no no-JSX construction form and no snapshot.
 *
 * **One counterpart, which is not a dropped case:** `forwards ref correctly`
 * becomes the attachment a consumer passes through the rest props, for the same
 * reason as `Thumbnail`'s — Svelte has no `ref`, and the attachment receives
 * the element itself, so this checks more than upstream's does.
 *
 * ---
 *
 * **This file is the last of four L0 leaves that were ported together**, and the
 * name is all that is left of that. They shared a file because they shared
 * exactly one thing, which is what made them a batch: none of them has state,
 * an effect, or a React idiom needing translation.
 *
 * **That shared shape is why the file was taken apart.** A file naming several
 * upstream suites can state a count against none of them, and the count is the
 * contract. All three of the others have left:
 *
 * - **`Citation`** → `citation.svelte.test.ts`. Upstream's suite grew from 7
 *   cases to 16 at 0.2.0 (four pointer-cursor cases and five source-icon
 *   cases), more than a shared file can carry without burying the others. Its
 *   seven cases had been *restated* to read computed colours out of the browser
 *   and are now back on upstream's own atomic-class probe.
 * - **`EmptyState`** → `empty-state.svelte.test.ts`. Its sixteen cases moved
 *   whole, joined by the four `theming targets` cases upstream added at 0.4.x,
 *   which nothing here covered. That file states the 20-of-20 contract this one
 *   could not.
 * - **`IconButton`** → `icon-button.svelte.test.ts`. Eight cases moved whole.
 *   The recount that split them out found what this file's silence had been
 *   hiding: upstream declares **10** at 0.4.5, one of which (`has displayName
 *   set`) is a standing drop, leaving 9 against the 8 that were here. `forwards
 *   the elevation prop through to the underlying button` (upstream
 *   `IconButton.test.tsx:95`) was missing and is not droppable; it is ported in
 *   the new file.
 *
 * With only `NavIcon` left, the file now ports exactly one upstream suite and
 * can state its contract — but the name no longer describes it, and renaming it
 * to `nav-icon.svelte.test.ts` is the last step of the split.
 */

describe('NavIcon', () => {
	it('renders icon content', async () => {
		const screen = await render(SlotProbe, {
			props: { component: NavIcon, slot: 'icon', text: 'Icon', testid: 'icon' }
		});
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeNull();
	});

	// Counterpart to upstream's `forwards ref correctly`.
	it('hands the root element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, {
			props: {
				component: NavIcon,
				slot: 'icon',
				text: 'Icon',
				rest: { [createAttachmentKey()]: attached }
			}
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('span'));
	});

	it('passes data-testid', async () => {
		const screen = await render(SlotProbe, {
			props: { component: NavIcon, slot: 'icon', text: 'Icon', rest: { 'data-testid': 'nav-icon' } }
		});
		expect(screen.container.querySelector('[data-testid="nav-icon"]')).not.toBeNull();
	});
});
