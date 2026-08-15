<script lang="ts">
	import {
		Button,
		Card,
		Heading,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		Section,
		Table,
		TableBody,
		TableCell,
		TableHeader,
		TableHeaderCell,
		TableRow,
		Text,
		VStack,
		pixel,
		proportional
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';
	// Upstream reads the raw token defaults from `@astryxdesign/core/theme` for the
	// inline pill colours in `CustomCellRenderer`. This port publishes them from
	// no barrel (see port/todo.md's "No public path to the tokens"), so the demo
	// imports the declaration site directly — legal from a `.svelte` file
	// because it is the *tokens* module being imported, not `@stylexjs/stylex`.
	import {
		colorDefaults,
		radiusDefaults,
		spacingDefaults,
		textSizeDefaults
	} from '$lib/styles/tokens.stylex.js';

	/**
	 * Upstream's `Table.stories.tsx`, as a sibling route component — the
	 * `nav-side-nav-demos.svelte` shape, because twenty-four tables would
	 * otherwise bury the page.
	 *
	 * **All 24 stories**, and none of them needs a plugin: `Table.stories.tsx`
	 * imports no `useTable*` hook at all, so the deferred plugin surface costs
	 * this file nothing.
	 *
	 * Two translations recur:
	 *
	 * - `renderCell` is a `Snippet<[T]>` where upstream's is
	 *   `(item) => ReactNode`. A template snippet does not exist while the
	 *   `<script>` runs, so any column array that references one is
	 *   `$derived.by` — deferred to first read, which is inside the render.
	 * - Upstream's story `decorators` (a padded page wrapper on the
	 *   container-bleed stories) become a plain wrapper `<div>` here, because
	 *   the bleed only reads as intended against a body-coloured surface.
	 */

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
		age: number;
	}

	const users: User[] = [
		{ id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Engineer', age: 30 },
		{ id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Designer', age: 25 },
		{ id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'PM', age: 35 },
		{ id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Engineer', age: 28 },
		{ id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Designer', age: 32 }
	];

	const columns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: proportional(1) },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role', width: proportional(1) },
		{ key: 'age', header: 'Age', width: pixel(80) }
	];

	const simpleColumns: TableColumn<User>[] = [
		{ key: 'name', header: 'Name', width: proportional(1) },
		{ key: 'role', header: 'Role', width: proportional(1) },
		{ key: 'email', header: 'Email', width: proportional(2) }
	];

	const customColumns = $derived.by<TableColumn<User>[]>(() => [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email', width: proportional(2), renderCell: mailtoCell },
		{ key: 'role', header: 'Role', renderCell: rolePillCell },
		{ key: 'age', header: 'Age', width: pixel(80) }
	]);

	interface OverflowRow extends Record<string, unknown> {
		scenario: string;
		content: string;
	}

	const overflowData: OverflowRow[] = [
		{
			scenario: 'Long unbroken string',
			content:
				'a_very_long_string_like_this_that_overflows_the_column_without_any_spaces_or_hyphens'
		},
		{
			scenario: 'Normal prose',
			content:
				'This is a longer sentence that might wrap or truncate depending on the textOverflow setting of the table.'
		},
		{ scenario: 'Short text', content: 'Fits fine.' }
	];

	const overflowColumns: TableColumn<OverflowRow>[] = [
		{ key: 'scenario', header: 'Scenario', width: pixel(160) },
		{ key: 'content', header: 'Content', width: proportional(1) }
	];

	interface Transaction extends Record<string, unknown> {
		id: string;
		description: string;
		category: string;
		quantity: number;
		amount: string;
	}

	const transactions: Transaction[] = [
		{
			id: '1',
			description: 'Cloud hosting (monthly)',
			category: 'Infrastructure',
			quantity: 1,
			amount: '$2,400.00'
		},
		{
			id: '2',
			description: 'Design software licenses',
			category: 'Tools',
			quantity: 12,
			amount: '$1,188.00'
		},
		{
			id: '3',
			description: 'Team offsite catering',
			category: 'Events',
			quantity: 45,
			amount: '$3,150.00'
		},
		{
			id: '4',
			description: 'Ergonomic keyboards',
			category: 'Hardware',
			quantity: 8,
			amount: '$1,592.00'
		},
		{
			id: '5',
			description: 'Annual conference tickets',
			category: 'Travel',
			quantity: 3,
			amount: '$4,500.00'
		}
	];

	const alignedColumns: TableColumn<Transaction>[] = [
		{ key: 'description', header: 'Description', width: proportional(2) },
		{ key: 'category', header: 'Category' },
		{ key: 'quantity', header: 'Qty', align: 'center', width: pixel(80) },
		{ key: 'amount', header: 'Amount', align: 'end', width: pixel(120) }
	];

	interface TeamMember extends Record<string, unknown> {
		id: string;
		name: string;
		bio: string;
		role: string;
	}

	const teamMembers: TeamMember[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			bio: 'Full-stack engineer with 8 years of experience. Specializes in distributed systems and performance optimization. Previously at Stripe and Google.',
			role: 'Staff Engineer'
		},
		{
			id: '2',
			name: 'Bob Smith',
			bio: 'Product designer focused on design systems and accessibility.',
			role: 'Senior Designer'
		},
		{
			id: '3',
			name: 'Charlie Brown',
			bio: 'Engineering manager leading the platform team. Passionate about developer experience, tooling, and building inclusive teams that ship with confidence.',
			role: 'EM'
		}
	];

	const verticalAlignColumns = $derived.by<TableColumn<TeamMember>[]>(() => [
		{ key: 'name', header: 'Name', width: pixel(140) },
		{ key: 'bio', header: 'Bio', width: proportional(3), renderCell: bioCell },
		{ key: 'role', header: 'Role', align: 'end', width: pixel(140) }
	]);

	interface Employee extends Record<string, unknown> {
		id: string;
		name: string;
		department: string;
		title: string;
		location: string;
		email: string;
		status: string;
	}

	const mobileData: Employee[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			department: 'Engineering',
			title: 'Senior Software Engineer',
			location: 'San Francisco',
			email: 'alice.johnson@example.com',
			status: 'Active'
		},
		{
			id: '2',
			name: 'Bob Martinez',
			department: 'Product Design',
			title: 'Lead Product Designer',
			location: 'New York',
			email: 'bob.martinez@example.com',
			status: 'Active'
		},
		{
			id: '3',
			name: 'Carol Williams',
			department: 'Data Science',
			title: 'Staff Data Scientist',
			location: 'Seattle',
			email: 'carol.williams@example.com',
			status: 'On Leave'
		}
	];

	const mobileColumns: TableColumn<Employee>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'department', header: 'Department' },
		{ key: 'title', header: 'Title' },
		{ key: 'location', header: 'Location' },
		{ key: 'email', header: 'Email' },
		{ key: 'status', header: 'Status' }
	];

	interface PropEntry extends Record<string, unknown> {
		name: string;
		type: string;
		description: string;
	}

	const propData: PropEntry[] = [
		{ name: 'label', type: 'string', description: 'The visible text label for the button.' },
		{
			name: 'variant',
			type: "'primary' | 'secondary' | 'ghost' | 'danger'",
			description:
				'Visual style variant. Primary for main actions, secondary for supporting actions, ghost for minimal emphasis, danger for destructive operations.'
		},
		{
			name: 'size',
			type: "'sm' | 'md' | 'lg'",
			description: 'Controls button height, padding, and font size.'
		},
		{
			name: 'isDisabled',
			type: 'boolean',
			description: 'Disables the button, preventing interactions and applying disabled styling.'
		},
		{
			name: 'onClick',
			type: '(event: MouseEvent) => void',
			description: 'Callback fired when the button is clicked.'
		},
		{
			name: 'startIcon',
			type: 'ReactNode',
			description: 'Icon rendered before the label text.'
		}
	];

	const propColumns = $derived.by<TableColumn<PropEntry>[]>(() => [
		{ key: 'name', header: 'Prop', width: pixel(140), renderCell: propNameCell },
		{ key: 'type', header: 'Type', width: pixel(240), renderCell: propTypeCell },
		{ key: 'description', header: 'Description' }
	]);

	const DENSITIES = ['compact', 'balanced', 'spacious'] as const;
	const VERTICAL_ALIGNS = ['middle', 'top', 'bottom'] as const;

	const pageWrapper = `background-color: ${colorDefaults['--color-background-body']}; padding: ${spacingDefaults['--spacing-6']}`;
	const storyWrapper = 'display: flex; gap: 24px; flex-wrap: wrap; align-items: start';
</script>

{#snippet mailtoCell(item: User)}
	<a href={`mailto:${item.email}`} style="color: inherit">{item.email}</a>
{/snippet}

{#snippet rolePillCell(item: User)}
	<span
		style="padding: {spacingDefaults['--spacing-0-5']} {spacingDefaults['--spacing-2']};
			border-radius: {radiusDefaults['--radius-inner']};
			font-size: {textSizeDefaults['--font-size-xs']};
			background-color: {item.role === 'Engineer'
			? colorDefaults['--color-background-blue']
			: colorDefaults['--color-background-purple']};
			color: {item.role === 'Engineer'
			? colorDefaults['--color-text-blue']
			: colorDefaults['--color-text-purple']}"
	>
		{item.role}
	</span>
{/snippet}

{#snippet bioCell(item: TeamMember)}
	<span style="white-space: normal; overflow: visible; display: block">{item.bio}</span>
{/snippet}

{#snippet propNameCell(item: PropEntry)}
	<Text type="code" weight="bold">{item.name}</Text>
{/snippet}

{#snippet propTypeCell(item: PropEntry)}
	<Text type="code" color="secondary">{item.type}</Text>
{/snippet}

<h3>Default</h3>
<Table data={users} {columns} idKey="id" />

<h3>Compact</h3>
<Table data={users} {columns} idKey="id" density="compact" />

<h3>Spacious</h3>
<Table data={users} {columns} idKey="id" density="spacious" />

<h3>Striped with hover</h3>
<Table data={users} {columns} idKey="id" isStriped hasHover />

<h3>Grid dividers</h3>
<Table data={users} {columns} idKey="id" dividers="grid" />

<h3>Column dividers</h3>
<Table data={users} {columns} idKey="id" dividers="columns" />

<h3>No dividers</h3>
<Table data={users} {columns} idKey="id" dividers="none" />

<h3>Auto columns</h3>
<Table
	data={[
		{ name: 'Alice', role: 'Engineer', status: 'Active' },
		{ name: 'Bob', role: 'Designer', status: 'Away' }
	]}
	hasHover
/>

<h3>Custom cell renderer</h3>
<Table data={users} columns={customColumns} idKey="id" hasHover />

<h3>Children mode</h3>
<Table density="balanced" dividers="rows" isStriped hasHover>
	<TableHeader>
		<TableRow>
			<TableHeaderCell>Name</TableHeaderCell>
			<TableHeaderCell>Email</TableHeaderCell>
			<TableHeaderCell>Role</TableHeaderCell>
		</TableRow>
	</TableHeader>
	<TableBody>
		<TableRow>
			<TableCell>Alice</TableCell>
			<TableCell>alice@example.com</TableCell>
			<TableCell>Engineer</TableCell>
		</TableRow>
		<TableRow>
			<TableCell>Bob</TableCell>
			<TableCell>bob@example.com</TableCell>
			<TableCell>Designer</TableCell>
		</TableRow>
		<TableRow>
			<TableCell>Charlie</TableCell>
			<TableCell>charlie@example.com</TableCell>
			<TableCell>PM</TableCell>
		</TableRow>
		<TableRow>
			<TableCell>Diana</TableCell>
			<TableCell>diana@example.com</TableCell>
			<TableCell>Engineer</TableCell>
		</TableRow>
	</TableBody>
</Table>

<h3>All densities</h3>
<div style="display: flex; flex-direction: column; gap: 32px">
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">Compact</p>
		<Table data={users.slice(0, 3)} {columns} idKey="id" density="compact" />
	</div>
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">Balanced (default)</p>
		<Table data={users.slice(0, 3)} {columns} idKey="id" density="balanced" />
	</div>
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">Spacious</p>
		<Table data={users.slice(0, 3)} {columns} idKey="id" density="spacious" />
	</div>
</div>

<h3>Kitchen sink</h3>
<Table data={users} {columns} idKey="id" density="compact" dividers="grid" isStriped hasHover />

<h3>Overflow behavior</h3>
<div style="display: flex; flex-direction: column; gap: 32px; width: 480px">
	<div>
		<h4 style="margin: 0 0 8px">Wrap (default)</h4>
		<Table data={overflowData} columns={overflowColumns} dividers="grid" density="balanced" />
	</div>
	<div>
		<h4 style="margin: 0 0 8px">Truncate (with tooltip on hover)</h4>
		<Table
			data={overflowData}
			columns={overflowColumns}
			dividers="grid"
			density="balanced"
			textOverflow="truncate"
		/>
	</div>
</div>

<h3>In card</h3>
<div style={pageWrapper}>
	<div style={storyWrapper}>
		<div>
			<h4 style="margin: 0 0 8px">Table in Card (auto bleed)</h4>
			<Card width={480}>
				<Table data={users.slice(0, 4)} columns={simpleColumns} />
			</Card>
		</div>
		<div>
			<h4 style="margin: 0 0 8px">Before: Card padding=&#123;0&#125; (old pattern)</h4>
			<Card width={480} padding={0}>
				<Table data={users.slice(0, 4)} columns={simpleColumns} />
			</Card>
		</div>
	</div>
</div>

<h3>In card with heading</h3>
<div style={pageWrapper}>
	<Card width={520}>
		<VStack gap={3}>
			<Heading level={3}>Team Members</Heading>
			<Table data={users.slice(0, 4)} columns={simpleColumns} hasHover />
		</VStack>
	</Card>
</div>

<h3>In card with layout</h3>
<div style={pageWrapper}>
	<Card width={560}>
		<Layout>
			{#snippet header()}
				<LayoutHeader hasDivider>
					<Heading level={3}>User Directory</Heading>
				</LayoutHeader>
			{/snippet}
			{#snippet content()}
				<LayoutContent>
					<Table data={users} columns={simpleColumns} hasHover isStriped />
				</LayoutContent>
			{/snippet}
			{#snippet footer()}
				<LayoutFooter hasDivider>
					<HStack gap={2} hAlign="end">
						<Button label="Export" variant="secondary" />
						<Button label="Add User" variant="primary" />
					</HStack>
				</LayoutFooter>
			{/snippet}
		</Layout>
	</Card>
</div>

<h3>In card with section</h3>
<div style={pageWrapper}>
	<Card width={520}>
		<VStack gap={3}>
			<Heading level={3}>Dashboard</Heading>
			<p style="font-size: 14px; margin: 0">
				The table below is in a wash section for visual separation.
			</p>
		</VStack>
		<Section variant="muted">
			<Table data={users.slice(0, 3)} columns={simpleColumns} density="compact" />
		</Section>
	</Card>
</div>

<h3>In card densities</h3>
<div style={pageWrapper}>
	<div style={storyWrapper}>
		{#each DENSITIES as density (density)}
			<div>
				<h4 style="margin: 0 0 8px">{density}</h4>
				<Card width={400}>
					<VStack gap={2}>
						<Heading level={4}>Team</Heading>
						<Table data={users.slice(0, 3)} columns={simpleColumns} {density} />
					</VStack>
				</Card>
			</div>
		{/each}
	</div>
</div>

<h3>Standalone vs container</h3>
<div style={pageWrapper}>
	<div style={storyWrapper}>
		<div>
			<h4 style="margin: 0 0 8px">Standalone (no container)</h4>
			<div style="width: 400px">
				<Table data={users.slice(0, 3)} columns={simpleColumns} />
			</div>
		</div>
		<div>
			<h4 style="margin: 0 0 8px">Inside Card</h4>
			<Card width={400}>
				<Table data={users.slice(0, 3)} columns={simpleColumns} />
			</Card>
		</div>
	</div>
</div>

<h3>Column alignment</h3>
<Table data={transactions} columns={alignedColumns} idKey="id" hasHover dividers="rows" />

<h3>Vertical alignment</h3>
<div style="display: flex; flex-direction: column; gap: 32px">
	{#each VERTICAL_ALIGNS as vAlign (vAlign)}
		<div>
			<p style="margin: 0 0 8px; font-weight: 600">verticalAlign="{vAlign}"</p>
			<Table
				data={teamMembers}
				columns={verticalAlignColumns}
				idKey="id"
				verticalAlign={vAlign}
				dividers="rows"
			/>
		</div>
	{/each}
</div>

<h3>Responsive scroll</h3>
<div style="display: flex; flex-direction: column; gap: 32px">
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">320px container — 6 columns, horizontal scroll</p>
		<div style="width: 320px; border: 1px dashed #ccc; border-radius: 8px">
			<Table
				data={mobileData}
				columns={mobileColumns}
				idKey="id"
				dividers="rows"
				density="compact"
				textOverflow="truncate"
			/>
		</div>
	</div>
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">
			480px container — same table, more visible before scroll
		</p>
		<div style="width: 480px; border: 1px dashed #ccc; border-radius: 8px">
			<Table
				data={mobileData}
				columns={mobileColumns}
				idKey="id"
				dividers="rows"
				density="compact"
				textOverflow="truncate"
			/>
		</div>
	</div>
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">Full width — no scroll needed</p>
		<Table
			data={mobileData}
			columns={mobileColumns}
			idKey="id"
			dividers="rows"
			density="compact"
			textOverflow="truncate"
		/>
	</div>
</div>

<h3>Responsive scroll in card</h3>
<div style="width: 360px; border: 1px dashed #ccc; border-radius: 8px">
	<Card>
		<Table
			data={mobileData}
			columns={mobileColumns}
			idKey="id"
			dividers="rows"
			density="compact"
			textOverflow="truncate"
		/>
	</Card>
</div>

<h3>Props table pattern</h3>
<div style="display: flex; flex-direction: column; gap: 32px">
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">360px — docsite props table on mobile</p>
		<div style="width: 360px; border: 1px dashed #ccc; border-radius: 8px">
			<Table data={propData} columns={propColumns} density="spacious" dividers="rows" />
		</div>
	</div>
	<div>
		<p style="margin: 0 0 8px; font-weight: 600">Full width — normal desktop experience</p>
		<Table data={propData} columns={propColumns} density="spacious" dividers="rows" />
	</div>
</div>
