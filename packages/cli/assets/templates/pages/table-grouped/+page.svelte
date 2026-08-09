<!--
	Ported from upstream's `assets/templates/pages/table-grouped/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons, which have no Svelte build, so each is a stand-in
	from core's 28-name `Icon` registry. Only the two chevrons are true matches:
	`ChevronDownIcon` → `chevronDown`, `ChevronRightIcon` → `chevronRight`,
	`XMarkIcon` → `close`, `EllipsisHorizontalIcon` → `moreHorizontal`,
	`ChartBarIcon` → `viewColumns`, `PencilIcon` → `wrench`, `UserIcon` → `info`,
	`TagIcon` → `stop`, `DocumentDuplicateIcon` → `copy`, `ArrowRightIcon` →
	`chevronRight` (**a collision** — the same glyph the collapsed group header
	uses), `TrashIcon` → `error` (the registry ships no trash; `error` is the
	nearest destructive-action glyph and avoids a second `close`). Retires with
	the icon registry.

	Three structural translations:

	- **`Table` is in children mode**, so — exactly as upstream — `columns` is
		used only for `resolveColumnWidths` and the `<colgroup>`, and no header row
		is rendered. Upstream's `BaseTable` short-circuits on `children` the same
		way, so this is upstream behaviour, not a port artifact.
	- **`<col style={…}>` takes a string here.** `resolveColumnWidths` hands back
		a `{width?, minWidth?}` object, which React spreads onto `style` directly;
		`colStyle()` below serialises it, keeping the two declarations in that
		order.
	- **`TaskDetailPanel` is a top-level snippet**, since a page template is a
		single `+page.svelte` (the CLI copies `PAGE_SOURCE_FILE` and nothing else).
		It holds no state, so the three props become three snippet parameters and
		its `if (!task) return null` guard transcribes as `{#if task}`.

	Upstream's `groupHeaderCell: React.CSSProperties` becomes a `style` string
	under the same name, same three declarations, same order. Its comment is
	upstream's and is kept.

	Prop renames: `className` → `class` (unused here), `onClick` → `onclick` and
	`onKeyDown` → `onkeydown` on `Button`/`TableRow` (both extend the DOM
	attribute sets), `colSpan` → `colspan`, `tabIndex` → `tabindex`. Component
	-level props (`onChange`, `onOpenChange`, `isIconOnly`, `hasChevron`) keep
	their camelCase.
-->
<script lang="ts">
	import {
		Avatar,
		Badge,
		Button,
		Center,
		Dialog,
		DialogHeader,
		Divider,
		DropdownMenu,
		Heading,
		HStack,
		Icon,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel,
		MetadataList,
		MetadataListItem,
		Popover,
		PowerSearch,
		RadioList,
		RadioListItem,
		ResizeHandle,
		Selector,
		StackItem,
		StatusDot,
		Table,
		TableCell,
		TableRow,
		Text,
		TextInput,
		VStack,
		pixel,
		proportional,
		resolveColumnWidths,
		useResizable
	} from '@astryx-svelte/core';
	import type {
		PowerSearchConfig,
		PowerSearchFilter,
		ResizableProps,
		TableColumn
	} from '@astryx-svelte/core';

	// Plain inline styles using Astryx design-token CSS variables (declared at
	// :root by `@astryx-svelte/core`'s stylesheet). No StyleX compiler required.
	// The group-header background + cursor live on the colSpan TableCell (which
	// reliably forwards `style`) so they fill the full row width.
	const groupHeaderCell =
		'cursor: pointer; background-color: var(--color-background-muted); padding: var(--spacing-3) var(--spacing-4);';

	// Types
	type TaskStatus = 'in_progress' | 'todo' | 'backlog' | 'done';
	type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

	interface TaskRow extends Record<string, unknown> {
		id: string;
		taskId: string;
		title: string;
		subtitle: string;
		status: TaskStatus;
		priority: TaskPriority;
		project: string;
		tags: string[];
		created: string;
		createdISO: string;
		updated: string;
		updatedISO: string;
		assignee: string;
	}

	const STATUS_DOT_VARIANT: Record<TaskStatus, 'success' | 'accent' | 'neutral' | 'warning'> = {
		in_progress: 'accent',
		todo: 'warning',
		backlog: 'neutral',
		done: 'success'
	};

	const PRIORITY_COLOR: Record<TaskPriority, 'primary' | 'secondary' | 'disabled'> = {
		urgent: 'primary',
		high: 'primary',
		medium: 'secondary',
		low: 'disabled',
		none: 'disabled'
	};

	// Mock data matching a task tracker
	const allTasks: TaskRow[] = [
		{
			id: '1',
			taskId: 'T235040469',
			title: 'Update user interface',
			subtitle: 'Update payment gateway integration',
			status: 'in_progress',
			priority: 'medium',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Olivia Martin'
		},
		{
			id: '2',
			taskId: 'T235040470',
			title: 'Use Projects to organize work for features or releases',
			subtitle: '',
			status: 'in_progress',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Jackson Lee'
		},
		{
			id: '3',
			taskId: 'T235040471',
			title: 'Use Cycles to focus work over n-weeks',
			subtitle: '',
			status: 'in_progress',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Isabella Nguyen'
		},
		{
			id: '4',
			taskId: 'T235040472',
			title: 'Testing code',
			subtitle: 'Update payment gateway integration',
			status: 'todo',
			priority: 'medium',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'William Kim'
		},
		{
			id: '5',
			taskId: 'T235040473',
			title: 'Update backend code',
			subtitle: 'Update payment gateway integration',
			status: 'todo',
			priority: 'medium',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Sofia Davis'
		},
		{
			id: '6',
			taskId: 'T235040474',
			title: 'Update front end code',
			subtitle: 'Update payment gateway integration',
			status: 'todo',
			priority: 'medium',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Mia Wilson'
		},
		{
			id: '7',
			taskId: 'T235040475',
			title: 'Update payment gateway integration',
			subtitle: '',
			status: 'todo',
			priority: 'high',
			project: 'Payment gateway integration 2.0',
			tags: ['Improvement', '3rd Party'],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Lucas Brown'
		},
		{
			id: '8',
			taskId: 'T235040476',
			title: 'Update payment gateway backend code',
			subtitle: '',
			status: 'todo',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Ethan Jones'
		},
		{
			id: '9',
			taskId: 'T235040477',
			title: 'Invite your teammates',
			subtitle: '',
			status: 'todo',
			priority: 'low',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 1',
			updatedISO: '2025-07-01',
			assignee: 'Ava Taylor'
		},
		{
			id: '10',
			taskId: 'T235040478',
			title: 'Next steps',
			subtitle: '',
			status: 'todo',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Noah Garcia'
		},
		{
			id: '11',
			taskId: 'T235040479',
			title: 'Welcome to Linear',
			subtitle: '',
			status: 'backlog',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Olivia Martin'
		},
		{
			id: '12',
			taskId: 'T235040480',
			title: 'Connect GitHub or GitLab',
			subtitle: '',
			status: 'backlog',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Jackson Lee'
		},
		{
			id: '13',
			taskId: 'T235040481',
			title: 'Customize settings',
			subtitle: '',
			status: 'backlog',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Isabella Nguyen'
		},
		{
			id: '14',
			taskId: 'T235040482',
			title: 'Try 3 ways to navigate: Command menu, keyboard or mouse',
			subtitle: '',
			status: 'done',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'William Kim'
		},
		{
			id: '15',
			taskId: 'T235040483',
			title: 'Connect to Slack',
			subtitle: '',
			status: 'done',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Sofia Davis'
		},
		{
			id: '16',
			taskId: 'T235040484',
			title: 'Migrate database schema to v2',
			subtitle: 'Payment gateway integration',
			status: 'in_progress',
			priority: 'high',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 4',
			createdISO: '2025-07-04',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'Lucas Brown'
		},
		{
			id: '17',
			taskId: 'T235040485',
			title: 'Write integration tests for checkout flow',
			subtitle: '',
			status: 'in_progress',
			priority: 'medium',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 4',
			createdISO: '2025-07-04',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'Ethan Jones'
		},
		{
			id: '18',
			taskId: 'T235040486',
			title: 'Set up CI/CD pipeline for staging',
			subtitle: '',
			status: 'in_progress',
			priority: 'high',
			project: '',
			tags: [],
			created: 'Jul 2',
			createdISO: '2025-07-02',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'Ava Taylor'
		},
		{
			id: '19',
			taskId: 'T235040487',
			title: 'Add rate limiting to public API endpoints',
			subtitle: '',
			status: 'todo',
			priority: 'urgent',
			project: '',
			tags: [],
			created: 'Jul 5',
			createdISO: '2025-07-05',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'Noah Garcia'
		},
		{
			id: '20',
			taskId: 'T235040488',
			title: 'Refactor auth middleware to support OAuth2',
			subtitle: '',
			status: 'todo',
			priority: 'high',
			project: '',
			tags: [],
			created: 'Jul 4',
			createdISO: '2025-07-04',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'Olivia Martin'
		},
		{
			id: '21',
			taskId: 'T235040489',
			title: 'Design error pages for 404 and 500',
			subtitle: '',
			status: 'todo',
			priority: 'low',
			project: '',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 4',
			updatedISO: '2025-07-04',
			assignee: 'Mia Wilson'
		},
		{
			id: '22',
			taskId: 'T235040490',
			title: 'Audit third-party dependencies for vulnerabilities',
			subtitle: '',
			status: 'todo',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jul 5',
			createdISO: '2025-07-05',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'Jackson Lee'
		},
		{
			id: '23',
			taskId: 'T235040491',
			title: 'Implement webhook retry logic with exponential backoff',
			subtitle: 'Payment gateway integration',
			status: 'todo',
			priority: 'medium',
			project: 'Payment gateway integration 2.0',
			tags: [],
			created: 'Jul 4',
			createdISO: '2025-07-04',
			updated: 'Jul 5',
			updatedISO: '2025-07-05',
			assignee: 'William Kim'
		},
		{
			id: '24',
			taskId: 'T235040492',
			title: 'Add dark mode support to dashboard',
			subtitle: '',
			status: 'backlog',
			priority: 'low',
			project: '',
			tags: [],
			created: 'Jul 2',
			createdISO: '2025-07-02',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Sofia Davis'
		},
		{
			id: '25',
			taskId: 'T235040493',
			title: 'Create onboarding flow for new team members',
			subtitle: '',
			status: 'backlog',
			priority: 'none',
			project: '',
			tags: [],
			created: 'Jul 1',
			createdISO: '2025-07-01',
			updated: 'Jul 2',
			updatedISO: '2025-07-02',
			assignee: 'Isabella Nguyen'
		},
		{
			id: '26',
			taskId: 'T235040494',
			title: 'Set up error tracking with Sentry',
			subtitle: '',
			status: 'backlog',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jul 3',
			createdISO: '2025-07-03',
			updated: 'Jul 4',
			updatedISO: '2025-07-04',
			assignee: 'Ethan Jones'
		},
		{
			id: '27',
			taskId: 'T235040495',
			title: 'Improve search performance with indexing',
			subtitle: '',
			status: 'backlog',
			priority: 'low',
			project: '',
			tags: [],
			created: 'Jul 2',
			createdISO: '2025-07-02',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Ava Taylor'
		},
		{
			id: '28',
			taskId: 'T235040496',
			title: 'Write API documentation for v2 endpoints',
			subtitle: '',
			status: 'done',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jun 28',
			createdISO: '2025-06-28',
			updated: 'Jul 3',
			updatedISO: '2025-07-03',
			assignee: 'Noah Garcia'
		},
		{
			id: '29',
			taskId: 'T235040497',
			title: 'Set up staging environment',
			subtitle: '',
			status: 'done',
			priority: 'high',
			project: '',
			tags: [],
			created: 'Jun 25',
			createdISO: '2025-06-25',
			updated: 'Jul 1',
			updatedISO: '2025-07-01',
			assignee: 'Lucas Brown'
		},
		{
			id: '30',
			taskId: 'T235040498',
			title: 'Fix flaky end-to-end tests in CI',
			subtitle: '',
			status: 'done',
			priority: 'medium',
			project: '',
			tags: [],
			created: 'Jun 30',
			createdISO: '2025-06-30',
			updated: 'Jul 2',
			updatedISO: '2025-07-02',
			assignee: 'Mia Wilson'
		}
	];

	const STATUS_LABEL: Record<TaskStatus, string> = {
		in_progress: 'In Progress',
		todo: 'Todo',
		backlog: 'Backlog',
		done: 'Done'
	};

	const GROUP_ORDER: TaskStatus[] = ['in_progress', 'todo', 'backlog', 'done'];

	type GroupByField = 'status' | 'priority' | 'project' | 'assignee' | 'none';

	const GROUP_BY_OPTIONS: { value: GroupByField; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'status', label: 'Status' },
		{ value: 'priority', label: 'Priority' },
		{ value: 'project', label: 'Project' },
		{ value: 'assignee', label: 'Assignee' }
	];

	function groupTasks(tasks: TaskRow[], groupBy: GroupByField): Map<string, TaskRow[]> {
		if (groupBy === 'none') {
			return new Map([['All', tasks]]);
		}
		const map = new Map<string, TaskRow[]>();
		for (const task of tasks) {
			const key = String(task[groupBy]) || '—';
			let group = map.get(key);
			if (!group) {
				group = [];
				map.set(key, group);
			}
			group.push(task);
		}
		return map;
	}

	function getGroupLabel(groupBy: GroupByField, key: string): string {
		if (groupBy === 'status') {
			return STATUS_LABEL[key as TaskStatus] ?? key;
		}
		if (groupBy === 'priority') {
			const labels: Record<string, string> = {
				urgent: 'Urgent',
				high: 'High',
				medium: 'Medium',
				low: 'Low',
				none: 'No priority'
			};
			return labels[key] ?? key;
		}
		return key;
	}

	const columns: TableColumn<TaskRow>[] = [
		{
			key: 'status',
			header: '',
			width: pixel(44)
		},
		{
			key: 'title',
			header: 'Issue',
			width: proportional(1)
		},
		{
			key: 'project',
			header: 'Project',
			width: pixel(180)
		},
		{
			key: 'created',
			header: 'Created',
			width: pixel(72)
		},
		{
			key: 'updated',
			header: 'Updated',
			width: pixel(72)
		},
		{
			key: 'assignee',
			header: 'Assignee',
			width: pixel(52)
		},
		{
			key: 'actions',
			header: '',
			width: pixel(56)
		}
	];

	const powerSearchConfig: PowerSearchConfig = {
		name: 'IssueSearch',
		fields: [
			{
				key: 'status',
				label: 'Status',
				operators: [
					{
						key: 'is',
						label: 'is',
						value: {
							type: 'enum',
							values: [
								{ value: 'in_progress', label: 'In Progress' },
								{ value: 'todo', label: 'Todo' },
								{ value: 'backlog', label: 'Backlog' },
								{ value: 'done', label: 'Done' }
							]
						}
					}
				]
			},
			{
				key: 'priority',
				label: 'Priority',
				operators: [
					{
						key: 'is',
						label: 'is',
						value: {
							type: 'enum',
							values: [
								{ value: 'urgent', label: 'Urgent' },
								{ value: 'high', label: 'High' },
								{ value: 'medium', label: 'Medium' },
								{ value: 'low', label: 'Low' },
								{ value: 'none', label: 'None' }
							]
						}
					}
				]
			},
			{
				key: 'title',
				label: 'Title',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
			},
			{
				key: 'assignee',
				label: 'Assignee',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
			},
			{
				key: 'project',
				label: 'Project',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
			}
		]
	};

	const PRIORITY_LABEL: Record<TaskPriority, string> = {
		urgent: 'Urgent',
		high: 'High',
		medium: 'Medium',
		low: 'Low',
		none: 'None'
	};

	// Upstream's `_setSearch` / `_setPriorityFilter` are named out of the way and
	// never called, so both of these only ever hold their initial value.
	let search = $state('');
	let priorityFilter = $state('all');
	let dialogOpen = $state(false);
	let selectedTask = $state<TaskRow | null>(null);
	let powerSearchFilters = $state<ReadonlyArray<PowerSearchFilter>>([]);
	let groupBy = $state<GroupByField>('status');
	let expandedGroups = $state<Set<string>>(new Set(GROUP_ORDER as string[]));

	const filtered = $derived.by(() => {
		let data = allTasks;
		if (search.trim()) {
			const q = search.toLowerCase();
			data = data.filter(
				(t) =>
					t.title.toLowerCase().includes(q) ||
					t.taskId.toLowerCase().includes(q) ||
					t.subtitle.toLowerCase().includes(q)
			);
		}
		if (priorityFilter !== 'all') {
			data = data.filter((t) => t.priority === priorityFilter);
		}
		return data;
	});

	const grouped = $derived(groupTasks(filtered, groupBy));

	const groupKeys = $derived(Array.from(grouped.keys()));

	// Upstream's `React.useEffect(…, [groupKeys])`. It reads `groupKeys` and
	// writes `expandedGroups` without reading it, so there is no cycle.
	$effect(() => {
		expandedGroups = new Set(groupKeys);
	});

	const toggleGroup = (key: string) => {
		const next = new Set(expandedGroups);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		expandedGroups = next;
	};

	const detailPanel = useResizable(() => ({
		defaultSize: 360,
		minSizePx: 280,
		maxSizePx: 500
	}));

	const COL_COUNT = columns.length;
	const resolvedWidths = resolveColumnWidths(columns);

	// `<col style>` is a string in Svelte where React takes the style object
	// `resolveColumnWidths` produces. Same two declarations, same order.
	function colStyle(key: string): string {
		const style = resolvedWidths.columns.get(key)?.style;
		if (!style) {
			return '';
		}
		return [
			style.width ? `width: ${style.width};` : '',
			style.minWidth ? `min-width: ${style.minWidth};` : ''
		]
			.filter(Boolean)
			.join(' ');
	}
</script>

{#snippet closeIcon()}<Icon icon="close" size="sm" />{/snippet}
{#snippet ellipsisIcon()}<Icon icon="moreHorizontal" size="sm" />{/snippet}

{#snippet taskDetailPanel(
	task: TaskRow | null,
	onClose: () => void,
	resizable: ResizableProps
)}
	{#if task}
		<!--
			Panel owns the separator (its full-height left border). The adjacent
			ResizeHandle is kept divider-less + isAlwaysVisible={false} so its
			always-on pill doesn't float above the panel as a stray stub.
		-->
		<LayoutPanel hasDivider {resizable} padding={4} role="complementary" label="Task details">
			<VStack gap={4}>
				<HStack gap={2} vAlign="center">
					<StackItem size="fill">
						<Text type="supporting" color="secondary">{task.taskId}</Text>
					</StackItem>
					<Button
						label="Close panel"
						variant="ghost"
						size="sm"
						icon={closeIcon}
						isIconOnly
						onclick={onClose}
					/>
				</HStack>

				<VStack gap={1}>
					<Heading level={3}>{task.title}</Heading>
					{#if task.subtitle}
						<Text type="body" color="secondary">{task.subtitle}</Text>
					{/if}
				</VStack>

				<MetadataList label={{ position: 'start' }}>
					<MetadataListItem label="Status">
						<HStack gap={2} vAlign="center">
							<StatusDot
								variant={STATUS_DOT_VARIANT[task.status]}
								label={STATUS_LABEL[task.status]}
							/>
							<Text type="body">{STATUS_LABEL[task.status]}</Text>
						</HStack>
					</MetadataListItem>
					<MetadataListItem label="Priority">
						<HStack gap={2} vAlign="center">
							<Icon icon="viewColumns" size="sm" color={PRIORITY_COLOR[task.priority]} />
							<Text type="body">{PRIORITY_LABEL[task.priority]}</Text>
						</HStack>
					</MetadataListItem>
					<MetadataListItem label="Assignee">
						<HStack gap={2} vAlign="center">
							<Avatar name={task.assignee} size="sm" />
							<Text type="body">{task.assignee}</Text>
						</HStack>
					</MetadataListItem>
					<MetadataListItem label="Project">{task.project || '—'}</MetadataListItem>
					<MetadataListItem label="Created">{task.created}</MetadataListItem>
					<MetadataListItem label="Updated">{task.updated}</MetadataListItem>
				</MetadataList>

				{#if task.tags.length > 0}
					<Divider />
					<VStack gap={2}>
						<Text type="label">Labels</Text>
						<HStack gap={2}>
							{#each task.tags as tag (tag)}
								<Badge variant="neutral" label={tag} />
							{/each}
						</HStack>
					</VStack>
				{/if}
			</VStack>
		</LayoutPanel>
	{/if}
{/snippet}

{#snippet groupingOptions()}
	<VStack gap={4}>
		<RadioList label="Group by" value={groupBy} onChange={(v) => (groupBy = v as GroupByField)}>
			{#each GROUP_BY_OPTIONS as opt (opt.value)}
				<RadioListItem value={opt.value} label={opt.label} />
			{/each}
		</RadioList>
	</VStack>
{/snippet}

{#snippet header()}
	<LayoutHeader hasDivider padding={4}>
		<VStack gap={4}>
			<HStack gap={3} vAlign="center">
				<StackItem size="fill">
					<Heading level={1}>All Issues</Heading>
				</StackItem>
				<Button
					label="Create issue"
					variant="primary"
					size="lg"
					onclick={() => (dialogOpen = true)}
				/>
			</HStack>
			<HStack gap={2} vAlign="center">
				<StackItem size="fill">
					<PowerSearch
						config={powerSearchConfig}
						filters={powerSearchFilters}
						onChange={(newFilters) => (powerSearchFilters = newFilters)}
						placeholder="Filter issues..."
						resultCount={`${filtered.length} issue${filtered.length !== 1 ? 's' : ''}`}
					/>
				</StackItem>
				<Popover
					placement="below"
					alignment="end"
					width={320}
					label="Grouping options"
					content={groupingOptions}
				>
					<Button label="View Options" variant="secondary" size="md" />
				</Popover>
			</HStack>
		</VStack>
	</LayoutHeader>
{/snippet}

{#snippet content()}
	<LayoutContent role="main" padding={0}>
		<Table {columns} density="balanced" dividers="rows" textOverflow="truncate" hasHover>
			<colgroup>
				{#each columns as col (col.key)}
					<col style={colStyle(col.key)} />
				{/each}
			</colgroup>
			{#each groupKeys as key (key)}
				{@const tasks = grouped.get(key)}
				{#if tasks && tasks.length > 0}
					{@const isExpanded = expandedGroups.has(key)}
					{#if groupBy !== 'none'}
						<TableRow
							role="button"
							tabindex={0}
							onclick={() => toggleGroup(key)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleGroup(key);
								}
							}}
						>
							<TableCell colspan={COL_COUNT} style={groupHeaderCell}>
								<HStack gap={2} vAlign="center">
									<Icon
										icon={isExpanded ? 'chevronDown' : 'chevronRight'}
										size="sm"
										color="secondary"
									/>
									<Text type="body" weight="bold">{getGroupLabel(groupBy, key)}</Text>
									<Badge variant="neutral" label={String(tasks.length)} />
								</HStack>
							</TableCell>
						</TableRow>
					{/if}
					{#if groupBy === 'none' || isExpanded}
						{#each tasks as task (task.id)}
							<TableRow onclick={() => (selectedTask = task)}>
								<TableCell>
									<Center axis="horizontal">
										<StatusDot
											variant={STATUS_DOT_VARIANT[task.status]}
											label={STATUS_LABEL[task.status]}
										/>
									</Center>
								</TableCell>
								<TableCell>
									<HStack gap={3} vAlign="center">
										<Icon icon="viewColumns" size="sm" color={PRIORITY_COLOR[task.priority]} />
										<Text type="supporting" color="secondary">{task.taskId}</Text>
										<Text type="body" maxLines={1}>{task.title}</Text>
										{#if task.subtitle}
											<Text type="body" color="secondary" maxLines={1}>
												› {task.subtitle}
											</Text>
										{/if}
									</HStack>
								</TableCell>
								<TableCell>
									{#if task.project}
										<Text type="body" maxLines={1}>{task.project}</Text>
									{:else}
										<Text type="supporting" color="secondary">—</Text>
									{/if}
								</TableCell>
								<TableCell>
									<Text type="supporting" color="secondary">{task.created}</Text>
								</TableCell>
								<TableCell>
									<Text type="supporting" color="secondary">{task.updated}</Text>
								</TableCell>
								<TableCell>
									<Avatar name={task.assignee} size="sm" />
								</TableCell>
								<TableCell>
									<DropdownMenu
										button={{
											label: 'Actions',
											variant: 'ghost',
											size: 'sm',
											icon: ellipsisIcon,
											isIconOnly: true
										}}
										hasChevron={false}
										items={[
											{ label: 'Edit issue', icon: 'wrench', onClick: () => {} },
											{ label: 'Assign to...', icon: 'info', onClick: () => {} },
											{ label: 'Add label', icon: 'stop', onClick: () => {} },
											{ label: 'Duplicate', icon: 'copy', onClick: () => {} },
											{ label: 'Move to project', icon: 'chevronRight', onClick: () => {} },
											{ type: 'divider' as const },
											{ label: 'Delete issue', icon: 'error', onClick: () => {} }
										]}
									/>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				{/if}
			{/each}
		</Table>
	</LayoutContent>
{/snippet}

{#snippet end()}
	{#if selectedTask}
		<ResizeHandle resizable={detailPanel.props} isReversed isAlwaysVisible={false} />
		{@render taskDetailPanel(
			selectedTask,
			() => (selectedTask = null),
			detailPanel.props
		)}
	{/if}
{/snippet}

{#snippet dialogHeader()}
	<DialogHeader title="Create Issue" onOpenChange={(open) => (dialogOpen = open)} />
{/snippet}

{#snippet dialogContent()}
	<LayoutContent padding={4}>
		<VStack gap={4}>
			<TextInput label="Title" placeholder="Issue title" value="" onChange={() => {}} />
			<Selector
				label="Status"
				value="todo"
				options={[
					{ value: 'in_progress', label: 'In Progress' },
					{ value: 'todo', label: 'Todo' },
					{ value: 'backlog', label: 'Backlog' }
				]}
				onChange={() => {}}
			/>
			<Selector
				label="Priority"
				value="none"
				options={[
					{ value: 'urgent', label: 'Urgent' },
					{ value: 'high', label: 'High' },
					{ value: 'medium', label: 'Medium' },
					{ value: 'low', label: 'Low' },
					{ value: 'none', label: 'No priority' }
				]}
				onChange={() => {}}
			/>
			<TextInput label="Project" placeholder="Project name" value="" onChange={() => {}} />
		</VStack>
	</LayoutContent>
{/snippet}

{#snippet dialogFooter()}
	<LayoutFooter hasDivider>
		<HStack gap={2} hAlign="end">
			<Button
				label="Cancel"
				variant="secondary"
				size="md"
				onclick={() => (dialogOpen = false)}
			/>
			<Button
				label="Create"
				variant="primary"
				size="md"
				onclick={() => (dialogOpen = false)}
			/>
		</HStack>
	</LayoutFooter>
{/snippet}

<Layout height="fill" {header} {content} {end} />
<Dialog isOpen={dialogOpen} onOpenChange={(open) => (dialogOpen = open)}>
	<Layout header={dialogHeader} content={dialogContent} footer={dialogFooter} />
</Dialog>
