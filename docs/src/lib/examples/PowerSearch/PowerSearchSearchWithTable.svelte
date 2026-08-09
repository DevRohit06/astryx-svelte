<!--
	Ported from upstream's `templates/blocks/components/PowerSearch/PowerSearchSearchWithTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Field definitions, book data, columns, widths and the `resultCount` wiring are
	upstream's, unchanged. Three translations:

	- **`usePowerSearchConfig` takes a getter and returns getters**, so its result
	  is held as `search` rather than destructured. Upstream's
	  `const {config, applyFilters} = usePowerSearchConfig(fieldDefs, 'Books')`
	  would snapshot both here and stop tracking — the `useThemeHookUsage` hazard.
	  The second argument (`'Books'`, the config name) is a getter for the same
	  reason.
	- **`renderCell` is a `Snippet<[Book]>`**, so `columns` is a `$derived.by`:
	  a template snippet does not exist yet while the `<script>` runs, and a plain
	  `const` referencing one would hit its temporal dead zone. The
	  `TableRichCellTable` precedent.
	- **`useState` → `$state`**, and `filteredBooks` is a `$derived` so the table
	  and the result count both follow the filters.

	Note `applyFilters(filters, books)` takes the PowerSearch filters directly —
	no `toSearchFilters` — because this block drives the table from PowerSearch
	itself rather than from per-column filter controls.
-->
<script lang="ts">
	import {
		PowerSearch,
		Table,
		VStack,
		pixel,
		proportional,
		usePowerSearchConfig
	} from '@astryx-svelte/core';
	import type { PowerSearchFilter, TableColumn } from '@astryx-svelte/core';

	const genreValues = [
		{ value: 'sci-fi', label: 'Science Fiction' },
		{ value: 'fantasy', label: 'Fantasy' },
		{ value: 'non-fiction', label: 'Non-Fiction' },
		{ value: 'romance', label: 'Romance' },
		{ value: 'mystery', label: 'Mystery' }
	];

	const fieldDefs = [
		{ key: 'title', type: 'string', label: 'Title' },
		{ key: 'author', type: 'string', label: 'Author' },
		{ key: 'year', type: 'number', label: 'Publication Year' },
		{ key: 'genre', type: 'enum', label: 'Genre', enumValues: genreValues }
	] as const;

	interface Book extends Record<string, unknown> {
		id: string;
		title: string;
		author: string;
		year: number;
		genre: string;
	}

	const books: Book[] = [
		{ id: '1', title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'sci-fi' },
		{
			id: '2',
			title: 'Pride and Prejudice',
			author: 'Jane Austen',
			year: 1813,
			genre: 'romance'
		},
		{ id: '3', title: '1984', author: 'George Orwell', year: 1949, genre: 'sci-fi' },
		{
			id: '4',
			title: 'The Hobbit',
			author: 'J.R.R. Tolkien',
			year: 1937,
			genre: 'fantasy'
		},
		{
			id: '5',
			title: 'Sapiens',
			author: 'Yuval Noah Harari',
			year: 2011,
			genre: 'non-fiction'
		}
	];

	const columns = $derived.by<TableColumn<Book>[]>(() => [
		{ key: 'title', header: 'Title', width: proportional(2) },
		{ key: 'author', header: 'Author', width: proportional(2) },
		{ key: 'year', header: 'Year', width: pixel(100) },
		{
			key: 'genre',
			header: 'Genre',
			width: pixel(140),
			renderCell: genreCell
		}
	]);

	let filters = $state<PowerSearchFilter[]>([]);
	const search = usePowerSearchConfig(
		() => fieldDefs,
		() => 'Books'
	);
	const filteredBooks = $derived(search.applyFilters(filters, books));
</script>

{#snippet genreCell(book: Book)}
	{genreValues.find((g) => g.value === book.genre)?.label ?? book.genre}
{/snippet}

<VStack gap={4} width="100%" style="max-width: 500px">
	<PowerSearch
		config={search.config}
		{filters}
		onChange={(newFilters) => (filters = [...newFilters])}
		placeholder="Filter books by title, author, year, genre..."
		resultCount={filteredBooks.length}
	/>
	<Table data={filteredBooks} {columns} idKey="id" hasHover />
</VStack>
