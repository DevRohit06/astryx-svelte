<!--
	Ported from upstream's `assets/templates/pages/kanban-board/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`ArrowsUpDownIcon` → `arrowsUpDown`, `FunnelIcon` → `funnel`,
	`MagnifyingGlassIcon` → `search`, `InformationCircleIcon` → `info` and
	`CheckCircleIcon` → `success` are true matches. The rest are stand-ins:
	`PlusIcon` → `check` (the registry ships no plus — the same call
	`shell-side-nav` makes, and TODO.md records the gap), `ArrowPathIcon` →
	`clock`, `InboxIcon` → `arrowDown` (as `messaging-shell` takes it), and
	`ClipboardDocumentCheckIcon` → `checkDouble`. No two collide here. Retires
	with the icon registry (TODO.md).

	Upstream authors its styles in `stylex.create`. StyleX may not be imported
	from a `.svelte` file, so the static ones become `style` strings and the two
	dynamic ones (`floatingAt`, `ghost`) become functions returning strings —
	the same declarations, in the same order. The one exception is `styles.card`,
	which carries a `:hover`: a pseudo-class needs a real CSS rule, so it moves
	to the `<style>` block below. It lands on `Card`, a component, and Svelte's
	scoper only rewrites selectors it can match against an element in this
	template — so `:global()` is required there, exactly as `login-split` records.

	`BoardCardBody`, `BoardCard` and `BoardColumn` are components upstream and
	hold no state, so all three transcribe to parameterised snippets — a page
	template is a single `+page.svelte`, and the CLI copies `PAGE_SOURCE_FILE`
	and nothing beside it. One consequence: `BoardColumn` renders
	`{children ?? <EmptyState/>}`, and React can tell "rendered nothing" from a
	`null` return where a Svelte snippet always renders something. The `null`
	branch of `renderColumnCards` therefore becomes `hasColumnCards`, a predicate
	read at the call site, and the column receives `undefined` instead of a
	snippet. Same two branches, same condition.

	All four `useRef(new Map())` registries stay, as plain (deliberately
	non-reactive) `Map`s. A React ref callback becomes an attachment — the same
	register-on-mount contract, with `el ? set : delete` split into the call and
	the cleanup it returns — and the two callback caches keep earning their keep,
	because Svelte re-runs an attachment whenever its *function* changes identity.
	Without them a drag would tear down and re-register every card on every
	pointermove. `teardownRef` is a plain `let`, for the reason `useResizable`'s
	two refs are.
-->
<script lang="ts">
	import {
		Badge,
		Button,
		Card,
		Divider,
		EmptyState,
		HStack,
		Heading,
		Icon,
		IconButton,
		Layout,
		LayoutContent,
		LayoutHeader,
		MoreMenu,
		Section,
		Selector,
		StatusDot,
		Text,
		Toolbar,
		Tooltip,
		VStack,
		type IconName
	} from '@astryx-svelte/core';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	// ============= TYPES =============

	type ColumnId = 'todo' | 'in-progress' | 'in-review' | 'done';
	type Priority = 'high' | 'medium' | 'low';

	interface WorkItem {
		id: string;
		column: ColumnId;
		ref: string;
		priority: Priority;
		title: string;
		description: string;
		lastEdited: string;
		dueDate: string;
	}

	interface ColumnMeta {
		id: ColumnId;
		title: string;
		variant: 'neutral' | 'accent' | 'warning' | 'success';
		tooltip: string;
		emptyTitle: string;
		emptyDescription: string;
		emptyIcon: IconName;
	}

	// Where a dragged card will land: a column and an insertion index within it
	// (measured against the cards remaining after the dragged card is removed).
	interface DropTarget {
		column: ColumnId;
		index: number;
	}

	// Live state of an in-progress pointer drag. Coordinates are in viewport space.
	interface DragState {
		id: string;
		width: number;
		height: number;
		offsetX: number;
		offsetY: number;
		pointerX: number;
		pointerY: number;
		target: DropTarget | null;
	}

	// ============= DATA =============

	const COLUMNS: ColumnMeta[] = [
		{
			id: 'todo',
			title: 'To-do',
			variant: 'neutral',
			tooltip: 'Items assigned to this sprint, waiting to be picked up.',
			emptyTitle: 'To-do is empty',
			emptyDescription: 'Items pulled into this sprint appear here.',
			emptyIcon: 'arrowDown'
		},
		{
			id: 'in-progress',
			title: 'In progress',
			variant: 'accent',
			tooltip: 'Items currently in progress.',
			emptyTitle: 'Nothing in progress',
			emptyDescription: 'Items being worked on appear here.',
			emptyIcon: 'clock'
		},
		{
			id: 'in-review',
			title: 'In review',
			variant: 'warning',
			tooltip: 'Items waiting for your review.',
			emptyTitle: 'Nothing in review',
			emptyDescription: 'Items awaiting your review appear here.',
			emptyIcon: 'checkDouble'
		},
		{
			id: 'done',
			title: 'Done',
			variant: 'success',
			tooltip: 'Items that have been handled.',
			emptyTitle: 'Nothing done yet',
			emptyDescription: 'Completed items appear here.',
			emptyIcon: 'success'
		}
	];

	const PRIORITY_META: Record<Priority, { label: string; variant: 'error' | 'warning' | 'teal' }> =
		{
			high: { label: 'High', variant: 'error' },
			medium: { label: 'Medium', variant: 'warning' },
			low: { label: 'Low', variant: 'teal' }
		};

	const INITIAL_ITEMS: WorkItem[] = [
		{
			id: 't1',
			column: 'todo',
			ref: 'Task 4821',
			priority: 'low',
			title: 'Draft project kickoff brief',
			description:
				'Write a short brief outlining goals, scope, and success criteria for the upcoming project.',
			lastEdited: '2h ago',
			dueDate: 'Jul 8'
		},
		{
			id: 't2',
			column: 'todo',
			ref: 'Task 4842',
			priority: 'low',
			title: 'Collect feedback from stakeholders',
			description:
				'Gather input from key stakeholders and summarize the main themes for the next review.',
			lastEdited: '1d ago',
			dueDate: 'Jul 11'
		},
		{
			id: 'p1',
			column: 'in-progress',
			ref: 'Task 4825',
			priority: 'high',
			title: 'Design the landing page layout',
			description:
				'Create a first-pass layout for the landing page and share it for early feedback.',
			lastEdited: '18m ago',
			dueDate: 'Jul 3'
		},
		{
			id: 'p2',
			column: 'in-progress',
			ref: 'Task 4833',
			priority: 'medium',
			title: 'Set up the project workspace',
			description: 'Configure the shared workspace and invite the team so everyone has access.',
			lastEdited: '5m ago',
			dueDate: 'Jul 4'
		},
		{
			id: 'r1',
			column: 'done',
			ref: 'Task 4788',
			priority: 'low',
			title: 'Write the weekly status update',
			description: 'Summarize progress, blockers, and next steps in a short update for the team.',
			lastEdited: 'Yesterday',
			dueDate: 'Jul 1'
		},
		{
			id: 'r2',
			column: 'done',
			ref: 'Task 4789',
			priority: 'high',
			title: 'Prepare the demo walkthrough',
			description: 'Put together a short walkthrough covering the main features for the demo.',
			lastEdited: '3d ago',
			dueDate: 'Jun 30'
		},
		{
			id: 'r3',
			column: 'done',
			ref: 'Task 4790',
			priority: 'medium',
			title: 'Review and merge open changes',
			description:
				'Go through the pending changes, leave comments, and merge the ones that are ready.',
			lastEdited: '4d ago',
			dueDate: 'Jun 28'
		}
	];

	// Pointer travel (px) before a press is promoted to a drag, so taps and clicks
	// on card controls still register normally.
	const DRAG_THRESHOLD = 5;

	// Shared width for every board column, so they stay visually aligned.
	const COLUMN_WIDTH = 300;

	// ============= STYLES =============

	const styles = {
		boardColumns: 'overflow-x: auto; overflow-y: hidden; height: 100%; padding: var(--spacing-4);',
		columnShell: `flex-shrink: 0; flex-basis: ${COLUMN_WIDTH}px; height: 100%;`,
		// `card` carries a `:hover`, so it lives in the <style> block below as
		// `.kanban-card`.
		// The dragged card is lifted out of flow and follows the pointer. It ignores
		// pointer events so hit-testing reads the columns underneath it.
		floating:
			'position: fixed; inset-block-start: 0; inset-inline-start: 0; pointer-events: none; cursor: grabbing; box-shadow: var(--shadow-high); z-index: 1000;',
		floatingAt: (x: number, y: number, width: number) =>
			`width: ${width}px; transform: translate(${x}px, ${y}px);`,
		// Placeholder marking the landing slot; matches the dragged card's height.
		ghost: (height: number) =>
			`height: ${height}px; border-radius: var(--radius-container); background-color: var(--color-background-muted);`,
		toolbarDivider: 'height: auto; margin-block: var(--spacing-1); align-self: stretch;',
		columnEmptyState: 'padding-block: var(--spacing-10);'
	};

	// ============= MAIN =============

	let items = $state.raw<WorkItem[]>(INITIAL_ITEMS);
	let sprint = $state('003');
	let drag = $state.raw<DragState | null>(null);

	// Live element registries for pointer hit-testing (kept out of render state).
	// Plain Maps, deliberately not `SvelteMap`s: nothing renders from them, and
	// making them reactive would re-render the board on every registration.
	/* eslint-disable svelte/prefer-svelte-reactivity */
	const columnEls = new Map<ColumnId, HTMLElement>();
	const cardEls = new Map<string, HTMLElement>();
	const columnRefCbs = new Map<ColumnId, Attachment<HTMLElement>>();
	const cardRefCbs = new Map<string, Attachment<HTMLElement>>();
	/* eslint-enable svelte/prefer-svelte-reactivity */
	let teardownRef: (() => void) | null = null;

	// Stable attachments so registering an element never churns. Upstream keeps
	// these caches so a ref callback's identity survives a re-render; Svelte
	// re-runs an attachment whenever its *function* changes identity, so the
	// caches earn their keep for the same reason — without them every pointermove
	// would tear down and re-register every card. The `el ? set : delete` pair of
	// a React ref callback becomes attach + the cleanup an attachment returns.
	const getColumnRef = (id: ColumnId): Attachment<HTMLElement> => {
		let cb = columnRefCbs.get(id);
		if (!cb) {
			cb = (el: HTMLElement) => {
				columnEls.set(id, el);
				return () => columnEls.delete(id);
			};
			columnRefCbs.set(id, cb);
		}
		return cb;
	};

	const getCardRef = (id: string): Attachment<HTMLElement> => {
		let cb = cardRefCbs.get(id);
		if (!cb) {
			cb = (el: HTMLElement) => {
				cardEls.set(id, el);
				return () => cardEls.delete(id);
			};
			cardRefCbs.set(id, cb);
		}
		return cb;
	};

	const itemsByColumn = $derived.by(() => {
		const map: Record<ColumnId, WorkItem[]> = {
			todo: [],
			'in-progress': [],
			'in-review': [],
			done: []
		};
		for (const item of items) {
			map[item.column].push(item);
		}
		return map;
	});

	const moveItem = (id: string, to: ColumnId) => {
		items = items.map((item) => (item.id === id ? { ...item, column: to } : item));
	};

	// Resolve the pointer position to a column + insertion index, ignoring the
	// card being dragged so the math is against the cards that stay in place.
	const computeTarget = (px: number, py: number, draggedId: string): DropTarget | null => {
		for (const [colId, el] of Array.from(columnEls.entries())) {
			const r = el.getBoundingClientRect();
			if (px < r.left || px > r.right || py < r.top || py > r.bottom) {
				continue;
			}

			const ids = itemsByColumn[colId].filter((it) => it.id !== draggedId).map((it) => it.id);

			let index = ids.length;
			for (let i = 0; i < ids.length; i++) {
				const cardEl = cardEls.get(ids[i]);
				if (!cardEl) {
					continue;
				}
				const cr = cardEl.getBoundingClientRect();
				if (py < cr.top + cr.height / 2) {
					index = i;
					break;
				}
			}
			return { column: colId, index };
		}
		return null;
	};

	// Rebuild the flat item list so the dragged card lands at the resolved slot
	// while every other card keeps its relative order.
	const commitDrag = (id: string, target: DropTarget) => {
		const prev = items;
		const moved = prev.find((it) => it.id === id);
		if (!moved) {
			return;
		}

		const rest = prev.filter((it) => it.id !== id);
		const updated: WorkItem = { ...moved, column: target.column };
		const colItems = rest.filter((it) => it.column === target.column);
		const anchor = colItems[target.index];

		if (!anchor) {
			items = [...rest, updated];
			return;
		}
		const at = rest.indexOf(anchor);
		items = [...rest.slice(0, at), updated, ...rest.slice(at)];
	};

	const onCardPointerDown = (e: PointerEvent, id: string) => {
		if (e.button !== 0) {
			return;
		}
		// Let the card's own controls (the actions menu) handle the press.
		if ((e.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"]')) {
			return;
		}

		const el = cardEls.get(id);
		if (!el) {
			return;
		}

		const rect = el.getBoundingClientRect();
		const startX = e.clientX;
		const startY = e.clientY;
		const offsetX = startX - rect.left;
		const offsetY = startY - rect.top;
		const { width, height } = rect;

		let started = false;
		let target: DropTarget | null = null;

		const onMove = (ev: PointerEvent) => {
			if (
				!started &&
				Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < DRAG_THRESHOLD
			) {
				return;
			}
			started = true;
			target = computeTarget(ev.clientX, ev.clientY, id);
			drag = {
				id,
				width,
				height,
				offsetX,
				offsetY,
				pointerX: ev.clientX,
				pointerY: ev.clientY,
				target
			};
		};

		const onUp = () => {
			teardownRef?.();
			if (started && target) {
				commitDrag(id, target);
			}
			drag = null;
		};

		const teardown = () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			teardownRef = null;
		};
		teardownRef = teardown;

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	};

	const draggedItem = $derived.by(() => {
		// A local const, because TypeScript drops the narrowing of a reassigned
		// `let` inside the `find` callback.
		const activeDrag = drag;
		return activeDrag ? items.find((it) => it.id === activeDrag.id) : undefined;
	});
	const isDragging = $derived(drag !== null);

	// Suppress selection while dragging and detach listeners on unmount.
	$effect(() => {
		if (!isDragging) {
			return;
		}
		const previous = document.body.style.userSelect;
		document.body.style.userSelect = 'none';
		return () => {
			document.body.style.userSelect = previous;
		};
	});

	$effect(() => () => teardownRef?.());

	// Whether a column has anything to render — upstream's `renderColumnCards`
	// returning `null`, which a Svelte snippet cannot signal.
	const hasColumnCards = (colId: ColumnId): boolean => {
		const activeDrag = drag;
		const colItems = itemsByColumn[colId];
		const visible = activeDrag ? colItems.filter((it) => it.id !== activeDrag.id) : colItems;
		const ghostTarget =
			activeDrag && activeDrag.target && activeDrag.target.column === colId ? activeDrag : null;
		return visible.length > 0 || ghostTarget != null;
	};
</script>

{#snippet arrowsUpDownIcon()}<Icon icon="arrowsUpDown" size="sm" />{/snippet}
{#snippet funnelIcon()}<Icon icon="funnel" size="sm" />{/snippet}
{#snippet magnifyingGlassIcon()}<Icon icon="search" size="sm" />{/snippet}
{#snippet plusIcon()}<Icon icon="check" size="sm" />{/snippet}

<!-- ============= CARD BODY ============= -->

<!--
	Shared card contents, rendered both in the column list and inside the
	floating drag clone so the two stay pixel-identical.
-->
{#snippet boardCardBody(item: WorkItem, onMove: (id: string, to: ColumnId) => void)}
	{@const priority = PRIORITY_META[item.priority]}
	{@const moveTargets = COLUMNS.filter((c) => c.id !== item.column).map((c) => ({
		label: `Move to ${c.title}`,
		onClick: () => onMove(item.id, c.id)
	}))}
	<VStack gap={2}>
		<HStack hAlign="between" vAlign="start">
			<HStack gap={1} vAlign="center" wrap="wrap">
				<Badge label={item.ref} variant="neutral" />
				<Badge label={priority.label} variant={priority.variant} />
			</HStack>
			<MoreMenu
				label="Work item actions"
				size="sm"
				items={[
					{ label: 'Open', onClick: () => {} },
					{ label: 'Assign to me', onClick: () => {} },
					{ type: 'divider' },
					...moveTargets
				]}
			/>
		</HStack>

		<VStack gap={1}>
			<Heading level={4}>{item.title}</Heading>
			<Text type="supporting" color="secondary" maxLines={2}>{item.description}</Text>
		</VStack>

		<Text type="supporting" color="secondary">
			Edited {item.lastEdited} · Due {item.dueDate}
		</Text>
	</VStack>
{/snippet}

<!-- ============= BOARD CARD ============= -->

{#snippet boardCard(item: WorkItem)}
	<Card
		class="kanban-card"
		padding={3}
		{@attach getCardRef(item.id)}
		onpointerdown={(e) => onCardPointerDown(e, item.id)}
	>
		{@render boardCardBody(item, moveItem)}
	</Card>
{/snippet}

<!-- ============= BOARD COLUMN ============= -->

{#snippet boardColumn(meta: ColumnMeta, count: number, children: Snippet | undefined)}
	{#snippet columnHeader()}
		<LayoutHeader hasDivider padding={3}>
			<HStack hAlign="between" vAlign="center">
				<HStack gap={2} vAlign="center">
					<StatusDot variant={meta.variant} label={`${meta.title} status`} />
					<Heading level={4}>{meta.title}</Heading>
					<Tooltip content={meta.tooltip}>
						<Icon icon="info" size="sm" color="secondary" />
					</Tooltip>
				</HStack>
				<Text type="supporting" color="secondary" hasTabularNumbers>{count}</Text>
			</HStack>
		</LayoutHeader>
	{/snippet}
	{#snippet columnContent()}
		<LayoutContent padding={2} {@attach getColumnRef(meta.id)}>
			{#if children}
				{@render children()}
			{:else}
				{#snippet emptyIcon()}
					<Icon icon={meta.emptyIcon} size="lg" color="secondary" />
				{/snippet}
				<EmptyState
					isCompact
					style={styles.columnEmptyState}
					icon={emptyIcon}
					title={meta.emptyTitle}
					description={meta.emptyDescription}
				/>
			{/if}
		</LayoutContent>
	{/snippet}
	<Card variant="muted" padding={0} style={styles.columnShell}>
		<Layout height="fill" header={columnHeader} content={columnContent} />
	</Card>
{/snippet}

<!--
	Card nodes for a column. A dashed ghost box marks the landing slot during a
	drag: upstream splices it into the node array, which here is an insertion
	point read off the loop index.
-->
{#snippet columnCards(colId: ColumnId)}
	{@const activeDrag = drag}
	{@const colItems = itemsByColumn[colId]}
	{@const visible = activeDrag ? colItems.filter((it) => it.id !== activeDrag.id) : colItems}
	{@const ghostTarget =
		activeDrag && activeDrag.target && activeDrag.target.column === colId ? activeDrag : null}
	{@const ghostIndex =
		ghostTarget && ghostTarget.target ? Math.min(ghostTarget.target.index, visible.length) : -1}
	<VStack gap={2}>
		{#each visible as it, index (it.id)}
			{#if index === ghostIndex && ghostTarget}
				<VStack style={styles.ghost(ghostTarget.height)} />
			{/if}
			{@render boardCard(it)}
		{/each}
		{#if ghostIndex === visible.length && ghostTarget}
			<VStack style={styles.ghost(ghostTarget.height)} />
		{/if}
	</VStack>
{/snippet}

{#snippet toolbarStart()}
	<Heading level={3}>Sprint Board</Heading>
	<Badge label={String(items.length)} variant="neutral" />
{/snippet}

{#snippet toolbarEnd()}
	<HStack gap={2}>
		<Selector
			label="Sprint"
			width={200}
			isLabelHidden
			value={sprint}
			onChange={(value) => (sprint = value)}
			options={[
				{ value: '003', label: 'Sprint 003' },
				{ value: '002', label: 'Sprint 002' },
				{ value: '001', label: 'Sprint 001' }
			]}
		/>
		<Divider variant="strong" orientation="vertical" style={styles.toolbarDivider} />
		<HStack gap={1} vAlign="center">
			<IconButton icon={arrowsUpDownIcon} label="Sort" />
			<IconButton icon={funnelIcon} label="Filter" />
			<IconButton icon={magnifyingGlassIcon} label="Search" />
		</HStack>
		<Button label="Add task" variant="primary" icon={plusIcon} />
	</HStack>
{/snippet}

{#snippet header()}
	<LayoutHeader hasDivider padding={4}>
		<Toolbar label="Board actions" gap={2} startContent={toolbarStart} endContent={toolbarEnd} />
	</LayoutHeader>
{/snippet}

{#snippet content()}
	<LayoutContent padding={0}>
		<HStack gap={4} style={styles.boardColumns}>
			{#each COLUMNS as meta (meta.id)}
				{#snippet cards()}{@render columnCards(meta.id)}{/snippet}
				{@render boardColumn(
					meta,
					itemsByColumn[meta.id].length,
					hasColumnCards(meta.id) ? cards : undefined
				)}
			{/each}
		</HStack>
	</LayoutContent>
{/snippet}

<Section height="100dvh">
	<Layout height="fill" {header} {content} />
	{#if drag && draggedItem}
		<Card
			padding={3}
			style={`${styles.floating} ${styles.floatingAt(
				drag.pointerX - drag.offsetX,
				drag.pointerY - drag.offsetY,
				drag.width
			)}`}
		>
			{@render boardCardBody(draggedItem, () => {})}
		</Card>
	{/if}
</Section>

<!--
	Upstream's `styles.card`, the one style with a pseudo-class. `.kanban-card`
	lands on a COMPONENT (`Card`), and Svelte's scoper only rewrites selectors it
	can match against an element in this template — a class passed to a component
	is left alone and the rule would be pruned as unused. `:global()` is
	therefore required, the same call `login-split` makes.
-->
<style>
	:global(.kanban-card) {
		cursor: grab;
		user-select: none;
		touch-action: none;
		transition: box-shadow 120ms ease;
	}

	:global(.kanban-card:hover) {
		box-shadow: var(--shadow-med);
	}
</style>
