<script lang="ts">
	import { Button, PowerSearch } from '$lib/index.js';
	import type {
		PowerSearchComponents,
		PowerSearchConfig,
		PowerSearchFilter,
		SearchableItem,
		SearchSource
	} from '$lib/index.js';
	import PowerSearchCustomIntegerEditor from './power-search-custom-integer-editor.svelte';
	import PowerSearchStatusToken from './power-search-status-token.svelte';

	/**
	 * Upstream's `PowerSearch.stories.tsx`, as a sibling route component.
	 *
	 * **All 24 stories**, in upstream's order, under upstream's display names.
	 * Data, configs, preset filters, captions and prop values are upstream's,
	 * unchanged.
	 *
	 * Five translations recur:
	 *
	 * - **`{...args}` has no counterpart**, so each story renders the combination
	 *   its `args` default to. This is the `TablePagination`/`Playground` ruling
	 *   already recorded: Storybook's `argTypes` panel is the knob surface, and a
	 *   demo route has none — hand-building one would be invented content.
	 * - **`useState` → `$state`**, and the six stories that seed preset filters
	 *   get their own `$state`, since a route component has one instance where
	 *   upstream has one per story render.
	 * - **`startIcon={MagnifyingGlassIcon}` → `startIcon="search"`.** Our
	 *   `startIcon` is `IconName | Snippet`; `search` is a *true* match for the
	 *   Heroicon rather than a stand-in, and retires with nothing when the icon
	 *   registry lands.
	 * - **`endContent` is a snippet**, and the two override components
	 *   (`StatusToken`, `CustomIntegerEditor`) are sibling `.svelte` files —
	 *   `PowerSearchComponentOverride.Token`/`.Editor` are `Component<P>`, i.e.
	 *   constructors, so they cannot be snippets.
	 * - **`ReadOnly`, `Disabled` and `DisabledWithMessage` keep their `const`
	 *   filters and their no-op `onChange`**, exactly as upstream writes them:
	 *   the point of those three is that nothing changes.
	 *
	 * The two `Math.floor(new Date(…).getTime() / 1000)` seeds are upstream's
	 * literal dates, so they are stable rather than clock-dependent.
	 */

	// =============================================================================
	// Sample data
	// =============================================================================

	const statusValues = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'review', label: 'In Review' },
		{ value: 'closed', label: 'Closed' },
		{ value: 'blocked', label: 'Blocked' }
	];

	const priorityValues = [
		{ value: 'p0', label: 'P0 - Critical' },
		{ value: 'p1', label: 'P1 - High' },
		{ value: 'p2', label: 'P2 - Medium' },
		{ value: 'p3', label: 'P3 - Low' }
	];

	const tagValues = [
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'docs', label: 'Documentation' },
		{ value: 'perf', label: 'Performance' },
		{ value: 'security', label: 'Security' },
		{ value: 'ux', label: 'UX' },
		{ value: 'infra', label: 'Infrastructure' }
	];

	const users: SearchableItem[] = [
		{
			id: 'user-1',
			label: 'Alice Johnson',
			auxiliaryData: { photo: 'https://i.pravatar.cc/150?u=alice' }
		},
		{
			id: 'user-2',
			label: 'Bob Smith',
			auxiliaryData: { photo: 'https://i.pravatar.cc/150?u=bob' }
		},
		{
			id: 'user-3',
			label: 'Charlie Brown',
			auxiliaryData: { photo: 'https://i.pravatar.cc/150?u=charlie' }
		},
		{
			id: 'user-4',
			label: 'Diana Prince',
			auxiliaryData: { photo: 'https://i.pravatar.cc/150?u=diana' }
		},
		{
			id: 'user-5',
			label: 'Eve Williams',
			auxiliaryData: { photo: 'https://i.pravatar.cc/150?u=eve' }
		},
		{
			id: 'user-6',
			label: 'Frank Miller',
			auxiliaryData: { photo: 'https://i.pravatar.cc/150?u=frank' }
		}
	];

	const userSource: SearchSource = {
		search: (query: string) =>
			users.filter((u) => u.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => users
	};

	// =============================================================================
	// Configs
	// =============================================================================

	const basicConfig: PowerSearchConfig = {
		name: 'BasicSearch',
		fields: [
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [
					{ key: 'is', label: 'is', value: { type: 'enum', values: statusValues } },
					{ key: 'is_not', label: 'is not', value: { type: 'enum', values: statusValues } }
				]
			},
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [
					{ key: 'contains', label: 'contains', value: { type: 'string' } },
					{ key: 'not_contains', label: 'does not contain', value: { type: 'string' } }
				]
			},
			{
				key: 'priority',
				label: 'Priority',
				defaultOperator: 'is',
				operators: [{ key: 'is', label: 'is', value: { type: 'enum', values: priorityValues } }]
			}
		]
	};

	const fullConfig: PowerSearchConfig = {
		name: 'FullSearch',
		fields: [
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'any_of',
				operators: [
					{
						key: 'any_of',
						label: 'is any of',
						value: { type: 'enum_list', values: statusValues }
					},
					{
						key: 'none_of',
						label: 'is none of',
						value: { type: 'enum_list', values: statusValues }
					}
				]
			},
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [
					{ key: 'contains', label: 'contains', value: { type: 'string' } },
					{ key: 'not_contains', label: 'does not contain', value: { type: 'string' } }
				]
			},
			{
				key: 'priority',
				label: 'Priority',
				defaultOperator: 'is',
				operators: [{ key: 'is', label: 'is', value: { type: 'enum', values: priorityValues } }]
			},
			{
				key: 'assignee',
				label: 'Assignee',
				defaultOperator: 'any_of',
				typeaheadAliases: ['owner', 'assigned'],
				operators: [
					{
						key: 'any_of',
						label: 'is any of',
						value: { type: 'entity_list', searchSource: userSource }
					},
					{
						key: 'none_of',
						label: 'is none of',
						value: { type: 'entity_list', searchSource: userSource }
					}
				]
			},
			{
				key: 'tags',
				label: 'Tags',
				defaultOperator: 'include',
				operators: [
					{ key: 'include', label: 'include', value: { type: 'enum_list', values: tagValues } },
					{ key: 'exclude', label: 'exclude', value: { type: 'enum_list', values: tagValues } }
				]
			},
			{
				key: 'line_count',
				label: 'Line count',
				defaultOperator: 'gt',
				operators: [
					{
						key: 'gt',
						label: 'is greater than',
						value: { type: 'integer', minValue: 0, maxValue: 10000, units: 'lines' }
					},
					{
						key: 'lt',
						label: 'is less than',
						value: { type: 'integer', minValue: 0, maxValue: 10000, units: 'lines' }
					}
				]
			},
			{
				key: 'cost',
				label: 'Cost',
				defaultOperator: 'gt',
				operators: [
					{
						key: 'gt',
						label: '>',
						value: { type: 'float', minValue: 0, maxValue: 100000, units: 'USD' }
					},
					{
						key: 'lt',
						label: '<',
						value: { type: 'float', minValue: 0, maxValue: 100000, units: 'USD' }
					}
				]
			},
			{
				key: 'created',
				label: 'Created',
				defaultOperator: 'after',
				operators: [
					{
						key: 'after',
						label: 'is after',
						value: { type: 'date_absolute', isDateOnly: true }
					},
					{
						key: 'newer_than',
						label: 'is newer than',
						value: { type: 'date_relative', isPastAllowed: true, isFutureAllowed: false }
					}
				]
			},
			{
				key: 'ids',
				label: 'ID',
				defaultOperator: 'in',
				operators: [{ key: 'in', label: 'is any of', value: { type: 'string_list' } }]
			},
			{
				key: 'unread',
				label: 'Unread only',
				defaultOperator: 'yes',
				operators: [{ key: 'yes', label: '', value: { type: 'empty' } }]
			}
		]
	};

	const nestedConfig: PowerSearchConfig = {
		name: 'NestedSearch',
		fields: [
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [
					{ key: 'is', label: 'is', value: { type: 'enum', values: statusValues } },
					{ key: 'is_not', label: 'is not', value: { type: 'enum', values: statusValues } }
				]
			},
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
			},
			{
				key: 'priority',
				label: 'Priority',
				defaultOperator: 'is',
				operators: [{ key: 'is', label: 'is', value: { type: 'enum', values: priorityValues } }]
			},
			{
				key: 'or_group',
				label: 'Any of (OR)',
				defaultOperator: 'match_any',
				operators: [{ key: 'match_any', label: 'match any', value: { type: 'nested' } }]
			},
			{
				key: 'and_group',
				label: 'All of (AND)',
				defaultOperator: 'match_all',
				operators: [{ key: 'match_all', label: 'match all', value: { type: 'nested' } }]
			}
		]
	};

	const contentSearchConfig: PowerSearchConfig = {
		name: 'ContentSearch',
		contentSearchFieldKey: 'title',
		fields: [
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [
					{ key: 'contains', label: 'contains', value: { type: 'string' } },
					{ key: 'not_contains', label: 'does not contain', value: { type: 'string' } }
				]
			},
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [
					{ key: 'is', label: 'is', value: { type: 'enum', values: statusValues } },
					{ key: 'is_not', label: 'is not', value: { type: 'enum', values: statusValues } }
				]
			},
			{
				key: 'priority',
				label: 'Priority',
				defaultOperator: 'is',
				operators: [{ key: 'is', label: 'is', value: { type: 'enum', values: priorityValues } }]
			}
		]
	};

	// =============================================================================
	// Per-story state
	// =============================================================================

	let defaultFilters = $state<PowerSearchFilter[]>([]);

	let presetFilters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } },
		{ field: 'priority', operator: 'is', value: { type: 'enum', value: 'p1' } }
	]);

	let fullFeaturedFilters = $state<PowerSearchFilter[]>([]);

	let enumListFilters = $state<PowerSearchFilter[]>([
		{
			field: 'status',
			operator: 'any_of',
			value: { type: 'enum_list', value: ['open', 'in_progress'] }
		},
		{
			field: 'tags',
			operator: 'include',
			value: { type: 'enum_list', value: ['bug', 'security'] }
		}
	]);

	let entityFilters = $state<PowerSearchFilter[]>([
		{
			field: 'assignee',
			operator: 'any_of',
			value: {
				type: 'entity_list',
				value: [
					{ id: 'user-1', label: 'Alice Johnson' },
					{ id: 'user-3', label: 'Charlie Brown' }
				]
			}
		}
	]);

	let numericFilters = $state<PowerSearchFilter[]>([
		{ field: 'line_count', operator: 'gt', value: { type: 'integer', value: 100 } },
		{ field: 'cost', operator: 'lt', value: { type: 'float', value: 500.5 } }
	]);

	let dateFilters = $state<PowerSearchFilter[]>([
		{
			field: 'created',
			operator: 'after',
			value: {
				type: 'date_absolute',
				unixSeconds: Math.floor(new Date('2025-01-15').getTime() / 1000)
			}
		}
	]);

	let emptyFilterFilters = $state<PowerSearchFilter[]>([
		{ field: 'unread', operator: 'yes', value: { type: 'empty' } }
	]);

	const readOnlyFilters: PowerSearchFilter[] = [
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } },
		{ field: 'priority', operator: 'is', value: { type: 'enum', value: 'p0' } }
	];

	const disabledFilters: PowerSearchFilter[] = [
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } }
	];

	let errorFilters = $state<PowerSearchFilter[]>([]);

	let warningFilters = $state<PowerSearchFilter[]>([
		{ field: 'title', operator: 'contains', value: { type: 'string', value: 'test' } }
	]);

	let manyFilters = $state<PowerSearchFilter[]>([
		{
			field: 'status',
			operator: 'any_of',
			value: { type: 'enum_list', value: ['open', 'in_progress'] }
		},
		{ field: 'priority', operator: 'is', value: { type: 'enum', value: 'p1' } },
		{ field: 'title', operator: 'contains', value: { type: 'string', value: 'login' } },
		{
			field: 'assignee',
			operator: 'any_of',
			value: { type: 'entity_list', value: [{ id: 'user-1', label: 'Alice Johnson' }] }
		},
		{ field: 'tags', operator: 'include', value: { type: 'enum_list', value: ['bug'] } },
		{ field: 'line_count', operator: 'gt', value: { type: 'integer', value: 50 } },
		{
			field: 'created',
			operator: 'after',
			value: {
				type: 'date_absolute',
				unixSeconds: Math.floor(new Date('2025-06-01').getTime() / 1000)
			}
		}
	]);

	let trackingFilters = $state<PowerSearchFilter[]>([]);
	let trackingLog = $state<string[]>([]);

	let nestedFilters = $state<PowerSearchFilter[]>([
		{
			field: 'or_group',
			operator: 'match_any',
			value: {
				type: 'nested',
				value: [
					{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } },
					{ field: 'status', operator: 'is', value: { type: 'enum', value: 'in_progress' } }
				]
			}
		},
		{ field: 'priority', operator: 'is', value: { type: 'enum', value: 'p0' } },
		{
			field: 'and_group',
			operator: 'match_all',
			value: {
				type: 'nested',
				value: [
					{ field: 'title', operator: 'contains', value: { type: 'string', value: 'login' } },
					{ field: 'status', operator: 'is_not', value: { type: 'enum', value: 'closed' } }
				]
			}
		}
	]);

	let contentSearchFilters = $state<PowerSearchFilter[]>([]);

	let smFilters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } }
	]);
	let mdFilters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } }
	]);
	let lgFilters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } }
	]);

	let startIconFilters = $state<PowerSearchFilter[]>([]);

	let resultCountFilters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } }
	]);

	let endContentFilters = $state<PowerSearchFilter[]>([]);

	const overflowFilters: PowerSearchFilter[] = [
		{
			field: 'status',
			operator: 'any_of',
			value: { type: 'enum_list', value: ['open', 'in_progress'] }
		},
		{ field: 'priority', operator: 'is', value: { type: 'enum', value: 'p1' } },
		{ field: 'title', operator: 'contains', value: { type: 'string', value: 'login' } },
		{
			field: 'assignee',
			operator: 'any_of',
			value: { type: 'entity_list', value: [{ id: 'user-1', label: 'Alice Johnson' }] }
		},
		{ field: 'tags', operator: 'include', value: { type: 'enum_list', value: ['bug'] } }
	];

	let overflowInlineFilters = $state<PowerSearchFilter[]>([...overflowFilters]);
	let overflowLayerFilters = $state<PowerSearchFilter[]>([...overflowFilters]);

	const customComponents: PowerSearchComponents = {
		enum: { Token: PowerSearchStatusToken },
		integer: { Editor: PowerSearchCustomIntegerEditor }
	};

	let customComponentFilters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } },
		{ field: 'line_count', operator: 'gt', value: { type: 'integer', value: 200 } }
	]);
</script>

<h3>Default</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={defaultFilters}
		onChange={(newFilters) => (defaultFilters = [...newFilters])}
		placeholder="Search by status, title, priority..."
	/>
</div>

<h3>Pre-set Filters</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={presetFilters}
		onChange={(newFilters) => (presetFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Full Featured (All Field Types)</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={fullFeaturedFilters}
		onChange={(newFilters) => (fullFeaturedFilters = [...newFilters])}
		placeholder="Search..."
	/>
	{#if fullFeaturedFilters.length > 0}
		<pre
			style="margin-top: 16px; padding: 12px; background-color: #f5f5f5; border-radius: 8px; font-size: 12px; overflow: auto">{JSON.stringify(
				fullFeaturedFilters,
				null,
				2
			)}</pre>
	{/if}
</div>

<h3>Multi-value Filters</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={enumListFilters}
		onChange={(newFilters) => (enumListFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Entity Filters</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={entityFilters}
		onChange={(newFilters) => (entityFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Numeric Filters</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={numericFilters}
		onChange={(newFilters) => (numericFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Date Filters</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={dateFilters}
		onChange={(newFilters) => (dateFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Boolean / Empty Filters</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={emptyFilterFilters}
		onChange={(newFilters) => (emptyFilterFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Read Only</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={readOnlyFilters}
		onChange={() => {}}
		isReadOnly
		placeholder="Search..."
	/>
</div>

<h3>Disabled</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={disabledFilters}
		onChange={() => {}}
		isDisabled
		placeholder="Search..."
	/>
</div>

<h3>With Error Status</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={errorFilters}
		onChange={(newFilters) => (errorFilters = [...newFilters])}
		status={{ type: 'error', message: 'Invalid filter combination' }}
		placeholder="Search..."
	/>
</div>

<h3>With Warning Status</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={warningFilters}
		onChange={(newFilters) => (warningFilters = [...newFilters])}
		status={{ type: 'warning', message: 'Broad search may be slow' }}
		placeholder="Search..."
	/>
</div>

<h3>Many Filters</h3>
<div style="width: 800px">
	<PowerSearch
		config={fullConfig}
		filters={manyFilters}
		onChange={(newFilters) => (manyFilters = [...newFilters])}
		placeholder="Add more filters..."
	/>
</div>

<h3>Change Tracking</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={trackingFilters}
		onChange={(newFilters, changeType, index) => {
			trackingFilters = [...newFilters];
			trackingLog = [
				...trackingLog,
				`${changeType} at index ${index} (${newFilters.length} filters total)`
			];
		}}
		placeholder="Try adding, editing, and removing filters..."
	/>
	{#if trackingLog.length > 0}
		<div
			style="margin-top: 16px; padding: 12px; background-color: #f5f5f5; border-radius: 8px; font-size: 12px; max-height: 200px; overflow: auto"
		>
			<strong>Change log:</strong>
			<ul style="margin: 4px 0; padding-inline-start: 20px">
				{#each trackingLog as entry, i (i)}
					<li>{entry}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<h3>Nested Filters</h3>
<div style="width: 700px">
	<PowerSearch
		config={nestedConfig}
		filters={nestedFilters}
		onChange={(newFilters) => (nestedFilters = [...newFilters])}
		placeholder="Add filters..."
	/>
	{#if nestedFilters.length > 0}
		<pre
			style="margin-top: 16px; padding: 12px; background-color: #f5f5f5; border-radius: 8px; font-size: 12px; overflow: auto">{JSON.stringify(
				nestedFilters,
				null,
				2
			)}</pre>
	{/if}
</div>

<h3>Content Search Field Key</h3>
<div style="width: 600px">
	<PowerSearch
		config={contentSearchConfig}
		filters={contentSearchFilters}
		onChange={(newFilters) => (contentSearchFilters = [...newFilters])}
		placeholder="Type to search by title, or pick a field..."
	/>
	{#if contentSearchFilters.length > 0}
		<pre
			style="margin-top: 16px; padding: 12px; background-color: #f5f5f5; border-radius: 8px; font-size: 12px; overflow: auto">{JSON.stringify(
				contentSearchFilters,
				null,
				2
			)}</pre>
	{/if}
</div>

<h3>SizeVariants</h3>
<div style="width: 600px">
	<div style="display: flex; flex-direction: column; gap: 16px">
		<PowerSearch
			label="Small (28px)"
			config={basicConfig}
			filters={smFilters}
			onChange={(newFilters) => (smFilters = [...newFilters])}
			placeholder="Small size"
			size="sm"
		/>
		<PowerSearch
			label="Medium (32px)"
			config={basicConfig}
			filters={mdFilters}
			onChange={(newFilters) => (mdFilters = [...newFilters])}
			placeholder="Medium size (default)"
			size="md"
		/>
		<PowerSearch
			label="Large (36px)"
			config={basicConfig}
			filters={lgFilters}
			onChange={(newFilters) => (lgFilters = [...newFilters])}
			placeholder="Large size"
			size="lg"
		/>
	</div>
</div>

<h3>With Start Icon</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={startIconFilters}
		onChange={(newFilters) => (startIconFilters = [...newFilters])}
		startIcon="search"
		label="Search"
		isLabelHidden
		placeholder="Search..."
	/>
</div>

<h3>With Result Count</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={resultCountFilters}
		onChange={(newFilters) => (resultCountFilters = [...newFilters])}
		resultCount={1234}
		startIcon="search"
		label="Search"
		isLabelHidden
		placeholder="Search..."
	/>
</div>

{#snippet saveButton()}
	<Button label="Save" variant="primary" size="sm" style="height: 20px" />
{/snippet}

<h3>With End Content and Result Count</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={endContentFilters}
		onChange={(newFilters) => (endContentFilters = [...newFilters])}
		resultCount={42}
		endContent={saveButton}
		label="Search"
		isLabelHidden
		placeholder="Search..."
		size="lg"
	/>
</div>

<h3>Overflow Inline</h3>
<div style="width: 600px">
	<PowerSearch
		config={fullConfig}
		filters={overflowInlineFilters}
		onChange={(newFilters) => (overflowInlineFilters = [...newFilters])}
		tokenOverflowBehavior="unfocusedInline"
		placeholder="Add more filters..."
	/>
	<p style="margin-top: 8px">This text will shift down when the search bar expands on focus.</p>
</div>

<h3>Overflow Layer</h3>
<div style="width: 600px">
	<PowerSearch
		config={fullConfig}
		filters={overflowLayerFilters}
		onChange={(newFilters) => (overflowLayerFilters = [...newFilters])}
		tokenOverflowBehavior="unfocusedLayer"
		placeholder="Add more filters..."
	/>
	<p style="margin-top: 8px">This text should not shift when the search bar expands on focus.</p>
</div>

<h3>Custom Components Map</h3>
<div style="width: 700px">
	<PowerSearch
		config={fullConfig}
		filters={customComponentFilters}
		onChange={(newFilters) => (customComponentFilters = [...newFilters])}
		components={customComponents}
		placeholder="Search with custom components..."
	/>
	<p style="margin-top: 16px; font-size: 13px; color: #666">
		<strong>Custom overrides:</strong> Status tokens show colored text (custom Token). Integer fields
		use a range slider editor (custom Editor).
	</p>
</div>

<h3>DisabledWithMessage</h3>
<div style="width: 600px">
	<PowerSearch
		config={basicConfig}
		filters={disabledFilters}
		onChange={() => {}}
		isDisabled
		disabledMessage="You need edit access to search"
		placeholder="Search..."
	/>
</div>
