<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import {
		AlertDialog,
		AspectRatio,
		Avatar,
		AvatarGroup,
		AvatarGroupOverflow,
		AvatarStatusDot,
		Badge,
		Banner,
		Blockquote,
		BreadcrumbItem,
		Breadcrumbs,
		Button,
		ButtonGroup,
		Calendar,
		Card,
		Carousel,
		Center,
		CheckboxInput,
		CheckboxList,
		CheckboxListItem,
		Citation,
		ClickableCard,
		Collapsible,
		CollapsibleGroup,
		ContextMenu,
		Code,
		CodeBlock,
		DateInput,
		DateRangeInput,
		DateTimeInput,
		Dialog,
		DialogHeader,
		Divider,
		DropdownMenu,
		DropdownMenuItem,
		EmptyState,
		Field,
		FieldStatus,
		FileInput,
		FormLayout,
		Grid,
		GridSpan,
		HStack,
		Heading,
		HoverCard,
		HoverCardLayer,
		Icon,
		IconButton,
		ImperativeAlertDialogLayer,
		InputGroup,
		InputGroupText,
		InternationalizationProvider,
		Item,
		Kbd,
		List,
		ListItem,
		Layout,
		Lightbox,
		LightboxLayer,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel,
		Link,
		Markdown,
		MetadataList,
		MetadataListItem,
		MoreMenu,
		MultiSelector,
		NavIcon,
		NumberInput,
		Outline,
		Overlay,
		OverlayScrim,
		OverflowList,
		Pagination,
		Popover,
		ProgressBar,
		RadioList,
		RadioListItem,
		ResizeHandle,
		Section,
		SegmentedControl,
		SegmentedControlItem,
		SelectableCard,
		Selector,
		SelectorOption,
		Skeleton,
		Slider,
		Spinner,
		Stack,
		StackItem,
		StatusDot,
		Switch,
		Tab,
		TabList,
		TabMenu,
		Text,
		TextArea,
		TextInput,
		Theme,
		Thumbnail,
		TimeInput,
		Timestamp,
		Toast,
		ToggleButton,
		ToggleButtonGroup,
		Token,
		Tokenizer,
		Toolbar,
		Tooltip,
		TooltipLayer,
		TreeList,
		Typeahead,
		NavHeadingMenu,
		NavHeadingMenuItem,
		VStack,
		useHoverCard,
		useImperativeAlertDialog,
		useOutlineFromDOM,
		useOutlineFromMarkdown,
		useOverlay,
		useLightbox,
		useResizable,
		useToast,
		useTooltip
	} from '$lib/index.js';
	// `dracula` is one of the 12 community presets upstream publishes from
	// `theme/syntax`; the CodeBlock section uses it for the `syntaxTheme` block.
	import { dracula } from '$lib/theme/syntax/index.js';
	import { defineTheme } from '$lib/theme/define-theme.js';
	// The built neutral theme object, alongside the stylesheet `+layout.svelte`
	// imports. Relative rather than by package name for the same reason the CSS
	// is: the theme package depends on core, not the other way round. See that
	// file for why this pair keeps the workbench out of core's `build` script.
	//
	// Reading the theme's *source* instead would not help: `neutral-theme.ts`
	// imports `@astryx-svelte/core/theme/define`, which resolves to core's own
	// `dist/` — the thing core's build is in the middle of producing.
	import { neutralTheme } from '../../../themes/neutral/dist/index.js';
	import ChatDemos from './chat-demos.svelte';
	import CommandPaletteDemos from './command-palette-demos.svelte';
	import ComplexSelectorDemos from './complex-selector-demos.svelte';
	import MarkdownDemos from './markdown-demos.svelte';
	import TableDemos from './table-demos.svelte';
	import TableSelectionDemos from './table-selection-demos.svelte';
	import TableSortableDemos from './table-sortable-demos.svelte';
	import TablePaginationDemos from './table-pagination-demos.svelte';
	import TableColumnSettingsDemos from './table-column-settings-demos.svelte';
	import TableColumnResizeDemos from './table-column-resize-demos.svelte';
	import TableStickyColumnsDemos from './table-sticky-columns-demos.svelte';
	import TableGroupedRowsDemos from './table-grouped-rows-demos.svelte';
	import TableRowIndexDemos from './table-row-index-demos.svelte';
	import TableRowStatusDemos from './table-row-status-demos.svelte';
	import TableRowExpansionDemos from './table-row-expansion-demos.svelte';
	import TableTreeDemos from './table-tree-demos.svelte';
	import TableFilteringDemos from './table-filtering-demos.svelte';
	import PowerSearchDemos from './power-search-demos.svelte';
	import NavAppShellDemos from './nav-app-shell-demos.svelte';
	import NavMobileNavDemos from './nav-mobile-nav-demos.svelte';
	import NavSideNavDemos from './nav-side-nav-demos.svelte';
	import NavTopNavDemos from './nav-top-nav-demos.svelte';
	import HintToolbar from './hint-toolbar.svelte';
	import SquiggleIcon from './squiggle-icon.svelte';
	import ThemeBarChart from './theme-bar-chart.svelte';
	import ThemeGroupedChart from './theme-grouped-chart.svelte';
	import ThemeTokenInspector from './theme-token-inspector.svelte';
	import { GOLDEN_SUNSET, MISTY_VALLEY, NIGHT_FOREST, SNOWY_PEAKS } from './thumbnail-images.js';
	import I18nSample from './i18n-sample.svelte';
	import type {
		AvatarSize,
		BadgeVariant,
		CarouselHandle,
		DateRange,
		DateRangePreset,
		HeadingLevel,
		ISODateString,
		ISODateTimeString,
		ISOTimeString,
		IconColor,
		IconName,
		IconSize,
		Locale,
		MessagesByLocale,
		Overrides,
		SearchableItem,
		SearchSource,
		MultiSelectorOptionData,
		MultiSelectorOptionType,
		SelectorOptionData,
		SelectorOptionType,
		OutlineItem,
		TabListSize,
		TokenColor,
		TreeListItemData
	} from '$lib/index.js';

	// Lightbox — the four scenes stand in for upstream's CDN photos, for the
	// reason `thumbnail-images.ts` documents. `LightboxVideo` has no counterpart
	// here: it needs a video asset this repo doesn't ship (see TODO.md).
	const LIGHTBOX_PHOTOS = [
		{ src: NIGHT_FOREST, alt: 'Night forest', caption: 'A dense forest under a night sky.' },
		{ src: MISTY_VALLEY, alt: 'Misty valley', caption: 'A valley under low morning mist.' },
		{ src: GOLDEN_SUNSET, alt: 'Golden sunset', caption: 'A shoreline at golden hour.' },
		{ src: SNOWY_PEAKS, alt: 'Snowy peaks', caption: 'Snow-covered peaks above the treeline.' }
	];
	const lightboxGallery = useLightbox(() => ({ media: LIGHTBOX_PHOTOS }));

	// `Carousel`'s ImperativeControl story. Upstream holds a `CarouselHandle` in a
	// ref and passes it as `handleRef`; this port publishes the five methods as
	// instance exports, so the handle *is* the component instance and `bind:this`
	// is the seam — the `Tokenizer` / `Calendar` / `PowerSearch` arrangement.
	let imperativeCarousel = $state<CarouselHandle | null>(null);

	// Outline — upstream's `outlineItems`, verbatim. The ids match the headings the
	// "With document" block renders, so the uncontrolled scroll-spy has real
	// targets to resolve against.
	const outlineItems: OutlineItem[] = [
		{ id: 'overview', label: 'Overview', level: 2 },
		{ id: 'installation', label: 'Installation', level: 2 },
		{ id: 'theming', label: 'Theming', level: 2 },
		{ id: 'tokens', label: 'Tokens', level: 3 },
		{ id: 'component-overrides', label: 'Component overrides', level: 3 },
		{ id: 'accessibility', label: 'Accessibility', level: 2 }
	];

	const outlineDeepItems: OutlineItem[] = [
		{ id: 'chapter-1', label: 'Chapter 1', level: 1 },
		{ id: 'section-1-1', label: 'Section 1.1', level: 2 },
		{ id: 'subsection-1-1-1', label: 'Subsection 1.1.1', level: 3 },
		{ id: 'subsection-1-1-2', label: 'Subsection 1.1.2', level: 3 },
		{ id: 'section-1-2', label: 'Section 1.2', level: 2 },
		{ id: 'chapter-2', label: 'Chapter 2', level: 1 },
		{ id: 'section-2-1', label: 'Section 2.1', level: 2 }
	];

	// `ExtractFromHTML`. Upstream passes a `RefObject`; the hook takes a getter
	// here, so `bind:this` landing after this call still reaches the observer.
	let outlineArticleEl = $state<HTMLElement | null>(null);
	const outlineFromDom = useOutlineFromDOM(() => outlineArticleEl);

	/** Height of the `ScrollSpy` story's sticky header — fed straight to `offset`. */
	const STICKY_HEADER_HEIGHT = 48;

	// `ScrollSpy`. The pane scrolls, not the viewport, so auto-detection would
	// pick the wrong root; `scrollContainerRef` scopes tracking to it. Upstream
	// passes a `RefObject`; the prop is a getter here.
	let outlinePaneEl = $state<HTMLElement | null>(null);

	// `NavigateCallbacks`. `onNavigateEnd` fires exactly once per
	// `onNavigateStart`, including when the user scrolls away mid-jump, so
	// neither of these can get stuck.
	let outlineNavigateStatus = $state('idle');
	let outlineFlashId = $state<string | null>(null);

	// `ExtractFromMarkdown`, landed with batch 11's markdown parser.
	const outlineMarkdown = [
		'## Overview',
		'',
		'Astryx gives teams a consistent foundation for internal product surfaces.',
		'',
		'## Installation',
		'',
		'Install the package and wrap the app in an Theme provider.',
		'',
		'### Package setup',
		'',
		'Import components from their component subpaths for clear ownership.',
		'',
		'### Theme setup',
		'',
		'Use a built theme in production so component overrides are present at first paint.',
		'',
		'## Accessibility',
		'',
		'Components include semantic roles, labels, and focus behavior where applicable.'
	].join('\n');
	const outlineFromMarkdown = useOutlineFromMarkdown(() => outlineMarkdown);

	/**
	 * Upstream's story overrides `components.heading` and derives each id from
	 * the heading's own text (`storySlug(nodeText(children))`). A snippet's text
	 * cannot be read, so the ids come from `useOutlineFromMarkdown` instead —
	 * which computes them with the same slugifier, in the same document order —
	 * and an attachment stamps them onto the rendered headings. That is
	 * upstream's *docsite* pattern (`PackageStubPage`), not an invention.
	 */
	let markdownOutlineEl = $state<HTMLElement | null>(null);
	$effect(() => {
		const root = markdownOutlineEl;
		if (root == null) return;
		const headings = root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');
		headings.forEach((heading, i) => {
			const item = outlineFromMarkdown.items[i];
			if (item != null) heading.id = item.id;
		});
	});

	let deleteAlertOpen = $state(false);
	let noticeAlertOpen = $state(false);
	let revokeAlertOpen = $state(false);
	let revokeAlertLoading = $state(false);

	// Upstream's `Imperative` story: no open state at all — `show()` carries the
	// whole prop bag, and `<ImperativeAlertDialogLayer>` is the rendering half the
	// hook's `element: ReactNode` return becomes here.
	const imperativeAlert = useImperativeAlertDialog();

	let lightboxShowcaseOpen = $state(false);
	let lightboxZoomOpen = $state(false);

	// Toast — `useToast()` reads context at init, so it is called here. No
	// `<ToastViewport>` wraps this page, which is upstream's demo-block situation
	// too: the hook self-mounts its fallback viewport on first use (and warns
	// once, by design).
	const showToast = useToast();

	// `ToastDismiss` keeps the returned dismiss fn in a ref; a plain `let` is its
	// counterpart, since nothing renders from it.
	let dismissLastToast: (() => void) | null = null;

	// `ToastStacking` cycles this list on each click via a `countRef`.
	const TOAST_MESSAGES = [
		{ body: 'Changes saved.', type: 'info' as const },
		{ body: 'Failed to upload file.', type: 'error' as const },
		{ body: 'Message sent to Sarah Chen.', type: 'info' as const }
	];
	let toastStackingCount = 0;

	// Fixed so the page is stable to look at; `isLive` below shows the moving case.
	const sampleTimestamp = '2026-02-19T17:00:00Z';

	// Upstream's `Sizes` story walks the named scale in order; a numeric size is a
	// separate example rather than one interleaved into the ramp, where it reads
	// as another named step.
	const avatarSizes: AvatarSize[] = ['xsm', 'sm', 'md', 'lg', 'xl'];

	const AVATAR_INITIALS = [
		{ name: 'John Doe', note: 'First + last' },
		{ name: 'Alice', note: 'Single name' },
		{ name: 'Bob Smith Johnson', note: 'Multi-word' },
		{ name: 'Dr. Sarah Connor', note: 'Prefixed' }
	];

	const ICON_BUTTON_ACTIONS = [
		{ icon: 'search', label: 'Search' },
		{ icon: 'copy', label: 'Copy' },
		{ icon: 'info', label: 'Info' },
		{ icon: 'menu', label: 'Menu' },
		{ icon: 'close', label: 'Close' }
	] as const;

	const ICON_BUTTON_TOOLTIPS = [
		{ icon: 'search', label: 'Search', tooltip: 'Search items' },
		{ icon: 'copy', label: 'Copy link', tooltip: 'Copy to clipboard' },
		{ icon: 'moreHorizontal', label: 'More options', tooltip: 'More options' }
	] as const;

	const GRID_TEAMS = [
		{ name: 'Design Systems', members: 8 },
		{ name: 'Frontend Platform', members: 12 },
		{ name: 'Developer Experience', members: 6 },
		{ name: 'Accessibility', members: 4 },
		{ name: 'Performance', members: 7 },
		{ name: 'Mobile Infrastructure', members: 9 }
	];

	const THEME_SWATCHES = [
		{ title: 'Status', tokens: ['accent', 'error', 'success', 'warning'] },
		{
			title: 'Status (muted)',
			tokens: ['accent-muted', 'error-muted', 'success-muted', 'warning-muted']
		},
		{
			title: 'Surfaces',
			tokens: ['background-body', 'background-surface', 'background-card', 'background-popover']
		},
		{ title: 'Borders', tokens: ['border', 'border-emphasized'] }
	];

	/**
	 * Seconds back from `now` for the relative-format ladder — the seven offsets
	 * upstream's `RelativeFormat` and `RelativeShortFormat` stories both walk.
	 */
	const RELATIVE_OFFSETS = [5, 120, 3600, 86_400, 259_200, 90 * 86_400, 730 * 86_400];

	// Captured once at init so every relative row measures from the same instant
	// and the page does not re-render them on unrelated state changes.
	const now = Date.now();

	// The disconnected-hover story: `useOverlay` drives an overlay from a
	// container the overlay does not wrap - hovering the whole card reveals it.
	const featuredOverlay = useOverlay(() => ({
		showOn: 'hover',
		position: 'bottom',
		align: 'start'
	}));

	// `Card` exposes no element seam, so the hook's container attachment travels
	// through its rest props - the same route `SelectableCard` documents.
	const featuredCardProps = { [createAttachmentKey()]: featuredOverlay.attachContainer };

	const iconNames: IconName[] = [
		'close',
		'chevronDown',
		'chevronLeft',
		'chevronRight',
		'check',
		'success',
		'error',
		'warning',
		'info',
		'calendar',
		'clock',
		'externalLink',
		'menu',
		'moreHorizontal',
		'search',
		'arrowUp',
		'arrowDown',
		'arrowsUpDown',
		'funnel',
		'eyeSlash',
		'viewColumns',
		'copy',
		'checkDouble',
		'wrench',
		'stop',
		'microphone'
	];
	const iconSizes: IconSize[] = ['xsm', 'sm', 'md', 'lg'];
	const iconSemanticColors: IconColor[] = [
		'primary',
		'secondary',
		'tertiary',
		'disabled',
		'accent',
		'success',
		'error',
		'warning',
		'inherit'
	];
	const iconNonSemanticColors: IconColor[] = [
		'blue',
		'red',
		'green',
		'gray',
		'cyan',
		'teal',
		'yellow',
		'orange',
		'pink',
		'purple'
	];

	// Upstream's roster, verbatim from `AvatarGroupShowcase.tsx`. The names are
	// not decoration: an invented list is exactly the hand-drawn demo content the
	// parity rule calls a defect.
	const teamMembers = ['Alex Daniels', 'Ann Smith', 'Carol Davis', 'Gina Wilson', 'Eve Park'];

	const badgeVariants: BadgeVariant[] = [
		'neutral',
		'info',
		'success',
		'warning',
		'error',
		'blue',
		'cyan',
		'green',
		'orange',
		'pink',
		'purple',
		'red',
		'teal',
		'yellow'
	];

	let tglActive = $state(false);
	let tglFavorite = $state(false);
	let tglView = $state<string | null>('list');
	let tglFormats = $state<string[]>([]);

	let segViewMode = $state('grid');
	let segIconMode = $state('grid');
	let segPeriod = $state('week');
	let segGranularity = $state('daily');
	let segFilter = $state('all');

	// TabList — one `value` per storybook story.
	let tabDefault = $state('home');
	let tabWithMenu = $state('home');
	let tabMenuChild = $state('analytics');
	let tabSizes = $state('home');
	let tabIcons = $state('home');
	let tabIconOnly = $state('desktop');
	let tabActions = $state('all');
	let tabDividerGap = $state('overview');
	let tabFill = $state('home');
	let tabOverflow = $state('overview');
	let tabOverflowDivider = $state('dashboard');
	const tabSizeRamp: TabListSize[] = ['sm', 'md', 'lg'];
	const overflowTabs = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'activity', label: 'Activity' },
		{ value: 'members', label: 'Members' },
		{ value: 'settings', label: 'Settings' },
		{ value: 'integrations', label: 'Integrations' },
		{ value: 'billing', label: 'Billing & Plans' },
		{ value: 'security', label: 'Security' },
		{ value: 'notifications', label: 'Notifications' },
		{ value: 'api', label: 'API Keys' }
	];
	const overflowDividerTabs = [
		{ value: 'dashboard', label: 'Dashboard' },
		{ value: 'analytics', label: 'Analytics' },
		{ value: 'reports', label: 'Reports' },
		{ value: 'customers', label: 'Customers' },
		{ value: 'products', label: 'Products' },
		{ value: 'orders', label: 'Orders' }
	];

	// TreeList — upstream's `fileTreeItems`, reused by four of its stories.
	const noop = (): void => {};
	const fileTreeItems: TreeListItemData[] = [
		{
			id: 'src',
			label: 'src',
			isExpanded: true,
			children: [
				{
					id: 'components',
					label: 'components',
					children: [
						{ id: 'button', label: 'Button.svelte', onClick: noop },
						{ id: 'card', label: 'Card.svelte', onClick: noop },
						{ id: 'list', label: 'List.svelte', onClick: noop }
					]
				},
				{ id: 'app', label: 'App.svelte', onClick: noop },
				{ id: 'index', label: 'index.ts', onClick: noop }
			]
		},
		{
			id: 'public',
			label: 'public',
			children: [
				{ id: 'favicon', label: 'favicon.ico', onClick: noop },
				{ id: 'index-html', label: 'index.html', onClick: noop }
			]
		},
		{ id: 'pkg', label: 'package.json', onClick: noop },
		{ id: 'readme', label: 'README.md', onClick: noop }
	];
	const treeDisabledItems: TreeListItemData[] = [
		{
			id: 'active',
			label: 'Active Section',
			isExpanded: true,
			children: [
				{ id: 'item1', label: 'Available Item', onClick: noop },
				{ id: 'item2', label: 'Disabled Item', onClick: noop, isDisabled: true }
			]
		},
		{ id: 'disabled-parent', label: 'Disabled Parent', onClick: noop, isDisabled: true }
	];
	const treeSelectedItems: TreeListItemData[] = [
		{
			id: 'nav',
			label: 'Navigation',
			isExpanded: true,
			children: [
				{ id: 'home', label: 'Home', onClick: noop },
				{ id: 'about', label: 'About', onClick: noop, isSelected: true },
				{ id: 'contact', label: 'Contact', onClick: noop }
			]
		}
	];

	let selectedPlan = $state('basic');
	const selectablePlans = [
		{ id: 'basic', name: 'Basic', price: '$9/mo' },
		{ id: 'pro', name: 'Pro', price: '$29/mo' },
		{ id: 'enterprise', name: 'Enterprise', price: '$99/mo' }
	];

	const tokenColors: TokenColor[] = [
		'default',
		'red',
		'orange',
		'yellow',
		'green',
		'teal',
		'cyan',
		'blue',
		'purple',
		'pink',
		'gray'
	];

	const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const;
	const sizes = ['sm', 'md', 'lg'] as const;
	const textTypes = [
		'display-1',
		'display-2',
		'display-3',
		'large',
		'body',
		'label',
		'supporting',
		'code'
	] as const;
	const levels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

	// Upstream's `LONG_TEXT` from `TextTruncation.tsx`, verbatim. The previous
	// string was prose *about* the truncation mechanism, which made the sample
	// data part of the explanation rather than a neutral specimen.
	const clampSample =
		'The design system provides a consistent set of typography tokens, spacing scales, and color palettes that ensure every surface in the product feels cohesive regardless of which team built it.';

	// i18n. Upstream ships no showcase block or story for
	// `InternationalizationProvider` — only a props table and a prose usage note —
	// so this whole section is necessarily hand-assembled, which is worth stating
	// plainly rather than implying otherwise.
	//
	// What *is* upstream: the pagination catalogs and the `fr` override are lifted
	// verbatim from its own `resolve` and `e2e-pagination` tests. What is not: the
	// `pt` string for `avatarGroup.label`, which upstream has no translation for.
	// That key is here because it is the port's only live `t()` call site — but it
	// lands in an `aria-label`, so a locale switch moves nothing visible there.
	// The visible movement is the pagination table above it.
	const demoLocales: Locale[] = ['en', 'pt', 'pt-BR', 'fr'];
	let locale = $state<Locale>('en');

	const demoMessages: MessagesByLocale = {
		pt: {
			'@astryx.pagination.next': { defaultMessage: 'Próxima' },
			'@astryx.pagination.previous': { defaultMessage: 'Anterior' },
			'@astryx.avatarGroup.label': { defaultMessage: 'Avatares' }
		},
		'pt-BR': {
			'@astryx.pagination.next': { defaultMessage: 'Próxima (BR)' }
		}
	};

	const demoOverrides: Overrides = {
		fr: { '@astryx.pagination.next': 'Suivant' }
	};

	// One resizable region driving both the panel's width and the handle beside it.
	const sidebar = useResizable(() => ({
		defaultSize: 200,
		minSizePx: 140,
		maxSizePx: 320,
		collapsible: true
	}));

	let isUploading = $state(false);

	let scheme = $state<'light' | 'dark'>('light');
	let themed = $state(true);

	/**
	 * The workbench's text direction — upstream's Storybook "Direction" global,
	 * added in 0.2.0 alongside the RTL work.
	 *
	 * It has to be applied in **two** places, which is the whole point of the
	 * control: `InternationalizationProvider dir` drives the JavaScript half
	 * (`useDirection`, pointer math, arrow keys), and the `dir` attribute on a
	 * real element drives the CSS half, since logical properties resolve against
	 * the DOM's direction and know nothing about a Svelte context. Setting only
	 * one produces a half-flipped page that looks like a component bug.
	 */
	let direction = $state<'ltr' | 'rtl'>('ltr');

	/**
	 * The "Theme: none" branch of the toggle. A `<Theme>` is always mounted — it
	 * is what sets `color-scheme` and syncs `<html>` — so switching the theme
	 * *off* means switching to one that declares nothing: its `@scope` name
	 * matches no stylesheet, and every token falls back to the defaults in
	 * `tokens.stylex.ts`, which is exactly what the toggle is for.
	 *
	 * `__built` because there is no CSS to inject: the flag's meaning is "this
	 * theme's stylesheet does not come from runtime injection", and an empty
	 * theme's trivially does not.
	 */
	const noTheme = { ...defineTheme({ name: 'none' }), __built: true } as const;

	/**
	 * Upstream's `oceanTheme` from `Theme.stories.tsx`, verbatim — the second
	 * theme its comparison and inspector stories put beside the neutral one.
	 */
	const oceanTheme = defineTheme({
		name: 'ocean',
		tokens: {
			'--color-accent': ['#0077B6', '#48CAE4'],
			'--color-success': ['#2D6A4F', '#52B788'],
			'--color-warning': ['#E76F51', '#F4A261'],
			'--color-background-surface': ['#F0F8FF', '#0A1628'],
			'--color-text-primary': ['#023E8A', '#CAF0F8'],
			'--color-text-secondary': ['#4A7FB5', '#89C2D9'],
			'--color-border': ['#ADE8F433', '#02394A66']
		},
		typography: { scale: { base: 14, ratio: 1.2 } }
	});

	/** Upstream's `CHART_DATA` and `MULTI_SERIES`, verbatim. */
	const CHART_DATA = [
		{ label: 'Mon', value: 42 },
		{ label: 'Tue', value: 78 },
		{ label: 'Wed', value: 56 },
		{ label: 'Thu', value: 91 },
		{ label: 'Fri', value: 64 },
		{ label: 'Sat', value: 35 },
		{ label: 'Sun', value: 48 }
	];

	const MULTI_SERIES = [
		{ label: 'Q1', series: [120, 90, 70] },
		{ label: 'Q2', series: [140, 110, 85] },
		{ label: 'Q3', series: [100, 130, 95] },
		{ label: 'Q4', series: [160, 105, 120] }
	];

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	// Upstream's `TooltipHookUsage` block, which drives a tooltip without the
	// wrapper component. `id` is passed in because `$props.id()` is only callable
	// at the top level of a component — see `useLayer` for why that matters.
	// `$props.id()` is callable only once per component, so a page driving two
	// layer hooks suffixes the one id rather than minting two. Both halves stay
	// SSR-stable, which is the property the hooks actually need.
	const uid = $props.id();
	const hookTooltip = useTooltip(() => ({
		id: `${uid}-tooltip`,
		placement: 'above',
		delay: 100
	}));

	// Upstream's `HoverCardHookUsage` block, the same shape one component up.
	const hookHoverCard = useHoverCard(() => ({
		id: `${uid}-hovercard`,
		placement: 'below',
		delay: 100,
		isDefaultOpen: true
	}));

	// Popover demo state — upstream's storybook stories each hold their own
	// `useState`; `$state` is the Svelte spelling. `popoverAnchor` captures the
	// sibling-mode trigger's DOM element (upstream's `buttonRef`), populated by an
	// attachment through `Button`'s rest props.
	let popoverSettings = $state({ notifications: true, darkMode: false, sounds: true });
	let confirmOpen = $state(false);
	let dialogOpen = $state(false);
	let ddControlledOpen = $state(false);
	let popoverAnchor = $state<HTMLElement | null>(null);

	// Upstream's `ThumbnailRemovable` and `ThumbnailGallery` lists. Two copies so
	// removing from one block doesn't empty the other.
	const attachments = [
		{
			id: 1,
			src: NIGHT_FOREST,
			alt: 'Forest at night under a crescent moon',
			label: 'forest-night.jpg'
		},
		{ id: 2, src: MISTY_VALLEY, alt: 'Misty mountain valley', label: 'misty-valley.jpg' },
		{ id: 3, src: GOLDEN_SUNSET, alt: 'Golden sunset over mountains', label: 'golden-sunset.jpg' },
		{ id: 4, src: SNOWY_PEAKS, alt: 'Snowy mountain peaks', label: 'snowy-peaks.jpg' }
	];

	let removable = $state([...attachments]);
	let gallery = $state([...attachments]);
	let selected = $state<string | null>(null);

	// `TextArea` is controlled — upstream's stories each hold their own `useState`,
	// and `bind:value` is the Svelte spelling of that same wrapper.
	let taDescription = $state('');
	let taBio = $state('');
	let taMessage = $state('');
	let taNotes = $state('');
	let taError = $state('Too short');
	let taWarning = $state('This content may contain issues');
	let taSuccess = $state('This is a valid description that meets all requirements.');
	let taCounted = $state('');
	let taDocumented = $state('');

	// `CheckboxInput` is controlled, with no uncontrolled fallback — each of
	// upstream's stories holds a `useState`, and `value` + `onChange` is that.
	// `value` is `boolean | 'indeterminate'`, hence the third state below.
	let cbDefault = $state(false);
	let cbChecked = $state(true);
	let cbDescribed = $state(false);
	let cbHiddenLabel = $state(false);
	let cbIndeterminate = $state<boolean | 'indeterminate'>('indeterminate');
	let cbSmall = $state(true);
	let cbSizeSm = $state(true);
	let cbSizeMd = $state(true);
	let cbLabelIcon = $state(false);
	let cbError = $state(false);
	let cbWarning = $state(true);
	let cbSuccess = $state(true);

	// `CheckboxList` collection mode: the group owns the value array.
	let clNotifications = $state<string[]>(['email']);
	let clDescribed = $state<string[]>(['weekly']);
	let clDividers = $state<string[]>(['push']);
	let clError = $state<string[]>([]);
	let clEndContent = $state<string[]>(['unread']);
	let clAsync = $state<string[]>(['email']);

	// Standalone mode: no `value` on the group, so each item owns its own state.
	// This is what the select-all pattern is built on — the header item is
	// `'indeterminate'` whenever the children disagree.
	let clSelectAll = $state<string[]>(['a']);
	const clSelectAllOptions = ['a', 'b', 'c'];
	const clSelectAllState = $derived<boolean | 'indeterminate'>(
		clSelectAll.length === clSelectAllOptions.length
			? true
			: clSelectAll.length === 0
				? false
				: 'indeterminate'
	);

	// `CodeBlock` fixtures, verbatim from upstream's storybook stories.
	const cbTsExample = `import {useState, useEffect} from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  return response.json();
}

export function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(id).then(setUser);
  }, [id]);

  return user;
}`;

	const cbJson = `{
  "name": "@astryxdesign/core",
  "version": "0.0.5",
  "dependencies": {
    "@stylexjs/stylex": "^0.17.5",
    "react": "^19.0.0"
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest"
  }
}`;

	const cbPython = `#!/usr/bin/env python3
"""Data processing pipeline."""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Config:
    input_path: str
    output_path: str
    batch_size: int = 100

def process(config: Config) -> None:
    """Process data according to config."""
    print(f"Processing {config.input_path}")
    # TODO: implement pipeline
    pass

if __name__ == "__main__":
    cfg = Config("input.csv", "output.csv")
    process(cfg)`;

	// The closing script tag is interpolated rather than written literally: Svelte's
	// parser scans for `</script` to end this block and would terminate it early.
	const cbHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello World</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main id="app">
      <h1>Hello, World!</h1>
      <p class="subtitle">Welcome to Astryx.</p>
    </main>
    <script src="app.js"></${'script'}>
  </body>
</html>`;

	const cbCss = `:root {
  --color-primary: #0064E0;
  --radius: 8px;
}

.button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: var(--radius);
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
  transition: opacity 0.15s ease;
}

.button:hover {
  opacity: 0.9;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #2694FE;
  }
}`;

	const cbBash = `#!/bin/bash
# Deploy script for production

set -euo pipefail

DEPLOY_DIR="/opt/app"
VERSION=$(git describe --tags --always)

echo "Deploying version $VERSION..."

if [ ! -d "$DEPLOY_DIR" ]; then
  mkdir -p "$DEPLOY_DIR"
fi

pnpm build
cp -r dist/* "$DEPLOY_DIR/"

echo "Deploy complete: $VERSION"`;

	const cbWrapped = `// This is a very long line that demonstrates the word wrapping behavior of the code block component when isWrapped is set to true, which causes long lines to wrap instead of scrolling horizontally
const result = someVeryLongFunctionName(parameterOne, parameterTwo, parameterThree, parameterFour, parameterFive);`;

	const cbManyLines = Array.from({ length: 50 }, (_, i) => `const line${i + 1} = ${i + 1};`).join(
		'\n'
	);

	const cbNoHeader = `const greeting = "Hello, world!";
console.log(greeting);`;

	const cbPlaintext = `This is plain text without any syntax highlighting.
It preserves whitespace and line breaks.

  Indentation is maintained.
    Nested indentation too.`;

	// `NumberInput` is strictly controlled — it never writes `value` back — so
	// every block holds its own state, as each upstream story's `useState` does.
	let niQuantity = $state<number | null>(null);
	let niAge = $state<number | null>(null);
	let niRating = $state<number | null>(null);
	let niPrice = $state<number | null>(null);
	let niDiscount = $state<number | null>(50);
	let niStorage = $state<number | null>(128);
	let niCount = $state<number | null>(null);
	let niWithValue = $state<number | null>(42);
	let niExtension = $state<number | null>(null);
	let niRequired = $state<number | null>(null);
	let niStartIcon = $state<number | null>(null);
	let niSm = $state<number | null>(null);
	let niMd = $state<number | null>(null);
	let niLg = $state<number | null>(null);
	let niError = $state<number | null>(-5);
	let niWarning = $state<number | null>(150);
	let niSuccess = $state<number | null>(25);
	let niErrorNoMsg = $state<number | null>(0);
	let niRateLimit = $state<number | null>(null);
	let niDecimal = $state<number | null>(null);
	let niClearable = $state<number | null>(42);
	let niClearableUnits = $state<number | null>(75);

	// `Selector` — every upstream story holds its own `useState`, so each block
	// here holds its own `$state`. The clearable ones are `string | null`, which
	// is what the `hasClear` arm of the props union widens `value` to.
	const SELECTOR_FRUITS = ['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple'];
	const SELECTOR_OBJECT_FRUITS: SelectorOptionData[] = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'orange', label: 'Orange', disabled: true },
		{ value: 'mango', label: 'Mango' }
	];
	// Upstream passes Heroicons' `UserIcon`/`CogIcon`/`BellIcon`; the registry has
	// no counterpart for any of the three, so this substitutes built-ins — the
	// substitution the `Switch`/`CheckboxInput`/`NumberInput` icons already make.
	// Retires with the icon registry (see TODO.md).
	const SELECTOR_ICON_OPTIONS: SelectorOptionData[] = [
		{ value: 'profile', label: 'Profile', icon: 'info' },
		{ value: 'settings', label: 'Settings', icon: 'menu' },
		{ value: 'notifications', label: 'Notifications', icon: 'warning' }
	];
	const SELECTOR_SECTIONED: SelectorOptionType[] = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{
			type: 'section',
			title: 'Citrus',
			options: [
				{ value: 'orange', label: 'Orange' },
				{ value: 'lemon', label: 'Lemon' },
				{ value: 'lime', label: 'Lime' }
			]
		},
		{
			type: 'section',
			title: 'Tropical',
			options: [
				{ value: 'mango', label: 'Mango' },
				{ value: 'pineapple', label: 'Pineapple' }
			]
		}
	];
	const SELECTOR_USERS: SelectorOptionData[] = [
		{ value: 'user1', label: 'Alice Johnson' },
		{ value: 'user2', label: 'Bob Smith' },
		{ value: 'user3', label: 'Carol White' }
	];
	const SELECTOR_USER_EMAILS: Record<string, string> = {
		user1: 'alice@example.com',
		user2: 'bob@example.com',
		user3: 'carol@example.com'
	};
	let selDefault = $state<string | undefined>(undefined);
	let selHiddenLabel = $state<string | undefined>(undefined);
	let selDescription = $state<string | undefined>(undefined);
	let selObjects = $state<string | undefined>(undefined);
	let selIcons = $state<string | undefined>(undefined);
	let selSections = $state<string | undefined>(undefined);
	let selCustomRender = $state<string | undefined>(undefined);
	let selSm = $state<string | undefined>(undefined);
	let selMd = $state<string | undefined>(undefined);
	let selLg = $state<string | undefined>(undefined);
	let selError = $state<string | undefined>(undefined);
	let selWarning = $state<string | undefined>('banana');
	let selSuccess = $state<string | undefined>('apple');
	let selOptional = $state<string | undefined>(undefined);
	let selRequired = $state<string | undefined>(undefined);
	let selPreSelected = $state<string | undefined>('Banana');
	let selClearable = $state<string | null>('Banana');
	let selClearableStatus = $state<string | null>('Banana');
	let selPlacementAbove = $state<string | undefined>('Banana');
	let selSearch = $state<string | undefined>(undefined);
	// GhostVariant — the toolbar trigger style added at 0.3.0. Both selectors sit
	// on one strip between two ghost Buttons, which is the composition the variant
	// exists for.
	let selGhostView = $state<string | undefined>('week');
	let selGhostDensity = $state<string | undefined>('comfortable');

	// `MultiSelector` — every upstream story holds its own `useState<string[]>`,
	// so each block here holds its own `$state`.
	const MS_COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Created'];
	const MS_PERMISSIONS: MultiSelectorOptionType[] = [
		{
			type: 'section',
			title: 'Read',
			options: [
				{ value: 'read_posts', label: 'Read posts' },
				{ value: 'read_comments', label: 'Read comments' },
				{ value: 'read_users', label: 'Read users' }
			]
		},
		{
			type: 'section',
			title: 'Write',
			options: [
				{ value: 'write_posts', label: 'Write posts' },
				{ value: 'write_comments', label: 'Write comments' }
			]
		}
	];
	const MS_SELECT_ALL_COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Created', 'Updated'];
	const MS_COUNTRIES = [
		'United States',
		'United Kingdom',
		'Canada',
		'Australia',
		'Germany',
		'France',
		'Japan',
		'Brazil',
		'India',
		'Mexico'
	];
	const MS_ROLES: MultiSelectorOptionData[] = [
		{ value: 'admin', label: 'Admin', disabled: true },
		{ value: 'editor', label: 'Editor' },
		{ value: 'viewer', label: 'Viewer' },
		{ value: 'guest', label: 'Guest' }
	];
	const MS_FORM_COLUMNS: MultiSelectorOptionData[] = [
		{ value: 'name', label: 'Name' },
		{ value: 'email', label: 'Email' },
		{ value: 'role', label: 'Role' },
		{ value: 'status', label: 'Status' },
		{ value: 'created', label: 'Created at' }
	];
	const MS_ALL_COLUMNS: MultiSelectorOptionData[] = [
		{ value: 'name', label: 'Name' },
		{ value: 'email', label: 'Email' },
		{ value: 'role', label: 'Role' },
		{ value: 'status', label: 'Status' },
		{ value: 'created', label: 'Created' },
		{ value: 'updated', label: 'Updated' },
		{ value: 'actions', label: 'Actions' }
	];
	const MS_TECHNOLOGIES: MultiSelectorOptionData[] = [
		{ value: 'react', label: 'React' },
		{ value: 'typescript', label: 'TypeScript' },
		{ value: 'stylex', label: 'StyleX' },
		{ value: 'vitest', label: 'Vitest' }
	];
	let msDefault = $state<string[]>(['Role', 'Created']);
	let msSections = $state<string[]>([]);
	let msSelectAll = $state<string[]>([]);
	let msSearchable = $state<string[]>([]);
	let msTriggerCount = $state<string[]>(['Name', 'Email']);
	let msTriggerLabels = $state<string[]>(['Name', 'Email', 'Role']);
	let msTriggerBadges = $state<string[]>(['Name', 'Email', 'Role', 'Status', 'Created']);
	let msDisabledItems = $state<string[]>(['admin']);
	let msDisabledMessage = $state<string[]>([]);
	let msError = $state<string[]>([]);
	let msWarning = $state<string[]>(['Email']);
	let msSuccess = $state<string[]>(['Name', 'Email']);
	let msSm = $state<string[]>([]);
	let msMd = $state<string[]>([]);
	let msLg = $state<string[]>([]);
	let msFormColumns = $state<string[]>(['name', 'email']);
	let msFormFilters = $state<string[]>([]);
	let msColumnVisibility = $state<string[]>(['name', 'email', 'role', 'status']);
	let msClearable = $state<string[]>(['react', 'typescript']);
	// GhostVariant — the same toolbar strip as `Selector`'s.
	let msGhostColumns = $state<string[]>(['Name', 'Email']);
	let msGhostFilters = $state<string[]>(['Active']);

	// `Pagination` — upstream's stories all go through one `PaginationDemo`
	// wrapper holding `page` (and `pageSize` when a size selector is shown), so
	// each block here holds the same pair.
	let pgDefault = $state(1);
	let pgPages = $state(1);
	let pgCount = $state(1);
	let pgCompact = $state(1);
	let pgDots = $state(1);
	let pgNone = $state(1);
	let pgSizeSelector = $state(1);
	let pgSizeSelectorSize = $state(10);
	let pgCursor = $state(1);
	let pgSmall = $state(1);
	let pgManyPages = $state(5);
	let pgManyPagesSiblings = $state(10);
	let pgSinglePage = $state(1);
	let pgDisabled = $state(3);
	// The four `input` blocks, added at 0.3.0 alongside `pageLabel`, `hasFirstLast`
	// and `step`. Each starts on the page its upstream story does.
	let pgInput = $state(3);
	let pgInputLabel = $state(3);
	let pgInputNoFirstLast = $state(3);
	let pgInputStep = $state(6);

	// `Typeahead` — upstream's stories share one `fruitSource` and hold the
	// selected item in `useState`. The pair is hand-written rather than taken from
	// `createStaticSource`, because upstream's `bootstrap` returns only the first
	// five fruits where the factory's returns all of them — and `hasEntriesOnFocus`
	// blocks show exactly that list.
	const TYPEAHEAD_FRUITS: SearchableItem[] = [
		{ id: '1', label: 'Apple' },
		{ id: '2', label: 'Banana' },
		{ id: '3', label: 'Cherry' },
		{ id: '4', label: 'Date' },
		{ id: '5', label: 'Elderberry' },
		{ id: '6', label: 'Fig' },
		{ id: '7', label: 'Grape' },
		{ id: '8', label: 'Honeydew' }
	];
	const typeaheadSource: SearchSource = {
		search: (query: string) =>
			TYPEAHEAD_FRUITS.filter((f) => f.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => TYPEAHEAD_FRUITS.slice(0, 5)
	};
	let thDefault = $state<SearchableItem | null>(null);
	let thBootstrap = $state<SearchableItem | null>(null);
	let thRequired = $state<SearchableItem | null>(null);
	let thOptional = $state<SearchableItem | null>(null);
	let thDescription = $state<SearchableItem | null>(null);
	let thError = $state<SearchableItem | null>(null);
	let thWarning = $state<SearchableItem | null>(null);
	let thSuccess = $state<SearchableItem | null>(null);
	let thDisabled = $state<SearchableItem | null>(null);
	let thDisabledMessage = $state<SearchableItem | null>(null);
	let thNoClear = $state<SearchableItem | null>(null);
	let thLimited = $state<SearchableItem | null>(null);
	let thSm = $state<SearchableItem | null>(null);
	let thMd = $state<SearchableItem | null>(null);
	let thLg = $state<SearchableItem | null>(null);
	let thStartIcon = $state<SearchableItem | null>(null);
	let thStatusAttached = $state<SearchableItem | null>(null);
	let thStatusDetached = $state<SearchableItem | null>(null);

	// `Tokenizer` — upstream's stories share one `userSource` over eight people
	// (its `bootstrap` returns the first five) and hold the selected items in
	// `useState`, so each block here holds its own `$state`.
	const TOKENIZER_USERS: SearchableItem[] = [
		{ id: '1', label: 'Alice Johnson' },
		{ id: '2', label: 'Bob Smith' },
		{ id: '3', label: 'Charlie Brown' },
		{ id: '4', label: 'Diana Prince' },
		{ id: '5', label: 'Eve Williams' },
		{ id: '6', label: 'Frank Miller' },
		{ id: '7', label: 'Grace Lee' },
		{ id: '8', label: 'Henry Davis' }
	];
	const tokenizerUserSource: SearchSource = {
		search: (query: string) =>
			TOKENIZER_USERS.filter((u) => u.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => TOKENIZER_USERS.slice(0, 5)
	};
	// Upstream's free-text stories pass an empty source, so the only suggestion is
	// the synthetic `Create "…"` row `hasCreate` appends.
	const tokenizerEmptySource: SearchSource = {
		search: async () => [],
		bootstrap: async () => []
	};
	const TOKENIZER_OVERFLOW_VALUE = TOKENIZER_USERS.slice(0, 6);
	let tkDefault = $state<SearchableItem[]>([]);
	let tkPreselected = $state<SearchableItem[]>([TOKENIZER_USERS[0], TOKENIZER_USERS[2]]);
	let tkClear = $state<SearchableItem[]>([]);
	let tkMaxEntries = $state<SearchableItem[]>([]);
	let tkRequired = $state<SearchableItem[]>([]);
	let tkDescription = $state<SearchableItem[]>([]);
	let tkError = $state<SearchableItem[]>([]);
	let tkWarning = $state<SearchableItem[]>([]);
	let tkSuccess = $state<SearchableItem[]>([]);
	let tkStartIcon = $state<SearchableItem[]>([]);
	let tkStartIconTokens = $state<SearchableItem[]>([TOKENIZER_USERS[0], TOKENIZER_USERS[2]]);
	let tkEntriesOnFocus = $state<SearchableItem[]>([]);
	let tkOverflowInline = $state<SearchableItem[]>([...TOKENIZER_OVERFLOW_VALUE]);
	let tkOverflowLayer = $state<SearchableItem[]>([...TOKENIZER_OVERFLOW_VALUE]);
	let tkEndContent = $state<SearchableItem[]>([TOKENIZER_USERS[0], TOKENIZER_USERS[2]]);
	let tkTags = $state<SearchableItem[]>([]);
	let tkSm = $state<SearchableItem[]>([]);
	let tkMd = $state<SearchableItem[]>([TOKENIZER_USERS[0], TOKENIZER_USERS[2]]);
	let tkLg = $state<SearchableItem[]>([]);
	let tkCreatableSearch = $state<SearchableItem[]>([]);

	// `FileInput` is likewise strictly controlled.
	let fiDefault = $state<File | File[] | null>(null);
	let fiResume = $state<File | File[] | null>(null);
	let fiAttachments = $state<File | File[] | null>(null);
	let fiPhoto = $state<File | File[] | null>(null);
	let fiDropzone = $state<File | File[] | null>(null);
	let fiRequired = $state<File | File[] | null>(null);
	let fiOptional = $state<File | File[] | null>(null);
	let fiDisabled = $state<File | File[] | null>(null);
	let fiDisabledMessage = $state<File | File[] | null>(null);
	let fiLoading = $state<File | File[] | null>(null);
	let fiError = $state<File | File[] | null>(null);
	let fiSuccess = $state<File | File[] | null>(null);
	let fiTooltip = $state<File | File[] | null>(null);

	// `Calendar` is strictly controlled — it never writes `value` back — so every
	// tile holds its own state, as each upstream story's `useState` does.
	// `ISODateString` is a template-literal type, so the seeded literals need no
	// cast; the branded `ISOTimeString`/`ISODateTimeString` below do.
	let calDefault = $state<ISODateString | undefined>(undefined);
	let calSelected = $state<ISODateString | undefined>('2026-01-15');
	let calRange = $state<DateRange | undefined>(undefined);
	let calRangeWithValue = $state<DateRange | undefined>({
		start: '2026-01-10',
		end: '2026-01-20'
	});
	let calTwoMonths = $state<ISODateString | undefined>(undefined);
	let calTwoMonthsRange = $state<DateRange | undefined>(undefined);
	let calMinMax = $state<ISODateString | undefined>(undefined);
	let calConstrained = $state<ISODateString | undefined>(undefined);
	let calWeekdays = $state<ISODateString | undefined>(undefined);
	let calWeekNumbers = $state<ISODateString | undefined>(undefined);
	let calMondayStart = $state<ISODateString | undefined>(undefined);
	let calRtl = $state<ISODateString | undefined>(undefined);

	// Upstream's `WeekdaysOnly` predicate, verbatim.
	const calIsWeekday = (date: Date) => {
		const day = date.getDay();
		return day !== 0 && day !== 6;
	};

	// `DateInput` is controlled the same way.
	let diDefault = $state<ISODateString | undefined>(undefined);
	let diWithValue = $state<ISODateString | undefined>('2026-01-25');
	let diBirthday = $state<ISODateString | undefined>(undefined);
	let diHiddenLabel = $state<ISODateString | undefined>(undefined);
	let diOptional = $state<ISODateString | undefined>(undefined);
	let diRequired = $state<ISODateString | undefined>(undefined);
	let diDisabled = $state<ISODateString | undefined>('2026-01-25');
	let diDisabledMessage = $state<ISODateString | undefined>(undefined);
	let diSmall = $state<ISODateString | undefined>(undefined);
	let diMinMax = $state<ISODateString | undefined>(undefined);
	let diInLayout = $state<ISODateString | undefined>(undefined);
	let diTwoMonths = $state<ISODateString | undefined>(undefined);
	let diError = $state<ISODateString | undefined>('2026-01-25');
	let diWarning = $state<ISODateString | undefined>('2026-01-01');
	let diSuccess = $state<ISODateString | undefined>('2026-02-10');
	let diClearable = $state<ISODateString | undefined>('2026-04-06');
	let diClearableStatus = $state<ISODateString | undefined>('2026-04-06');

	// Upstream's `WithMaxDateInLayout` caps `max` at today, so the calendar opens
	// with its "next month" button already disabled — the point of the story.
	const diTodayISO = new Date().toISOString().slice(0, 10) as ISODateString;

	// `TimeInput`. The `tm` prefix rather than `ti`, which `TextInput` holds.
	let tmDefault = $state<ISOTimeString | undefined>(undefined);
	let tmWithValue = $state<ISOTimeString | undefined>('14:30' as ISOTimeString);
	let tm24h = $state<ISOTimeString | undefined>('14:30' as ISOTimeString);
	let tmSeconds = $state<ISOTimeString | undefined>('14:30:45' as ISOTimeString);
	let tmClear = $state<ISOTimeString | undefined>('09:00' as ISOTimeString);
	let tmDescription = $state<ISOTimeString | undefined>(undefined);
	let tmMinMax = $state<ISOTimeString | undefined>(undefined);
	let tmIncrement = $state<ISOTimeString | undefined>('09:00' as ISOTimeString);
	let tmOptional = $state<ISOTimeString | undefined>(undefined);
	let tmRequired = $state<ISOTimeString | undefined>(undefined);
	let tmDisabled = $state<ISOTimeString | undefined>('10:00' as ISOTimeString);
	let tmDisabledMessage = $state<ISOTimeString | undefined>(undefined);
	let tmSmall = $state<ISOTimeString | undefined>(undefined);
	let tmError = $state<ISOTimeString | undefined>('22:00' as ISOTimeString);
	let tmWarning = $state<ISOTimeString | undefined>('07:00' as ISOTimeString);
	let tmSuccess = $state<ISOTimeString | undefined>('10:00' as ISOTimeString);

	// `DateTimeInput`. `onChange` is a *required* prop here, as upstream.
	let dtmDefault = $state<ISODateTimeString | undefined>(undefined);
	let dtmWithValue = $state<ISODateTimeString | undefined>('2026-03-15T14:30' as ISODateTimeString);
	let dtm24h = $state<ISODateTimeString | undefined>('2026-03-15T14:30' as ISODateTimeString);
	let dtmSeconds = $state<ISODateTimeString | undefined>(
		'2026-03-15T14:30:45' as ISODateTimeString
	);
	let dtmDescription = $state<ISODateTimeString | undefined>(undefined);
	let dtmClear = $state<ISODateTimeString | undefined>('2026-03-15T09:00' as ISODateTimeString);
	let dtmMinMax = $state<ISODateTimeString | undefined>(undefined);
	let dtmIncrement = $state<ISODateTimeString | undefined>('2026-03-15T09:00' as ISODateTimeString);
	let dtmOptional = $state<ISODateTimeString | undefined>(undefined);
	let dtmRequired = $state<ISODateTimeString | undefined>(undefined);
	let dtmDisabled = $state<ISODateTimeString | undefined>('2026-03-15T10:00' as ISODateTimeString);
	let dtmDisabledMessage = $state<ISODateTimeString | undefined>(undefined);
	let dtmSm = $state<ISODateTimeString | undefined>(undefined);
	let dtmMd = $state<ISODateTimeString | undefined>(undefined);
	let dtmLg = $state<ISODateTimeString | undefined>(undefined);
	let dtmTwoMonths = $state<ISODateTimeString | undefined>(undefined);
	let dtmError = $state<ISODateTimeString | undefined>('2026-03-15T14:30' as ISODateTimeString);
	let dtmWarning = $state<ISODateTimeString | undefined>('2026-03-15T07:00' as ISODateTimeString);
	let dtmSuccess = $state<ISODateTimeString | undefined>('2026-03-15T10:00' as ISODateTimeString);

	// `DateRangeInput`. Both `value` and `onChange` are required, and `value` is
	// `DateRange | null` rather than `| undefined`. Upstream's three date helpers
	// and its `defaultPresets` list, transcribed.
	function driDaysAgo(n: number): ISODateString {
		// Plain `Date` on purpose, upstream's own: the instance is a local scratch
		// value that never leaves the function, so a `SvelteDate` would make a
		// reactive object nothing ever reads.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const d = new Date();
		d.setDate(d.getDate() - n);
		return d.toISOString().slice(0, 10) as ISODateString;
	}

	function driToday(): ISODateString {
		return new Date().toISOString().slice(0, 10) as ISODateString;
	}

	function driStartOfMonth(): ISODateString {
		// Same as `driDaysAgo`: a local scratch `Date`, discarded on return.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const d = new Date();
		d.setDate(1);
		return d.toISOString().slice(0, 10) as ISODateString;
	}

	const DRI_PRESETS: ReadonlyArray<DateRangePreset> = [
		{ label: 'Last 1 day', getRange: () => ({ start: driDaysAgo(1), end: driToday() }) },
		{ label: 'Last 3 days', getRange: () => ({ start: driDaysAgo(3), end: driToday() }) },
		{ label: 'Last 7 days', getRange: () => ({ start: driDaysAgo(7), end: driToday() }) },
		{ label: 'Last 14 days', getRange: () => ({ start: driDaysAgo(14), end: driToday() }) },
		{ label: 'Last 30 days', getRange: () => ({ start: driDaysAgo(30), end: driToday() }) },
		{ label: 'This month', getRange: () => ({ start: driStartOfMonth(), end: driToday() }) }
	];

	let driDefault = $state<DateRange | null>(null);
	let driWithValue = $state<DateRange | null>({ start: '2026-03-10', end: '2026-03-20' });
	let driPresets = $state<DateRange | null>(null);
	let driPresetsWithValue = $state<DateRange | null>({
		start: driDaysAgo(7),
		end: driToday()
	});
	let driDescription = $state<DateRange | null>(null);
	let driMinMax = $state<DateRange | null>(null);
	let driOptional = $state<DateRange | null>(null);
	let driRequired = $state<DateRange | null>(null);
	let driDisabled = $state<DateRange | null>({ start: '2026-03-10', end: '2026-03-20' });
	let driDisabledMessage = $state<DateRange | null>(null);
	let driSm = $state<DateRange | null>(null);
	let driMd = $state<DateRange | null>(null);
	let driLg = $state<DateRange | null>(null);
	let driSingleMonth = $state<DateRange | null>(null);
	let driError = $state<DateRange | null>(null);
	let driWarning = $state<DateRange | null>({ start: '2026-03-01', end: '2026-06-30' });
	let driNoClear = $state<DateRange | null>({ start: '2026-03-10', end: '2026-03-20' });

	// `Slider` is fully controlled; every upstream story holds a `useState`.
	let slVolume = $state(50);
	let slRange = $state<[number, number]>([20, 80]);
	let slMarks = $state(50);
	let slQuantity = $state(50);
	let slTemperature = $state(72);
	let slVertical = $state(50);
	let slCpu = $state(95);
	let slMemory = $state(50);
	let slDisk = $state(75);
	let slNoDisplay = $state(50);

	// `Switch` is controlled the same way — upstream's stories each hold a
	// `useState`; `value` + `onChange` is that wrapper, matching the TextArea tiles.
	let swOff = $state(false);
	let swOn = $state(true);
	let swDisabledOff = $state(false);
	let swDisabledOn = $state(true);
	let swDescribed = $state(false);
	let swNotifications = $state(false);
	let swSecurity = $state(true);
	let swAutosave = $state(false);
	let swEnd = $state(false);
	let swStart = $state(false);
	let swSpread = $state(false);
	let swRequired = $state(false);
	let swOptional = $state(false);
	let swError = $state(false);
	let swWarning = $state(false);
	let swSuccess = $state(true);
	let swDisabledMessage = $state(false);

	// `TextInput` is controlled exactly as `TextArea` is — `value` + `onChange`
	// stands in for upstream's per-story `useState`.
	let tiName = $state('');
	let tiEmail = $state('');
	let tiPassword = $state('');
	let tiSearch = $state('Quarterly report');
	let tiError = $state('bad-email');
	let tiWarning = $state('admin');
	let tiSuccess = $state('available-handle');
	let tiDocumented = $state('');

	// `InputGroup` members are controlled the same way.
	let igPrice = $state('');
	let igDomain = $state('');
	let igWeight = $state('');
	// Upstream's `WithNumberInput` story — unblocked now that `NumberInput` is ported.
	let igBudget = $state<number | null>(null);

	// `Item`'s onclick makes the whole row a button; track a selected row.
	let selectedItem = $state('ada');

	// `RadioList` is controlled — `value` + `onChange`, like the other form controls.
	let notify = $state('email');
	let plan = $state('');

	/**
	 * The demo index. Grouped by role rather than alphabetically, and in the
	 * same order the sections appear below, so the sidebar and the scroll
	 * position never disagree.
	 */
	const NAV: { group: string; items: { id: string; label: string }[] }[] = [
		{
			group: 'Foundations',
			items: [
				{ id: 'theme-tokens', label: 'Theme tokens' },
				{ id: 'theme', label: 'Theme' },
				{ id: 'icon', label: 'Icon' },
				{ id: 'internationalization', label: 'Internationalization' },
				{ id: 'spinner', label: 'Spinner' },
				{ id: 'skeleton', label: 'Skeleton' }
			]
		},
		{
			group: 'Typography',
			items: [
				{ id: 'text-types', label: 'Text types' },
				{ id: 'heading-levels', label: 'Heading levels' },
				{ id: 'text-options', label: 'Text options' },
				{ id: 'truncation', label: 'Truncation' },
				{ id: 'code-kbd-blockquote', label: 'Code, Kbd, Blockquote' },
				{ id: 'codeblock', label: 'CodeBlock' },
				{ id: 'timestamp', label: 'Timestamp' }
			]
		},
		{
			group: 'Layout',
			items: [
				{ id: 'stack', label: 'Stack' },
				{ id: 'grid', label: 'Grid' },
				{ id: 'divider', label: 'Divider' },
				{ id: 'aspectratio', label: 'AspectRatio' },
				{ id: 'center', label: 'Center' },
				{ id: 'card', label: 'Card' },
				{ id: 'section', label: 'Section' },
				{ id: 'layout', label: 'Layout' },
				{ id: 'overflowlist', label: 'OverflowList' },
				{ id: 'appshell', label: 'AppShell' },
				{ id: 'sidenav', label: 'SideNav' },
				{ id: 'topnav', label: 'TopNav' },
				{ id: 'mobilenav', label: 'MobileNav' }
			]
		},
		{
			group: 'Actions',
			items: [
				{ id: 'button-variants', label: 'Button variants' },
				{ id: 'button-sizes', label: 'Button sizes' },
				{ id: 'button-states', label: 'Button states' },
				{ id: 'button-icon-end-content-link', label: 'Button icon, end content, link' },
				{ id: 'buttongroup', label: 'ButtonGroup' },
				{ id: 'togglebutton', label: 'ToggleButton' },
				{ id: 'segmentedcontrol', label: 'SegmentedControl' },
				{ id: 'link', label: 'Link' },
				{ id: 'navicon-iconbutton', label: 'NavIcon, IconButton' },
				{ id: 'moremenu', label: 'MoreMenu' },
				{ id: 'toolbar', label: 'Toolbar' },
				{ id: 'tablist', label: 'TabList' },
				{ id: 'collapsible', label: 'Collapsible' }
			]
		},
		{
			group: 'Data display',
			items: [
				{ id: 'badge', label: 'Badge' },
				{ id: 'token', label: 'Token' },
				{ id: 'statusdot', label: 'StatusDot' },
				{ id: 'progressbar', label: 'ProgressBar' },
				{ id: 'avatar', label: 'Avatar' },
				{ id: 'avatargroup', label: 'AvatarGroup' },
				{ id: 'thumbnail', label: 'Thumbnail' },
				{ id: 'item', label: 'Item' },
				{ id: 'list', label: 'List' },
				{ id: 'treelist', label: 'TreeList' },
				{ id: 'table', label: 'Table' },
				{ id: 'tableselection', label: 'TableSelection' },
				{ id: 'tablesortable', label: 'TableSortable' },
				{ id: 'tablepagination', label: 'TablePagination' },
				{ id: 'tablecolumnsettings', label: 'TableColumnSettings' },
				{ id: 'tablecolumnresize', label: 'TableColumnResize' },
				{ id: 'tablestickycolumns', label: 'TableStickyColumns' },
				{ id: 'tablegroupedrows', label: 'TableGroupedRows' },
				{ id: 'tablerowindex', label: 'TableRowIndex' },
				{ id: 'tablerowstatus', label: 'TableRowStatus' },
				{ id: 'tablerowexpansion', label: 'TableRowExpansion' },
				{ id: 'tabletree', label: 'TableTree' },
				{ id: 'tablefiltering', label: 'TableFiltering' },
				{ id: 'markdown', label: 'Markdown' },
				{ id: 'metadatalist', label: 'MetadataList' },
				{ id: 'emptystate', label: 'EmptyState' },
				{ id: 'citation', label: 'Citation' },
				{ id: 'breadcrumbs', label: 'Breadcrumbs' },
				{ id: 'outline', label: 'Outline' },
				{ id: 'carousel', label: 'Carousel' },
				{ id: 'pagination', label: 'Pagination' }
			]
		},
		{
			group: 'Inputs',
			items: [
				{ id: 'field', label: 'Field' },
				{ id: 'fieldstatus-formlayout', label: 'FieldStatus, FormLayout' },
				{ id: 'textinput', label: 'TextInput' },
				{ id: 'textarea', label: 'TextArea' },
				{ id: 'numberinput', label: 'NumberInput' },
				{ id: 'fileinput', label: 'FileInput' },
				{ id: 'calendar', label: 'Calendar' },
				{ id: 'dateinput', label: 'DateInput' },
				{ id: 'timeinput', label: 'TimeInput' },
				{ id: 'datetimeinput', label: 'DateTimeInput' },
				{ id: 'daterangeinput', label: 'DateRangeInput' },
				{ id: 'selector', label: 'Selector' },
				{ id: 'multiselector', label: 'MultiSelector' },
				{ id: 'complexselector', label: 'ComplexSelector' },
				{ id: 'typeahead', label: 'Typeahead' },
				{ id: 'tokenizer', label: 'Tokenizer' },
				{ id: 'powersearch', label: 'PowerSearch' },
				{ id: 'inputgroup', label: 'InputGroup' },
				{ id: 'radiolist', label: 'RadioList' },
				{ id: 'checkboxinput', label: 'CheckboxInput' },
				{ id: 'checkboxlist', label: 'CheckboxList' },
				{ id: 'slider', label: 'Slider' },
				{ id: 'switch', label: 'Switch' },
				{ id: 'selectablecard', label: 'SelectableCard' },
				{ id: 'clickablecard', label: 'ClickableCard' }
			]
		},
		{
			group: 'Overlays',
			items: [
				{ id: 'tooltip', label: 'Tooltip' },
				{ id: 'hovercard', label: 'HoverCard' },
				{ id: 'popover', label: 'Popover' },
				{ id: 'usekeyboardhint', label: 'useKeyboardHint' },
				{ id: 'dropdownmenu', label: 'DropdownMenu' },
				{ id: 'contextmenu', label: 'ContextMenu' },
				{ id: 'navheadingmenu', label: 'NavHeadingMenu' },
				{ id: 'dialog', label: 'Dialog' },
				{ id: 'alertdialog', label: 'AlertDialog' },
				{ id: 'commandpalette', label: 'CommandPalette' },
				{ id: 'lightbox', label: 'Lightbox' },
				{ id: 'toast', label: 'Toast' },
				{ id: 'banner', label: 'Banner' },
				{ id: 'overlay', label: 'Overlay' }
			]
		},
		{
			group: 'Chat',
			items: [{ id: 'chat', label: 'Chat' }]
		}
	];

	let query = $state('');
	let activeId = $state(NAV[0].items[0].id);

	const filtered = $derived(
		query.trim() === ''
			? NAV
			: NAV.map((section) => ({
					...section,
					items: section.items.filter((entry) =>
						entry.label.toLowerCase().includes(query.trim().toLowerCase())
					)
				})).filter((section) => section.items.length > 0)
	);

	const matchCount = $derived(filtered.reduce((n, section) => n + section.items.length, 0));

	/**
	 * Scroll-spy. Every section is observed against a band near the top of the
	 * viewport; the topmost intersecting one wins, so the highlight tracks what
	 * is actually being read rather than whatever crossed the midpoint last.
	 */
	$effect(() => {
		const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
		if (sections.length === 0) return;

		// Plain Set on purpose: it is bookkeeping inside this effect and is never
		// read during render, so reactivity would buy nothing.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = (entry.target as HTMLElement).dataset.section;
					if (!id) continue;
					if (entry.isIntersecting) visible.add(id);
					else visible.delete(id);
				}
				const first = sections.find((el) => visible.has(el.dataset.section ?? ''));
				if (first?.dataset.section) activeId = first.dataset.section;
			},
			{ rootMargin: '-72px 0px -70% 0px' }
		);

		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	});
</script>

<!--
	`data-astryx-theme` activates the theme's @scope block; `data-theme` pins
	color-scheme so the light-dark() tokens resolve. Toggling the former off
	falls back to the bare token defaults from tokens.stylex.ts.
-->
{#snippet quickView()}
	<Button label="Quick view" variant="ghost" />
{/snippet}

<!-- `labelIcon` is a snippet here where upstream takes a `ReactNode | IconType`,
     so the caller sets the icon's own size and colour rather than `Field` doing it. -->
{#snippet searchIcon()}
	<Icon icon="search" size="sm" color="inherit" />
{/snippet}

<!-- `TextArea`'s `startIcon` is the same snippet story, but upstream applies
     `color="secondary"` to it rather than `inherit`. -->
{#snippet documentIcon()}
	<Icon icon="copy" size="sm" color="secondary" />
{/snippet}

<!-- `TextInput`'s `startIcon`, likewise applied at `color="secondary"`. -->
{#snippet searchIconSecondary()}
	<Icon icon="search" size="sm" color="secondary" />
{/snippet}

<!-- `Switch`'s `labelIcon` is a snippet where upstream takes a `ReactNode | IconType`;
     `FieldLabel` documents `size="sm" color="inherit"`, so the caller sets them.
     Upstream's stories pass heroicons (Bell/Moon/ShieldCheck/CloudArrowUp) absent
     from Astryx's 26-name registry, so these use registry names in the same slots. -->
{#snippet switchInfoIcon()}
	<Icon icon="info" size="sm" color="inherit" />
{/snippet}

<!-- CheckboxInput's `labelIcon` is a Snippet here, so the caller sets `size`/`color`
     that upstream applies for you. Upstream's WithStartIcon stories pass heroicons
     (Bell/Envelope/ShieldCheck) absent from the 26-name registry, so this uses a
     registry name in the same slot — the substitution the Switch icons above make. -->
{#snippet checkboxBellIcon()}
	<Icon icon="info" size="sm" color="inherit" />
{/snippet}

<!-- `CheckboxListItem.endContent` — upstream's doc block shows exactly these two:
     a `Badge` with a count, and a small chevron. -->
{#snippet checkboxCountBadge()}
	<Badge label="3" />
{/snippet}

{#snippet checkboxChevron()}
	<Icon icon="chevronDown" size="sm" />
{/snippet}

<!-- `NumberInput.startIcon` is a Snippet here, so the caller sets the `size="sm"
     color="secondary"` upstream applies for you. Upstream's WithStep/DecimalInput
     and WithStartIcon stories pass heroicons (CurrencyDollar/Hashtag) absent from
     the 26-name registry, so these use registry names in the same slots — the
     substitution the Switch and CheckboxInput icons above make. -->
{#snippet numberInputDollarIcon()}
	<Icon icon="info" size="sm" color="secondary" />
{/snippet}

{#snippet numberInputHashIcon()}
	<Icon icon="menu" size="sm" color="secondary" />
{/snippet}

{#snippet selectorUserOption(option: SelectorOptionData)}
	<SelectorOption
		icon="info"
		label={option.label ?? option.value}
		description={SELECTOR_USER_EMAILS[option.value]}
	/>
{/snippet}

{#snippet tokenizerApplyButton()}
	<Button label="Apply" variant="primary" size="sm" />
{/snippet}

{#snippet switchSecurityIcon()}
	<Icon icon="success" size="sm" color="inherit" />
{/snippet}

{#snippet switchAutosaveIcon()}
	<Icon icon="copy" size="sm" color="inherit" />
{/snippet}

{#snippet favourite()}
	<Button label="♡" variant="ghost" />
{/snippet}

{#snippet uploading()}
	<VStack gap={2} hAlign="center">
		<Spinner size="md" />
		<Text weight="bold">Uploading...</Text>
	</VStack>
{/snippet}

{#snippet caption()}
	<VStack gap={1}>
		<Heading level={3}>Gallery Collection</Heading>
		<Text type="supporting" color="secondary">24 items · Updated today</Text>
	</VStack>
{/snippet}

<!-- Toast `endContent` slots. Upstream passes these as React elements; the
     Svelte counterpart of a `ReactNode` option value is a snippet. -->
{#snippet showcaseToastAction()}
	<Button
		label="Show toast"
		variant="ghost"
		size="sm"
		onclick={() => showToast({ body: 'Document saved successfully' })}
	/>
{/snippet}

{#snippet infoToastAction()}
	<Button
		label="Show toast"
		variant="ghost"
		size="sm"
		onclick={() => showToast({ body: 'Changes saved successfully.', type: 'info' })}
	/>
{/snippet}

{#snippet errorToastAction()}
	<Button
		label="Show toast"
		variant="ghost"
		size="sm"
		onclick={() => showToast({ body: 'Failed to save changes.', type: 'error' })}
	/>
{/snippet}

{#snippet undoToastAction()}
	<Button
		label="Undo"
		variant="secondary"
		size="sm"
		onclick={() => showToast({ body: 'Undo successful', type: 'info' })}
	/>
{/snippet}

{#snippet metadataTitle()}
	<Text type="label">Pipeline</Text>
{/snippet}

{#snippet reportToastLink()}
	<Link href="#" hasUnderline>View report</Link>
{/snippet}

<Theme theme={themed ? neutralTheme : noTheme} mode={scheme}>
	<InternationalizationProvider locale="en" dir={direction}>
		<div class="page" dir={direction}>
			<header class="topbar">
				<div>
					<h1>astryx-svelte</h1>
					<p class="sub">{themed ? 'neutral theme' : 'token defaults (no theme)'}</p>
				</div>
				<div class="row">
					<Button
						label={themed ? 'Theme: neutral' : 'Theme: none'}
						variant={themed ? 'primary' : 'secondary'}
						size="sm"
						onclick={() => (themed = !themed)}
					/>
					<Button
						label={scheme === 'light' ? 'Dark mode' : 'Light mode'}
						variant="ghost"
						size="sm"
						onclick={() => (scheme = scheme === 'light' ? 'dark' : 'light')}
					/>
					<Button
						label={direction === 'ltr' ? 'Direction: LTR' : 'Direction: RTL'}
						variant={direction === 'rtl' ? 'primary' : 'ghost'}
						size="sm"
						onclick={() => (direction = direction === 'ltr' ? 'rtl' : 'ltr')}
					/>
				</div>
			</header>

			<div class="shell">
				<nav class="sidebar" aria-label="Demo sections">
					<div class="filter">
						<input
							class="native-input"
							type="search"
							placeholder="Filter sections…"
							aria-label="Filter sections"
							bind:value={query}
						/>
						<p class="count" aria-live="polite">
							{matchCount}
							{matchCount === 1 ? 'section' : 'sections'}
						</p>
					</div>
					{#each filtered as section (section.group)}
						<p class="nav-group">{section.group}</p>
						<ul>
							{#each section.items as entry (entry.id)}
								<li>
									<a
										href="#{entry.id}"
										class:active={activeId === entry.id}
										aria-current={activeId === entry.id ? 'true' : undefined}
									>
										{entry.label}
									</a>
								</li>
							{/each}
						</ul>
					{/each}
					{#if matchCount === 0}
						<p class="count">No section matches “{query}”.</p>
					{/if}
				</nav>

				<main class="content">
					<section id="theme-tokens" data-section="theme-tokens">
						<h2 id="theme-tokens">
							Theme tokens
							<a class="anchor" href="#theme-tokens" aria-label="Link to Theme tokens">#</a>
						</h2>
						<!--
				The swatch list follows the theme's own colour groups rather than an ad-hoc
				pick: the four status hues with their muted pairs, then the surfaces and
				the two border weights the components actually reference.
			-->
						{#each THEME_SWATCHES as group (group.title)}
							<VStack gap={2}>
								<Text type="supporting" color="secondary">{group.title}</Text>
								<div class="swatches">
									{#each group.tokens as token (token)}
										<div class="swatch">
											<span class="chip" style="background: var(--color-{token})"></span>
											<code>--color-{token}</code>
										</div>
									{/each}
								</div>
							</VStack>
						{/each}
					</section>

					<section id="theme" data-section="theme">
						<h2 id="theme">
							Theme
							<a class="anchor" href="#theme" aria-label="Link to Theme">#</a>
						</h2>
						<p class="note">
							<code>&lt;Theme&gt;</code> applies a theme to its children as CSS custom properties
							and sets the <code>color-scheme</code> that makes every <code>light-dark()</code>
							token resolve. The first one in the tree also mirrors <code>data-theme</code> and
							<code>data-astryx-theme</code> onto <code>&lt;html&gt;</code>, so browser chrome and
							top-layer content follow the app's mode. <code>useTheme()</code> is the programmatic
							half: it returns
							<em>resolved</em> values for the active mode, which is what an SVG chart, a canvas or
							a data-viz config needs — no <code>getComputedStyle</code>, no second render.
						</p>

						<Text type="label">Bar chart — light</Text>
						<Theme theme={neutralTheme} mode="light">
							<VStack gap={4}>
								<Heading level={3}>Weekly Activity</Heading>
								<Card>
									<ThemeBarChart data={CHART_DATA} />
								</Card>
							</VStack>
						</Theme>

						<Text type="label">Bar chart — dark</Text>
						<Theme theme={neutralTheme} mode="dark">
							<VStack gap={4}>
								<Heading level={3}>Weekly Activity</Heading>
								<Card>
									<ThemeBarChart data={CHART_DATA} />
								</Card>
							</VStack>
						</Theme>

						<Text type="label">Grouped chart</Text>
						<Theme theme={neutralTheme} mode="light">
							<VStack gap={4}>
								<Heading level={3}>Quarterly Metrics</Heading>
								<Card>
									<ThemeGroupedChart data={MULTI_SERIES} />
								</Card>
							</VStack>
						</Theme>

						<Text type="label">Theme comparison</Text>
						<div class="theme-compare">
							<Theme theme={neutralTheme} mode="light">
								<VStack gap={2}>
									<Heading level={4}>Default Theme</Heading>
									<Card>
										<ThemeGroupedChart data={MULTI_SERIES} width={360} />
									</Card>
								</VStack>
							</Theme>
							<Theme theme={oceanTheme} mode="light">
								<VStack gap={2}>
									<Heading level={4}>Ocean Theme</Heading>
									<Card>
										<ThemeGroupedChart data={MULTI_SERIES} width={360} />
									</Card>
								</VStack>
							</Theme>
						</div>

						<Text type="label">Token inspector</Text>
						<div class="theme-compare">
							<Theme theme={neutralTheme} mode="light">
								<ThemeTokenInspector />
							</Theme>
							<Theme theme={oceanTheme} mode="dark">
								<ThemeTokenInspector />
							</Theme>
						</div>
						<p class="note">
							A nested <code>&lt;Theme&gt;</code> themes its own subtree and deliberately does
							<em>not</em> touch <code>&lt;html&gt;</code> — these six are all nested inside the page's
							own theme, so the toggles above still own the document.
						</p>
					</section>

					<section id="icon" data-section="icon">
						<h2 id="icon">
							Icon
							<a class="anchor" href="#icon" aria-label="Link to Icon">#</a>
						</h2>
						<div class="row">
							{#each iconNames as name (name)}
								<Icon icon={name} color="secondary" />
							{/each}
						</div>
						<div class="row">
							{#each iconSizes as size (size)}
								<Icon icon="search" {size} />
							{/each}
							<Icon icon={SquiggleIcon} color="accent" size="lg" />
						</div>
						<div class="row">
							{#each iconSemanticColors as color (color)}
								<Icon icon="success" {color} />
							{/each}
						</div>
						<div class="row">
							{#each iconNonSemanticColors as color (color)}
								<Icon icon="success" {color} />
							{/each}
						</div>
						<p class="note">
							Two modes. A name resolves through the registry and lands in a sized
							<code>&lt;span&gt;</code> whose font-size drives the 1em SVG; a component is rendered directly
							and takes the width/height classes itself. The last one is component mode.
						</p>
					</section>

					<section id="internationalization" data-section="internationalization">
						<h2 id="internationalization">
							Internationalization
							<a
								class="anchor"
								href="#internationalization"
								aria-label="Link to Internationalization">#</a
							>
						</h2>
						<div class="row">
							{#each demoLocales as tag (tag)}
								<Button
									label={tag}
									size="sm"
									variant={locale === tag ? 'primary' : 'secondary'}
									onclick={() => (locale = tag)}
								/>
							{/each}
						</div>
						<div class="stack">
							<InternationalizationProvider
								{locale}
								messages={demoMessages}
								overrides={demoOverrides}
							>
								<I18nSample />

								<AvatarGroup size="md">
									{#each teamMembers.slice(0, 3) as member (member)}
										<Avatar name={member} />
									{/each}
									<AvatarGroupOverflow count={teamMembers.length - 3} />
								</AvatarGroup>
							</InternationalizationProvider>
						</div>
						<p class="note">
							Lookup walks the tag from most-specific to least. <code>pt-BR</code> resolves
							<code>next</code> from its own catalog but <code>previous</code> from
							<code>pt</code>, and <code>count</code> from the shipped <code>en</code> pattern —
							formatted with <code>pt-BR</code> number separators, so 1000 reads <code>1.000</code>.
							<code>fr</code> has no catalog at all, only an <code>overrides</code> entry for
							<code>next</code>; everything else stays English. The AvatarGroup above is the port's
							first real call site: its <code>aria-label</code> is
							<code>@astryx.avatarGroup.label</code>, which the <code>pt</code> catalog translates.
						</p>
					</section>

					<section id="spinner" data-section="spinner">
						<h2 id="spinner">
							Spinner
							<a class="anchor" href="#spinner" aria-label="Link to Spinner">#</a>
						</h2>
						<div class="row">
							<Spinner size="sm" />
							<Spinner size="md" />
							<Spinner size="lg" shade="subtle" />
							<Spinner size="xl" />
						</div>
						<!-- SpinnerWithLabel: a string label, and a rich one carrying its own aria-label. -->
						<HStack gap={8} vAlign="start">
							<Spinner size="lg" label="Loading..." />
							<Spinner size="lg" aria-label="Fetching data">
								{#snippet label()}
									<VStack gap={0} hAlign="center">
										<Text type="body" weight="bold">Fetching data</Text>
										<Text type="supporting" color="secondary">This may take a moment</Text>
									</VStack>
								{/snippet}
							</Spinner>
						</HStack>
						<!-- SpinnerOnMedia: the onMedia shade against a dark surface. -->
						<HStack gap={4} vAlign="center">
							<Spinner shade="default" />
							<div class="on-media">
								<Spinner shade="onMedia" />
							</div>
						</HStack>
						<p class="note">
							A string <code>label</code> renders as bold body text below the ring <em>and</em>
							becomes the accessible name; richer content carries its own <code>aria-label</code>.
							With a label the root becomes a wrapper <code>&lt;div&gt;</code> and every consumer
							prop moves out to it, so
							<code>data-testid</code> and <code>class</code> still land on the outermost element.
						</p>
					</section>

					<section id="skeleton" data-section="skeleton">
						<h2 id="skeleton">
							Skeleton
							<a class="anchor" href="#skeleton" aria-label="Link to Skeleton">#</a>
						</h2>
						<HStack gap={4} vAlign="start">
							<Skeleton width={48} height={48} radius="rounded" />
							<VStack gap={2} width={280}>
								<Skeleton width="100%" height={16} index={0} />
								<Skeleton width="88%" height={16} index={1} />
								<Skeleton width="64%" height={16} index={2} />
							</VStack>
						</HStack>
						<p class="note">
							<code>index</code> staggers the start by 100ms a step, on top of a 1s delay — so content
							that arrives quickly never flashes an animation.
						</p>
					</section>

					<section id="text-types" data-section="text-types">
						<h2 id="text-types">
							Text types
							<a class="anchor" href="#text-types" aria-label="Link to Text types">#</a>
						</h2>
						<div class="stack">
							{#each textTypes as type (type)}
								<Text {type} as="div">{type} — the quick brown fox jumps over the lazy dog</Text>
							{/each}
						</div>
					</section>

					<section id="heading-levels" data-section="heading-levels">
						<h2 id="heading-levels">
							Heading levels
							<a class="anchor" href="#heading-levels" aria-label="Link to Heading levels">#</a>
						</h2>
						<div class="stack">
							{#each levels as level (level)}
								<Heading {level}>Heading level {level}</Heading>
							{/each}
							<Heading level={2} type="display-2">Level 2, display-2 sizing</Heading>
						</div>
					</section>

					<section id="text-options" data-section="text-options">
						<h2 id="text-options">
							Text options
							<a class="anchor" href="#text-options" aria-label="Link to Text options">#</a>
						</h2>
						<div class="stack">
							<Text as="div" color="secondary">color="secondary"</Text>
							<Text as="div" weight="bold">weight="bold"</Text>
							<Text as="div" hasStrikethrough>hasStrikethrough</Text>
							<Text as="div" hasTabularNumbers>hasTabularNumbers 1234567890</Text>
							<Text as="div" justify="center">justify="center"</Text>
						</div>
					</section>

					<section id="truncation" data-section="truncation">
						<h2 id="truncation">
							Truncation
							<a class="anchor" href="#truncation" aria-label="Link to Truncation">#</a>
						</h2>
						<div class="stack clamped">
							<Text as="div" maxLines={1}>{clampSample}</Text>
							<Text as="div" maxLines={2}>{clampSample}</Text>
							<Heading level={4} maxLines={1}>{clampSample}</Heading>
						</div>
						<p class="note">
							Hover a clamped line for the full text. Both arrive: upstream sets the native
							<code>title</code> and lazy-loads a <code>Tooltip</code> anchored to the element, and
							<code>hasTruncateTooltip</code> takes a placement as well as a boolean.
						</p>
					</section>

					<section id="code-kbd-blockquote" data-section="code-kbd-blockquote">
						<h2 id="code-kbd-blockquote">
							Code, Kbd, Blockquote
							<a
								class="anchor"
								href="#code-kbd-blockquote"
								aria-label="Link to Code, Kbd, Blockquote">#</a
							>
						</h2>
						<div class="stack">
							<Text as="p"
								>Declare it with <Code>const x = 1</Code>, or <Code color="secondary"
									>let y = 2</Code
								> if it has to change.</Text
							>
							<Text type="large" as="p"
								>Inside larger text, <Code size="inherit">size="inherit"</Code> keeps the code at the
								surrounding size.</Text
							>
							<div class="row">
								<Kbd keys="mod+k" />
								<Kbd keys="mod+shift+p" />
								<Kbd keys="shift+plus" />
								<Kbd keys="escape" />
								<Kbd keys="up" />
							</div>
							<!--
					Upstream's `BlockquoteShowcase` renders this quote *uncited* and puts
					the `cite` on the other one. Attributing it to Charles Eames was both
					invented and wrong — it is Steve Jobs, which is exactly whom upstream
					cites on the quote below.
				-->
							<Blockquote>
								Design is not just what it looks like and feels like. Design is how it works.
							</Blockquote>
							<Blockquote>
								{#snippet cite()}Steve Jobs{/snippet}
								The people who are crazy enough to think they can change the world are the ones who do.
							</Blockquote>
						</div>
						<p class="note">
							<code>mod</code> resolves after hydration — ⌘ on macOS, Ctrl elsewhere — so the server and
							the first client render agree.
						</p>
					</section>

					<section id="codeblock" data-section="codeblock">
						<h2 id="codeblock">
							CodeBlock
							<a class="anchor" href="#codeblock" aria-label="Link to CodeBlock">#</a>
						</h2>
						<div class="field-column">
							<CodeBlock
								code={cbTsExample}
								language="typescript"
								title="useUser.ts"
								hasLineNumbers
								hasCopyButton
							/>
							<CodeBlock
								code={cbTsExample}
								language="typescript"
								title="useUser.ts"
								hasLineNumbers
								highlightLines={[9, 10, 11, 12, 13]}
							/>
							<CodeBlock code={cbJson} language="json" title="package.json" hasLineNumbers />
							<CodeBlock
								code={cbPython}
								language="python"
								title="pipeline.py"
								hasLineNumbers
								highlightLines={[7, 8, 9, 10, 11]}
							/>
							<CodeBlock code={cbHtml} language="html" title="index.html" hasLineNumbers />
							<CodeBlock code={cbCss} language="css" title="button.css" hasLineNumbers />
							<CodeBlock code={cbBash} language="bash" title="deploy.sh" hasLineNumbers />
							<CodeBlock code="npm install @astryxdesign/core" language="bash" hasCopyButton />
							<CodeBlock code={cbWrapped} language="typescript" isWrapped hasLineNumbers />
							<CodeBlock
								code={cbManyLines}
								language="typescript"
								title="many-lines.ts"
								hasLineNumbers
								maxHeight={200}
							/>
							<CodeBlock
								code={cbTsExample}
								language="typescript"
								title="useUser.ts"
								hasLineNumbers
								size="sm"
							/>
							<CodeBlock code={cbNoHeader} language="typescript" hasCopyButton />
							<CodeBlock code={cbPlaintext} language="plaintext" title="notes.txt" hasLineNumbers />
							<CodeBlock code={cbTsExample} language="typescript" title="useUser.ts" width="100%" />
							<CodeBlock
								code={cbTsExample}
								language="typescript"
								title="useUser.ts"
								width="100%"
								container="section"
							/>
							<CodeBlock
								code={cbTsExample}
								language="typescript"
								title="useUser.ts (dracula)"
								hasLineNumbers
								syntaxTheme={dracula}
							/>
						</div>
						<p class="note">
							Syntax colour is painted with the CSS Custom Highlight API — <code>Range</code>
							objects registered in <code>CSS.highlights</code>, styled by
							<code>::highlight()</code>
							— so the code stays bare text nodes rather than thousands of spans. Browsers without it
							(and Safari, which has the objects but mis-renders the pseudo-element in code blocks) fall
							back to spans automatically; force either with
							<code>highlightMode</code>. Blocks over 100 lines are split into
							<code>content-visibility: auto</code>
							chunks. The last block uses the
							<code>syntaxTheme</code> prop, shorthand for wrapping in
							<code>&lt;SyntaxTheme&gt;</code>; the 12 community presets ship from
							<code>@astryx-svelte/core/theme/syntax</code>.
						</p>
					</section>

					<section id="timestamp" data-section="timestamp">
						<h2 id="timestamp">
							Timestamp
							<a class="anchor" href="#timestamp" aria-label="Link to Timestamp">#</a>
						</h2>
						<!--
				TimestampFormats: user-facing formats on a fixed date, then the system
				formats - which upstream renders as `type="code"`, the monospace face
				they are meant for in logs and dev tools.
			-->
						<VStack gap={4}>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">User-facing formats</Text>
								<HStack gap={4} vAlign="center">
									<Timestamp value={sampleTimestamp} format="date" color="primary" />
									<Timestamp value={sampleTimestamp} format="date_time" color="primary" />
									<Timestamp value={sampleTimestamp} format="time" color="primary" />
								</HStack>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">System formats (logs and dev tools)</Text>
								<HStack gap={4} vAlign="center">
									<Timestamp
										value={sampleTimestamp}
										format="system_date"
										type="code"
										color="primary"
									/>
									<Timestamp
										value={sampleTimestamp}
										format="system_date_time"
										type="code"
										color="primary"
									/>
									<Timestamp
										value={sampleTimestamp}
										format="system_time"
										type="code"
										color="primary"
									/>
								</HStack>
							</VStack>
							<!--
					TimestampRelativeFormat / TimestampAutoFormat both measure from *now*:
					a fixed date makes "relative" read as a stale absolute string and
					makes `auto` show only its date_time branch.
				-->
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Relative timestamps (hover for the full date)
								</Text>
								<VStack gap={2}>
									{#each RELATIVE_OFFSETS as offset (offset)}
										<Timestamp value={now - offset * 1000} format="relative" color="primary" />
									{/each}
								</VStack>
							</VStack>
							<!--
								RelativeShortFormat — the same tiers as `relative` with abbreviated
								units, for space-constrained surfaces. New at 0.3.0.
							-->
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									relative_short - the same tiers, abbreviated
								</Text>
								<VStack gap={2}>
									{#each RELATIVE_OFFSETS as offset (offset)}
										<Timestamp
											value={now - offset * 1000}
											format="relative_short"
											color="primary"
										/>
									{/each}
								</VStack>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">auto - recent renders as relative</Text>
								<HStack gap={4} vAlign="center">
									<Timestamp value={now - 300_000} format="auto" color="primary" />
									<Timestamp value={now - 7_200_000} format="auto" color="primary" />
									<Timestamp value={now - 86_400_000} format="auto" color="primary" />
								</HStack>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									auto - older than 7 days renders as date_time
								</Text>
								<HStack gap={4} vAlign="center">
									<Timestamp value="2025-01-15T09:30:00Z" format="auto" color="primary" />
									<Timestamp value="2024-06-01T14:00:00Z" format="auto" color="primary" />
								</HStack>
							</VStack>
							<HStack gap={3} vAlign="center">
								<Text type="label" size="sm"><code>isLive</code></Text>
								<Timestamp value={now - 5000} format="relative" isLive />
								<Text type="label" size="sm"><code>isTimezoneShown</code></Text>
								<Timestamp value={sampleTimestamp} format="date_time" isTimezoneShown />
							</HStack>
						</VStack>

						<!-- TooltipTimezones — "Hover card — configuration examples". -->
						<h3>Hover card — configuration examples</h3>
						<VStack gap={8}>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Local + UTC, default format — hover or tab to the timestamp, then copy any row
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="relative"
										tooltipEntries={[{ label: 'Local' }, { timezoneID: 'UTC', label: 'UTC' }]}
									/>
								</div>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Three labelled zones — the widest case the card holds
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="date"
										tooltipEntries={[
											{
												timezoneID: 'America/New_York',
												format: 'date_time',
												label: 'New York'
											},
											{ timezoneID: 'Europe/London', format: 'date_time', label: 'London' },
											{ timezoneID: 'Asia/Tokyo', format: 'date_time', label: 'Tokyo' }
										]}
									/>
								</div>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									One zone, two formats — friendly line plus a machine-precise line
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="date_time"
										tooltipEntries={[
											{ format: 'full' },
											{ format: 'system_date_time', label: 'ISO' }
										]}
									/>
								</div>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									UTC only — an audit log that never shows local time
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="date_time"
										tooltipEntries={[{ timezoneID: 'UTC', label: 'UTC' }]}
									/>
								</div>
							</VStack>
						</VStack>

						<!-- CopyableHoverCard. -->
						<h3>Copyable hover card</h3>
						<VStack gap={8}>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Local, UTC, another zone, and Unix seconds — hover or tab, then copy any row
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="relative"
										tooltipEntries={[
											{ label: 'Local' },
											{ timezoneID: 'UTC', label: 'UTC' },
											{ timezoneID: 'Asia/Tokyo', format: 'date_time', label: 'Tokyo' },
											{ timezoneID: 'UTC', format: 'system_date_time', label: 'ISO (UTC)' }
										]}
									/>
								</div>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									A single UTC entry — one copyable row, on an absolute format that has no hover
									card of its own
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="date_time"
										tooltipEntries={[{ timezoneID: 'UTC', label: 'UTC' }]}
									/>
								</div>
							</VStack>
						</VStack>

						<!-- PerEntryCopyable. -->
						<h3>Per-entry copyable</h3>
						<VStack gap={8}>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Mixed: human-readable rows are read-only; only the machine value opts into a copy
									button
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="relative"
										tooltipEntries={[
											{ label: 'Local' },
											{ timezoneID: 'UTC', label: 'UTC' },
											{
												timezoneID: 'UTC',
												format: 'system_date_time',
												label: 'ISO (UTC)',
												isCopyable: true
											}
										]}
									/>
								</div>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Fully read-only card — no row opts in, so there is no copy button and no trailing
									action column
								</Text>
								<div>
									<Timestamp
										value={sampleTimestamp}
										format="relative"
										tooltipEntries={[{ label: 'Local' }, { timezoneID: 'UTC', label: 'UTC' }]}
									/>
								</div>
							</VStack>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Single read-only row with no label — the value sits flush at the leading edge
								</Text>
								<div>
									<Timestamp value={sampleTimestamp} format="relative" tooltipEntries={[{}]} />
								</div>
							</VStack>
						</VStack>

						<p class="note">
							<code>auto</code> shows relative text until the value passes
							<code>autoThreshold</code> (7 days), then switches to <code>date_time</code>.
							<code>relative_short</code> (0.3.0) is the same ladder with abbreviated units, for space-constrained
							surfaces.
						</p>
						<p class="note">
							Hovering — or tabbing to — a relative one reveals the full absolute time in a
							<strong>copyable hover card</strong>, which replaced the plain
							<code>Tooltip</code> at 0.3.0. It is still lazily loaded and still anchored to the
							<code>&lt;time&gt;</code>, which takes a tab stop only while a card is attached, so
							keyboard users can reach it and no gratuitous tab stops appear otherwise.
							<code>tooltipEntries</code> gives the card its rows — one line per entry, each with an
							optional <code>timezoneID</code>, <code>format</code> and <code>label</code> — and
							configuring them also attaches the card to the absolute formats, which otherwise have
							none. Rows are read-only unless they set <code>isCopyable</code>; the copy buttons
							live in a trailing action column that is only reserved when some row opts in, so a
							fully read-only card has no trailing gutter. With no entries the card is a single
							default row carrying the full absolute time, itself copyable.
							<code>{'hasTooltip={false}'}</code> still suppresses the whole surface, and an empty array
							is treated as no configuration rather than as a second way to spell "off".
						</p>
					</section>

					<section id="stack" data-section="stack">
						<h2 id="stack">
							Stack
							<a class="anchor" href="#stack" aria-label="Link to Stack">#</a>
						</h2>
						<VStack gap={3}>
							<HStack gap={2} vAlign="center">
								<Button label="One" size="sm" />
								<Button label="Two" size="sm" variant="secondary" />
								<Text type="supporting">HStack, vAlign="center"</Text>
							</HStack>

							<HStack gap={2} justify="between" class="demo-box">
								<Text>justify="between"</Text>
								<Text>edge to edge</Text>
							</HStack>

							<HStack gap={2} class="demo-box">
								<StackItem>
									<Text>static</Text>
								</StackItem>
								<StackItem size="fill">
									<Text color="secondary">fill — takes the slack</Text>
								</StackItem>
								<StackItem>
									<Button label="Action" size="sm" />
								</StackItem>
							</HStack>

							<Stack direction="horizontal" gap={2} wrap="wrap" padding={3} class="demo-box">
								<!-- Upstream's `HStackShowcase` fills the row with `Badge`s, not filler words. -->
								{#each ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'] as word (word)}
									<Code>{word}</Code>
								{/each}
							</Stack>
						</VStack>
						<p class="note">
							<code>padding</code> and <code>gap</code> take spacing steps, not lengths — the same scale
							the tokens are built from, so a stack can never fall off the grid.
						</p>
					</section>

					<section id="grid" data-section="grid">
						<h2 id="grid">
							Grid
							<a class="anchor" href="#grid" aria-label="Link to Grid">#</a>
						</h2>
						<Grid columns={3} gap={3}>
							<GridSpan columns={2}>
								<Center class="cell" minHeight={64}><Text>columns={2}</Text></Center>
							</GridSpan>
							<Center class="cell" minHeight={64}><Text>1</Text></Center>
							<Center class="cell" minHeight={64}><Text>2</Text></Center>
							<Center class="cell" minHeight={64}><Text>3</Text></Center>
							<Center class="cell" minHeight={64}><Text>4</Text></Center>
							<GridSpan columns="full">
								<Center class="cell" minHeight={40}><Text>columns="full"</Text></Center>
							</GridSpan>
						</Grid>
						<p class="note">
							Responsive form below: <code
								>columns=&lbrace;&lbrace;minWidth: 160, max: 4&rbrace;&rbrace;</code
							>
							caps the count at four but still fills the row when fewer fit.
						</p>
						<Grid columns={{ minWidth: 160, max: 4 }} gap={3}>
							{#each [1, 2, 3, 4, 5] as n (n)}
								<Center class="cell" minHeight={56}><Text>{n}</Text></Center>
							{/each}
						</Grid>
						<p class="note">
							<code>repeat</code> picks the auto-placement keyword: <code>'fit'</code> collapses
							empty tracks so the items stretch to fill the row (upstream's
							<code>GridResponsiveAutoFit</code>), where <code>'fill'</code> keeps them, leaving the
							gaps visible. Both are shown at the same
							<code>minWidth</code> so the difference is the only variable.
						</p>
						<VStack gap={2}>
							<Text type="supporting" color="secondary">repeat: 'fit'</Text>
							<Grid columns={{ minWidth: 180, repeat: 'fit' }} gap={4} width="100%">
								{#each GRID_TEAMS as team (team.name)}
									<Card>
										<VStack gap={1}>
											<Text type="label" display="block">{team.name}</Text>
											<Text type="supporting" display="block">{team.members} members</Text>
										</VStack>
									</Card>
								{/each}
							</Grid>
							<Text type="supporting" color="secondary">repeat: 'fill'</Text>
							<Grid columns={{ minWidth: 180, repeat: 'fill' }} gap={4} width="100%">
								{#each GRID_TEAMS.slice(0, 3) as team (team.name)}
									<Card>
										<VStack gap={1}>
											<Text type="label" display="block">{team.name}</Text>
											<Text type="supporting" display="block">{team.members} members</Text>
										</VStack>
									</Card>
								{/each}
							</Grid>
						</VStack>
					</section>

					<section id="divider" data-section="divider">
						<h2 id="divider">
							Divider
							<a class="anchor" href="#divider" aria-label="Link to Divider">#</a>
						</h2>
						<VStack gap={4}>
							<Divider />
							<Divider variant="strong" />
							<Divider label="or" />
							<HStack gap={3} vAlign="center" height={48}>
								<Text>left</Text>
								<Divider orientation="vertical" />
								<Text>right</Text>
							</HStack>
						</VStack>
						<!-- DividerFullBleed: rules that reach past the card's padding. -->
						<Card width={400}>
							<VStack gap={3}>
								<Text type="label">Order Summary</Text>
								<HStack hAlign="between">
									<Text type="body">3 items</Text>
									<Text type="body">$127.00</Text>
								</HStack>
								<Divider isFullBleed />
								<HStack hAlign="between">
									<Text type="body">Shipping</Text>
									<Text type="body">$7.99</Text>
								</HStack>
								<HStack hAlign="between">
									<Text type="body">Tax</Text>
									<Text type="body">$10.16</Text>
								</HStack>
								<Divider isFullBleed />
								<HStack hAlign="between">
									<Text type="label">Total</Text>
									<Text type="label">$145.15</Text>
								</HStack>
							</VStack>
						</Card>
					</section>

					<section id="aspectratio" data-section="aspectratio">
						<h2 id="aspectratio">
							AspectRatio
							<a class="anchor" href="#aspectratio" aria-label="Link to AspectRatio">#</a>
						</h2>
						<Grid columns={3} gap={4} maxWidth={560}>
							<AspectRatio ratio={16 / 9}>
								<Center class="cell" height="100%"><Text type="supporting">16 / 9</Text></Center>
							</AspectRatio>
							<AspectRatio ratio={1}>
								<Center class="cell" height="100%"><Text type="supporting">1 / 1</Text></Center>
							</AspectRatio>
							<AspectRatio ratio={1} shape="ellipse" fit="cover">
								<div class="cell"></div>
							</AspectRatio>
						</Grid>
						<!-- AspectRatioWithSkeleton: the loading placeholder holds the same box. -->
						<Center width={600}>
							<AspectRatio ratio={16 / 9}>
								<Skeleton width="100%" height="100%" />
							</AspectRatio>
						</Center>
					</section>

					<section id="center" data-section="center">
						<h2 id="center">
							Center
							<a class="anchor" href="#center" aria-label="Link to Center">#</a>
						</h2>
						<!--
							AllAxisModes. Upstream's `Box` is a StyleX-styled div; StyleX cannot be
							imported from a `.svelte` file, so the blue box, the dashed padding
							outline and the fill area are plain classes in this page's stylesheet —
							the treatment every other block here gives storybook-local styles.
						-->
						<h3>All axis modes</h3>
						<Section variant="muted">
							<VStack gap={6}>
								<Card>
									<Text type="supporting" display="block">axis: both (default)</Text>
									<Center axis="both" width={300} height={150}>
										<div class="center-box">Both Axes</div>
									</Center>
								</Card>
								<Card>
									<Text type="supporting" display="block">axis: horizontal</Text>
									<Center axis="horizontal" width={300}>
										<div class="center-box">Horizontal Only</div>
									</Center>
								</Card>
								<Card>
									<Text type="supporting" display="block">axis: vertical</Text>
									<Center axis="vertical" height={150}>
										<div class="center-box">Vertical Only</div>
									</Center>
								</Card>
							</VStack>
						</Section>

						<!-- Padding — inner padding via the spacing scale (no inline styles needed). -->
						<h3>Padding</h3>
						<Section variant="muted" width="100%">
							<Center
								axis="both"
								width="100%"
								height={200}
								padding={4}
								class="center-padding-outline"
							>
								<div class="center-fill">
									<div class="center-box">Inset by padding on the spacing scale</div>
								</div>
							</Center>
						</Section>
						<p class="note">
							<code>padding</code>, <code>paddingInline</code> and <code>paddingBlock</code> (0.3.0)
							put inner padding on the spacing scale, so centred page content needs no wrapper for
							it — the same trio <code>Stack</code>, <code>Card</code>, <code>LayoutContent</code>
							and <code>LayoutPanel</code> already carry, and the per-axis props win over
							<code>padding</code> on their own axis. Upstream ships one story for the group —
							<em>Padding</em>, above — and exposes the per-axis pair as
							<code>argTypes</code> controls only, which a static page has no counterpart for; the
							dashed outline is the <code>Center</code> box itself, so the gap between it and the blue
							panel is the padding.
						</p>
					</section>

					<section id="card" data-section="card">
						<h2 id="card">
							Card
							<a class="anchor" href="#card" aria-label="Link to Card">#</a>
						</h2>
						<Grid columns={{ minWidth: 220, max: 3 }} gap={4}>
							<Card>
								<VStack gap={2}>
									<Heading level={5}>Default</Heading>
									<Text type="supporting" color="secondary">
										Border drawn inside the padding, so the total inset still equals the padding
										token.
									</Text>
								</VStack>
							</Card>
							<Card variant="muted">
								<VStack gap={2}>
									<Heading level={5}>Muted</Heading>
									<Text type="supporting" color="secondary">De-emphasised surface, no border.</Text>
								</VStack>
							</Card>
							<Card variant="blue">
								<VStack gap={2}>
									<Heading level={5}>Tinted</Heading>
									<Text type="supporting" color="secondary">One of ten palette tints.</Text>
								</VStack>
							</Card>
							<Card padding={2}>
								<Text type="supporting">padding=&lbrace;2&rbrace;</Text>
							</Card>
							<Card padding={6}>
								<Text type="supporting">padding=&lbrace;6&rbrace;</Text>
							</Card>
							<Card height={120}>
								<VStack gap={2}>
									<Text type="supporting">A fixed height makes the card scroll.</Text>
									{#each [1, 2, 3, 4, 5, 6] as n (n)}
										<Text type="supporting" color="secondary">overflow line {n}</Text>
									{/each}
								</VStack>
							</Card>
						</Grid>
						<p class="note">
							With no <code>padding</code> prop a card reads
							<code>--astryx-card-padding</code>, so a theme retunes every card at once. Passing the
							prop pins a spacing step instead.
						</p>
					</section>

					<section id="section" data-section="section">
						<h2 id="section">
							Section
							<a class="anchor" href="#section" aria-label="Link to Section">#</a>
						</h2>
						<HStack gap={6} wrap="wrap" vAlign="start">
							<Section variant="section" width={200}>
								<Text type="supporting">Surface background</Text>
							</Section>
							<Section variant="muted" width={200}>
								<Text type="supporting">Muted background</Text>
							</Section>
							<Section variant="transparent" width={200}>
								<Text type="supporting">Transparent background</Text>
							</Section>
						</HStack>
						<HStack gap={6} wrap="wrap" vAlign="start">
							<Section variant="muted" width={320}>
								<VStack gap={2}>
									<Heading level={5}>Section title</Heading>
									<Text type="supporting" color="secondary">
										Container padding is applied automatically, so simple content lines up on the
										spacing scale.
									</Text>
								</VStack>
							</Section>
							<Section variant="muted" width={250} padding={0}>
								<div style="background-color: rgba(0, 100, 200, 0.2); padding: 8px;">
									<Text type="supporting"
										>padding=&lbrace;0&rbrace; — content touches the section edges.</Text
									>
								</div>
							</Section>
						</HStack>
						<HStack gap={6} wrap="wrap" vAlign="start">
							<Section variant="section" width={260} dividers={['top', 'bottom']}>
								<Text type="supporting">dividers=&lbrace;['top', 'bottom']&rbrace;</Text>
							</Section>
							<Section variant="section" width={350} padding={6}>
								<Section variant="muted">
									<Text type="supporting"
										>Nested section inherits padding=&lbrace;6&rbrace; from its parent.</Text
									>
								</Section>
							</Section>
							<Section variant="section" width={350} padding={6}>
								<Section variant="muted" padding={2}>
									<Text type="supporting"
										>Nested section overrides with padding=&lbrace;2&rbrace;.</Text
									>
								</Section>
							</Section>
						</HStack>
						<p class="note">
							With no <code>padding</code> prop a section reads
							<code>--astryx-section-padding</code>, and an explicit <code>padding</code>
							republishes that token so nested sections inherit it. Rest props, <code>class</code>
							and
							<code>style</code> land on the outer wrapper that escapes the parent's container padding.
						</p>
					</section>

					<section id="layout" data-section="layout">
						<h2 id="layout">
							Layout
							<a class="anchor" href="#layout" aria-label="Link to Layout">#</a>
						</h2>
						<!--
				`padding={0}` is upstream's: the `Layout` inside owns the padding for each
				of its zones, so a padded card would double every gutter.
			-->
						<Card padding={0} height={320}>
							<Layout defaultHasDividers>
								{#snippet header()}
									<LayoutHeader>
										<HStack hAlign="between" vAlign="center">
											<Heading level={4}>Page Title</Heading>
											<Button label="Save" variant="primary" size="sm" />
										</HStack>
									</LayoutHeader>
								{/snippet}

								{#snippet start()}
									<!--
							Upstream's collapsible stories take the panel out of the tree rather
							than letting it sit at zero width, since a 0px panel still renders
							its padding box.
						-->
									{#if !sidebar.isCollapsed}
										<LayoutPanel
											resizable={sidebar.props}
											hasDivider={false}
											role="navigation"
											label="Sections"
										>
											<VStack gap={1}>
												<Button label="Overview" variant="ghost" size="sm" />
												<Button label="Members" variant="ghost" size="sm" />
												<Button label="Settings" variant="ghost" size="sm" />
											</VStack>
										</LayoutPanel>
									{/if}
									<ResizeHandle resizable={sidebar.props} hasDivider label="Resize sections" />
								{/snippet}

								{#snippet content()}
									<LayoutContent role="main">
										<VStack gap={3}>
											<Text type="body" color="secondary">
												The scrollable centre. Its padding is context-aware: the edges facing the
												panel and the header take the inner step, the ones touching the container
												take the outer.
											</Text>
											{#each ['One', 'Two', 'Three', 'Four', 'Five', 'Six'] as row (row)}
												<Card variant="muted" padding={3}><Text>Row {row}</Text></Card>
											{/each}
										</VStack>
									</LayoutContent>
								{/snippet}

								{#snippet end()}
									<LayoutPanel hasDivider width={180} role="complementary" label="Details">
										<MetadataList>
											<MetadataListItem label="Status">Active</MetadataListItem>
											<MetadataListItem label="Owner">Joey</MetadataListItem>
										</MetadataList>
									</LayoutPanel>
								{/snippet}

								{#snippet footer()}
									<LayoutFooter>
										<Text type="supporting" color="secondary">6 rows</Text>
									</LayoutFooter>
								{/snippet}
							</Layout>
						</Card>

						<VStack gap={2} style="margin-top: var(--spacing-6)">
							<Text type="label">height="auto", no dividers, contentWidth=420</Text>
							<Card padding={0}>
								<Layout height="auto" contentWidth={420}>
									{#snippet header()}
										<LayoutHeader><Heading level={5}>Seamless</Heading></LayoutHeader>
									{/snippet}
									{#snippet content()}
										<LayoutContent isScrollable={false}>
											<Text type="body" color="secondary">
												With no divider on the header, the content's top padding collapses so the
												two read as one surface — a CSS <code>:has()</code> rule on the layout's inner
												wrapper, with no JavaScript involved.
											</Text>
										</LayoutContent>
									{/snippet}
								</Layout>
							</Card>
						</VStack>
						<p class="note">
							Slots are snippets rather than element props, so <code>content</code> is written as
							<code>{'{#snippet content()}'}</code> where upstream writes
							<code>content={'{<LayoutContent/>}'}</code>. Everything else transcribes: the panel
							reads which slot it is in to pick its divider edge, the content reads which slots are
							filled to pick outer vs inner padding, and both are decided in CSS. The sections panel
							is driven by a
							<code>useResizable</code> region — drag the handle, or focus it and use the arrow
							keys,
							<code>Home</code>/<code>End</code>, or <code>Enter</code> to collapse. It carries no
							<code>hasDivider</code> of its own, which is what upstream asks for when an adjacent handle
							draws the line.
						</p>
					</section>

					<section id="overflowlist" data-section="overflowlist">
						<h2 id="overflowlist">
							OverflowList
							<a class="anchor" href="#overflowlist" aria-label="Link to OverflowList">#</a>
						</h2>
						<VStack gap={4}>
							<VStack gap={2}>
								<Text type="label"
									>Collapses to fit (the component's own <code>@example</code>)</Text
								>
								<!-- gap={2} + a `+N more` ghost indicator over four action buttons, in a
					     constrained box so the default `observeSelf` behaviour collapses. -->
								<div
									style="max-width: 220px; border: 1px solid var(--color-divider); border-radius: 8px; padding: 8px;"
								>
									<OverflowList gap={2} items={['Action 1', 'Action 2', 'Action 3', 'Action 4']}>
										{#snippet item(label)}
											<Button label={label as string} />
										{/snippet}
										{#snippet overflowRenderer(overflowItems)}
											<Button label={`+${overflowItems.length} more`} variant="ghost" />
										{/snippet}
									</OverflowList>
								</div>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Playground default (<code>behavior="observeParent"</code>)</Text>
								<!-- Upstream's playground uses `observeParent` so the preview keeps every
					     item content-sized rather than collapsing to one. -->
								<OverflowList
									behavior="observeParent"
									items={['Overview', 'Activity', 'Settings', 'Members', 'Billing']}
								>
									{#snippet item(label)}
										<Button label={label as string} variant="secondary" />
									{/snippet}
									{#snippet overflowRenderer(overflowItems)}
										<Button label={`+${overflowItems.length}`} variant="ghost" />
									{/snippet}
								</OverflowList>
							</VStack>
						</VStack>
						<p class="note">
							Upstream is compositional — it takes arbitrary element <code>children</code> and
							slices
							<code>Children.toArray</code>. A Svelte snippet is one opaque unit that can be
							rendered twice but never <em>sliced</em>, so this port takes <code>items</code> + an
							<code>item</code>
							snippet and slices the data, the shape <code>useOverflow</code>'s own docstring
							anticipates. The rendered DOM, classes and behaviour are otherwise identical. The
							<code>FilterPanel</code>
							/
							<code>DropdownMenu</code>-triggered indicator story is deferred until those components
							land.
						</p>
					</section>

					<section id="appshell" data-section="appshell">
						<h2 id="appshell">
							AppShell
							<a class="anchor" href="#appshell" aria-label="Link to AppShell">#</a>
						</h2>

						<NavAppShellDemos />

						<p class="note">
							Ports <strong>9 of upstream's 10</strong> stories; <code>Playground</code> is absent,
							being <code>TopNavWithSideNav</code> with the two defaults passed explicitly plus
							storybook <code>argTypes</code> controls a static page has no counterpart for. The
							shell composes over <code>Layout</code>: <code>topNav</code>, <code>sideNav</code>,
							<code>banner</code>
							and <code>mobileNav</code> are all <strong>snippets</strong> where upstream takes
							nodes, and
							<code>mobileNav</code>
							is <code>false | MobileNavConfig | Snippet</code> —
							<code>typeof === 'function'</code> is what discriminates markup from a config,
							standing in for React's <code>isValidElement</code>. Below the breakpoint the
							<em>same</em>
							nav content re-renders in different shapes through render-mode contexts rather than being
							duplicated. Each story is wrapped in a fixed-height frame because
							<code>AppShell</code>
							is <code>height: 100dvh</code> (or <code>min-height</code> in
							<code>auto</code> mode) and nine viewport-tall shells would be unreadable; the shell
							takes an inline <code>height: 100%</code> so it fills the frame instead. The icons
							substitute registry built-ins for upstream's Heroicons, as the rest of this page does
							— including <code>selectedIcon</code>, which cannot be "the same glyph, filled"
							because the registry ships no outline/solid pairs.
						</p>
					</section>

					<section id="sidenav" data-section="sidenav">
						<h2 id="sidenav">
							SideNav
							<a class="anchor" href="#sidenav" aria-label="Link to SideNav">#</a>
						</h2>

						<NavSideNavDemos />

						<p class="note">
							Ports <strong>all 14</strong> of upstream's stories, each in the 480px frame
							upstream's own decorator supplies — <code>SideNav</code> is <code>height: 100%</code>,
							so it needs a bounded parent. <code>header</code>, <code>footerIcons</code>,
							<code>endContent</code>
							and <code>SideNavHeading</code>'s <code>icon</code>/<code>menu</code> are snippets;
							<code>SideNavItem.icon</code>/<code>selectedIcon</code> are
							<code>IconName | Snippet</code>, the icon-slot shape <code>Button.icon</code> and
							<code>DropdownMenuItem.icon</code> already take. Upstream's <code>handleRef</code> has
							no counterpart: <code>SideNav</code> exposes <code>getCollapseState()</code> as an
							instance export, so the component instance reached through
							<code>bind:this</code> <em>is</em> the handle, and
							<code>SideNavCollapseButton</code> takes <code>handle</code> — no story exercises
							either, so neither appears here. One block inside <code>Collapsible Items</code> is
							absent: upstream's third section drives its item with <code>alert()</code>, which this
							page omits rather than substitutes (the <code>TreeList</code> <code>Interactive</code> precedent).
						</p>
					</section>

					<section id="topnav" data-section="topnav">
						<h2 id="topnav">
							TopNav
							<a class="anchor" href="#topnav" aria-label="Link to TopNav">#</a>
						</h2>

						<NavTopNavDemos />

						<p class="note">
							Ports <strong>all 9</strong> of <code>TopNav.stories.tsx</code> and
							<strong>all 4</strong>
							of <code>TopNavMenu.stories.tsx</code> (two <code>TopNavMenu</code>, two
							<code>TopNavMegaMenu</code>) — the menu stories live here because upstream composes
							both inside a <code>TopNav</code>. <code>heading</code>, <code>startContent</code>,
							<code>centerContent</code>
							and <code>endContent</code> are snippets, and <code>children</code> is a documented
							alias for <code>startContent</code> so items written as content do not silently
							disappear;
							<code>ChildrenNavigationItems</code>
							is the story for it. Supplying <code>centerContent</code> switches the bar from a flex
							row to a three-column grid. <code>TopNavMenuItemData.icon</code> and
							<code>TopNavMegaMenuItem.icon</code>
							are snippets, and its callback is <code>onclick</code>, not
							<code>onClick</code>. The mega menu's featured image is one of the local data-URI
							scenes
							<code>thumbnail-images.ts</code> substitutes for upstream's CDN photos, so the demo needs
							no network.
						</p>
					</section>

					<section id="mobilenav" data-section="mobilenav">
						<h2 id="mobilenav">
							MobileNav
							<a class="anchor" href="#mobilenav" aria-label="Link to MobileNav">#</a>
						</h2>

						<NavMobileNavDemos />

						<p class="note">
							Ports <strong>all 6</strong> of upstream's stories. Like <code>Dialog</code> and
							<code>Lightbox</code>, and unlike every popover in this library, the drawer is a
							native
							<code>&lt;dialog&gt;</code>
							opened with <code>showModal()</code> — the browser supplies the top layer,
							<code>::backdrop</code>, focus containment, body scroll lock and Escape. Each story
							keeps its own state and starts <em>closed</em>, since a drawer open on mount would
							cover the page. <code>header</code> is <code>string | Snippet</code> (a string gets a
							<code>Heading level={2}</code>), and <code>isOpen</code>/<code>onOpenChange</code> are
							bindable-friendly; inside an <code>AppShell</code> both come from context instead.
							<code>Responsive Pattern</code>
							switches on the viewport through <code>useMediaQuery</code>, so narrow the window
							below 768px to see the drawer branch rather than the inline sidebar.
						</p>
					</section>

					<section id="button-variants" data-section="button-variants">
						<h2 id="button-variants">
							Button variants
							<a class="anchor" href="#button-variants" aria-label="Link to Button variants">#</a>
						</h2>
						<div class="row">
							{#each variants as variant (variant)}
								<Button label={variant} {variant} />
							{/each}
						</div>
						<p class="note">
							Destructive is the theme's tell: neutral overrides it to a pastel red fill via
							<code>.astryx-button.destructive</code>. Toggle the theme off and it reverts to the
							default solid red.
						</p>
					</section>

					<section id="button-sizes" data-section="button-sizes">
						<h2 id="button-sizes">
							Button sizes
							<a class="anchor" href="#button-sizes" aria-label="Link to Button sizes">#</a>
						</h2>
						<div class="row">
							{#each sizes as size (size)}
								<Button label={size} variant="primary" {size} />
							{/each}
						</div>
					</section>

					<section id="button-states" data-section="button-states">
						<h2 id="button-states">
							Button states
							<a class="anchor" href="#button-states" aria-label="Link to Button states">#</a>
						</h2>
						<div class="row">
							<Button label="Disabled" isDisabled />
							<Button
								label="Disabled, with reason"
								tooltip="You do not have permission"
								isDisabled
							/>
							<Button label="Loading" variant="primary" isLoading />
							<Button label="Async action" variant="primary" clickAction={() => wait(1500)} />
						</div>
						<p class="note">
							<code>isInterruptible</code> has no tile: it is a documented prop, but upstream ships
							no story, block or <code>doc.mjs</code> example for it — the same standard the
							<code>ButtonGroup</code> section applies to <code>isDisabled</code>. It is covered by
							the ported tests instead. The disabled-with-tooltip button above is kept because
							<code>Button.doc.mjs</code> documents that exact pairing in prose: a tooltip'd
							disabled button uses <code>aria-disabled</code> so it stays focusable.
						</p>
					</section>

					<section id="button-icon-end-content-link" data-section="button-icon-end-content-link">
						<h2 id="button-icon-end-content-link">
							Button icon, end content, link
							<a
								class="anchor"
								href="#button-icon-end-content-link"
								aria-label="Link to Button icon, end content, link">#</a
							>
						</h2>
						<div class="row">
							<Button label="Save" variant="primary">
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</Button>
							<Button label="Save" variant="ghost" isIconOnly>
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</Button>
							<Button label="Messages">
								{#snippet endContent()}<Badge label="3" />{/snippet}
							</Button>
							<Button label="Messages" variant="secondary">
								{#snippet endContent()}<Icon icon="chevronDown" size="sm" />{/snippet}
							</Button>
							<Button label="Visit Example" variant="primary" href="https://example.com" />
						</div>
						<p class="note">
							Both slots take exactly what <code>Button.doc.mjs</code> lists as their
							<code>slotElements</code>: <code>icon</code> is an
							<code>&lt;Icon icon="check" size="sm" /&gt;</code>, and <code>endContent</code> is
							typed as
							<em>only</em>
							an <code>Icon</code> or a <code>Badge</code> — so a bare text node would be outside
							the documented API. Upstream's own icon blocks pair heroicons with richer labels;
							those glyphs are not in its 26-name registry, and the doc's <code>slotElements</code> are
							the machine-readable answer for what belongs in the slot.
						</p>
					</section>

					<section id="buttongroup" data-section="buttongroup">
						<h2 id="buttongroup">
							ButtonGroup
							<a class="anchor" href="#buttongroup" aria-label="Link to ButtonGroup">#</a>
						</h2>
						<HStack gap={6} vAlign="center">
							<ButtonGroup label="Text editing actions">
								<Button label="Copy" />
								<Button label="Cut" />
								<Button label="Paste" />
							</ButtonGroup>
							<ButtonGroup label="Save options">
								<Button label="Save" variant="primary" />
								<IconButton label="Save options" variant="primary">
									{#snippet icon()}<Icon icon="chevronDown" />{/snippet}
								</IconButton>
							</ButtonGroup>
							<ButtonGroup label="Merge options">
								<Button label="Merge pull request" variant="primary" />
								<!-- The story spells this one `<Button isIconOnly>`, where `ButtonGroupShowcase` above uses `<IconButton>`; both are kept as upstream writes them. -->
								<Button label="More merge options" variant="primary" isIconOnly>
									{#snippet icon()}<Icon icon="chevronDown" />{/snippet}
								</Button>
							</ButtonGroup>
							<ButtonGroup label="Edit actions">
								<Button label="Edit" />
								<IconButton label="More options">
									{#snippet icon()}<Icon icon="chevronDown" />{/snippet}
								</IconButton>
							</ButtonGroup>
						</HStack>
						<HStack gap={4} vAlign="center">
							<ButtonGroup label="Small actions" size="sm">
								<Button label="Copy" />
								<Button label="Paste" />
							</ButtonGroup>
							<ButtonGroup label="Medium actions" size="md">
								<Button label="Copy" />
								<Button label="Paste" />
							</ButtonGroup>
							<ButtonGroup label="Large actions" size="lg">
								<Button label="Copy" />
								<Button label="Paste" />
							</ButtonGroup>
							<ButtonGroup label="Actions" orientation="vertical">
								<Button label="Copy" />
								<Button label="Cut" />
								<Button label="Paste" />
							</ButtonGroup>
						</HStack>
						<p class="note">
							The connected look is entirely the <em>children's</em> job: each
							<code>Button</code> reads the group context and picks its own border and radius rules
							in pure CSS, so the group itself is a flex container plus two context providers. The
							trailing radius is keyed off
							<code>:not(:has(~ *:not([popover])))</code> rather than
							<code>:last-child</code>, so a member that renders its own layer — a tooltip'd
							<code>Button</code>, or a <code>DropdownMenu</code> — still gets the end cap. Arrow
							keys move between members via <code>useListFocus</code>; there is no roving tab stop,
							so every button stays individually tabbable, and <code>size</code> cascades through
							<code>SizeContext</code> so a child with its own <code>size</code> still wins.
						</p>
					</section>

					<section id="togglebutton" data-section="togglebutton">
						<h2 id="togglebutton">
							ToggleButton
							<a class="anchor" href="#togglebutton" aria-label="Link to ToggleButton">#</a>
						</h2>
						<HStack gap={3} wrap="wrap" vAlign="center">
							<ToggleButton
								label="Active"
								isPressed={tglActive}
								onPressedChange={(p) => (tglActive = p)}
							>
								Active
							</ToggleButton>
							<ToggleButton
								label="Favorite"
								isPressed={tglFavorite}
								onPressedChange={(p) => (tglFavorite = p)}
								isIconOnly
							>
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
								{#snippet pressedIcon()}<Icon icon="checkDouble" size="sm" />{/snippet}
							</ToggleButton>
							{#each ['sm', 'md', 'lg'] as const as size (size)}
								<ToggleButton
									label={size}
									{size}
									isPressed={tglActive}
									onPressedChange={(p) => (tglActive = p)}
									isIconOnly
								>
									{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
								</ToggleButton>
							{/each}
							<ToggleButton label="Disabled" isPressed={false} isDisabled>
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</ToggleButton>
							<ToggleButton label="Loading" isPressed={true} isLoading>
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</ToggleButton>
						</HStack>
						<HStack gap={6} wrap="wrap" vAlign="center">
							<ToggleButtonGroup
								value={tglView}
								onChange={(v: string | null) => (tglView = v)}
								label="View mode"
							>
								<ToggleButton value="list" label="List view" isIconOnly>
									{#snippet icon()}<Icon icon="menu" size="sm" />{/snippet}
								</ToggleButton>
								<ToggleButton value="grid" label="Grid view" isIconOnly>
									{#snippet icon()}<Icon icon="viewColumns" size="sm" />{/snippet}
								</ToggleButton>
							</ToggleButtonGroup>
							<ToggleButtonGroup
								type="multiple"
								value={tglFormats}
								onChange={(v) => (tglFormats = v)}
								label="Text formatting"
							>
								<ToggleButton value="bold" label="Bold" />
								<ToggleButton value="italic" label="Italic" />
								<ToggleButton value="underline" label="Underline" />
							</ToggleButtonGroup>
						</HStack>
						<p class="note">
							A thin wrapper over <code>Button</code> (ghost, interruptible) that adds
							<code>aria-pressed</code>, a <code>pressedIcon</code> swap, and a semibold-on-press
							shift with a hidden width-reservation copy to avoid layout shift.
							<code>ToggleButtonGroup</code>
							coordinates
							<code>single</code> (click active to deselect) or <code>multiple</code> selection.
						</p>
					</section>

					<section id="segmentedcontrol" data-section="segmentedcontrol">
						<h2 id="segmentedcontrol">
							SegmentedControl
							<a class="anchor" href="#segmentedcontrol" aria-label="Link to SegmentedControl">#</a>
						</h2>
						<VStack gap={4}>
							<SegmentedControl
								value={segViewMode}
								onChange={(v) => (segViewMode = v)}
								label="View mode"
							>
								<SegmentedControlItem value="grid" label="Grid" />
								<SegmentedControlItem value="list" label="List" />
								<SegmentedControlItem value="table" label="Table" />
							</SegmentedControl>
							<SegmentedControl
								value={segIconMode}
								onChange={(v) => (segIconMode = v)}
								label="View mode"
							>
								<SegmentedControlItem value="grid" label="Grid">
									{#snippet icon()}<Icon icon="viewColumns" color="inherit" />{/snippet}
								</SegmentedControlItem>
								<SegmentedControlItem value="list" label="List">
									{#snippet icon()}<Icon icon="menu" color="inherit" />{/snippet}
								</SegmentedControlItem>
								<SegmentedControlItem value="calendar" label="Calendar" isLabelHidden>
									{#snippet icon()}<Icon icon="calendar" color="inherit" />{/snippet}
								</SegmentedControlItem>
							</SegmentedControl>
							{#each ['sm', 'md', 'lg'] as const as size (size)}
								<SegmentedControl
									value={segPeriod}
									onChange={(v) => (segPeriod = v)}
									label="Time period"
									{size}
								>
									<SegmentedControlItem value="day" label="Day" />
									<SegmentedControlItem value="week" label="Week" />
									<SegmentedControlItem value="month" label="Month" />
								</SegmentedControl>
							{/each}
							<SegmentedControl
								value={segGranularity}
								onChange={(v) => (segGranularity = v)}
								label="Data granularity"
							>
								<SegmentedControlItem value="hourly" label="Hourly" />
								<SegmentedControlItem value="daily" label="Daily" />
								<SegmentedControlItem value="weekly" label="Weekly" isDisabled />
							</SegmentedControl>
							<SegmentedControl
								value={segFilter}
								onChange={(v) => (segFilter = v)}
								label="Filter"
								isDisabled
								disabledMessage="Choose a project to filter tasks"
							>
								<SegmentedControlItem value="all" label="All" />
								<SegmentedControlItem value="active" label="Active" />
								<SegmentedControlItem value="completed" label="Completed" />
							</SegmentedControl>
						</VStack>
						<p class="note">
							A radiogroup that controls a value, not a view. Roving tabindex + arrow/Home/End
							navigation and selection-follows-focus come from <code>useListFocus</code>; a keyboard
							hint appears on first focus. <code>disabledMessage</code> keeps a whole-group-disabled control
							focusable so its reason tooltip is keyboard-discoverable.
						</p>
					</section>

					<section id="link" data-section="link">
						<h2 id="link">
							Link
							<a class="anchor" href="#link" aria-label="Link to Link">#</a>
						</h2>
						<div class="row">
							<Link href="/docs">Documentation</Link>
							<Link href="https://github.com" isExternalLink>GitHub</Link>
							<Link href="/privacy" hasUnderline>Privacy Policy</Link>
							<Link href="/settings" color="primary">Primary</Link>
							<Link href="/settings" color="secondary">Secondary</Link>
							<Link href="/terms" isStandalone>Terms of Service</Link>
							<Link href="/help" tooltip="Opens the help centre">Help</Link>
							<Link href="/locked" isDisabled>Disabled</Link>
							<Link onclick={() => (selectedItem = 'ada')}>Action (no href)</Link>
						</div>
						<p>
							<Text>
								Read our <Link href="/terms" type="inherit">terms</Link> before continuing.
							</Text>
						</p>
						<p class="note">
							A <code>Link</code> renders a real <code>&lt;a&gt;</code>, falls back to a
							<code>&lt;button&gt;</code> when it has no <code>href</code> (the last one), and
							becomes an inert, unfocusable anchor when disabled. Wrap an app in
							<code>LinkProvider</code> to route every link through a framework router — it has no visual
							output of its own, so it is not shown here.
						</p>
					</section>

					<section id="navicon-iconbutton" data-section="navicon-iconbutton">
						<h2 id="navicon-iconbutton">
							NavIcon, IconButton
							<a class="anchor" href="#navicon-iconbutton" aria-label="Link to NavIcon, IconButton"
								>#</a
							>
						</h2>
						<!-- NavIconShowcase: an HStack, as upstream's block uses - not a page div. -->
						<HStack gap={4} vAlign="center">
							{#each ['search', 'calendar', 'wrench'] as const as name (name)}
								<NavIcon>
									{#snippet icon()}<Icon icon={name} />{/snippet}
								</NavIcon>
							{/each}
						</HStack>
						<!-- IconButtonActionBar: human labels, not the registry's icon names. -->
						<HStack gap={1}>
							{#each ICON_BUTTON_ACTIONS as action (action.icon)}
								<IconButton label={action.label} variant="ghost">
									{#snippet icon()}<Icon icon={action.icon} color="inherit" />{/snippet}
								</IconButton>
							{/each}
						</HStack>
						<!-- IconButtonTooltipIconButton: the tooltip differs from the accessible name. -->
						<HStack gap={2}>
							{#each ICON_BUTTON_TOOLTIPS as action (action.icon)}
								<IconButton label={action.label} variant="ghost" tooltip={action.tooltip}>
									{#snippet icon()}<Icon icon={action.icon} color="inherit" />{/snippet}
								</IconButton>
							{/each}
						</HStack>
						<p class="note">
							<code>IconButton</code> is <code>&lt;Button isIconOnly&gt;</code> under a name, and it
							is the first component that needed <code>ButtonProps</code> to exist — it declares its
							own props as
							<code>Omit&lt;ButtonProps, …&gt;</code>, exactly as upstream does.
						</p>
					</section>

					<section id="moremenu" data-section="moremenu">
						<h2 id="moremenu">
							MoreMenu
							<a class="anchor" href="#moremenu" aria-label="Link to MoreMenu">#</a>
						</h2>
						<div class="row">
							<MoreMenu
								items={[
									{ label: 'Edit', onClick: () => {} },
									{ label: 'Duplicate', onClick: () => {} },
									{ label: 'Delete', onClick: () => {} }
								]}
							/>
							<MoreMenu
								items={[
									{ label: 'Edit', icon: 'wrench', onClick: () => {} },
									{ label: 'Duplicate', icon: 'copy', onClick: () => {} },
									{ type: 'divider' },
									{ label: 'Delete', icon: 'close', onClick: () => {} }
								]}
							/>
							<MoreMenu
								label="Document actions"
								items={[
									{
										type: 'section',
										title: 'Edit',
										items: [
											{ label: 'Rename', onClick: () => {} },
											{ label: 'Duplicate', icon: 'copy', onClick: () => {} }
										]
									},
									{
										type: 'section',
										title: 'Share',
										items: [{ label: 'Copy link', icon: 'externalLink', onClick: () => {} }]
									}
								]}
							/>
							<MoreMenu size="sm" items={[{ label: 'Edit', onClick: () => {} }]} />
							<MoreMenu isDisabled items={[{ label: 'Edit', onClick: () => {} }]} />
						</div>
						<p class="note">
							A thin wrapper over <code>DropdownMenu</code> with icon-only button defaults: the
							trigger is a ghost <code>Button</code> carrying the registry's
							<code>moreHorizontal</code>
							icon, its
							<code>label</code> doubles as the <code>aria-label</code> and the tooltip, and
							<code>hasChevron</code> is off. Everything else — items, sections, dividers, disabled
							rows — is <code>DropdownMenu</code>'s.
						</p>
					</section>

					<section id="toolbar" data-section="toolbar">
						<h2 id="toolbar">
							Toolbar
							<a class="anchor" href="#toolbar" aria-label="Link to Toolbar">#</a>
						</h2>
						<Toolbar label="Formatting actions" dividers={['bottom']}>
							{#snippet startContent()}
								<Button label="Cut" variant="ghost" />
								<Button label="Copy" variant="ghost" />
								<Button label="Paste" variant="ghost" />
							{/snippet}
							{#snippet endContent()}
								<MoreMenu items={[{ label: 'Settings', onClick: () => {} }]} />
							{/snippet}
						</Toolbar>
						<Toolbar label="Three-slot toolbar" size="sm" variant="muted">
							{#snippet startContent()}
								<Button label="Undo" variant="ghost" size="sm" />
							{/snippet}
							{#snippet centerContent()}
								<Text type="supporting">Draft saved</Text>
							{/snippet}
							{#snippet endContent()}
								<Button label="Publish" variant="primary" size="sm" />
							{/snippet}
						</Toolbar>
						<p class="note">
							Built on <code>Section</code>, with roving-tabindex arrow navigation from
							<code>useListFocus</code> and a keyboard hint on first keyboard entry. Its
							<code>size</code> cascades to children through the size context, and the slots carry
							edge compensation so the ghost buttons sit flush with the container's padding. Passing
							<code>centerContent</code> switches the layout from two-slot flex to a
							<code>1fr auto 1fr</code> grid.
						</p>
					</section>

					<section id="tablist" data-section="tablist">
						<h2 id="tablist">
							TabList
							<a class="anchor" href="#tablist" aria-label="Link to TabList">#</a>
						</h2>

						{#snippet homeIcon()}
							<svg viewBox="0 0 16 16" fill="currentColor" width="100%" height="100%">
								<path
									d="M8.543 2.232a.75.75 0 0 0-1.085 0l-5.25 5.5A.75.75 0 0 0 2.75 9H4v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V9h1.25a.75.75 0 0 0 .543-1.268l-5.25-5.5Z"
								/>
							</svg>
						{/snippet}
						{#snippet cogIcon()}
							<svg viewBox="0 0 16 16" fill="currentColor" width="100%" height="100%">
								<path
									fill-rule="evenodd"
									d="M6.955 1.45A.5.5 0 0 1 7.452 1h1.096a.5.5 0 0 1 .497.45l.17 1.699c.484.12.94.312 1.356.562l1.321-.816a.5.5 0 0 1 .67.087l.774.774a.5.5 0 0 1 .087.67l-.816 1.321c.25.416.442.872.562 1.356l1.699.17a.5.5 0 0 1 .45.497v1.096a.5.5 0 0 1-.45.497l-1.699.17c-.12.484-.312.94-.562 1.356l.816 1.321a.5.5 0 0 1-.087.67l-.774.774a.5.5 0 0 1-.67.087l-1.321-.816c-.416.25-.872.442-1.356.562l-.17 1.699a.5.5 0 0 1-.497.45H7.452a.5.5 0 0 1-.497-.45l-.17-1.699a4.973 4.973 0 0 1-1.356-.562l-1.321.816a.5.5 0 0 1-.67-.087l-.774-.774a.5.5 0 0 1-.087-.67l.816-1.321a4.972 4.972 0 0 1-.562-1.356l-1.699-.17A.5.5 0 0 1 1 8.548V7.452a.5.5 0 0 1 .45-.497l1.699-.17c.12-.484.312-.94.562-1.356l-.816-1.321a.5.5 0 0 1 .087-.67l.774-.774a.5.5 0 0 1 .67-.087l1.321.816c.416-.25.872-.442 1.356-.562l.17-1.699ZM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
									clip-rule="evenodd"
								/>
							</svg>
						{/snippet}
						{#snippet desktopIcon()}
							<svg viewBox="0 0 16 16" fill="currentColor" width="100%" height="100%">
								<path
									d="M2.5 3A1.5 1.5 0 0 0 1 4.5v5A1.5 1.5 0 0 0 2.5 11h4.75v1.5H5a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5H8.75V11h4.75A1.5 1.5 0 0 0 15 9.5v-5A1.5 1.5 0 0 0 13.5 3h-11Zm0 1.5h11v5h-11v-5Z"
								/>
							</svg>
						{/snippet}
						{#snippet phoneIcon()}
							<svg viewBox="0 0 16 16" fill="currentColor" width="100%" height="100%">
								<path
									d="M5 1.5A1.5 1.5 0 0 0 3.5 3v10A1.5 1.5 0 0 0 5 14.5h6a1.5 1.5 0 0 0 1.5-1.5V3A1.5 1.5 0 0 0 11 1.5H5Zm0 1.5h6v10H5V3Zm2.25 8.5a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75Z"
								/>
							</svg>
						{/snippet}
						{#snippet funnelIcon()}
							<Icon icon="funnel" />
						{/snippet}
						{#snippet themeIcon()}
							<svg viewBox="0 0 16 16" fill="currentColor" width="100%" height="100%">
								<path
									d="M8 1.5a6.5 6.5 0 0 0 0 13h.25a1.75 1.75 0 0 0 1.2-3.02.35.35 0 0 1 .23-.6h.97A3.85 3.85 0 0 0 14.5 7.03 5.53 5.53 0 0 0 8.97 1.5H8Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm2-1.75a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM4.5 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm6-1.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
								/>
							</svg>
						{/snippet}

						<VStack gap={6}>
							<VStack gap={2}>
								<Text type="label">Default</Text>
								<TabList value={tabDefault} onChange={(v) => (tabDefault = v)}>
									<Tab value="home" label="Home" />
									<Tab value="projects" label="Projects" />
									<Tab value="settings" label="Settings" />
								</TabList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">With menu</Text>
								<TabList value={tabWithMenu} onChange={(v) => (tabWithMenu = v)}>
									<Tab value="home" label="Home" />
									<Tab value="projects" label="Projects" />
									<TabMenu
										label="More"
										options={[
											{ value: 'analytics', label: 'Analytics' },
											{ value: 'reports', label: 'Reports' },
											{ value: 'billing', label: 'Billing' }
										]}
									/>
								</TabList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Menu with a selected child</Text>
								<TabList value={tabMenuChild} onChange={(v) => (tabMenuChild = v)}>
									<Tab value="home" label="Home" />
									<Tab value="projects" label="Projects" />
									<TabMenu
										label="More"
										options={[
											{ value: 'analytics', label: 'Analytics' },
											{ value: 'reports', label: 'Reports' }
										]}
									/>
								</TabList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Size variants</Text>
								{#each tabSizeRamp as size (size)}
									<Text type="supporting">size="{size}"</Text>
									<TabList value={tabSizes} onChange={(v) => (tabSizes = v)} {size}>
										<Tab value="home" label="Home" />
										<Tab value="projects" label="Projects" />
										<Tab value="settings" label="Settings" />
									</TabList>
								{/each}
							</VStack>

							<VStack gap={2}>
								<Text type="label">With icons</Text>
								<TabList value={tabIcons} onChange={(v) => (tabIcons = v)}>
									<Tab value="home" label="Home" icon={homeIcon} />
									<Tab value="settings" label="Settings" icon={cogIcon} />
								</TabList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Icon only</Text>
								<TabList value={tabIconOnly} onChange={(v) => (tabIconOnly = v)}>
									<Tab value="desktop" label="Desktop preview" icon={desktopIcon} isLabelHidden />
									<Tab value="phone" label="Phone preview" icon={phoneIcon} isLabelHidden />
									<Tab value="theme" label="Theme" icon={themeIcon} isLabelHidden />
								</TabList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">With actions</Text>
								<TabList value={tabActions} onChange={(v) => (tabActions = v)} size="lg" hasDivider>
									<Tab value="all" label="All items" />
									<Tab value="active" label="Active" />
									<Tab value="archived" label="Archived" />
									<div class="tab-actions">
										<Button label="Filter" variant="ghost" size="lg" icon={funnelIcon} isIconOnly />
										<Button label="New item" variant="primary" size="lg" />
									</div>
								</TabList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Divider gap (sm / md / lg)</Text>
								{#each tabSizeRamp as size (size)}
									<Text type="supporting">size="{size}" · hasDivider · matched Button size</Text>
									<TabList
										value={tabDividerGap}
										onChange={(v) => (tabDividerGap = v)}
										{size}
										hasDivider
									>
										<Tab value="overview" label="Overview" />
										<Tab value="activity" label="Activity" />
										<Tab value="settings" label="Settings" />
										<div class="tab-actions">
											<Button label="Filter" variant="ghost" {size} icon={funnelIcon} isIconOnly />
											<Button label="New item" variant="primary" {size} />
										</div>
									</TabList>
								{/each}
							</VStack>

							<VStack gap={2}>
								<Text type="label">Fill layout</Text>
								<div class="tab-fill-frame">
									<TabList value={tabFill} onChange={(v) => (tabFill = v)} layout="fill" hasDivider>
										<Tab value="home" label="Home" />
										<Tab value="projects" label="Projects" />
										<Tab value="settings" label="Settings" />
									</TabList>
								</div>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Overflow</Text>
								<div class="tab-overflow-frame">
									<TabList value={tabOverflow} onChange={(v) => (tabOverflow = v)}>
										<Carousel items={overflowTabs} gap={0.5} hasSnap={false} aria-label="Tabs">
											{#snippet item(tab)}
												<Tab value={tab.value} label={tab.label} />
											{/snippet}
										</Carousel>
									</TabList>
								</div>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Overflow with divider</Text>
								<div class="tab-overflow-narrow">
									<TabList
										value={tabOverflowDivider}
										onChange={(v) => (tabOverflowDivider = v)}
										hasDivider
										size="lg"
									>
										<Carousel
											items={overflowDividerTabs}
											gap={0.5}
											hasSnap={false}
											aria-label="Tabs"
										>
											{#snippet item(tab)}
												<Tab value={tab.value} label={tab.label} />
											{/snippet}
										</Carousel>
									</TabList>
								</div>
							</VStack>
						</VStack>
						<p class="note">
							A <code>&lt;nav&gt;</code> whose strip is a single Tab stop: <code>useListFocus</code>
							with
							<code>hasRovingTabIndex</code> owns one <code>tabindex="0"</code> across every
							<code>Tab</code> and the <code>TabMenu</code> trigger, and both arrow axes navigate
							per the APG allowance for tab strips — unconditionally, which is why 0.2.0 removed the
							<code>orientation</code> prop: it never rendered vertical tabs and never changed which
							arrows worked, it only picked the hint badge's glyphs. <code>aria-orientation</code>
							is deliberately
							<em>not</em> emitted (it is invalid on the navigation role), even if a caller passes
							one. Each tab reserves its selected (semibold) width with an invisible sizer cell, so
							selecting never reflows the strip. <code>hasDivider</code> reserves a gap under the
							tabs and publishes <code>--_tab-indicator-bottom</code> so the selected indicator
							drops onto the rail. The two overflow blocks wrap the tabs in <code>Carousel</code>,
							which takes
							<code>items</code> + an <code>item</code> snippet here rather than children.
						</p>
					</section>

					<section id="collapsible" data-section="collapsible">
						<h2 id="collapsible">
							Collapsible
							<a class="anchor" href="#collapsible" aria-label="Link to Collapsible">#</a>
						</h2>
						<VStack gap={4}>
							<VStack gap={2}>
								<Card>
									<Collapsible trigger="Starts open (default)">
										<Text type="body"
											>This collapsible manages its own state. Click the trigger to toggle.</Text
										>
									</Collapsible>
								</Card>
								<Card>
									<Collapsible trigger="Starts collapsed" defaultIsOpen={false}>
										<Text type="body">This collapsible starts collapsed. Click to reveal.</Text>
									</Collapsible>
								</Card>
								<Card>
									<Collapsible trigger="Disabled — can't be toggled" isDisabled>
										<Text type="body">The trigger is non-interactive and dimmed.</Text>
									</Collapsible>
								</Card>
							</VStack>
							<CollapsibleGroup type="single" defaultValue="general">
								<VStack gap={2}>
									<Card>
										<Collapsible trigger="General settings" value="general">
											<Text type="body">Language, timezone, and display options.</Text>
										</Collapsible>
									</Card>
									<Card>
										<Collapsible trigger="Privacy settings" value="privacy">
											<Text type="body">Manage who can see your profile and activity.</Text>
										</Collapsible>
									</Card>
									<Card>
										<Collapsible trigger="Notification settings" value="notifications">
											<Text type="body">Choose which notifications you receive.</Text>
										</Collapsible>
									</Card>
								</VStack>
							</CollapsibleGroup>
							<div style="max-width: 480px">
								<CollapsibleGroup type="single" hasDividers defaultValue="q1">
									<Collapsible trigger="How do I reset my password?" value="q1">
										<Text type="body">Go to Settings → Security → Change Password.</Text>
									</Collapsible>
									<Collapsible trigger="Can I change my username?" value="q2">
										<Text type="body">Usernames can be changed once every 30 days.</Text>
									</Collapsible>
									<Collapsible trigger="How do I delete my account?" value="q3">
										<Text type="body"
											>Account deletion is permanent; data is removed within 30 days.</Text
										>
									</Collapsible>
								</CollapsibleGroup>
							</div>
						</VStack>
						<p class="note">
							A disclosure primitive: a trigger with a rotating chevron and a region toggled via
							<code>display:none</code> (children stay mounted). Standalone by default, or
							coordinated by
							<code>CollapsibleGroup</code> — <code>single</code> (accordion) or
							<code>multiple</code>.
							<code>hasDividers</code> renders a wrapper and draws hairline row chrome; the group is otherwise
							DOM-less.
						</p>
					</section>

					<section id="badge" data-section="badge">
						<h2 id="badge">
							Badge
							<a class="anchor" href="#badge" aria-label="Link to Badge">#</a>
						</h2>
						<HStack gap={2} wrap="wrap" vAlign="center">
							{#each badgeVariants as variant (variant)}
								<Badge {variant} label={variant} />
							{/each}
							<Badge variant="success" label="Deployed">
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</Badge>
						</HStack>
						<p class="note">
							The five semantic variants take a solid fill; the nine colour-named ones take a tinted
							background with matching text, so a row of them stays readable.
						</p>
					</section>

					<section id="token" data-section="token">
						<h2 id="token">
							Token
							<a class="anchor" href="#token" aria-label="Link to Token">#</a>
						</h2>
						<HStack gap={2} wrap="wrap" vAlign="center">
							{#each tokenColors as color (color)}
								<Token label={color} {color} />
							{/each}
						</HStack>
						<HStack gap={2} wrap="wrap" vAlign="center">
							{#each ['sm', 'md', 'lg'] as const as size (size)}
								<Token label={size} {size} />
							{/each}
							<Token label="With icon">
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</Token>
							<Token label="Count">
								{#snippet endContent()}<Badge label="3" variant="neutral" />{/snippet}
							</Token>
						</HStack>
						<HStack gap={2} wrap="wrap" vAlign="center">
							<Token label="Removable" onRemove={() => {}} />
							<Token label="Clickable" onclick={() => {}} />
							<Token label="Link token" href="#" />
							<Token label="Disabled" isDisabled />
							<Token label="Hidden label" isLabelHidden>
								{#snippet icon()}<Icon icon="check" size="sm" />{/snippet}
							</Token>
						</HStack>
						<p class="note">
							A token renders as a <code>&lt;span&gt;</code> by default, an
							<code>&lt;a&gt;</code> with <code>href</code>, or a span wrapping an invisible
							<code>&lt;button&gt;</code> with <code>onclick</code> — so the focus ring wraps the
							whole token. <code>onRemove</code> adds the trailing X;
							<code>isLabelHidden</code> keeps the accessible name.
						</p>
					</section>

					<section id="statusdot" data-section="statusdot">
						<h2 id="statusdot">
							StatusDot
							<a class="anchor" href="#statusdot" aria-label="Link to StatusDot">#</a>
						</h2>
						<HStack gap={4} wrap="wrap" vAlign="center">
							<HStack gap={2} vAlign="center"
								><StatusDot variant="success" label="Online" /><Text>Online</Text></HStack
							>
							<HStack gap={2} vAlign="center"
								><StatusDot variant="warning" label="Away" /><Text>Away</Text></HStack
							>
							<HStack gap={2} vAlign="center"
								><StatusDot variant="error" label="Offline" /><Text>Offline</Text></HStack
							>
							<HStack gap={2} vAlign="center"
								><StatusDot variant="accent" label="Live" isPulsing /><Text>Live (pulsing)</Text
								></HStack
							>
							<HStack gap={2} vAlign="center"
								><StatusDot variant="neutral" label="Unknown" /><Text>Unknown</Text></HStack
							>
							<HStack gap={2} vAlign="center"
								><StatusDot variant="success" label="Online" tooltip="Online" /><Text
									>With tooltip</Text
								></HStack
							>
						</HStack>
					</section>

					<section id="progressbar" data-section="progressbar">
						<h2 id="progressbar">
							ProgressBar
							<a class="anchor" href="#progressbar" aria-label="Link to ProgressBar">#</a>
						</h2>
						<VStack gap={4} maxWidth={420}>
							<ProgressBar value={72} label="Upload progress" hasValueLabel />
							<ProgressBar
								value={3.2}
								max={5}
								label="Disk usage"
								variant="warning"
								hasValueLabel
								formatValueLabel={(v, m) => `${v} GB / ${m} GB`}
							/>
							<ProgressBar value={100} label="Complete" variant="success" hasValueLabel />
							<ProgressBar value={30} label="Cancelled" isDisabled hasValueLabel />
							<ProgressBar isIndeterminate label="Processing…" />
							<ProgressBar value={40} label="Hidden label" isLabelHidden />
							<ProgressBar
								value={45}
								label="Fundraiser"
								hasValueLabel
								marks={[{ value: 80, label: 'Goal' }]}
							/>
							<ProgressBar
								value={55}
								label="Quarterly milestones"
								hasValueLabel
								marks={[
									{ value: 25, label: 'Q1 target' },
									{ value: 50, label: 'Q2 target' },
									{ value: 80, label: 'Stretch goal' }
								]}
							/>
							<ProgressBar
								value={92}
								label="Budget used"
								hasValueLabel
								variant="warning"
								marks={[{ value: 75, label: 'Budget cap' }]}
							/>
							<!--
								ThemedMarks. Upstream's note: marks are themeable directly via the
								`progressbar-mark` target — a theme sets `backgroundColor`, `width` and
								`height` on it with `defineTheme`, no dedicated CSS vars needed, and a
								taller height overhangs the bar symmetrically. Upstream shows the effect
								without a full theme by injecting a raw `<style>` block for
								`.astryx-progressbar-mark`; the counterpart here is a `:global` rule in
								this page's own stylesheet, since Svelte scopes styles to the component
								that declares them and the mark belongs to `ProgressBar`.
							-->
							<div class="themed-marks-demo">
								<ProgressBar
									value={55}
									label="Themed target marks"
									hasValueLabel
									marks={[
										{ value: 25, label: 'Lower bound' },
										{ value: 80, label: 'Upper bound' }
									]}
								/>
							</div>
						</VStack>
						<p class="note">
							<code>marks</code> (0.3.0) draws target ticks on the track at fixed points in the same
							<code>0..max</code> space as <code>value</code> — a funding goal, a budget cap, a
							milestone. Each mark's <code>label</code> is required and becomes its tooltip, so the
							tick is a focusable trigger; the <code>Tooltip</code> behind it is loaded lazily, so a
							consumer with no marks never pulls it into the bundle. Marks are ignored while
							<code>isIndeterminate</code>.
						</p>
					</section>

					<section id="avatar" data-section="avatar">
						<h2 id="avatar">
							Avatar
							<a class="anchor" href="#avatar" aria-label="Link to Avatar">#</a>
						</h2>
						<div class="row">
							{#each avatarSizes as size (size)}
								<Avatar {size} name="Ada Lovelace" />
							{/each}
						</div>
						<HStack gap={3} vAlign="center">
							<Avatar size={64} name="Ada Lovelace" />
							<Text type="supporting" color="secondary">Numeric size (64)</Text>
						</HStack>
						<!--
				AvatarInitialsFallback: how a name is reduced to initials - first + last,
				a single name, a multi-word name, and a prefixed one.
			-->
						<HStack gap={6} vAlign="center">
							{#each AVATAR_INITIALS as entry (entry.name)}
								<VStack gap={2} hAlign="center">
									<Avatar name={entry.name} size="lg" />
									<Text type="supporting" color="secondary">{entry.note}</Text>
								</VStack>
							{/each}
						</HStack>
						<!--
				The fallback chain, in upstream's `AvatarFallbackChain` shape: each row is
				an `HStack` whose caption is a sibling `Text`, and `alt` is left unset.
				The captions used to be passed *as* `alt`, which is what a screen reader
				announces for the person — an accessibility defect, not just a parity one.
				The URLs stay local: upstream's point is the chain, and a path that
				reliably 404s here demonstrates it where a remote CDN URL may not.
			-->
						<VStack gap={4}>
							<HStack gap={3} vAlign="center">
								<Avatar name="Alice" size="lg" />
								<Text type="supporting">Has name, no src</Text>
							</HStack>
							<HStack gap={3} vAlign="center">
								<Avatar size="lg" />
								<Text type="supporting">All invalid, no name</Text>
							</HStack>
							<HStack gap={3} vAlign="center">
								<Avatar size="lg" name="Test User" src="/nope.png" />
								<Text type="supporting">Both invalid, has name</Text>
							</HStack>
							<HStack gap={3} vAlign="center">
								<Avatar size="lg" name="Invalid User" src="/nope.png" fallbackSrc="/favicon.svg" />
								<Text type="supporting">Invalid src, valid fallbackSrc</Text>
							</HStack>
						</VStack>
						<div class="row">
							<Avatar size="lg" name="Alex Daniels">
								{#snippet status()}
									<AvatarStatusDot variant="success" label="Online" />
								{/snippet}
							</Avatar>
							<Avatar size="lg" name="Ann Smith">
								{#snippet status()}
									<AvatarStatusDot variant="neutral" label="Offline" />
								{/snippet}
							</Avatar>
							<Avatar size="xl" name="Carol Davis">
								{#snippet status()}
									<AvatarStatusDot variant="error" label="Busy" />
								{/snippet}
							</Avatar>
							<!--
					The iconed dot at `large` and again at `small`: the icon is dropped
					below the 40px tier, which is the behaviour the note describes and
					which upstream's `StatusWithIcon` story exists to show.
				-->
							<Avatar size="md" name="Gina Wilson">
								{#snippet status()}
									<AvatarStatusDot variant="success" label="Verified">
										{#snippet icon()}
											<Icon icon="check" size="sm" />
										{/snippet}
									</AvatarStatusDot>
								{/snippet}
							</Avatar>
							<Avatar size="xl" name="Eve Park">
								{#snippet status()}
									<AvatarStatusDot variant="success" label="Verified">
										{#snippet icon()}
											<Icon icon="check" size="sm" />
										{/snippet}
									</AvatarStatusDot>
								{/snippet}
							</Avatar>
						</div>
						<p class="note">
							A failed <code>src</code> falls through to <code>fallbackSrc</code>, then to initials,
							then to a generic icon. The dot reads the avatar's size from context and picks one of
							three tiers — its icon is dropped below 40px, where it could not be legible.
						</p>
					</section>

					<section id="avatargroup" data-section="avatargroup">
						<h2 id="avatargroup">
							AvatarGroup
							<a class="anchor" href="#avatargroup" aria-label="Link to AvatarGroup">#</a>
						</h2>
						<div class="stack">
							<AvatarGroup size="lg">
								{#each teamMembers.slice(0, 3) as member (member)}
									<Avatar name={member} />
								{/each}
								<AvatarGroupOverflow count={teamMembers.length - 3} />
							</AvatarGroup>

							<AvatarGroup size="md">
								{#each teamMembers.slice(0, 4) as member (member)}
									<Avatar name={member} />
								{/each}
								<AvatarGroupOverflow
									count={teamMembers.length - 4}
									onclick={() => alert('Show all participants')}
								/>
							</AvatarGroup>

							<AvatarGroup size="md">
								{#each teamMembers.slice(0, 2) as member (member)}
									<Avatar name={member} size="xl" />
								{/each}
								<AvatarGroupOverflow count={teamMembers.length - 2}>
									{teamMembers.length - 2}+
								</AvatarGroupOverflow>
							</AvatarGroup>
						</div>
						<p class="note">
							The group hands each child its size and overlap through context, so it never inspects
							its children — <code>size</code> on an Avatar inside is overridden. The second
							overflow takes an
							<code>onclick</code>, which is what turns it into a <code>&lt;button&gt;</code> with a
							focus ring. The third group's children ask for <code>size="xl"</code> and are
							overridden to
							<code>small</code>, and its overflow replaces the default <code>+N</code> with its own content.
						</p>
					</section>

					<section id="thumbnail" data-section="thumbnail">
						<h2 id="thumbnail">
							Thumbnail
							<a class="anchor" href="#thumbnail" aria-label="Link to Thumbnail">#</a>
						</h2>
						<!-- ThumbnailShowcase: the single-thumbnail form the docs lead with. -->
						<Thumbnail src={SNOWY_PEAKS} alt="Snowy mountain peaks" label="snowy-peaks.jpg" />
						<VStack gap={4}>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Lifecycle: empty → uploading → processing → loaded
								</Text>
								<HStack gap={3} vAlign="end">
									<VStack gap={1} hAlign="center">
										<Thumbnail label="report.pdf" />
										<Text type="supporting" color="secondary">Placeholder</Text>
									</VStack>
									<VStack gap={1} hAlign="center">
										<Thumbnail isLoading label="uploading.jpg" />
										<Text type="supporting" color="secondary">Skeleton</Text>
									</VStack>
									<VStack gap={1} hAlign="center">
										<Thumbnail
											src={MISTY_VALLEY}
											alt="Misty mountain valley"
											isLoading
											label="misty-valley.jpg"
										/>
										<Text type="supporting" color="secondary">Uploading</Text>
									</VStack>
									<VStack gap={1} hAlign="center">
										<Thumbnail
											src={MISTY_VALLEY}
											alt="Misty mountain valley"
											label="misty-valley.jpg"
										/>
										<Text type="supporting" color="secondary">Loaded</Text>
									</VStack>
								</HStack>
							</VStack>

							<VStack gap={1}>
								<Text type="supporting" color="secondary">
									Remove button adapts contrast to image luminance
								</Text>
								<HStack gap={3} vAlign="center">
									{#each removable as item (item.id)}
										<Thumbnail
											src={item.src}
											alt={item.alt}
											label={item.label}
											onRemove={() => (removable = removable.filter((i) => i.id !== item.id))}
										/>
									{/each}
									{#if removable.length === 0}
										<Text type="supporting" color="secondary">All removed.</Text>
									{/if}
								</HStack>
							</VStack>

							<VStack gap={1}>
								<Text type="supporting" color="secondary">Click to preview, dismiss to remove</Text>
								<HStack gap={2} vAlign="center">
									{#each gallery as item (item.id)}
										<Thumbnail
											src={item.src}
											alt={item.alt}
											label={item.label}
											onclick={() => (selected = item.label)}
											onRemove={() => (gallery = gallery.filter((i) => i.id !== item.id))}
										/>
									{/each}
								</HStack>
								{#if selected}
									<Text type="supporting" color="secondary">Selected: {selected}</Text>
								{/if}
							</VStack>

							<VStack gap={1}>
								<Text type="supporting" color="secondary">Disabled</Text>
								<HStack gap={3} vAlign="center">
									<Thumbnail
										src={GOLDEN_SUNSET}
										alt="Golden sunset over mountains"
										label="golden-sunset.jpg"
										onRemove={() => {}}
										isDisabled
									/>
									<Thumbnail label="document.pdf" onRemove={() => {}} isDisabled />
								</HStack>
							</VStack>
						</VStack>
						<p class="note">
							The remove button sits <em>on</em> the picture, so its contrast depends on what the
							picture happens to look like in that corner. <code>useImageMode</code> samples exactly
							that region through <code>OffscreenCanvas</code> and scores it with APCA; the answer
							picks a
							<code>MediaTheme</code> mode, and the theme's <code>[data-astryx-media]</code> rules hand
							the button the inverted tokens. Compare the button over the night forest against the one
							over the snowy peaks.
						</p>
					</section>

					<section id="item" data-section="item">
						<h2 id="item">
							Item
							<a class="anchor" href="#item" aria-label="Link to Item">#</a>
						</h2>
						<div class="field-column">
							<Item
								label="Ada Lovelace"
								description="Engineer"
								onclick={() => (selectedItem = 'ada')}
								isSelected={selectedItem === 'ada'}
							>
								{#snippet startContent()}<Avatar name="Ada Lovelace" size="md" />{/snippet}
								{#snippet endContent()}<Badge label="3" />{/snippet}
							</Item>
							<Item
								label="Grace Hopper"
								description="Rear Admiral"
								onclick={() => (selectedItem = 'grace')}
								isSelected={selectedItem === 'grace'}
							>
								{#snippet startContent()}<Avatar name="Grace Hopper" size="md" />{/snippet}
								{#snippet endContent()}<Badge label="7" />{/snippet}
							</Item>
							<Item label="Documentation" description="Guides and API reference" href="/docs">
								{#snippet startContent()}<Icon
										icon="externalLink"
										size="sm"
										color="secondary"
									/>{/snippet}
							</Item>
							<Item label="Notifications" description="You have 3 unread messages">
								{#snippet endContent()}<Text color="secondary">2h ago</Text>{/snippet}
							</Item>
							<Item label="Archived project" description="Read-only" isDisabled>
								{#snippet startContent()}<Icon icon="info" size="sm" color="secondary" />{/snippet}
							</Item>
						</div>
						<p class="note">
							<code>Item</code> unifies the "start content + label + description + end content" row.
							A
							<code>href</code> makes it a link and an <code>onclick</code> makes it a button — the
							two interactive rows above select on click; the third navigates; the fourth is static
							and the last is disabled. Density and alignment are props (<code>balanced</code> shown).
						</p>
					</section>

					<section id="list" data-section="list">
						<h2 id="list">
							List
							<a class="anchor" href="#list" aria-label="Link to List">#</a>
						</h2>
						<div class="field-column">
							<List>
								<ListItem label="Notifications" description="Manage your alerts" />
								<ListItem label="Privacy" description="Control your data" />
								<ListItem label="Security" description="Password and 2FA" />
							</List>
							<List hasDividers header="Settings">
								<ListItem label="Notifications" description="Manage your alerts">
									{#snippet startContent()}<Icon
											icon="info"
											size="sm"
											color="secondary"
										/>{/snippet}
								</ListItem>
								<ListItem label="Privacy" description="Control your data">
									{#snippet startContent()}<Icon
											icon="check"
											size="sm"
											color="secondary"
										/>{/snippet}
								</ListItem>
								<ListItem label="General" description="App preferences">
									{#snippet startContent()}<Icon
											icon="wrench"
											size="sm"
											color="secondary"
										/>{/snippet}
								</ListItem>
							</List>
							<List listStyle="decimal">
								<ListItem
									label="Install the package"
									description="npm install @astryx-svelte/core"
								/>
								<ListItem
									label="Import components"
									description="import &#123; List &#125; from '@astryx-svelte/core'"
								/>
								<ListItem label="Start building" description="Use components in your app" />
							</List>
							<List listStyle="disc">
								<ListItem label="Accessible by default" />
								<ListItem label="Themeable with StyleX" />
								<ListItem label="Composable and extensible" />
							</List>
							<List density="compact">
								<ListItem label="Available" onclick={() => {}} />
								<ListItem label="Unavailable" onclick={() => {}} isDisabled />
								<ListItem label="Also Available" onclick={() => {}} />
							</List>
						</div>
						<p class="note">
							<code>List</code> renders a <code>&lt;ul&gt;</code>, or an <code>&lt;ol&gt;</code>
							when
							<code>listStyle="decimal"</code>; the markers are custom spans driven by a CSS
							counter, not
							<code>list-style-type</code>, so <code>start</code> seeds the counter *and* emits the
							<code>start</code> attribute for assistive tech. <code>ListItem</code> composes
							<code>Item</code>, so it inherits the invisible button/anchor pattern — and takes its
							density, dividers and marker style from the enclosing list's context.
						</p>
					</section>

					<section id="treelist" data-section="treelist">
						<h2 id="treelist">
							TreeList
							<a class="anchor" href="#treelist" aria-label="Link to TreeList">#</a>
						</h2>

						{#snippet unreadBadge()}
							<Badge label="3" />
						{/snippet}
						{#snippet draftsBadge()}
							<Badge label="1" />
						{/snippet}
						{#snippet projectFilesHeader()}
							<strong>Project Files</strong>
						{/snippet}

						<Grid columns={2} gap={6}>
							<VStack gap={2}>
								<Text type="label">Basic</Text>
								<TreeList items={fileTreeItems} />
							</VStack>

							<VStack gap={2}>
								<Text type="label">Fully expanded</Text>
								<TreeList
									items={[
										{
											id: 'src',
											label: 'src',
											isExpanded: true,
											children: [
												{
													id: 'components',
													label: 'components',
													isExpanded: true,
													children: [
														{ id: 'button', label: 'Button.svelte', onClick: noop },
														{ id: 'card', label: 'Card.svelte', onClick: noop },
														{ id: 'list', label: 'List.svelte', onClick: noop }
													]
												},
												{ id: 'app', label: 'App.svelte', onClick: noop },
												{ id: 'index', label: 'index.ts', onClick: noop }
											]
										},
										{
											id: 'public',
											label: 'public',
											isExpanded: true,
											children: [
												{ id: 'favicon', label: 'favicon.ico', onClick: noop },
												{ id: 'index-html', label: 'index.html', onClick: noop }
											]
										},
										{ id: 'pkg', label: 'package.json', onClick: noop },
										{ id: 'readme', label: 'README.md', onClick: noop }
									]}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label">With header</Text>
								<TreeList items={fileTreeItems} header={projectFilesHeader} />
							</VStack>

							<VStack gap={2}>
								<Text type="label">Compact</Text>
								<TreeList
									density="compact"
									items={[
										{
											id: 'src',
											label: 'src',
											isExpanded: true,
											children: [
												{
													id: 'components',
													label: 'components',
													isExpanded: true,
													children: [
														{ id: 'button', label: 'Button.svelte', onClick: noop },
														{ id: 'card', label: 'Card.svelte', onClick: noop },
														{ id: 'list', label: 'List.svelte', onClick: noop }
													]
												},
												{ id: 'app', label: 'App.svelte', onClick: noop },
												{ id: 'index', label: 'index.ts', onClick: noop }
											]
										},
										{
											id: 'public',
											label: 'public',
											children: [
												{ id: 'favicon', label: 'favicon.ico', onClick: noop },
												{ id: 'index-html', label: 'index.html', onClick: noop }
											]
										},
										{ id: 'pkg', label: 'package.json', onClick: noop },
										{ id: 'readme', label: 'README.md', onClick: noop }
									]}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Spacious</Text>
								<TreeList items={fileTreeItems} density="spacious" />
							</VStack>

							<VStack gap={2}>
								<Text type="label">With end content</Text>
								<TreeList
									items={[
										{
											id: 'inbox',
											label: 'Inbox',
											isExpanded: true,
											endContent: unreadBadge,
											children: [
												{ id: 'unread', label: 'Unread', onClick: noop, endContent: unreadBadge },
												{ id: 'starred', label: 'Starred', onClick: noop }
											]
										},
										{ id: 'sent', label: 'Sent', onClick: noop },
										{ id: 'drafts', label: 'Drafts', onClick: noop, endContent: draftsBadge }
									]}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Disabled items</Text>
								<TreeList items={treeDisabledItems} />
							</VStack>

							<VStack gap={2}>
								<Text type="label">Selected items</Text>
								<TreeList items={treeSelectedItems} />
							</VStack>
						</Grid>
						<p class="note">
							A data-driven <code>role="tree"</code>: <code>items</code> is a recursive array and
							expansion is internal state seeded by <code>isExpanded</code>. Positional data (<code
								>aria-level</code
							>/<code>aria-posinset</code>/<code>aria-setsize</code>, the connector lines, the
							last-child terminus) is computed during the render rather than passed down a context.
							<code>useTreeFocus</code>
							owns the single tab stop and the APG tree model — arrows roam the <em>visible</em> rows,
							ArrowRight expands then descends, ArrowLeft collapses then ascends, and Enter/Space activates
							the row's own link or button before falling back to expand/collapse.
						</p>
					</section>

					<section id="table" data-section="table">
						<h2 id="table">
							Table
							<a class="anchor" href="#table" aria-label="Link to Table">#</a>
						</h2>
						<TableDemos />
						<p class="note">
							Ports <strong>all 24</strong> of upstream's <code>Table.stories.tsx</code> stories,
							and none of them needs a plugin — that file imports no <code>useTable*</code> hook at
							all. The plugin hooks have their own sections below and reach the table through the
							public
							<code>plugins</code> prop, which is what makes the seam clean. Everything here is the
							core: data mode and children mode, the density/divider/striping/hover matrix,
							per-column alignment and vertical alignment, container bleed inside <code>Card</code>/
							<code>Section</code>/<code>Layout</code>, and horizontal scroll in narrow containers.
							There is no <code>React.memo</code> counterpart for rows — a keyed
							<code>{'{#each}'}</code> plus fine-grained reactivity is that optimisation.
						</p>
					</section>

					<section id="tableselection" data-section="tableselection">
						<h2 id="tableselection">
							TableSelection
							<a class="anchor" href="#tableselection" aria-label="Link to TableSelection">#</a>
						</h2>
						<TableSelectionDemos />
						<p class="note">
							All <strong>7</strong> of upstream's <code>TableSelection.stories.tsx</code> stories.
							<code>useTableSelectionState</code> owns the selection set and
							<code>useTableSelection</code> turns it into a plugin that prepends a checkbox column
							and marks selected rows. This is the one plugin in the batch that needs no bound
							snippet: its per-cell markup reads the config from a <em>context</em> the plugin's own provider
							sets, so the snippet closes over nothing.
						</p>
					</section>

					<section id="tablesortable" data-section="tablesortable">
						<h2 id="tablesortable">
							TableSortable
							<a class="anchor" href="#tablesortable" aria-label="Link to TableSortable">#</a>
						</h2>
						<TableSortableDemos />
						<p class="note">
							All <strong>6</strong> of upstream's <code>TableSortable.stories.tsx</code> stories.
							Upstream sets <code>content: &lt;SortHeaderButton column={'{column}'}&gt;</code> — a
							closure over the column <em>and</em> over whatever a prior plugin left in the slot,
							neither of which can travel through a context. That is the case
							<code>internal/bind-snippet.ts</code> exists for. Note
							<code>allowUnsortedState</code> defaults to <strong>true</strong> here: upstream's doc
							table says <code>false</code>, but its own source reads
							<code>cfg.allowUnsortedState ?? true</code>, and this port follows the source.
						</p>
					</section>

					<section id="tablepagination" data-section="tablepagination">
						<h2 id="tablepagination">
							TablePagination
							<a class="anchor" href="#tablepagination" aria-label="Link to TablePagination">#</a>
						</h2>
						<TablePaginationDemos />
						<p class="note">
							All <strong>9</strong> of upstream's <code>TablePagination.stories.tsx</code> stories,
							including the 36-cell <em>OptionsMatrix</em> (4 variants × 3 positions × 3
							alignments). Upstream's <code>PaginatedDemo</code> helper has no counterpart — a
							<code>.svelte</code> file declares one component — so its two call sites are expanded
							in place. <em>Playground</em> renders no controls of its own upstream either; its
							knobs are Storybook's <code>argTypes</code> panel, so it shows the configuration its
							<code>args</code> default to rather than an invented control panel.
						</p>
					</section>

					<section id="tablecolumnsettings" data-section="tablecolumnsettings">
						<h2 id="tablecolumnsettings">
							TableColumnSettings
							<a class="anchor" href="#tablecolumnsettings" aria-label="Link to TableColumnSettings"
								>#</a
							>
						</h2>
						<TableColumnSettingsDemos />
						<p class="note">
							All <strong>4</strong> of upstream's <code>TableColumnSettings.stories.tsx</code>
							stories. The plugin itself is pure — no markup, no state, so it needs neither a context
							nor a bound snippet, and upstream's <code>useRef</code> +
							<code>useMemo(…, [])</code> pair (there to keep the plugin identity stable while
							reading the latest config) is exactly what the config <em>getter</em> already is. Both drop
							out and the transform transcribes verbatim.
						</p>
					</section>

					<section id="tablecolumnresize" data-section="tablecolumnresize">
						<h2 id="tablecolumnresize">
							TableColumnResize
							<a class="anchor" href="#tablecolumnresize" aria-label="Link to TableColumnResize"
								>#</a
							>
						</h2>
						<TableColumnResizeDemos />
						<p class="note">
							All <strong>6</strong> of upstream's <code>TableColumnResize.stories.tsx</code>
							stories. The largest plugin upstream ships (866 LOC); the width arithmetic, the neighbour
							and last-column rules and the WAI-ARIA window-splitter keyboard contract transcribe verbatim.
							The splitter rides a <em>keyed</em> bound snippet, and the keying is load-bearing
							rather than tidy: <code>{'{@render}'}</code> branches on the snippet's function identity,
							so an unkeyed binding would replace the handle on every transform and destroy the very element
							holding keyboard focus after the first arrow press.
						</p>
					</section>

					<section id="tablestickycolumns" data-section="tablestickycolumns">
						<h2 id="tablestickycolumns">
							TableStickyColumns
							<a class="anchor" href="#tablestickycolumns" aria-label="Link to TableStickyColumns"
								>#</a
							>
						</h2>
						<TableStickyColumnsDemos />
						<p class="note">
							All <strong>5</strong> of upstream's <code>TableStickyColumns.stories.tsx</code>
							stories. Every story is capped at 720px on purpose — the cap is what forces the table's
							internal horizontal scroll, and without scrolling there is nothing for pinned columns to
							pin against.
							<em>WithColumnResize</em>
							composes two plugins in a fixed order, and
							<em>NoOpEmptyConfig</em> is the degenerate case that must stay inert.
						</p>
					</section>

					<section id="tablegroupedrows" data-section="tablegroupedrows">
						<h2 id="tablegroupedrows">
							TableGroupedRows
							<a class="anchor" href="#tablegroupedrows" aria-label="Link to TableGroupedRows">#</a>
						</h2>
						<TableGroupedRowsDemos />
						<p class="note">
							All <strong>3</strong> of upstream's <code>TableGroupedRows.stories.tsx</code>
							stories.
							<code>renderGroupHeader</code> is a
							<code>Snippet&lt;[string, number, boolean]&gt;</code>
							taking the group key, its row count and its collapsed state. This plugin is where the batch's
							frozen-argument defect was first caught: reading the config
							<em>outside</em> the bound getter left the chevron reporting
							<code>aria-expanded="true"</code> forever while the rows below it toggled correctly.
						</p>
					</section>

					<section id="tablerowindex" data-section="tablerowindex">
						<h2 id="tablerowindex">
							TableRowIndex
							<a class="anchor" href="#tablerowindex" aria-label="Link to TableRowIndex">#</a>
						</h2>
						<TableRowIndexDemos />
						<p class="note">
							All <strong>3</strong> of upstream's <code>TableRowIndex.stories.tsx</code> stories. A
							monospaced, end-aligned row-number column is prepended; numbering follows the
							<em>rendered</em> order, which is why <em>RenumbersWithSort</em> passes the
							<strong>sorted</strong> data to the hook rather than the source array.
						</p>
					</section>

					<section id="tablerowstatus" data-section="tablerowstatus">
						<h2 id="tablerowstatus">
							TableRowStatus
							<a class="anchor" href="#tablerowstatus" aria-label="Link to TableRowStatus">#</a>
						</h2>
						<TableRowStatusDemos />
						<p class="note">
							Both of upstream's <code>TableRowStatus.stories.tsx</code> stories. A 28px gutter
							column carries a dot, or an <code>Icon</code> when <code>icon</code> is set — shape
							<em>and</em> colour, since colour alone fails WCAG 1.4.1, which is also why
							<code>label</code> is required rather than optional. The dot's colour is a StyleX
							<strong>function style</strong>, so it rides an inline
							<code>--x-backgroundColor</code> custom property; that is what lets a raw CSS colour work
							as an escape hatch beside the semantic tokens — and, because the class oracle cannot see
							a function style at all, it is the one thing here that only the ported suite checks.
						</p>
					</section>

					<section id="tablerowexpansion" data-section="tablerowexpansion">
						<h2 id="tablerowexpansion">
							TableRowExpansion
							<a class="anchor" href="#tablerowexpansion" aria-label="Link to TableRowExpansion"
								>#</a
							>
						</h2>
						<TableRowExpansionDemos />
						<p class="note">
							All <strong>3</strong> of upstream's <code>TableRowExpansion.stories.tsx</code>
							stories. One point worth knowing: <em>ExpandOnRowClick</em> spreads
							<code>expansionConfig</code> <em>inside</em> the config getter, not above it.
							Spreading it at the top of <code>&lt;script&gt;</code> would invoke that object's
							<code>expandedKeys</code> and <code>isAllExpanded</code> getters exactly once and freeze
							the tree.
						</p>
					</section>

					<section id="tabletree" data-section="tabletree">
						<h2 id="tabletree">
							TableTree
							<a class="anchor" href="#tabletree" aria-label="Link to TableTree">#</a>
						</h2>
						<TableTreeDemos />
						<p class="note">
							All <strong>9</strong> of upstream's <code>TableTree.stories.tsx</code> stories,
							including lazy-loaded children, the flat-data no-op and 0.3.0's
							<code>hasRowClickExpansion</code>, which lets a click anywhere on an expandable row
							toggle it while leaf rows stay inert. Upstream's
							<code>IndentExample</code> helper exists only so its hooks can run once per indent
							size; a Svelte component cannot declare hooks in a loop, so the three hook pairs are
							declared up front and an array drives the <code>{'{#each}'}</code>. This is also the
							one plugin absent from the published <code>@astryxdesign/core</code> tarball, so
							upstream's
							<em>source</em> is its only ground truth — the class oracle carries a self-retiring skip
							saying so.
						</p>
					</section>

					<section id="tablefiltering" data-section="tablefiltering">
						<h2 id="tablefiltering">
							TableFiltering
							<a class="anchor" href="#tablefiltering" aria-label="Link to TableFiltering">#</a>
						</h2>
						<TableFilteringDemos />
						<p class="note">
							All <strong>11</strong> of upstream's <code>TableFiltering.stories.tsx</code> stories
							— the one plugin file batch 13 could not port. Every story opens with
							<code>usePowerSearchConfig(fieldDefs)</code> and uses <em>both</em> halves of the
							result:
							<code>config</code> is the plugin's required <code>searchConfig</code>, and
							<code>applyFilters</code> is what actually removes rows. Batch 13's first cut shipped a
							~180-line hand-transcription of PowerSearch's operator tables and match engine to stand
							in; that is re-authoring an unported subsystem, so it was deleted rather than kept behind
							a "temporary" comment. This is the real thing, and the deferral it retires is why the file
							is worth reading beside its upstream original.
						</p>
					</section>

					<section id="markdown" data-section="markdown">
						<h2 id="markdown">
							Markdown
							<a class="anchor" href="#markdown" aria-label="Link to Markdown">#</a>
						</h2>
						<MarkdownDemos />
						<p class="note">
							Ports <strong>all 15</strong> stories across upstream's
							<code>Markdown.stories.tsx</code> and <code>MarkdownCitations.stories.tsx</code>. The
							parser is a hand-written one transcribed verbatim (CommonMark-ish blocks and inline,
							GFM tables and task lists, opt-in autolinking, link reference definitions) and the
							renderer maps every node onto a real component — <code>CodeBlock</code>,
							<code>Blockquote</code>, <code>List</code>, <code>CheckboxList</code>,
							<code>Table</code>, <code>Citation</code>, <code>Code</code>. The one structural
							translation: upstream threads a <em>mutable cursor</em> through its render to drive
							the streaming fade, and assigns citation numbers the same way. Svelte has no single
							synchronous render pass, so both are precomputed in one walk before rendering and the
							template reads the plan — the same move <code>CodeBlock</code> made for
							<code>renderLines</code>.
						</p>
					</section>

					<section id="metadatalist" data-section="metadatalist">
						<h2 id="metadatalist">
							MetadataList
							<a class="anchor" href="#metadatalist" aria-label="Link to MetadataList">#</a>
						</h2>
						<Grid columns={2} gap={6}>
							<VStack gap={2}>
								<Text type="label">Single column</Text>
								<MetadataList>
									<MetadataListItem label="Name">MetadataList</MetadataListItem>
									<MetadataListItem label="Status">Active</MetadataListItem>
									<MetadataListItem label="Owner">Joey</MetadataListItem>
								</MetadataList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Horizontal</Text>
								<MetadataList orientation="horizontal">
									<MetadataListItem label="Status">Active</MetadataListItem>
									<MetadataListItem label="Type">Premium</MetadataListItem>
									<MetadataListItem label="Owner">Joey</MetadataListItem>
									<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
								</MetadataList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Multi column</Text>
								<MetadataList columns="multi">
									<MetadataListItem label="Name">MetadataList</MetadataListItem>
									<MetadataListItem label="Status">Active</MetadataListItem>
									<MetadataListItem label="Owner">Joey</MetadataListItem>
									<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
									<MetadataListItem label="Tags">
										<HStack gap={1}>
											<Token label="component" />
											<Token label="xds" />
										</HStack>
									</MetadataListItem>
									<MetadataListItem label="Priority">Tier 1</MetadataListItem>
								</MetadataList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">title, label position/width, item icons</Text>
								<MetadataList title={metadataTitle} label={{ position: 'start', width: 120 }}>
									<MetadataListItem label="Status">
										{#snippet icon()}<Icon icon="success" size="sm" color="success" />{/snippet}
										Active
									</MetadataListItem>
									<MetadataListItem label="Last run">
										{#snippet icon()}<Icon icon="clock" size="sm" color="secondary" />{/snippet}
										2 minutes ago
									</MetadataListItem>
									<MetadataListItem label="Owner">
										{#snippet icon()}<Icon icon="info" size="sm" color="secondary" />{/snippet}
										Joey
									</MetadataListItem>
								</MetadataList>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Collapsible (maxNumOfItems=3)</Text>
								<MetadataList maxNumOfItems={3}>
									<MetadataListItem label="Name">MetadataList</MetadataListItem>
									<MetadataListItem label="Status">Active</MetadataListItem>
									<MetadataListItem label="Owner">Joey</MetadataListItem>
									<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
									<MetadataListItem label="Updated">Mar 26, 2026</MetadataListItem>
									<MetadataListItem label="Priority">Tier 1</MetadataListItem>
								</MetadataList>
							</VStack>
						</Grid>
						<p class="note">
							<code>maxNumOfItems</code> is the one place this port differs from upstream on the
							inside: React counts and slices <code>children</code> directly, and Svelte content is one
							opaque snippet with nothing to count. Items register with the list's context during init
							instead — which runs on the server too, so the "Show more" toggle is in the server-rendered
							HTML rather than appearing after hydration.
						</p>
					</section>

					<section id="emptystate" data-section="emptystate">
						<h2 id="emptystate">
							EmptyState
							<a class="anchor" href="#emptystate" aria-label="Link to EmptyState">#</a>
						</h2>
						<!--
				EmptyStateContainer wraps in a `Card` rather than a page-CSS surface, and
				the icon takes no `color` - upstream's blocks pass a size only.
			-->
						<VStack gap={4}>
							<Card>
								<EmptyState
									title="No results found"
									description="Try adjusting your search or filters to find what you need."
								>
									{#snippet icon()}<Icon icon="search" size="lg" />{/snippet}
									{#snippet actions()}<Button label="Clear filters" variant="secondary" />{/snippet}
								</EmptyState>
							</Card>
							<Card>
								<EmptyState
									title="No results found"
									description="Try adjusting your search terms or clearing filters to see more results."
								>
									{#snippet icon()}<Icon icon="search" size="lg" />{/snippet}
									{#snippet actions()}
										<Button label="Go back" variant="secondary" />
										<Button label="Clear filters" variant="primary" />
									{/snippet}
								</EmptyState>
							</Card>
							<Card>
								<EmptyState
									title="No notifications"
									description="You're all caught up. New notifications will appear here."
									isCompact
								>
									{#snippet icon()}<Icon icon="info" size="lg" />{/snippet}
									{#snippet actions()}
										<HStack gap={2}>
											<Button label="Settings" variant="secondary" size="sm" />
											<Button label="Refresh" variant="primary" size="sm" />
										</HStack>
									{/snippet}
								</EmptyState>
							</Card>
						</VStack>
						<p class="note">
							<code>headingLevel</code> moves the tag only — the title's size is fixed by the variant,
							so fitting the document outline never costs a visual change. The compact form stacks its
							actions rather than shrinking them.
						</p>
					</section>

					<section id="citation" data-section="citation">
						<h2 id="citation">
							Citation
							<a class="anchor" href="#citation" aria-label="Link to Citation">#</a>
						</h2>
						<!--
				`CitationShowcase`'s two grouped stacks, kept separate on purpose:
				`Citation.doc.mjs` lists "mix label and number variants in the same
				paragraph" under `guidance: false`, and the previous single row did
				exactly that. The GitHub entry is upstream's, and is the one place
				`source.icon` is demonstrated.
			-->
						<VStack gap={6}>
							<VStack gap={2}>
								<Text type="supporting" color="secondary">Label variant</Text>
								<div class="row">
									<Citation
										source={{ title: 'React Documentation', url: 'https://react.dev' }}
										number={1}
										variant="label"
									/>
									<Citation
										source={{
											title: 'GitHub',
											url: 'https://github.com',
											icon: 'https://github.githubassets.com/favicons/favicon.svg'
										}}
										number={2}
										variant="label"
									/>
									<Citation source={{ title: 'Internal reference' }} number={3} variant="label" />
								</div>
							</VStack>
							<VStack gap={2}>
								<Text type="supporting" color="secondary">Number variant</Text>
								<div class="row">
									<Citation
										source={{ title: 'TypeScript Handbook', url: 'https://typescriptlang.org' }}
										number={1}
										variant="number"
									/>
									<Citation
										source={{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org' }}
										number={2}
										variant="number"
									/>
									<Citation source={{ title: 'W3C Specification' }} number={3} variant="number" />
								</div>
							</VStack>
							<Text type="body">
								React uses a virtual DOM to minimize expensive DOM operations<Citation
									source={{ title: 'React Documentation', url: 'https://react.dev' }}
									number={1}
									variant="number"
								/>. This approach was inspired by earlier functional UI frameworks<Citation
									source={{
										title: 'Elm Architecture',
										url: 'https://guide.elm-lang.org/architecture/'
									}}
									number={2}
									variant="number"
								/>.
							</Text>
						</VStack>
						<p class="note">
							A source with a <code>url</code> renders as an <code>&lt;a&gt;</code> carrying
							<code>role="doc-noteref"</code>; one without renders as an inert
							<code>&lt;span&gt;</code>
							with no role, since <code>doc-noteref</code> is not a permitted role on a non-interactive
							element.
						</p>
					</section>

					<section id="breadcrumbs" data-section="breadcrumbs">
						<h2 id="breadcrumbs">
							Breadcrumbs
							<a class="anchor" href="#breadcrumbs" aria-label="Link to Breadcrumbs">#</a>
						</h2>
						<div class="field-column">
							<Breadcrumbs>
								<BreadcrumbItem href="/">Home</BreadcrumbItem>
								<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
								<BreadcrumbItem isCurrent>My Project</BreadcrumbItem>
							</Breadcrumbs>
							<Breadcrumbs>
								<BreadcrumbItem href="/">Home</BreadcrumbItem>
								<BreadcrumbItem isCurrent>Settings</BreadcrumbItem>
							</Breadcrumbs>
							<Breadcrumbs>
								<BreadcrumbItem href="/">Home</BreadcrumbItem>
								<BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
								<BreadcrumbItem>Auto Current</BreadcrumbItem>
							</Breadcrumbs>
							<Breadcrumbs variant="supporting">
								<BreadcrumbItem href="/">Home</BreadcrumbItem>
								<BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
								<BreadcrumbItem isCurrent>Supporting variant</BreadcrumbItem>
							</Breadcrumbs>
						</div>
						<p class="note">
							A <code>&lt;nav&gt;</code> landmark wrapping an <code>&lt;ol&gt;</code>. Each item
							renders its own <em>leading</em> separator, hidden on <code>:first-child</code>
							through a
							<code>--separator-display</code> custom property — so there are no separator
							<code>&lt;li&gt;</code>s to skip when finding the last item. The third trail sets
							<code>isCurrent</code> on nothing: each item checks the DOM after render and the last
							one claims <code>aria-current="page"</code>, on the link or span itself rather than
							the
							<code>&lt;li&gt;</code>.
						</p>
					</section>

					<section id="outline" data-section="outline">
						<h2 id="outline">
							Outline
							<a class="anchor" href="#outline" aria-label="Link to Outline">#</a>
						</h2>

						<div class="row">
							<div class="outline-demo-column">
								<h3>Basic</h3>
								<Outline items={outlineItems} />
							</div>
							<div class="outline-demo-column">
								<h3>Controlled</h3>
								<Outline items={outlineItems} activeId="tokens" />
							</div>
							<div class="outline-demo-column">
								<h3>Compact</h3>
								<Outline items={outlineItems} activeId="installation" density="compact" />
							</div>
							<div class="outline-demo-column">
								<h3>Deep nesting</h3>
								<Outline items={outlineDeepItems} activeId="subsection-1-1-1" />
							</div>
						</div>

						<h3>With document (scroll-spy)</h3>
						<div class="outline-document">
							<article>
								<section>
									<h2 id="overview">Overview</h2>
									<p>
										Astryx components provide consistent interaction, styling, and theme behavior
										for internal tools.
									</p>
								</section>
								<section>
									<h2 id="installation">Installation</h2>
									<p>
										Install the package, wrap the app with Theme, and import components from their
										subpaths.
									</p>
								</section>
								<section>
									<h2 id="theming">Theming</h2>
									<p>
										Themes define semantic tokens and component overrides without changing app code.
									</p>
									<h3 id="tokens">Tokens</h3>
									<p>
										Use semantic color, spacing, typography, radius, elevation, and motion tokens.
									</p>
									<h3 id="component-overrides">Component overrides</h3>
									<p>
										Component overrides target the stable Astryx selector surface emitted by each
										component: astryx-* classes plus data-* prop reflections.
									</p>
								</section>
								<section>
									<h2 id="accessibility">Accessibility</h2>
									<p>
										Components include landmark, keyboard, focus, and ARIA behavior where
										applicable.
									</p>
								</section>
							</article>
							<aside>
								<Outline items={outlineItems} />
							</aside>
						</div>

						<h3>Extract from HTML</h3>
						<div class="outline-document">
							<article bind:this={outlineArticleEl}>
								<section>
									<Heading id="account-settings" level={2}>Account settings</Heading>
									<Text type="body">Manage profile, authentication, and workspace preferences.</Text
									>
									<div class="row" style="margin-top: 12px;">
										<Badge variant="success" label="Active" />
										<Badge variant="neutral" label="Workspace" />
									</div>
								</section>
								<section>
									<Heading id="notifications" level={2}>Notifications</Heading>
									<Text type="body">Choose which product events should notify the team.</Text>
									<Heading id="email-alerts" level={3}>Email alerts</Heading>
									<Text type="body">Use email for low-frequency summaries and approvals.</Text>
									<Heading id="push-alerts" level={3}>Push alerts</Heading>
									<Text type="body">Use push for time-sensitive updates and incidents.</Text>
								</section>
								<section>
									<Heading id="billing" level={2}>Billing</Heading>
									<Text type="body">Review invoices, payment methods, and usage limits.</Text>
								</section>
							</article>
							<aside>
								<Outline items={outlineFromDom.items} />
							</aside>
						</div>

						<h3>Extract from markdown</h3>
						<div class="outline-document">
							<div bind:this={markdownOutlineEl}>
								<Markdown children={outlineMarkdown} />
							</div>
							<aside>
								<Outline items={outlineFromMarkdown.items} />
							</aside>
						</div>

						<h3>Scroll spy (scoped container + sticky header)</h3>
						<div class="outline-document">
							<div class="outline-scroll-pane" bind:this={outlinePaneEl}>
								<div class="outline-sticky-header">
									<Badge label={`Sticky header (${STICKY_HEADER_HEIGHT}px)`} />
								</div>
								<div class="outline-scroll-pane-body">
									{#each outlineItems as item (item.id)}
										<section>
											<!-- scroll-margin-top must sit on the element the outline targets —
											     the heading carries the id, so the browser reads it from there,
											     not from a wrapper. -->
											<Heading
												id={item.id}
												level={item.level === 2 ? 2 : 3}
												style="scroll-margin-top: 8px;">{item.label}</Heading
											>
											<Text type="body">
												Scroll the pane. The outline tracks the pane's scroll position, not the
												window's.
											</Text>
											<div style="height: 160px;"></div>
										</section>
									{/each}
								</div>
							</div>
							<aside>
								<Outline
									items={outlineItems}
									scrollContainerRef={() => outlinePaneEl}
									offset={STICKY_HEADER_HEIGHT}
								/>
							</aside>
						</div>

						<h3>Navigate callbacks</h3>
						<div class="outline-document">
							<article>
								{#each outlineItems as item (item.id)}
									<section>
										<!-- scroll-margin-top belongs on the heading (it carries the id the
										     outline scrolls to), not on the section wrapper. -->
										<!-- The flash is an inline style rather than a scoped class: the
										     rule would have to reach inside `Heading`'s own element, which
										     scoped CSS cannot do without `:global`. Upstream inlines it too. -->
										<Heading
											id={`nav-${item.id}`}
											level={item.level === 2 ? 2 : 3}
											style="scroll-margin-top: 16px; transition: background-color 600ms; background-color: {outlineFlashId ===
											`nav-${item.id}`
												? 'var(--color-overlay-hover)'
												: 'transparent'};">{item.label}</Heading
										>
										<div style="height: 320px;"></div>
									</section>
								{/each}
							</article>
							<aside>
								<Badge label={outlineNavigateStatus} />
								<Outline
									items={outlineItems.map((item) => ({ ...item, id: `nav-${item.id}` }))}
									onNavigateStart={(id) => {
										outlineFlashId = null;
										outlineNavigateStatus = `scrolling to ${id}`;
									}}
									onNavigateEnd={(id) => {
										outlineFlashId = id;
										outlineNavigateStatus = `arrived at ${id}`;
									}}
								/>
							</aside>
						</div>

						<h3>Keyboard navigation</h3>
						<div class="outline-keyboard-demo">
							<Button variant="secondary" label="Focus me, then press Tab" />
							<Outline items={outlineItems} />
							<Button variant="secondary" label="Tab again lands here" />
						</div>

						<p class="note">
							Ports <strong>all 10</strong> of upstream's stories — <code>ExtractFromMarkdown</code>
							landed with batch 11's markdown parser, which is what it was waiting on. Upstream's story
							derives each heading id from the heading's own text through a
							<code>components.heading</code> override; a snippet's text cannot be read, so the ids
							come from <code>useOutlineFromMarkdown</code> instead — same slugifier, same document
							order — and are stamped onto the rendered headings, which is upstream's own docsite
							pattern rather than an invention. The sliding indicator is CSS anchor positioning, not
							a measured transform — the active link carries <code>anchor-name</code> and the bar
							resolves <code>top</code>/<code>height</code> against it.
						</p>
						<p class="note">
							The last three stories are 0.2.0's. <code>ScrollSpy</code> scopes tracking with
							<code>scrollContainerRef</code> — a getter here, not a <code>RefObject</code> — and
							<code>offset</code> moves the activation line <em>and</em> the scroll landing
							together, so a heading activates exactly where clicking it parks it: 48px of sticky
							header plus the heading's own 8px <code>scroll-margin-top</code>, which
							<strong>compose rather than duplicate</strong>. <code>NavigateCallbacks</code> shows
							<code>onNavigateEnd</code> firing exactly once per <code>onNavigateStart</code> —
							scroll away mid-jump and it still fires, so the flash can never stick.
							<code>KeyboardNavigation</code> is the roving tab stop: one Tab enters the outline,
							arrows move between headings, Home/End jump to the ends, and the stop is
							<strong>seated on the active heading</strong> rather than the first — so tabbing in while
							reading section 5 lands on section 5.
						</p>
					</section>

					<section id="carousel" data-section="carousel">
						<h2 id="carousel">
							Carousel
							<a class="anchor" href="#carousel" aria-label="Link to Carousel">#</a>
						</h2>
						<Carousel items={LIGHTBOX_PHOTOS} gap={1} aria-label="Photo thumbnails" hasSnap>
							{#snippet item(photo)}
								<Thumbnail src={photo.src} alt={photo.alt} label={photo.alt} />
							{/snippet}
						</Carousel>

						<!--
							Loop (Wrap-Around). Upstream's story frames its eight thumbnails at 400px so
							the row overflows; this port's stand-in set is four, so the frame is
							narrower to keep the same overflow — the scaffolding is storybook layout,
							the props are upstream's.
						-->
						<h3>Loop (wrap-around)</h3>
						<div class="carousel-frame">
							<p class="sub">
								Next at the end wraps to the start — buttons stay active at both edges
							</p>
							<Carousel
								items={LIGHTBOX_PHOTOS}
								gap={1}
								hasLoop
								hasSnap
								aria-label="Looping gallery"
							>
								{#snippet item(photo)}
									<Thumbnail src={photo.src} alt={photo.alt} label={photo.alt} />
								{/snippet}
							</Carousel>
						</div>

						<!-- Imperative Control. Upstream's `handleRef`; here, `bind:this`. -->
						<h3>Imperative control</h3>
						<div class="carousel-frame">
							<p class="sub">External buttons driving the carousel through the instance handle</p>
							<Carousel
								bind:this={imperativeCarousel}
								items={LIGHTBOX_PHOTOS}
								gap={1}
								hasSnap
								hasButtons={false}
								aria-label="Externally controlled gallery"
							>
								{#snippet item(photo)}
									<Thumbnail src={photo.src} alt={photo.alt} label={photo.alt} />
								{/snippet}
							</Carousel>
							<div class="row">
								<Button
									label="Previous"
									variant="secondary"
									size="sm"
									onclick={() => imperativeCarousel?.scrollPrev()}
								/>
								<Button
									label="Next"
									variant="secondary"
									size="sm"
									onclick={() => imperativeCarousel?.scrollNext()}
								/>
								<Button
									label="Jump to first"
									variant="ghost"
									size="sm"
									onclick={() => imperativeCarousel?.scrollTo(0)}
								/>
							</div>
						</div>
						<p class="note">
							A horizontal scroll container: a gradient edge-fade appears on whichever side has more
							content, and the prev/next pills render on the <strong>top layer</strong> through
							<code>Layer</code> so they escape any parent overflow clipping. They stay mounted and
							<em>disabled</em> at each end rather than unmounting, so keyboard focus never lands on
							an invisible control. Upstream takes children and wraps each with
							<code>Children.map</code>; a snippet cannot be mapped over, so this takes
							<code>items</code>
							plus an
							<code>item</code> snippet — the <code>OverflowList</code> precedent.
						</p>
						<p class="note">
							<code>hasLoop</code> (0.3.0) makes Next at the trailing edge scroll back to the start and
							Prev at the leading edge scroll to the end, so the buttons stay enabled at both ends instead
							of disabling. It only applies while the content actually overflows.
						</p>
						<p class="note">
							The imperative handle is the one recorded divergence in this component's shape.
							Upstream passes a <code>handleRef</code> prop and fills it with
							<code>useImperativeHandle</code>; Svelte's counterpart to a ref-on-a-component is the
							instance itself, so the five methods are <strong>instance exports</strong> and
							<code>bind:this</code> is the seam —
							<code>let carousel: CarouselHandle</code>, then
							<code>{'<Carousel bind:this={carousel} … />'}</code>. The
							<code>CarouselHandle</code> type still describes exactly what upstream's does:
							<code>scrollNext</code>, <code>scrollPrev</code>, <code>scrollTo(index)</code>,
							<code>canScrollNext()</code> and <code>canScrollPrev()</code>. The last two are not
							exercised above because upstream's story does not call them — it wires only the three
							scroll methods to its three buttons.
						</p>
					</section>

					<section id="pagination" data-section="pagination">
						<h2 id="pagination">
							Pagination
							<a class="anchor" href="#pagination" aria-label="Link to Pagination">#</a>
						</h2>
						<div class="field-column">
							<Pagination
								page={pgDefault}
								onChange={(p) => (pgDefault = p)}
								totalItems={100}
								pageSize={10}
							/>
							<Pagination
								page={pgPages}
								onChange={(p) => (pgPages = p)}
								totalItems={200}
								pageSize={10}
								variant="pages"
							/>
							<Pagination
								page={pgCount}
								onChange={(p) => (pgCount = p)}
								totalItems={200}
								pageSize={20}
								variant="count"
							/>
							<Pagination
								page={pgCompact}
								onChange={(p) => (pgCompact = p)}
								totalPages={10}
								variant="compact"
							/>
							<Pagination
								page={pgDots}
								onChange={(p) => (pgDots = p)}
								totalPages={8}
								variant="dots"
							/>
							<Pagination
								page={pgNone}
								onChange={(p) => (pgNone = p)}
								totalPages={5}
								variant="none"
							/>
							<!-- The editable box: « ‹ Page [ n ] / N › » -->
							<Pagination
								page={pgInput}
								onChange={(p) => (pgInput = p)}
								totalItems={200}
								pageSize={20}
								variant="input"
							/>
							<!-- A "Row" label relabels the same page-navigated box: « ‹ Row [ n ] / N › » -->
							<Pagination
								page={pgInputLabel}
								onChange={(p) => (pgInputLabel = p)}
								totalItems={200}
								pageSize={10}
								variant="input"
								pageLabel="Row"
							/>
							<!-- Just ‹ Page [ n ] / N › — first/last buttons hidden. -->
							<Pagination
								page={pgInputNoFirstLast}
								onChange={(p) => (pgInputNoFirstLast = p)}
								totalItems={200}
								pageSize={10}
								variant="input"
								hasFirstLast={false}
							/>
							<!--
								‹/› advance 5 pages per click (clamped to 1..N). 500 items at 25/page =
								20 pages, so from page 6 next jumps to 11, prev back to 1.
							-->
							<Pagination
								page={pgInputStep}
								onChange={(p) => (pgInputStep = p)}
								totalItems={500}
								pageSize={25}
								variant="input"
								step={5}
							/>
							<Pagination
								page={pgSizeSelector}
								onChange={(p) => (pgSizeSelector = p)}
								totalItems={200}
								pageSize={pgSizeSelectorSize}
								pageSizeOptions={[10, 20, 50]}
								onPageSizeChange={(size) => (pgSizeSelectorSize = size)}
								variant="count"
							/>
							<Pagination page={pgCursor} onChange={(p) => (pgCursor = p)} hasMore />
							<Pagination
								page={pgSmall}
								onChange={(p) => (pgSmall = p)}
								totalItems={100}
								pageSize={10}
								size="sm"
							/>
							<Pagination
								page={pgManyPages}
								onChange={(p) => (pgManyPages = p)}
								totalItems={500}
								pageSize={10}
							/>
							<Pagination
								page={pgManyPagesSiblings}
								onChange={(p) => (pgManyPagesSiblings = p)}
								totalItems={500}
								pageSize={10}
								siblingCount={2}
							/>
							<Pagination page={pgSinglePage} onChange={(p) => (pgSinglePage = p)} totalPages={1} />
							<Pagination
								page={pgDisabled}
								onChange={(p) => (pgDisabled = p)}
								totalPages={10}
								isDisabled
							/>
						</div>
						<p class="note">
							Six variants between the prev/next buttons — page numbers with ellipsis,
							<code>"X–Y of Z"</code>, <code>"Page X of Y"</code>, dots, an editable page box, or
							nothing. Supply <code>totalItems</code> or <code>totalPages</code> when the count is
							known, or
							<code>hasMore</code> for cursor-based paging. <code>input</code> (0.3.0) types a page
							number directly: <code>pageLabel</code> renames the leading noun,
							<code>hasFirstLast</code>
							drops the «/» buttons flanking prev/next, and <code>step</code> makes ‹/› advance more
							than one page per click, clamped to the page range. The dots are a roving-tabindex
							group (<code>useListFocus</code>) where selection follows focus, so arrow keys change
							the page;
							<code>changeAction</code> drives an optimistic page indicator and is interruptible, so rapid
							next clicks advance from the in-flight target rather than stalling.
						</p>
					</section>

					<section id="field" data-section="field">
						<h2 id="field">
							Field
							<a class="anchor" href="#field" aria-label="Link to Field">#</a>
						</h2>
						<VStack gap={6}>
							<div class="field-column">
								<Field label="Email" inputID="email-input">
									<input class="native-input" id="email-input" placeholder="you@example.com" />
								</Field>

								<Field
									label="Email"
									description="We'll never share your email."
									inputID="email-desc-input"
									descriptionID="email-desc"
								>
									<input
										class="native-input"
										id="email-desc-input"
										aria-describedby="email-desc"
										placeholder="you@example.com"
									/>
								</Field>

								<Field label="Search" isLabelHidden inputID="search-input">
									<input class="native-input" id="search-input" placeholder="Search..." />
								</Field>

								<Field label="Nickname" isOptional inputID="nickname-input">
									<input
										class="native-input"
										id="nickname-input"
										placeholder="Enter your nickname"
									/>
								</Field>

								<Field label="Username" isRequired inputID="username-input">
									<input
										class="native-input"
										id="username-input"
										placeholder="Enter your username"
									/>
								</Field>

								<Field
									label="API Key"
									labelTooltip="Your unique API key. Keep this secret!"
									inputID="api-key-input"
								>
									<input class="native-input" id="api-key-input" placeholder="sk-..." />
								</Field>

								<Field label="Search" labelIcon={searchIcon} inputID="search-icon-input">
									<input class="native-input" id="search-icon-input" placeholder="Search..." />
								</Field>
							</div>

							<Divider />

							<!-- The documented `Field` example: a control Astryx has no input for. -->
							<div class="field-column">
								<Field
									label="Confidence"
									inputID="confidence-slider"
									description="Choose how strict the review should be."
									descriptionID="confidence-help"
									status={{ type: 'success', message: 'Recommended default' }}
									statusVariant="detached"
								>
									<input
										id="confidence-slider"
										type="range"
										min={0}
										max={100}
										value={60}
										aria-describedby="confidence-help"
									/>
								</Field>
							</div>

							<Divider />

							<!-- `horizontal-labels` is the settings-page arrangement: the field goes
				     `display: contents` so its label lands in the grid's first column. -->
							<FormLayout direction="horizontal-labels">
								<Field label="Display Name" inputID="hl-name">
									<input class="native-input" id="hl-name" value="Jane Doe" />
								</Field>
								<Field label="Email" inputID="hl-email">
									<input class="native-input" id="hl-email" value="jane@example.com" />
								</Field>
								<Field label="Timezone" inputID="hl-timezone">
									<select class="native-input" id="hl-timezone">
										<option value="America/Los_Angeles">Pacific Time</option>
										<option value="America/New_York">Eastern Time</option>
										<option value="UTC">UTC</option>
									</select>
								</Field>
								<Field label="Bio" inputID="hl-bio">
									<textarea class="native-input" id="hl-bio" rows={3}></textarea>
								</Field>
							</FormLayout>
						</VStack>
						<p class="note">
							<code>Field</code> is the low-level shell for controls Astryx has no input component
							for — it never wires <code>aria-describedby</code> for you, it <em>publishes</em> the
							ids (
							<code>email-desc</code>, or a derived <code>{'{inputID}'}-desc</code>) for the control
							you nest to reference. The native <code>&lt;input&gt;</code>s here are styled by this
							page, not by Astryx: that is the point of the component. In
							<code>horizontal-labels</code> the root becomes <code>display: contents</code>, so the
							label and the input group are placed by the enclosing grid rather than by the field.
						</p>
						<p class="note">
							Three deviations from upstream, all forced by something unported. Upstream's
							<code>labelIcon</code> story passes heroicons' <code>EnvelopeIcon</code>; Astryx's own
							26-icon registry has no envelope, so this shows the prop with a <code>search</code>
							icon on a search field rather than hand-drawing a glyph. Upstream's
							<code>StatusVariants</code>
							story is absent because it is built from <code>TextInput</code> —
							<code>Field</code>'s own status rendering is shown above instead. And the
							<code>horizontal-labels</code> block is upstream's
							<code>FormLayoutHorizontalLabels</code> with its copy verbatim, but its
							<code>TextInput</code>/<code>Selector</code>/<code>TextArea</code> children swapped
							for the native controls those wrap — the same compromise the <code>FormLayout</code> section
							makes, one component further along.
						</p>
					</section>

					<section id="fieldstatus-formlayout" data-section="fieldstatus-formlayout">
						<h2 id="fieldstatus-formlayout">
							FieldStatus, FormLayout
							<a
								class="anchor"
								href="#fieldstatus-formlayout"
								aria-label="Link to FieldStatus, FormLayout">#</a
							>
						</h2>
						<VStack gap={4}>
							<VStack gap={4}>
								<FieldStatus type="error" message="This field is required" variant="detached" />
								<FieldStatus
									type="warning"
									message="This username is already taken by another team"
									variant="detached"
								/>
								<FieldStatus
									type="success"
									message="Your changes have been saved"
									variant="detached"
								/>
							</VStack>

							<FormLayout>
								<Text type="label">Vertical (default)</Text>
								<FormLayout direction="horizontal">
									<Text type="supporting" color="secondary">Horizontal column one</Text>
									<Text type="supporting" color="secondary">Horizontal column two</Text>
								</FormLayout>
							</FormLayout>
						</VStack>
						<p class="note">
							<code>FieldStatus</code>'s entry animation is mount-only: a message present at first
							paint appears settled, and only one that arrives later slides in. Nesting a
							<code>FormLayout</code> inside another works without either knowing about the other — the
							inner one republishes its own direction.
						</p>
					</section>

					<section id="textinput" data-section="textinput">
						<h2 id="textinput">
							TextInput
							<a class="anchor" href="#textinput" aria-label="Link to TextInput">#</a>
						</h2>
						<div class="field-column">
							<TextInput
								label="Full name"
								placeholder="Jane Doe"
								value={tiName}
								onChange={(v) => (tiName = v)}
							/>
							<TextInput
								label="Email"
								type="email"
								description="We'll only use this to send your receipt."
								placeholder="you@example.com"
								value={tiEmail}
								onChange={(v) => (tiEmail = v)}
							/>
							<TextInput
								label="Password"
								type="password"
								isRequired
								placeholder="••••••••"
								value={tiPassword}
								onChange={(v) => (tiPassword = v)}
							/>
							<TextInput
								label="Search"
								isLabelHidden
								startIcon={searchIconSecondary}
								hasClear
								placeholder="Search reports..."
								value={tiSearch}
								onChange={(v) => (tiSearch = v)}
							/>
							<TextInput
								label="Email"
								type="email"
								status={{ type: 'error', message: 'Email must include an @ sign' }}
								value={tiError}
								onChange={(v) => (tiError = v)}
							/>
							<TextInput
								label="Username"
								status={{ type: 'warning', message: 'This username is close to a reserved word' }}
								value={tiWarning}
								onChange={(v) => (tiWarning = v)}
							/>
							<TextInput
								label="Handle"
								status={{ type: 'success', message: 'This handle is available' }}
								value={tiSuccess}
								onChange={(v) => (tiSuccess = v)}
							/>
							<TextInput
								label="API key"
								labelTooltip="Find your API key under Settings → Developer. Keep it secret."
								placeholder="sk-..."
								value={tiDocumented}
								onChange={(v) => (tiDocumented = v)}
							/>
							<TextInput
								label="Account ID"
								isDisabled
								disabledMessage="Your account ID cannot be changed"
								value="acct_8f2c91"
							/>
						</div>
						<p class="note">
							The same two forced deviations as <code>TextArea</code>: the search tile's
							<code>startIcon</code> uses the registry name <code>search</code> where upstream's
							story passes a heroicon, and there is no <code>changeAction</code>/<code
								>isLoading</code
							>
							tile because upstream ships no story for the optimistic path — it is covered by the ported
							suite. The clear button appears while the search field is non-empty and returns focus on
							click; the disabled field keeps focus via <code>aria-disabled</code> +
							<code>readonly</code> so its reason stays reachable by keyboard.
						</p>
					</section>

					<section id="textarea" data-section="textarea">
						<h2 id="textarea">
							TextArea
							<a class="anchor" href="#textarea" aria-label="Link to TextArea">#</a>
						</h2>
						<div class="field-column">
							<TextArea
								label="Description"
								placeholder="Enter a description..."
								value={taDescription}
								onChange={(v) => (taDescription = v)}
							/>
							<TextArea
								label="Bio"
								description="Tell us about yourself in a few sentences."
								placeholder="Write your bio here..."
								value={taBio}
								onChange={(v) => (taBio = v)}
							/>
							<TextArea
								label="Message"
								rows={6}
								placeholder="Write a longer message..."
								value={taMessage}
								onChange={(v) => (taMessage = v)}
							/>
							<TextArea
								label="Notes"
								startIcon={documentIcon}
								placeholder="Enter your notes..."
								value={taNotes}
								onChange={(v) => (taNotes = v)}
							/>
							<TextArea
								label="Description"
								placeholder="Enter a description..."
								status={{ type: 'error', message: 'Description must be at least 50 characters' }}
								value={taError}
								onChange={(v) => (taError = v)}
							/>
							<TextArea
								label="Content"
								placeholder="Enter content..."
								status={{ type: 'warning', message: 'Content may need review before publishing' }}
								value={taWarning}
								onChange={(v) => (taWarning = v)}
							/>
							<TextArea
								label="Description"
								placeholder="Enter a description..."
								status={{ type: 'success', message: 'Description looks good!' }}
								value={taSuccess}
								onChange={(v) => (taSuccess = v)}
							/>
							<TextArea
								label="Bio"
								placeholder="Tell us about yourself..."
								maxLength={150}
								value={taCounted}
								onChange={(v) => (taCounted = v)}
							/>
							<TextArea
								label="API Documentation"
								placeholder="Describe your API endpoint..."
								labelTooltip="Provide a detailed description of what this API endpoint does, including expected inputs and outputs."
								value={taDocumented}
								onChange={(v) => (taDocumented = v)}
							/>
							<TextArea
								label="Notes"
								isDisabled
								disabledMessage="Notes are locked after submission"
								value="These notes are locked after submission."
							/>
						</div>
						<p class="note">
							The counter deliberately does <em>not</em> set the native <code>maxlength</code>:
							over-limit text is accepted and reported rather than silently truncated, and the count
							turns red while
							<code>aria-invalid</code> goes true. Type past 120 of the 150 to hear the live region
							start announcing — it stays silent below 80% so a screen reader is not told the
							remaining count on every keystroke. The disabled field keeps focus: with a
							<code>disabledMessage</code> it takes <code>aria-disabled</code> and
							<code>readonly</code> rather than the native <code>disabled</code>, so the reason
							stays reachable by keyboard.
						</p>
						<p class="note">
							Two deviations, both forced. Upstream's three <code>startIcon</code> stories pass
							heroicons (<code>DocumentTextIcon</code>, <code>ChatBubbleLeftIcon</code>,
							<code>PencilSquareIcon</code>), none of which exist in Astryx's 26-name registry —
							this shows the prop with a registry name in a plausible context, as the
							<code>Field</code>
							section does, rather than hand-drawing a glyph. And there is no
							<code>changeAction</code>
							or
							<code>isLoading</code> tile: upstream ships no story for either, so demonstrating the optimistic
							path here would be invented. It is covered by the ported suite instead.
						</p>
					</section>

					<section id="numberinput" data-section="numberinput">
						<h2 id="numberinput">
							NumberInput
							<a class="anchor" href="#numberinput" aria-label="Link to NumberInput">#</a>
						</h2>
						<div class="field-column">
							<NumberInput
								label="Quantity"
								placeholder="Enter quantity"
								value={niQuantity}
								onChange={(v: number | null) => (niQuantity = v)}
							/>
							<NumberInput
								label="Age"
								description="Enter your age in years"
								placeholder="Enter your age"
								value={niAge}
								onChange={(v: number | null) => (niAge = v)}
							/>
							<NumberInput
								label="Rating"
								placeholder="1-5"
								min={1}
								max={5}
								description="Rate from 1 to 5"
								value={niRating}
								onChange={(v: number | null) => (niRating = v)}
							/>
							<NumberInput
								label="Price"
								placeholder="0.00"
								min={0}
								step={0.01}
								startIcon={numberInputDollarIcon}
								value={niPrice}
								onChange={(v: number | null) => (niPrice = v)}
							/>
							<NumberInput
								label="Discount"
								placeholder="Enter discount"
								min={0}
								max={100}
								units="%"
								value={niDiscount}
								onChange={(v: number | null) => (niDiscount = v)}
							/>
							<NumberInput
								label="Storage"
								placeholder="Enter storage"
								min={0}
								units="GB"
								value={niStorage}
								onChange={(v: number | null) => (niStorage = v)}
							/>
							<NumberInput
								label="Count"
								placeholder="Enter count"
								isIntegerOnly
								description="Only accepts whole numbers"
								value={niCount}
								onChange={(v: number | null) => (niCount = v)}
							/>
							<NumberInput
								label="Quantity"
								value={niWithValue}
								onChange={(v: number | null) => (niWithValue = v)}
							/>
							<NumberInput
								label="Phone Extension"
								isOptional
								placeholder="Enter extension"
								value={niExtension}
								onChange={(v: number | null) => (niExtension = v)}
							/>
							<NumberInput
								label="Quantity"
								isRequired
								placeholder="Enter quantity"
								value={niRequired}
								onChange={(v: number | null) => (niRequired = v)}
							/>
							<NumberInput label="Locked Amount" isDisabled value={100} onChange={() => {}} />
							<NumberInput
								label="Quantity"
								isDisabled
								disabledMessage="Editing is locked while the order is processing"
								value={100}
								onChange={() => {}}
							/>
							<NumberInput
								label="Count"
								placeholder="Enter count..."
								startIcon={numberInputHashIcon}
								value={niStartIcon}
								onChange={(v: number | null) => (niStartIcon = v)}
							/>
							<NumberInput
								label="Small"
								size="sm"
								placeholder="Small input"
								value={niSm}
								onChange={(v: number | null) => (niSm = v)}
							/>
							<NumberInput
								label="Medium"
								size="md"
								placeholder="Medium input"
								value={niMd}
								onChange={(v: number | null) => (niMd = v)}
							/>
							<NumberInput
								label="Large"
								size="lg"
								placeholder="Large input"
								value={niLg}
								onChange={(v: number | null) => (niLg = v)}
							/>
							<NumberInput
								label="Error with message"
								value={niError}
								onChange={(v: number | null) => (niError = v)}
								status={{ type: 'error', message: 'Must be positive' }}
							/>
							<NumberInput
								label="Warning with message"
								value={niWarning}
								onChange={(v: number | null) => (niWarning = v)}
								status={{ type: 'warning', message: 'Value seems high' }}
							/>
							<NumberInput
								label="Success with message"
								value={niSuccess}
								onChange={(v: number | null) => (niSuccess = v)}
								status={{ type: 'success', message: 'Looks good' }}
							/>
							<NumberInput
								label="Error without message"
								value={niErrorNoMsg}
								onChange={(v: number | null) => (niErrorNoMsg = v)}
								status={{ type: 'error' }}
							/>
							<NumberInput
								label="API Rate Limit"
								placeholder="Enter rate limit"
								labelTooltip="Maximum number of API requests per minute"
								value={niRateLimit}
								onChange={(v: number | null) => (niRateLimit = v)}
							/>
							<NumberInput
								label="Price"
								placeholder="0.00"
								min={0}
								step={0.01}
								startIcon={numberInputDollarIcon}
								description="Enter amount in dollars"
								value={niDecimal}
								onChange={(v: number | null) => (niDecimal = v)}
							/>
							<NumberInput
								label="Quantity"
								placeholder="Enter a number"
								hasClear
								value={niClearable}
								onChange={(v: number | null) => (niClearable = v)}
							/>
							<NumberInput
								label="Progress"
								units="%"
								min={0}
								max={100}
								hasClear
								value={niClearableUnits}
								onChange={(v: number | null) => (niClearableUnits = v)}
							/>
						</div>
						<p class="note">
							There are deliberately <strong>no increment/decrement buttons</strong>: the only
							stepper is the one <code>type="number"</code> gives the browser. Upstream's
							<code>.doc.mjs</code> anatomy lists a <code>Spinner</code> for "increment and
							decrement controls", but its source renders none, and the source wins.
							<code>onChange</code>
							fires only for values that pass <code>min</code>/<code>max</code>/<code
								>isIntegerOnly</code
							>; an unparseable entry dims, announces itself, and reverts on blur. <code>step</code> is
							an attribute only, never a validation constraint.
						</p>
					</section>

					<section id="fileinput" data-section="fileinput">
						<h2 id="fileinput">
							FileInput
							<a class="anchor" href="#fileinput" aria-label="Link to FileInput">#</a>
						</h2>
						<div class="field-column">
							<FileInput
								label="Upload file"
								placeholder="Drag files here or click to browse"
								value={fiDefault}
								onChange={(f) => (fiDefault = f)}
							/>
							<FileInput
								label="Resume"
								description="Upload your resume in PDF or Word format. Max 5MB."
								accept=".pdf,.doc,.docx"
								value={fiResume}
								onChange={(f) => (fiResume = f)}
							/>
							<FileInput
								label="Attachments"
								isMultiple
								description="Upload up to 10 files. Max 5MB each."
								maxFiles={10}
								maxSize={5 * 1024 * 1024}
								value={fiAttachments}
								onChange={(f) => (fiAttachments = f)}
							/>
							<FileInput
								label="Profile photo"
								accept="image/png,image/jpeg"
								description="PNG or JPEG, max 2MB."
								maxSize={2 * 1024 * 1024}
								value={fiPhoto}
								onChange={(f) => (fiPhoto = f)}
							/>
							<FileInput
								label="Upload files"
								mode="dropzone"
								placeholder="Drag files here or click to browse"
								value={fiDropzone}
								onChange={(f) => (fiDropzone = f)}
							/>
							<FileInput
								label="Supporting document"
								isRequired
								value={fiRequired}
								onChange={(f) => (fiRequired = f)}
							/>
							<FileInput
								label="Cover letter"
								isOptional
								value={fiOptional}
								onChange={(f) => (fiOptional = f)}
							/>
							<FileInput
								label="Upload locked"
								isDisabled
								placeholder="Upload is currently disabled"
								value={fiDisabled}
								onChange={(f) => (fiDisabled = f)}
							/>
							<FileInput
								label="Resume"
								isDisabled
								disabledMessage="Uploads are locked until your profile is verified"
								placeholder="Upload is currently disabled"
								value={fiDisabledMessage}
								onChange={(f) => (fiDisabledMessage = f)}
							/>
							<FileInput
								label="Uploading..."
								isLoading
								value={fiLoading}
								onChange={(f) => (fiLoading = f)}
							/>
							<FileInput
								label="Upload document"
								status={{ type: 'error', message: 'File must be under 10MB' }}
								value={fiError}
								onChange={(f) => (fiError = f)}
							/>
							<FileInput
								label="Upload document"
								status={{ type: 'success', message: 'File uploaded successfully' }}
								value={fiSuccess}
								onChange={(f) => (fiSuccess = f)}
							/>
							<FileInput
								label="Tax documents"
								labelTooltip="Upload W-2 forms, 1099s, or other tax-related documents."
								value={fiTooltip}
								onChange={(f) => (fiTooltip = f)}
							/>
						</div>
						<p class="note">
							The operable control is the <code>role="button"</code> wrapper, not the
							<code>&lt;input type="file"&gt;</code>
							— that input is visually hidden, <code>aria-hidden</code> and
							<code>tabindex="-1"</code>, and every describing attribute lives on the wrapper the
							user actually focuses (upstream's forms-6). Drag-and-drop handlers are attached only
							in
							<code>mode="dropzone"</code>; in <code>input</code> mode a drop is not even
							<code>preventDefault</code>ed. Only the clear button's label is translated — the two
							default placeholders, "Drop files here" and both announcements are hard-coded English
							upstream, and are reproduced rather than fixed.
						</p>
					</section>

					<section id="calendar" data-section="calendar">
						<h2 id="calendar">
							Calendar
							<a class="anchor" href="#calendar" aria-label="Link to Calendar">#</a>
						</h2>
						<div class="calendar-gallery">
							<div class="stack">
								<h3>Default</h3>
								<Calendar
									mode="single"
									value={calDefault}
									onChange={(v: ISODateString) => (calDefault = v)}
								/>
							</div>
							<div class="stack">
								<h3>With selected date</h3>
								<Calendar
									mode="single"
									value={calSelected}
									onChange={(v: ISODateString) => (calSelected = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Range selection</h3>
								<Calendar
									mode="range"
									value={calRange}
									onChange={(r: DateRange) => (calRange = r)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Range with value</h3>
								<Calendar
									mode="range"
									value={calRangeWithValue}
									onChange={(r: DateRange) => (calRangeWithValue = r)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Two months</h3>
								<Calendar
									mode="single"
									numberOfMonths={2}
									value={calTwoMonths}
									onChange={(v: ISODateString) => (calTwoMonths = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Two months, range selection</h3>
								<Calendar
									mode="range"
									numberOfMonths={2}
									value={calTwoMonthsRange}
									onChange={(r: DateRange) => (calTwoMonthsRange = r)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Min/max boundary</h3>
								<Calendar
									mode="single"
									min="2026-01-10"
									max="2026-03-20"
									value={calMinMax}
									onChange={(v: ISODateString) => (calMinMax = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>With date constraints</h3>
								<Calendar
									mode="single"
									min="2026-01-10"
									max="2026-01-25"
									value={calConstrained}
									onChange={(v: ISODateString) => (calConstrained = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Weekdays only</h3>
								<Calendar
									mode="single"
									dateConstraints={[calIsWeekday]}
									value={calWeekdays}
									onChange={(v: ISODateString) => (calWeekdays = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>With week numbers</h3>
								<Calendar
									mode="single"
									hasWeekNumbers
									value={calWeekNumbers}
									onChange={(v: ISODateString) => (calWeekNumbers = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>Monday start</h3>
								<Calendar
									mode="single"
									weekStartsOn={1}
									value={calMondayStart}
									onChange={(v: ISODateString) => (calMondayStart = v)}
									focusDate="2026-01-01"
								/>
							</div>
							<div class="stack">
								<h3>RTL</h3>
								<!--
								Upstream's story wraps the calendar in a bare `dir="rtl"` div and
								nothing else; the flip is entirely CSS (`:dir()`), so no direction
								has to be threaded through the page.
							-->
								<div dir="rtl">
									<Calendar
										mode="single"
										value={calRtl}
										onChange={(v: ISODateString) => (calRtl = v)}
										focusDate="2026-01-01"
									/>
								</div>
							</div>
						</div>
						<p class="note">
							Under <code>dir="rtl"</code> the header flips: "Previous month" sits on the visual
							right with its chevron mirrored to point right (outward), "Next month" on the visual
							left pointing left. The props are a discriminated union on <code>mode</code>, so the
							<code>range</code> arm has to name <code>mode="range"</code> explicitly — the default
							<code>single</code> arm is the one that can omit it. Selection is strictly controlled:
							the calendar never writes <code>value</code> back, so every tile assigns in its own
							<code>onChange</code>.
						</p>
						<p class="note">
							Upstream's <code>handleRef</code> prop has no counterpart. The imperative handle —
							<code>navigateTo(date)</code> — is an instance export reached with
							<code>bind:this</code>, the arrangement <code>Tokenizer</code> and
							<code>SideNav</code> already use, and upstream ships no story that exercises it, so
							there is no tile for it here either. Upstream's <code>AllVariations</code> story is
							also absent: its three blocks are the <code>Default</code>,
							<code>TwoMonthsRangeSelection</code>
							and <code>WeekdaysOnly</code>/<code>WithWeekNumbers</code> configurations already
							above, which is the same fold the <code>NumberInput</code> section makes.
						</p>
					</section>

					<section id="dateinput" data-section="dateinput">
						<h2 id="dateinput">
							DateInput
							<a class="anchor" href="#dateinput" aria-label="Link to DateInput">#</a>
						</h2>
						<VStack gap={6}>
							<div class="field-column">
								<DateInput
									label="Date"
									placeholder="Select a date"
									value={diDefault}
									onChange={(v) => (diDefault = v)}
								/>
								<DateInput
									label="Event date"
									value={diWithValue}
									onChange={(v) => (diWithValue = v)}
								/>
								<DateInput
									label="Birthday"
									description="Enter your date of birth"
									placeholder="Select your birthday"
									value={diBirthday}
									onChange={(v) => (diBirthday = v)}
								/>
								<DateInput
									label="Date"
									isLabelHidden
									placeholder="Select a date"
									value={diHiddenLabel}
									onChange={(v) => (diHiddenLabel = v)}
								/>
								<DateInput
									label="Preferred date"
									isOptional
									placeholder="Select a date (optional)"
									value={diOptional}
									onChange={(v) => (diOptional = v)}
								/>
								<DateInput
									label="Start date"
									isRequired
									placeholder="Select a start date"
									value={diRequired}
									onChange={(v) => (diRequired = v)}
								/>
								<DateInput
									label="Locked date"
									isDisabled
									value={diDisabled}
									onChange={(v) => (diDisabled = v)}
								/>
								<DateInput
									label="Event date"
									isDisabled
									disabledMessage="You need the Editor role to change this"
									value={diDisabledMessage}
									onChange={(v) => (diDisabledMessage = v)}
								/>
								<DateInput
									label="Date"
									size="sm"
									placeholder="Select a date"
									value={diSmall}
									onChange={(v) => (diSmall = v)}
								/>
								<DateInput
									label="Booking date"
									min="2026-01-15"
									max="2026-02-15"
									description="Available dates: Jan 15 - Feb 15, 2026"
									placeholder="Select a booking date"
									value={diMinMax}
									onChange={(v) => (diMinMax = v)}
								/>
								<DateInput
									label="Travel date"
									numberOfMonths={2}
									placeholder="Select a travel date"
									value={diTwoMonths}
									onChange={(v) => (diTwoMonths = v)}
								/>
								<DateInput
									label="Event date"
									status={{ type: 'error', message: 'This date is not available' }}
									value={diError}
									onChange={(v) => (diError = v)}
								/>
								<DateInput
									label="Meeting date"
									status={{ type: 'warning', message: 'This is a holiday - are you sure?' }}
									value={diWarning}
									onChange={(v) => (diWarning = v)}
								/>
								<DateInput
									label="Appointment date"
									status={{ type: 'success', message: 'Date is available' }}
									value={diSuccess}
									onChange={(v) => (diSuccess = v)}
								/>
								<DateInput
									label="Event date"
									placeholder="Select a date"
									hasClear
									value={diClearable}
									onChange={(v) => (diClearable = v)}
								/>
								<DateInput
									label="Deadline"
									status={{ type: 'error', message: 'Date is in the past' }}
									hasClear
									value={diClearableStatus}
									onChange={(v) => (diClearableStatus = v)}
								/>
							</div>

							<!--
							`WithMaxDateInLayout`. The `Layout` is upstream's, and the point of it:
							with `max` at today the calendar opens with its next-month button
							disabled, and the story exists to check the *label* does not grey out
							with it.
						-->
							<Layout height="auto">
								{#snippet content()}
									<LayoutContent>
										<DateInput
											label="End date"
											max={diTodayISO}
											description="Max is today; open the calendar to verify the label does not turn grey when nav buttons are disabled"
											placeholder="Select an end date"
											value={diInLayout}
											onChange={(v) => (diInLayout = v)}
										/>
									</LayoutContent>
								{/snippet}
							</Layout>
						</VStack>
						<p class="note">
							Strictly controlled, like <code>NumberInput</code>: <code>onChange</code> receives
							<code>undefined</code> when the field is cleared, and nothing is written back unless a
							tile assigns. The text half accepts typed dates and the calendar icon opens a
							<code>Popover</code> over the same value. Upstream's <code>AllVariations</code> story is
							folded away — its seven blocks are the default, valued, described, optional, required, disabled
							and error configurations already shown, under different labels.
						</p>
					</section>

					<section id="timeinput" data-section="timeinput">
						<h2 id="timeinput">
							TimeInput
							<a class="anchor" href="#timeinput" aria-label="Link to TimeInput">#</a>
						</h2>
						<div class="field-column">
							<TimeInput
								label="Time"
								placeholder="Select a time"
								value={tmDefault}
								onChange={(v) => (tmDefault = v)}
							/>
							<TimeInput
								label="Meeting time"
								value={tmWithValue}
								onChange={(v) => (tmWithValue = v)}
							/>
							<TimeInput
								label="Time (24h)"
								hourFormat="24h"
								value={tm24h}
								onChange={(v) => (tm24h = v)}
							/>
							<TimeInput
								label="Precise time"
								hasSeconds
								value={tmSeconds}
								onChange={(v) => (tmSeconds = v)}
							/>
							<TimeInput
								label="Start time"
								hasClear
								value={tmClear}
								onChange={(v) => (tmClear = v)}
							/>
							<TimeInput
								label="Alarm time"
								description="When should we wake you up?"
								placeholder="Set alarm time"
								value={tmDescription}
								onChange={(v) => (tmDescription = v)}
							/>
							<TimeInput
								label="Appointment time"
								min={'09:00' as ISOTimeString}
								max={'17:00' as ISOTimeString}
								description="Business hours: 9 AM - 5 PM"
								placeholder="Select appointment time"
								value={tmMinMax}
								onChange={(v) => (tmMinMax = v)}
							/>
							<TimeInput
								label="Time slot"
								increment={15}
								description="Use arrow keys to change by 15 minutes"
								value={tmIncrement}
								onChange={(v) => (tmIncrement = v)}
							/>
							<TimeInput
								label="Preferred time"
								isOptional
								placeholder="Select a time (optional)"
								value={tmOptional}
								onChange={(v) => (tmOptional = v)}
							/>
							<TimeInput
								label="Start time"
								isRequired
								placeholder="Select a start time"
								value={tmRequired}
								onChange={(v) => (tmRequired = v)}
							/>
							<TimeInput
								label="Locked time"
								isDisabled
								value={tmDisabled}
								onChange={(v) => (tmDisabled = v)}
							/>
							<TimeInput
								label="Start time"
								isDisabled
								disabledMessage="You need the Editor role to change this"
								value={tmDisabledMessage}
								onChange={(v) => (tmDisabledMessage = v)}
							/>
							<TimeInput
								label="Time"
								size="sm"
								placeholder="Select a time"
								value={tmSmall}
								onChange={(v) => (tmSmall = v)}
							/>
							<TimeInput
								label="Event time"
								status={{ type: 'error', message: 'Time must be during business hours' }}
								value={tmError}
								onChange={(v) => (tmError = v)}
							/>
							<TimeInput
								label="Meeting time"
								status={{ type: 'warning', message: 'Early morning meeting - are you sure?' }}
								value={tmWarning}
								onChange={(v) => (tmWarning = v)}
							/>
							<TimeInput
								label="Scheduled time"
								status={{ type: 'success', message: 'Time slot is available' }}
								value={tmSuccess}
								onChange={(v) => (tmSuccess = v)}
							/>
						</div>
						<p class="note">
							<code>value</code> is an <code>ISOTimeString</code> — a <em>branded</em> type, unlike
							<code>ISODateString</code> — so the seeded literals and the
							<code>min</code>/<code>max</code> pair need <code>as ISOTimeString</code>. The typed
							text is parsed loosely ("2pm", "0930") and only committed on blur or Enter; arrow keys
							step the segment under the caret by <code>increment</code> minutes. Upstream's
							<code>AllVariations</code> story is folded away for the same reason as
							<code>NumberInput</code>'s: every one of its seven blocks is a configuration already
							above.
						</p>
					</section>

					<section id="datetimeinput" data-section="datetimeinput">
						<h2 id="datetimeinput">
							DateTimeInput
							<a class="anchor" href="#datetimeinput" aria-label="Link to DateTimeInput">#</a>
						</h2>
						<div class="field-column field-column-wide">
							<DateTimeInput
								label="Meeting time"
								placeholder="Select a date"
								value={dtmDefault}
								onChange={(v) => (dtmDefault = v)}
							/>
							<DateTimeInput
								label="Event time"
								value={dtmWithValue}
								onChange={(v) => (dtmWithValue = v)}
							/>
							<DateTimeInput
								label="Appointment"
								hourFormat="24h"
								value={dtm24h}
								onChange={(v) => (dtm24h = v)}
							/>
							<DateTimeInput
								label="Log timestamp"
								hasSeconds
								value={dtmSeconds}
								onChange={(v) => (dtmSeconds = v)}
							/>
							<DateTimeInput
								label="Deadline"
								description="When is this task due?"
								placeholder="Select deadline"
								value={dtmDescription}
								onChange={(v) => (dtmDescription = v)}
							/>
							<DateTimeInput
								label="Start time"
								hasClear
								value={dtmClear}
								onChange={(v) => (dtmClear = v)}
							/>
							<DateTimeInput
								label="Appointment"
								min={'2026-03-15T09:00' as ISODateTimeString}
								max={'2026-03-15T17:00' as ISODateTimeString}
								description="Available: Mar 15, 9 AM - 5 PM"
								value={dtmMinMax}
								onChange={(v) => (dtmMinMax = v)}
							/>
							<DateTimeInput
								label="Time slot"
								timeIncrement={15}
								description="Use arrow keys to change by 15 minutes"
								value={dtmIncrement}
								onChange={(v) => (dtmIncrement = v)}
							/>
							<DateTimeInput
								label="Preferred time"
								isOptional
								placeholder="Select a date (optional)"
								value={dtmOptional}
								onChange={(v) => (dtmOptional = v)}
							/>
							<DateTimeInput
								label="Start time"
								isRequired
								value={dtmRequired}
								onChange={(v) => (dtmRequired = v)}
							/>
							<DateTimeInput
								label="Locked time"
								isDisabled
								value={dtmDisabled}
								onChange={(v) => (dtmDisabled = v)}
							/>
							<DateTimeInput
								label="Meeting time"
								isDisabled
								disabledMessage="You need the Editor role to change this"
								value={dtmDisabledMessage}
								onChange={(v) => (dtmDisabledMessage = v)}
							/>
							<DateTimeInput
								label="Small (28px)"
								placeholder="Small size"
								size="sm"
								value={dtmSm}
								onChange={(v) => (dtmSm = v)}
							/>
							<DateTimeInput
								label="Medium (32px)"
								placeholder="Medium size (default)"
								size="md"
								value={dtmMd}
								onChange={(v) => (dtmMd = v)}
							/>
							<DateTimeInput
								label="Large (36px)"
								placeholder="Large size"
								size="lg"
								value={dtmLg}
								onChange={(v) => (dtmLg = v)}
							/>
							<DateTimeInput
								label="Travel departure"
								numberOfMonths={2}
								value={dtmTwoMonths}
								onChange={(v) => (dtmTwoMonths = v)}
							/>
							<DateTimeInput
								label="Event time"
								status={{ type: 'error', message: 'This time slot is not available' }}
								value={dtmError}
								onChange={(v) => (dtmError = v)}
							/>
							<DateTimeInput
								label="Meeting time"
								status={{ type: 'warning', message: 'Early morning meeting - are you sure?' }}
								value={dtmWarning}
								onChange={(v) => (dtmWarning = v)}
							/>
							<DateTimeInput
								label="Scheduled time"
								status={{ type: 'success', message: 'Time slot is available' }}
								value={dtmSuccess}
								onChange={(v) => (dtmSuccess = v)}
							/>
						</div>
						<p class="note">
							One field, two inputs: the date half opens the calendar popover, the time half is a
							<code>TimeInput</code> in the same shell, and the value they share is a branded
							<code>ISODateTimeString</code> (<code>YYYY-MM-DDTHH:mm</code>), so seeded literals and
							the
							<code>min</code>/<code>max</code> pair need <code>as ISODateTimeString</code>.
							<code>onChange</code> is a <strong>required</strong> prop here — upstream's is too —
							so there is no uncontrolled arm to show. Upstream's <code>AllVariations</code> story is
							folded away; its six blocks are configurations already above.
						</p>
					</section>

					<section id="daterangeinput" data-section="daterangeinput">
						<h2 id="daterangeinput">
							DateRangeInput
							<a class="anchor" href="#daterangeinput" aria-label="Link to DateRangeInput">#</a>
						</h2>
						<div class="field-column">
							<DateRangeInput
								label="Date range"
								value={driDefault}
								onChange={(v) => (driDefault = v)}
							/>
							<DateRangeInput
								label="Report period"
								value={driWithValue}
								onChange={(v) => (driWithValue = v)}
							/>
							<DateRangeInput
								label="Date range"
								presets={DRI_PRESETS}
								value={driPresets}
								onChange={(v) => (driPresets = v)}
							/>
							<DateRangeInput
								label="Analytics period"
								presets={DRI_PRESETS}
								value={driPresetsWithValue}
								onChange={(v) => (driPresetsWithValue = v)}
							/>
							<DateRangeInput
								label="Coverage period"
								description="Select the start and end dates for the report"
								value={driDescription}
								onChange={(v) => (driDescription = v)}
							/>
							<DateRangeInput
								label="Booking dates"
								min="2026-03-01"
								max="2026-06-30"
								description="Available: Mar 1 – Jun 30, 2026"
								value={driMinMax}
								onChange={(v) => (driMinMax = v)}
							/>
							<DateRangeInput
								label="Filter by date"
								isOptional
								value={driOptional}
								onChange={(v) => (driOptional = v)}
							/>
							<DateRangeInput
								label="Coverage period"
								isRequired
								value={driRequired}
								onChange={(v) => (driRequired = v)}
							/>
							<DateRangeInput
								label="Locked range"
								isDisabled
								value={driDisabled}
								onChange={(v) => (driDisabled = v)}
							/>
							<DateRangeInput
								label="Reporting period"
								isDisabled
								disabledMessage="You need the Editor role to change this"
								value={driDisabledMessage}
								onChange={(v) => (driDisabledMessage = v)}
							/>
							<DateRangeInput
								label="Small (28px)"
								size="sm"
								value={driSm}
								onChange={(v) => (driSm = v)}
							/>
							<DateRangeInput
								label="Medium (32px)"
								size="md"
								value={driMd}
								onChange={(v) => (driMd = v)}
							/>
							<DateRangeInput
								label="Large (36px)"
								size="lg"
								value={driLg}
								onChange={(v) => (driLg = v)}
							/>
							<DateRangeInput
								label="Date range"
								numberOfMonths={1}
								value={driSingleMonth}
								onChange={(v) => (driSingleMonth = v)}
							/>
							<DateRangeInput
								label="Date range"
								status={{ type: 'error', message: 'Please select a date range' }}
								value={driError}
								onChange={(v) => (driError = v)}
							/>
							<DateRangeInput
								label="Date range"
								status={{ type: 'warning', message: 'Range exceeds 90 days' }}
								value={driWarning}
								onChange={(v) => (driWarning = v)}
							/>
							<DateRangeInput
								label="Required range"
								hasClear={false}
								value={driNoClear}
								onChange={(v) => (driNoClear = v)}
							/>
						</div>
						<p class="note">
							The only one of the five whose <code>value</code> <em>and</em> <code>onChange</code>
							are both required, and the only one whose empty value is <code>null</code> rather than
							<code>undefined</code>. It defaults to two months and to <code>hasClear</code> on,
							which is why the last tile has to switch the clear button off explicitly. The
							<code>presets</code> list is upstream's <code>defaultPresets</code>, transcribed: each
							entry computes its range at click time from <code>new Date()</code>, so the two tiles
							that use it move with the clock. Upstream's <code>AllVariations</code> story is folded away
							— its five blocks are the default, valued, preset, disabled and error configurations above.
						</p>
					</section>

					<section id="selector" data-section="selector">
						<h2 id="selector">
							Selector
							<a class="anchor" href="#selector" aria-label="Link to Selector">#</a>
						</h2>
						<div class="field-column">
							<Selector
								label="Fruit"
								options={SELECTOR_FRUITS}
								value={selDefault}
								onChange={(v: string) => (selDefault = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Fruit"
								isLabelHidden
								options={SELECTOR_FRUITS}
								value={selHiddenLabel}
								onChange={(v: string) => (selHiddenLabel = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Fruit"
								description="Choose your favorite fruit from the list"
								options={SELECTOR_FRUITS}
								value={selDescription}
								onChange={(v: string) => (selDescription = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Fruit"
								options={SELECTOR_OBJECT_FRUITS}
								value={selObjects}
								onChange={(v: string) => (selObjects = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Settings"
								options={SELECTOR_ICON_OPTIONS}
								value={selIcons}
								onChange={(v: string) => (selIcons = v)}
								placeholder="Select an option..."
							/>
							<Selector
								label="Fruit"
								options={SELECTOR_SECTIONED}
								value={selSections}
								onChange={(v: string) => (selSections = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="User"
								options={SELECTOR_USERS}
								value={selCustomRender}
								onChange={(v: string) => (selCustomRender = v)}
								placeholder="Select a user..."
								renderOption={selectorUserOption}
							/>
							<Selector
								label="Small"
								size="sm"
								options={['Apple', 'Banana', 'Orange']}
								value={selSm}
								onChange={(v: string) => (selSm = v)}
								placeholder="Small size (28px)"
							/>
							<Selector
								label="Medium"
								size="md"
								options={['Apple', 'Banana', 'Orange']}
								value={selMd}
								onChange={(v: string) => (selMd = v)}
								placeholder="Medium size (32px)"
							/>
							<Selector
								label="Large"
								size="lg"
								options={['Apple', 'Banana', 'Orange']}
								value={selLg}
								onChange={(v: string) => (selLg = v)}
								placeholder="Large size (36px)"
							/>
							<Selector
								label="Error status"
								options={[
									{ value: 'apple', label: 'Apple' },
									{ value: 'banana', label: 'Banana' }
								]}
								value={selError}
								onChange={(v: string) => (selError = v)}
								placeholder="Select a fruit..."
								status={{ type: 'error', message: 'Please select a fruit' }}
							/>
							<Selector
								label="Warning status"
								options={[
									{ value: 'apple', label: 'Apple' },
									{ value: 'banana', label: 'Banana' }
								]}
								value={selWarning}
								onChange={(v: string) => (selWarning = v)}
								status={{ type: 'warning', message: 'Banana is out of season' }}
							/>
							<Selector
								label="Success status"
								options={[
									{ value: 'apple', label: 'Apple' },
									{ value: 'banana', label: 'Banana' }
								]}
								value={selSuccess}
								onChange={(v: string) => (selSuccess = v)}
								status={{ type: 'success' }}
							/>
							<Selector
								label="Optional field"
								isOptional
								options={['Apple', 'Banana', 'Orange']}
								value={selOptional}
								onChange={(v: string) => (selOptional = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Required field"
								isRequired
								options={['Apple', 'Banana', 'Orange']}
								value={selRequired}
								onChange={(v: string) => (selRequired = v)}
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Fruit"
								options={['Apple', 'Banana', 'Orange']}
								value="Apple"
								isDisabled
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Owner"
								options={['Alice', 'Bob', 'Carol']}
								isDisabled
								disabledMessage="You need the Editor role to change this"
								placeholder="Select an owner..."
							/>
							<Selector
								label="Fruit"
								options={['Apple', 'Banana', 'Orange', 'Mango']}
								value={selPreSelected}
								onChange={(v: string) => (selPreSelected = v)}
							/>
							<Selector
								label="Fruit"
								options={['Apple', 'Banana', 'Cherry', 'Date']}
								value={selClearable}
								onChange={(v: string | null) => (selClearable = v)}
								hasClear
								placeholder="Select a fruit..."
							/>
							<Selector
								label="Required fruit"
								options={['Apple', 'Banana', 'Cherry']}
								value={selClearableStatus}
								onChange={(v: string | null) => (selClearableStatus = v)}
								hasClear
								status={{ type: 'warning', message: 'Selection is recommended' }}
							/>
							<Selector
								label="Bottom toolbar selector"
								options={['Apple', 'Banana', 'Cherry', 'Date']}
								value={selPlacementAbove}
								onChange={(v: string) => (selPlacementAbove = v)}
								placement="above"
							/>
							<Selector
								label="Searchable fruit"
								options={SELECTOR_FRUITS}
								value={selSearch}
								onChange={(v: string) => (selSearch = v)}
								hasSearch
								placeholder="Select a fruit..."
							/>
						</div>
						<!-- GhostVariant — ghost trigger for toolbar composition. -->
						<h3>Ghost variant</h3>
						<HStack gap={2} vAlign="center" width="max-content">
							<Button label="Today" variant="ghost" />
							<Selector
								label="View"
								isLabelHidden
								variant="ghost"
								size="md"
								options={[
									{ value: 'day', label: 'Day' },
									{ value: 'week', label: 'Week' },
									{ value: 'month', label: 'Month' }
								]}
								value={selGhostView}
								onChange={(v: string) => (selGhostView = v)}
							/>
							<Selector
								label="Density"
								isLabelHidden
								variant="ghost"
								size="md"
								options={[
									{ value: 'compact', label: 'Compact' },
									{ value: 'comfortable', label: 'Comfortable' },
									{ value: 'spacious', label: 'Spacious' }
								]}
								value={selGhostDensity}
								onChange={(v: string) => (selGhostDensity = v)}
								status={{ type: 'warning', message: 'This setting affects all users' }}
								statusVariant="tooltip"
							/>
							<Button label="Export" variant="ghost" />
						</HStack>
						<p class="note">
							<code>variant="ghost"</code> (0.3.0) drops the input chrome so the trigger reads as a
							toolbar control beside plain ghost <code>Button</code>s rather than as a form field
							stranded on a strip. An <code>attached</code> <code>statusVariant</code> would put
							that chrome back, so a ghost trigger silently resolves it to <code>detached</code>.
						</p>
						<p class="note">
							A <code>role="combobox"</code> trigger over a <code>Popover</code> whose
							<code>role</code> is <code>none</code>, so the inner <code>role="listbox"</code> is
							the exposed semantics and the trigger keeps DOM focus. Without an explicit
							<code>placement</code> the dropdown positions the <em>selected</em> item over the
							trigger (macOS-style) and clamps to the viewport. Upstream's <code>renderOption</code>
							render prop is a snippet here; <code>hasSearch</code> moves the combobox role onto the
							search input, which is the element that then owns <code>aria-activedescendant</code>.
							<code>value</code> is <strong>strictly controlled</strong> and deliberately not
							<code>bind:</code>-able, unlike <code>TextInput</code>/<code>Switch</code>: a local
							write would strand a controlled caller that does not commit — which is exactly what
							<code>Pagination</code>'s optional <code>onPageSizeChange</code> would do.
						</p>
					</section>

					<section id="multiselector" data-section="multiselector">
						<h2 id="multiselector">
							MultiSelector
							<a class="anchor" href="#multiselector" aria-label="Link to MultiSelector">#</a>
						</h2>
						<div class="field-column">
							<MultiSelector
								label="Columns"
								placeholder="Select columns..."
								options={MS_COLUMNS}
								value={msDefault}
								onChange={(v) => (msDefault = v)}
							/>
							<MultiSelector
								label="Permissions"
								placeholder="Select permissions..."
								options={MS_PERMISSIONS}
								value={msSections}
								onChange={(v) => (msSections = v)}
							/>
							<MultiSelector
								label="Columns"
								placeholder="Select columns..."
								options={MS_SELECT_ALL_COLUMNS}
								value={msSelectAll}
								onChange={(v) => (msSelectAll = v)}
								hasSelectAll
							/>
							<MultiSelector
								label="Countries"
								placeholder="Select countries..."
								options={MS_COUNTRIES}
								value={msSearchable}
								onChange={(v) => (msSearchable = v)}
								hasSearch
								hasSelectAll
							/>
							<MultiSelector
								label="Count (default)"
								options={MS_COLUMNS}
								value={msTriggerCount}
								onChange={(v) => (msTriggerCount = v)}
								triggerDisplay="count"
							/>
							<MultiSelector
								label="Labels"
								options={MS_COLUMNS}
								value={msTriggerLabels}
								onChange={(v) => (msTriggerLabels = v)}
								triggerDisplay="labels"
							/>
							<MultiSelector
								label="Badges"
								options={MS_COLUMNS}
								value={msTriggerBadges}
								onChange={(v) => (msTriggerBadges = v)}
								triggerDisplay="badges"
								maxBadges={3}
							/>
							<MultiSelector
								label="Roles"
								placeholder="Select roles..."
								options={MS_ROLES}
								value={msDisabledItems}
								onChange={(v) => (msDisabledItems = v)}
								hasSelectAll
							/>
							<MultiSelector
								label="Columns"
								placeholder="Select columns..."
								options={MS_COLUMNS}
								value={msDisabledMessage}
								onChange={(v) => (msDisabledMessage = v)}
								isDisabled
								disabledMessage="Select a table before choosing columns"
							/>
							<MultiSelector
								label="Error"
								placeholder="Select..."
								options={['Name', 'Email', 'Role']}
								value={msError}
								onChange={(v) => (msError = v)}
								status={{ type: 'error', message: 'Please select at least one column' }}
							/>
							<MultiSelector
								label="Warning"
								options={['Name', 'Email', 'Role']}
								value={msWarning}
								onChange={(v) => (msWarning = v)}
								status={{ type: 'warning', message: 'Email column has issues' }}
							/>
							<MultiSelector
								label="Success"
								options={['Name', 'Email', 'Role']}
								value={msSuccess}
								onChange={(v) => (msSuccess = v)}
								status={{ type: 'success' }}
							/>
							<MultiSelector
								label="Small"
								size="sm"
								placeholder="Small (28px)"
								options={['Name', 'Email', 'Role']}
								value={msSm}
								onChange={(v) => (msSm = v)}
							/>
							<MultiSelector
								label="Medium"
								size="md"
								placeholder="Medium (32px)"
								options={['Name', 'Email', 'Role']}
								value={msMd}
								onChange={(v) => (msMd = v)}
							/>
							<MultiSelector
								label="Large"
								size="lg"
								placeholder="Large (36px)"
								options={['Name', 'Email', 'Role']}
								value={msLg}
								onChange={(v) => (msLg = v)}
							/>
							<MultiSelector
								label="Visible columns"
								description="Choose which columns to display in the table"
								options={MS_FORM_COLUMNS}
								value={msFormColumns}
								onChange={(v) => (msFormColumns = v)}
								hasSelectAll
								isRequired
								triggerDisplay="labels"
							/>
							<MultiSelector
								label="Status filter"
								description="Filter by status"
								placeholder="All statuses"
								options={['Active', 'Inactive', 'Pending', 'Archived']}
								value={msFormFilters}
								onChange={(v) => (msFormFilters = v)}
								isOptional
								triggerDisplay="badges"
							/>
							<MultiSelector
								label="Columns"
								isLabelHidden
								placeholder="Columns"
								options={MS_ALL_COLUMNS}
								value={msColumnVisibility}
								onChange={(v) => (msColumnVisibility = v)}
								hasSelectAll
								hasSearch
								triggerDisplay="count"
							/>
							<MultiSelector
								label="Technologies"
								placeholder="Select technologies..."
								options={MS_TECHNOLOGIES}
								value={msClearable}
								onChange={(v) => (msClearable = v)}
								hasClear
							/>
						</div>
						<!-- GhostVariant — ghost trigger for toolbar composition. -->
						<h3>Ghost variant</h3>
						<HStack gap={2} vAlign="center" width="max-content">
							<Button label="Refresh" variant="ghost" />
							<MultiSelector
								label="Columns"
								isLabelHidden
								variant="ghost"
								size="md"
								options={['Name', 'Email', 'Role', 'Status', 'Created']}
								value={msGhostColumns}
								onChange={(v) => (msGhostColumns = v)}
								triggerDisplay="labels"
								placeholder="Columns"
							/>
							<MultiSelector
								label="Status"
								isLabelHidden
								variant="ghost"
								size="md"
								options={['Active', 'Inactive', 'Pending', 'Archived']}
								value={msGhostFilters}
								onChange={(v) => (msGhostFilters = v)}
								triggerDisplay="labels"
								placeholder="Status"
								status={{ type: 'warning', message: 'Some filters hide archived rows' }}
								statusVariant="tooltip"
							/>
							<Button label="Export" variant="ghost" />
						</HStack>
						<p class="note">
							<code>variant="ghost"</code> (0.3.0), the same toolbar trigger
							<code>Selector</code> grew, with the same <code>attached</code> →
							<code>detached</code> status resolution.
						</p>
						<p class="note">
							The multi-select sibling of <code>Selector</code>: the same
							<code>role="combobox"</code> trigger over a <code>Popover</code> whose
							<code>role</code>
							is <code>none</code>, but the popup is an <code>aria-multiselectable</code> listbox of
							decorative checkboxes and toggling an option deliberately does <em>not</em> close it.
							The items selected when the dropdown opens are snapshotted and sorted to the top of
							their group, frozen until it closes, so a row never moves under the pointer. Selection
							changes are announced politely (&ldquo;2 of 5 selected&rdquo;). <code>value</code> is
							<strong>strictly controlled</strong> and not <code>bind:</code>-able, the rule
							<code>Selector</code> settled.
						</p>
					</section>

					<section id="complexselector" data-section="complexselector">
						<h2 id="complexselector">
							ComplexSelector
							<a class="anchor" href="#complexselector" aria-label="Link to ComplexSelector">#</a>
						</h2>
						<ComplexSelectorDemos />
						<p class="note">
							All <strong>3</strong> of upstream's <code>ComplexSelector.stories.tsx</code> stories.
							New at 0.3.0: a selector <em>shell</em> rather than a selector. It owns the field, the
							trigger, the popover, focus restore and the async
							<code>changeAction</code> flow; the consumer owns the surface inside. Upstream's
							render prop is a <strong>parameterised snippet</strong> here, taking the same four
							arguments in the same order —
							<code>value</code>, <code>onChange</code>, <code>close</code>, and a render state
							describing the shell (<code>isOpen</code>, <code>isBusy</code>,
							<code>triggerId</code>, <code>contentId</code>). The popup is a
							<code>role="dialog"</code>
							with no close button, named from the field label; custom content brings its own semantics,
							which is why upstream's own docs say to reach for the Astryx focus hooks and to check the
							result against WCAG 2.2 — the fruit grid uses
							<code>useGridFocus</code> and the two tree blocks lean on <code>TreeList</code>'s.
						</p>
						<p class="note">
							<code>contentXstyle</code> is the one prop these blocks cannot show: it takes compiled
							StyleX, and StyleX may not be imported from a <code>.svelte</code> file. Upstream uses it
							only to size and pad the popup, so the demos draw the same box from the content side instead.
						</p>
					</section>

					<section id="typeahead" data-section="typeahead">
						<h2 id="typeahead">
							Typeahead
							<a class="anchor" href="#typeahead" aria-label="Link to Typeahead">#</a>
						</h2>
						<div class="field-column">
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								searchSource={typeaheadSource}
								value={thDefault}
								onChange={(item) => (thDefault = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								hasEntriesOnFocus
								searchSource={typeaheadSource}
								value={thBootstrap}
								onChange={(item) => (thBootstrap = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								isRequired
								searchSource={typeaheadSource}
								value={thRequired}
								onChange={(item) => (thRequired = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								isOptional
								searchSource={typeaheadSource}
								value={thOptional}
								onChange={(item) => (thOptional = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								description="Pick your favorite fruit from the list"
								searchSource={typeaheadSource}
								value={thDescription}
								onChange={(item) => (thDescription = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								status={{ type: 'error', message: 'Please select a fruit' }}
								searchSource={typeaheadSource}
								value={thError}
								onChange={(item) => (thError = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								status={{ type: 'warning', message: 'This fruit may be out of season' }}
								searchSource={typeaheadSource}
								value={thWarning}
								onChange={(item) => (thWarning = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								status={{ type: 'success', message: 'Great choice!' }}
								searchSource={typeaheadSource}
								value={thSuccess}
								onChange={(item) => (thSuccess = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								isDisabled
								searchSource={typeaheadSource}
								value={thDisabled}
								onChange={(item) => (thDisabled = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								isDisabled
								disabledMessage="You need the Editor role to change this"
								searchSource={typeaheadSource}
								value={thDisabledMessage}
								onChange={(item) => (thDisabledMessage = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								hasClear={false}
								searchSource={typeaheadSource}
								value={thNoClear}
								onChange={(item) => (thNoClear = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								hasEntriesOnFocus
								maxMenuItems={3}
								searchSource={typeaheadSource}
								value={thLimited}
								onChange={(item) => (thLimited = item)}
							/>
							<Typeahead
								label="Small (28px)"
								placeholder="Small size"
								size="sm"
								searchSource={typeaheadSource}
								value={thSm}
								onChange={(item) => (thSm = item)}
							/>
							<Typeahead
								label="Medium (32px)"
								placeholder="Medium size (default)"
								size="md"
								searchSource={typeaheadSource}
								value={thMd}
								onChange={(item) => (thMd = item)}
							/>
							<Typeahead
								label="Large (36px)"
								placeholder="Large size"
								size="lg"
								searchSource={typeaheadSource}
								value={thLg}
								onChange={(item) => (thLg = item)}
							/>
							<Typeahead
								label="Fruit"
								placeholder="Search fruits..."
								startIcon="search"
								hasEntriesOnFocus
								searchSource={typeaheadSource}
								value={thStartIcon}
								onChange={(item) => (thStartIcon = item)}
							/>
							<Typeahead
								label="Attached (default)"
								status={{ type: 'error', message: 'Please make a selection' }}
								searchSource={typeaheadSource}
								value={thStatusAttached}
								onChange={(item) => (thStatusAttached = item)}
							/>
							<Typeahead
								label="Detached"
								status={{ type: 'error', message: 'Please make a selection' }}
								statusVariant="detached"
								searchSource={typeaheadSource}
								value={thStatusDetached}
								onChange={(item) => (thStatusDetached = item)}
							/>
						</div>
						<p class="note">
							Search-as-you-type over a <code>SearchSource</code>. The styled wrapper owns the
							border, the selected-value <code>Token</code> and edit mode (click the token to edit;
							blur or Escape restores it); <code>BaseTypeahead</code> underneath is the bare
							combobox engine — input, debounced search, keyboard navigation and dropdown — and is
							exported for consumers that bring their own chrome. The source here is a hand-written
							<code>SearchSource</code>, as upstream's story writes it;
							<code>createStaticSource</code>
							is the published factory for the simpler case of a plain array.
						</p>
					</section>

					<section id="tokenizer" data-section="tokenizer">
						<h2 id="tokenizer">
							Tokenizer
							<a class="anchor" href="#tokenizer" aria-label="Link to Tokenizer">#</a>
						</h2>
						<div class="field-column">
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								searchSource={tokenizerUserSource}
								value={tkDefault}
								onChange={(items) => (tkDefault = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Add more..."
								searchSource={tokenizerUserSource}
								value={tkPreselected}
								onChange={(items) => (tkPreselected = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								hasClear
								searchSource={tokenizerUserSource}
								value={tkClear}
								onChange={(items) => (tkClear = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								maxEntries={3}
								searchSource={tokenizerUserSource}
								value={tkMaxEntries}
								onChange={(items) => (tkMaxEntries = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								isRequired
								searchSource={tokenizerUserSource}
								value={tkRequired}
								onChange={(items) => (tkRequired = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								description="Select up to 5 team members for this project"
								searchSource={tokenizerUserSource}
								value={tkDescription}
								onChange={(items) => (tkDescription = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								status={{ type: 'error', message: 'At least one member is required' }}
								searchSource={tokenizerUserSource}
								value={tkError}
								onChange={(items) => (tkError = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								status={{ type: 'warning', message: 'Some members may not have access' }}
								searchSource={tokenizerUserSource}
								value={tkWarning}
								onChange={(items) => (tkWarning = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								status={{ type: 'success', message: 'Team is ready!' }}
								searchSource={tokenizerUserSource}
								value={tkSuccess}
								onChange={(items) => (tkSuccess = items)}
							/>
							<Tokenizer
								label="Team Members"
								isDisabled
								searchSource={tokenizerUserSource}
								value={[TOKENIZER_USERS[0], TOKENIZER_USERS[1]]}
								onChange={() => {}}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search people..."
								startIcon="search"
								searchSource={tokenizerUserSource}
								value={tkStartIcon}
								onChange={(items) => (tkStartIcon = items)}
							/>
							<Tokenizer
								label="Team Members"
								startIcon="search"
								searchSource={tokenizerUserSource}
								value={tkStartIconTokens}
								onChange={(items) => (tkStartIconTokens = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Click to see suggestions..."
								hasEntriesOnFocus
								searchSource={tokenizerUserSource}
								value={tkEntriesOnFocus}
								onChange={(items) => (tkEntriesOnFocus = items)}
							/>
							<div>
								<Tokenizer
									label="Team Members"
									placeholder="Add more..."
									tokenOverflowBehavior="unfocusedInline"
									searchSource={tokenizerUserSource}
									value={tkOverflowInline}
									onChange={(items) => (tkOverflowInline = items)}
								/>
								<p class="note">This text will shift down when the tokenizer expands on focus.</p>
							</div>
							<div>
								<Tokenizer
									label="Team Members"
									placeholder="Add more..."
									tokenOverflowBehavior="unfocusedLayer"
									searchSource={tokenizerUserSource}
									value={tkOverflowLayer}
									onChange={(items) => (tkOverflowLayer = items)}
								/>
								<p class="note">This text should not shift when the tokenizer expands on focus.</p>
							</div>
							<Tokenizer
								label="Team Members"
								searchSource={tokenizerUserSource}
								value={tkEndContent}
								onChange={(items) => (tkEndContent = items)}
								endContent={tokenizerApplyButton}
							/>
							<div>
								<Tokenizer
									label="Tags"
									placeholder="Type a tag and press Enter..."
									hasCreate
									searchSource={tokenizerEmptySource}
									value={tkTags}
									onChange={(items) => (tkTags = items)}
								/>
								<p class="note">
									{tkTags.length} tag{tkTags.length !== 1 ? 's' : ''} added
								</p>
							</div>
							<Tokenizer
								label="Small (28px)"
								placeholder="Small size"
								size="sm"
								hasClear
								searchSource={tokenizerUserSource}
								value={tkSm}
								onChange={(items) => (tkSm = items)}
							/>
							<Tokenizer
								label="Medium (32px)"
								placeholder="Medium size (default)"
								size="md"
								hasClear
								searchSource={tokenizerUserSource}
								value={tkMd}
								onChange={(items) => (tkMd = items)}
							/>
							<Tokenizer
								label="Large (36px)"
								placeholder="Large size"
								size="lg"
								hasClear
								searchSource={tokenizerUserSource}
								value={tkLg}
								onChange={(items) => (tkLg = items)}
							/>
							<Tokenizer
								label="Team Members"
								placeholder="Search or type a new name..."
								hasCreate
								hasEntriesOnFocus
								searchSource={tokenizerUserSource}
								value={tkCreatableSearch}
								onChange={(items) => (tkCreatableSearch = items)}
							/>
							<Tokenizer
								label="Team Members"
								isDisabled
								disabledMessage="You need edit access to change members"
								searchSource={tokenizerUserSource}
								value={[TOKENIZER_USERS[0], TOKENIZER_USERS[1]]}
								onChange={() => {}}
							/>
						</div>
						<p class="note">
							A multi-select typeahead: <code>BaseTypeahead</code> for the search half,
							<code>Token</code> for each selection. Backspace on an empty input removes the last
							token, and <code>hasCreate</code> appends a synthetic <code>Create</code> row so free
							text can become a token. <code>tokenOverflowBehavior</code> collapses the row to
							<code>+ N more</code> while unfocused — <code>unfocusedInline</code> expands in flow,
							<code>unfocusedLayer</code> expands over the page on the top layer. Upstream's
							<code>handleRef</code> imperative handle is the component instance here:
							<code>bind:this</code> gives you <code>focus()</code> and <code>blur()</code>.
						</p>
					</section>

					<section id="powersearch" data-section="powersearch">
						<h2 id="powersearch">
							PowerSearch
							<a class="anchor" href="#powersearch" aria-label="Link to PowerSearch">#</a>
						</h2>
						<PowerSearchDemos />
						<p class="note">
							All <strong>24</strong> of upstream's <code>PowerSearch.stories.tsx</code> stories.
							The last of the 100 upstream component dirs to land, and the one that unblocked three
							things at once: the <code>TableFiltering</code> demo route, and two docs example
							blocks.
							<code>{'{...args}'}</code> has no counterpart on a demo route, so each story renders
							the combination its <code>args</code> default to — the <code>TablePagination</code>
							ruling. The two override components in "Custom Components Map" are sibling
							<code>.svelte</code> files, because
							<code>PowerSearchComponentOverride.Token</code>/<code>.Editor</code> are
							<code>Component&lt;P&gt;</code> constructors rather than snippets. Worth knowing while
							reading it: <code>PowerSearch</code> never renders the published
							<code>PowerSearchToken</code> or <code>PowerSearchFilterEditor</code> — it inlines its
							own token renderer, whose truncation and <code>enum_list</code> rules differ from
							<code>formatFilterValue</code>'s. That is upstream's shape, and both are in Known
							debts.
						</p>
					</section>

					<section id="inputgroup" data-section="inputgroup">
						<h2 id="inputgroup">
							InputGroup
							<a class="anchor" href="#inputgroup" aria-label="Link to InputGroup">#</a>
						</h2>
						<div class="field-column">
							<InputGroup label="Price" description="Enter the amount in USD.">
								<InputGroupText>$</InputGroupText>
								<TextInput
									label="Amount"
									placeholder="0.00"
									value={igPrice}
									onChange={(v) => (igPrice = v)}
								/>
							</InputGroup>
							<InputGroup label="Website">
								<InputGroupText>https://</InputGroupText>
								<TextInput
									label="Domain"
									placeholder="example"
									value={igDomain}
									onChange={(v) => (igDomain = v)}
								/>
								<InputGroupText>.com</InputGroupText>
							</InputGroup>
							<InputGroup
								label="Weight"
								size="sm"
								status={{ type: 'warning', message: 'Double-check the unit' }}
							>
								<TextInput
									label="Value"
									placeholder="0"
									value={igWeight}
									onChange={(v) => (igWeight = v)}
								/>
								<InputGroupText>kg</InputGroupText>
							</InputGroup>
							<InputGroup label="Budget">
								<InputGroupText>$</InputGroupText>
								<NumberInput
									label="Amount"
									placeholder="0.00"
									value={igBudget}
									onChange={(v: number | null) => (igBudget = v)}
								/>
							</InputGroup>
						</div>
						<p class="note">
							The group owns the label and description; each member is a bare member control that
							borrows them through context and collapses its border into the row. The whole unit is
							announced as one labelled <code>group</code>, and a member's accessible name combines
							the group label with its own hidden label (e.g. <em>Price Amount</em>,
							<em>Budget Amount</em>).
							<code>InputGroupText</code>, <code>TextInput</code> and <code>NumberInput</code>
							members are shown; the remaining documented members (<code>DateInput</code>,
							<code>Selector</code>, <code>Typeahead</code>, <code>MultiSelector</code>) are not yet
							ported.
						</p>
					</section>

					<section id="radiolist" data-section="radiolist">
						<h2 id="radiolist">
							RadioList
							<a class="anchor" href="#radiolist" aria-label="Link to RadioList">#</a>
						</h2>
						<div class="field-column">
							<RadioList label="Notify me by" value={notify} onChange={(v) => (notify = v)}>
								<RadioListItem label="Email" value="email" />
								<RadioListItem
									label="SMS"
									value="sms"
									description="Standard messaging rates apply"
								/>
								<RadioListItem label="Push notification" value="push" />
							</RadioList>
							<RadioList
								label="Plan"
								description="Choose the tier that fits your team."
								value={plan}
								onChange={(v) => (plan = v)}
								isRequired
								status={plan === ''
									? { type: 'error', message: 'Please choose a plan' }
									: undefined}
							>
								<RadioListItem label="Starter" value="starter" />
								<RadioListItem label="Pro" value="pro" />
								<RadioListItem label="Enterprise" value="enterprise" isDisabled />
							</RadioList>
							<RadioList
								label="Payment method"
								orientation="horizontal"
								size="sm"
								value="card"
								onChange={() => {}}
								isDisabled
								disabledMessage="Payment is locked while your account is under review"
							>
								<RadioListItem label="Card" value="card" />
								<RadioListItem label="Bank transfer" value="bank" />
							</RadioList>
						</div>
						<p class="note">
							Controlled by <code>value</code> + <code>onChange</code>. Items self-register through
							<code>RadioListContext</code> — the group never inspects its children. The last group
							is disabled with a reason: its radios stay focusable via <code>aria-disabled</code> so the
							tooltip is reachable by keyboard, and selection stays blocked.
						</p>
					</section>

					<section id="checkboxinput" data-section="checkboxinput">
						<h2 id="checkboxinput">
							CheckboxInput
							<a class="anchor" href="#checkboxinput" aria-label="Link to CheckboxInput">#</a>
						</h2>
						<div class="field-column">
							<CheckboxInput
								label="Accept terms"
								value={cbDefault}
								onChange={(v) => (cbDefault = v)}
							/>
							<CheckboxInput
								label="Accept terms"
								value={cbChecked}
								onChange={(v) => (cbChecked = v)}
							/>
							<CheckboxInput
								label="Subscribe to newsletter"
								description="Receive weekly updates about new features"
								value={cbDescribed}
								onChange={(v) => (cbDescribed = v)}
							/>
							<CheckboxInput
								label="Accept terms"
								isLabelHidden
								value={cbHiddenLabel}
								onChange={(v) => (cbHiddenLabel = v)}
							/>
							<CheckboxInput
								label="Select all"
								value={cbIndeterminate}
								onChange={(v) => (cbIndeterminate = v)}
							/>
							<CheckboxInput label="Disabled unchecked" value={false} isDisabled />
							<CheckboxInput label="Disabled checked" value={true} isDisabled />
							<CheckboxInput
								label="Small size"
								size="sm"
								value={cbSmall}
								onChange={(v) => (cbSmall = v)}
							/>
							<CheckboxInput
								label="Small (sm)"
								size="sm"
								value={cbSizeSm}
								onChange={(v) => (cbSizeSm = v)}
							/>
							<CheckboxInput
								label="Medium (md)"
								size="md"
								value={cbSizeMd}
								onChange={(v) => (cbSizeMd = v)}
							/>
							<CheckboxInput
								label="Email notifications"
								labelIcon={checkboxBellIcon}
								value={cbLabelIcon}
								onChange={(v) => (cbLabelIcon = v)}
							/>
							<CheckboxInput
								label="Accept terms"
								value={cbError}
								onChange={(v) => (cbError = v)}
								status={{ type: 'error', message: 'You must accept the terms to continue' }}
							/>
							<CheckboxInput
								label="Enable beta features"
								value={cbWarning}
								onChange={(v) => (cbWarning = v)}
								status={{ type: 'warning', message: 'Beta features may be unstable' }}
							/>
							<CheckboxInput
								label="Two-factor authentication"
								value={cbSuccess}
								onChange={(v) => (cbSuccess = v)}
								status={{ type: 'success', message: 'Your account is protected' }}
							/>
							<CheckboxInput
								label="Accept terms"
								value={true}
								isDisabled
								disabledMessage="Terms are managed by your administrator"
							/>
						</div>
						<p class="note">
							Controlled: <code>value</code> is <code>boolean | 'indeterminate'</code> and is never
							written back, so the mixed state has no boolean to commit. Mixed is exposed
							<em>only</em> through the native <code>indeterminate</code> DOM property — there is no
							<code>aria-checked</code>, which would be redundant and can desync from it. The last
							checkbox is disabled with a reason: it stays focusable via <code>aria-disabled</code> so
							the tooltip is keyboard-reachable, and toggling stays blocked.
						</p>
					</section>

					<section id="checkboxlist" data-section="checkboxlist">
						<h2 id="checkboxlist">
							CheckboxList
							<a class="anchor" href="#checkboxlist" aria-label="Link to CheckboxList">#</a>
						</h2>
						<div class="field-column">
							<CheckboxList
								label="Notifications"
								value={clNotifications}
								onChange={(v) => (clNotifications = v)}
							>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" />
								<CheckboxListItem label="Push notifications" value="push" />
							</CheckboxList>

							<CheckboxList
								label="Email preferences"
								description="Choose which emails you want to receive"
								value={clDescribed}
								onChange={(v) => (clDescribed = v)}
							>
								<CheckboxListItem
									label="Weekly digest"
									description="A summary of activity from the past week"
									value="weekly"
								/>
								<CheckboxListItem
									label="Product updates"
									description="News about features and improvements"
									value="product"
								/>
								<CheckboxListItem
									label="Security alerts"
									description="Important notices about your account"
									value="security"
								/>
							</CheckboxList>

							<Card>
								<CheckboxList
									label="Inside a card, with dividers"
									hasDividers
									value={clDividers}
									onChange={(v) => (clDividers = v)}
								>
									<CheckboxListItem label="Email" value="email" />
									<CheckboxListItem label="SMS" value="sms" />
									<CheckboxListItem label="Push notifications" value="push" />
								</CheckboxList>
							</Card>

							<CheckboxList label="Select all">
								<CheckboxListItem
									label="All options"
									isChecked={clSelectAllState}
									onCheck={(checked) => (clSelectAll = checked ? [...clSelectAllOptions] : [])}
								/>
								{#each clSelectAllOptions as option (option)}
									<CheckboxListItem
										label={`Option ${option.toUpperCase()}`}
										isChecked={clSelectAll.includes(option)}
										onCheck={(checked) =>
											(clSelectAll = checked
												? [...clSelectAll, option]
												: clSelectAll.filter((v) => v !== option))}
									/>
								{/each}
							</CheckboxList>

							<CheckboxList label="Read-only" value={['email']} isReadOnly>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" />
							</CheckboxList>

							<CheckboxList label="Disabled" value={['email']} isDisabled>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" />
							</CheckboxList>

							<CheckboxList
								label="Disabled with a reason"
								value={['email']}
								isDisabled
								disabledMessage="Notification settings are managed by your administrator"
							>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" />
							</CheckboxList>

							<CheckboxList label="One item disabled" value={['email']}>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" isDisabled />
							</CheckboxList>

							<CheckboxList label="Loading" value={['email']}>
								<CheckboxListItem label="Email" value="email" isLoading />
								<CheckboxListItem label="SMS" value="sms" />
							</CheckboxList>

							<CheckboxList
								label="Async changeAction"
								value={clAsync}
								onChange={(v) => (clAsync = v)}
								changeAction={async () => {
									await new Promise((resolve) => setTimeout(resolve, 1200));
								}}
							>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" />
								<CheckboxListItem label="Push notifications" value="push" />
							</CheckboxList>

							<CheckboxList
								label="Notifications"
								value={clError}
								onChange={(v) => (clError = v)}
								status={{ type: 'error', message: 'Select at least one notification method' }}
							>
								<CheckboxListItem label="Email" value="email" />
								<CheckboxListItem label="SMS" value="sms" />
							</CheckboxList>

							<CheckboxList
								label="With end content"
								value={clEndContent}
								onChange={(v) => (clEndContent = v)}
							>
								<CheckboxListItem label="Unread" value="unread" endContent={checkboxCountBadge} />
								<CheckboxListItem label="Archived" value="archived" endContent={checkboxChevron} />
							</CheckboxList>

							<Card>
								<CheckboxList label="Inside a card" value={['email']}>
									<CheckboxListItem label="Email" value="email" />
									<CheckboxListItem label="SMS" value="sms" />
								</CheckboxList>
							</Card>
						</div>
						<p class="note">
							Two modes. With <code>value</code> the group owns the array (<em>collection mode</em>)
							and every item needs a <code>value</code> — one without throws. Omit
							<code>value</code>
							and each item owns its own <code>isChecked</code>/<code>onCheck</code> (<em
								>standalone mode</em
							>), which is what the select-all block above is built from: the group computes
							nothing, so the header's <code>'indeterminate'</code> is the consumer's.
							<code>changeAction</code> spins only the toggled item and blocks re-toggling it while pending;
							the others stay live.
						</p>
					</section>

					<section id="slider" data-section="slider">
						<h2 id="slider">
							Slider
							<a class="anchor" href="#slider" aria-label="Link to Slider">#</a>
						</h2>
						<div class="field-column">
							<Slider
								label="Volume"
								value={slVolume}
								onChange={(v: number) => (slVolume = v)}
								width={300}
							/>
							<Slider
								label="Price range"
								value={slRange}
								onChange={(v: [number, number]) => (slRange = v)}
								width={300}
							/>
							<Slider
								label="Volume"
								value={slMarks}
								onChange={(v: number) => (slMarks = v)}
								width={300}
								marks={[
									{ value: 0, label: '0' },
									{ value: 25, label: '25' },
									{ value: 50, label: '50' },
									{ value: 75, label: '75' },
									{ value: 100, label: '100' }
								]}
							/>
							<Slider
								label="Quantity"
								value={slQuantity}
								onChange={(v: number) => (slQuantity = v)}
								min={0}
								max={100}
								step={10}
								valueDisplay="text"
								width={300}
							/>
							<Slider
								label="Temperature"
								value={slTemperature}
								onChange={(v: number) => (slTemperature = v)}
								min={60}
								max={90}
								step={1}
								formatValue={(v) => `${v}°F`}
								valueDisplay="text"
								width={300}
							/>
							<Slider label="Volume" value={50} isDisabled width={300} />
							<Slider
								label="Volume"
								value={50}
								isDisabled
								disabledMessage="Volume is locked while sharing your screen"
								width={300}
							/>
							<Slider
								label="No value display"
								value={slNoDisplay}
								onChange={(v: number) => (slNoDisplay = v)}
								valueDisplay="none"
								width={300}
							/>
							<Slider
								label="CPU usage"
								value={slCpu}
								onChange={(v: number) => (slCpu = v)}
								status={{ type: 'error', message: 'CPU usage is critically high' }}
								width={300}
							/>
							<Slider
								label="Memory"
								value={slMemory}
								onChange={(v: number) => (slMemory = v)}
								status={{ type: 'warning', message: 'Memory usage is moderate' }}
								width={300}
							/>
							<Slider
								label="Disk"
								value={slDisk}
								onChange={(v: number) => (slDisk = v)}
								status={{ type: 'success', message: 'Disk usage is healthy' }}
								width={300}
							/>
							<div style="height: 200px">
								<Slider
									label="Volume"
									value={slVertical}
									onChange={(v: number) => (slVertical = v)}
									orientation="vertical"
								/>
							</div>
						</div>
						<p class="note">
							Fully controlled, single or range depending on whether <code>value</code> is a number
							or a
							<code>[start, end]</code> pair. Pointer interaction belongs to the track — pressing
							anywhere moves the nearest thumb and pointer capture keeps the drag alive outside the
							element, so there are no window listeners. Arrow keys are orientation-independent;
							<code>PageUp</code>/<code>PageDown</code> move ten steps; <code>Home</code>/<code
								>End</code
							>
							jump to the bounds. A vertical slider runs bottom (min) to top (max) and needs a height
							from its container.
						</p>
					</section>

					<section id="switch" data-section="switch">
						<h2 id="switch">
							Switch
							<a class="anchor" href="#switch" aria-label="Link to Switch">#</a>
						</h2>
						<div class="field-column">
							<Switch label="Off state" value={swOff} onChange={(v) => (swOff = v)} />
							<Switch label="On state" value={swOn} onChange={(v) => (swOn = v)} />
							<Switch
								label="Disabled off"
								value={swDisabledOff}
								onChange={(v) => (swDisabledOff = v)}
								isDisabled
							/>
							<Switch
								label="Disabled on"
								value={swDisabledOn}
								onChange={(v) => (swDisabledOn = v)}
								isDisabled
							/>
							<Switch
								label="With description"
								description="Additional context for this setting"
								value={swDescribed}
								onChange={(v) => (swDescribed = v)}
							/>
							<Switch
								label="Notifications"
								description="Receive push notifications"
								labelIcon={switchInfoIcon}
								value={swNotifications}
								onChange={(v) => (swNotifications = v)}
							/>
							<Switch
								label="Two-factor authentication"
								description="Add an extra layer of security"
								labelIcon={switchSecurityIcon}
								value={swSecurity}
								onChange={(v) => (swSecurity = v)}
							/>
							<Switch
								label="Auto-save"
								labelTooltip="Automatically save your changes as you work"
								labelIcon={switchAutosaveIcon}
								value={swAutosave}
								onChange={(v) => (swAutosave = v)}
							/>
							<Switch
								label="Label at end (default)"
								labelPosition="end"
								value={swEnd}
								onChange={(v) => (swEnd = v)}
							/>
							<Switch
								label="Label at start"
								labelPosition="start"
								value={swStart}
								onChange={(v) => (swStart = v)}
							/>
							<Switch
								label="Accept terms and conditions"
								isRequired
								value={swRequired}
								onChange={(v) => (swRequired = v)}
							/>
							<Switch
								label="Subscribe to newsletter"
								isOptional
								value={swOptional}
								onChange={(v) => (swOptional = v)}
							/>
							<Switch
								label="Accept terms and conditions"
								status={{ type: 'error', message: 'You must accept the terms to continue' }}
								value={swError}
								onChange={(v) => (swError = v)}
							/>
							<Switch
								label="Share usage data"
								status={{ type: 'warning', message: 'This data may be shared with partners' }}
								value={swWarning}
								onChange={(v) => (swWarning = v)}
							/>
							<Switch
								label="Two-factor authentication"
								labelIcon={switchSecurityIcon}
								status={{ type: 'success', message: 'Your account is now more secure' }}
								value={swSuccess}
								onChange={(v) => (swSuccess = v)}
							/>
							<Switch
								label="Enable notifications"
								isDisabled
								disabledMessage="Notifications are turned off org-wide"
								value={swDisabledMessage}
								onChange={(v) => (swDisabledMessage = v)}
							/>
						</div>
						<div
							style="width: 300px; border: 1px solid var(--astryx-color-border, #ccc); padding: 16px"
						>
							<Switch
								label="Enable notifications"
								labelPosition="start"
								labelSpacing="spread"
								value={swSpread}
								onChange={(v) => (swSpread = v)}
							/>
						</div>
						<p class="note">
							The switch is a transparent native <code>checkbox</code> with
							<code>role="switch"</code>
							over a CSS-only track and thumb; the hover tint and focus ring key off a scoped
							<code>defineMarker</code> on the row, dropped while disabled.
							<code>labelSpacing="spread"</code>
							pushes the label and control to opposite ends of a sized container. The disabled
							<code>Enable notifications</code> tile keeps focus — with a
							<code>disabledMessage</code>
							it takes
							<code>aria-disabled</code> and shows the reason in a tooltip on hover and keyboard
							focus rather than the native <code>disabled</code>, and is withheld from form
							submission. As with
							<code>TextArea</code>, <code>labelIcon</code> uses registry names in the slots
							upstream fills with heroicons, and there is no <code>changeAction</code>/<code
								>isLoading</code
							> tile since upstream ships no story for either — the optimistic path is covered by the
							ported suite.
						</p>
					</section>

					<section id="selectablecard" data-section="selectablecard">
						<h2 id="selectablecard">
							SelectableCard
							<a class="anchor" href="#selectablecard" aria-label="Link to SelectableCard">#</a>
						</h2>
						<HStack gap={3} wrap="wrap">
							{#each selectablePlans as plan (plan.id)}
								<SelectableCard
									label={plan.name}
									isSelected={selectedPlan === plan.id}
									onChange={() => (selectedPlan = plan.id)}
									width={200}
								>
									<VStack gap={1}>
										<Text type="body" weight="bold">{plan.name}</Text>
										<Text type="supporting" color="secondary">{plan.price}</Text>
									</VStack>
								</SelectableCard>
							{/each}
						</HStack>
						<p class="note">
							Radio-style selection: track a single id in state and derive
							<code>isSelected</code>. Composes <code>Card</code> for all styling and adds an inset accent
							ring; the accessible role/label/state live on a visually hidden checkbox, so the card surface
							itself carries no role.
						</p>
					</section>

					<section id="clickablecard" data-section="clickablecard">
						<h2 id="clickablecard">
							ClickableCard
							<a class="anchor" href="#clickablecard" aria-label="Link to ClickableCard">#</a>
						</h2>
						<HStack gap={3} wrap="wrap" vAlign="start">
							<ClickableCard label="Settings" href="#settings" width={280}>
								<VStack gap={1}>
									<Text type="body" weight="bold">Settings</Text>
									<Text type="supporting" color="secondary">Manage your preferences</Text>
								</VStack>
							</ClickableCard>
							<ClickableCard label="Open modal" onclick={() => {}} width={280}>
								<VStack gap={1}>
									<Text type="body" weight="bold">Click me</Text>
									<Text type="supporting" color="secondary">Fires onclick on the surface</Text>
								</VStack>
							</ClickableCard>
							<ClickableCard label="Product card" href="#product" width={280}>
								<VStack gap={2}>
									<Text type="body" weight="bold">Product name</Text>
									<Text type="supporting" color="secondary">$29.99</Text>
									<Button label="Add to cart" variant="primary" onclick={() => {}} />
								</VStack>
							</ClickableCard>
							<ClickableCard label="Disabled card" onclick={() => {}} isDisabled width={280}>
								<VStack gap={1}>
									<Text type="body" weight="bold">Disabled</Text>
									<Text type="supporting" color="secondary">This card cannot be clicked</Text>
								</VStack>
							</ClickableCard>
						</HStack>
						<p class="note">
							A single navigation or action target: <code>href</code> renders a hidden
							<code>&lt;a&gt;</code>, <code>onclick</code> a hidden <code>&lt;button&gt;</code>,
							both visually hidden so the card surface stays role-free. Nested controls (the
							<em>Add to cart</em> button) fire independently — the container click bails when the target
							has an interactive ancestor.
						</p>
					</section>

					<section id="tooltip" data-section="tooltip">
						<h2 id="tooltip">
							Tooltip
							<a class="anchor" href="#tooltip" aria-label="Link to Tooltip">#</a>
						</h2>
						<!-- TooltipActionBarTooltips: one tooltip per action, all placed above. -->
						<Center>
							<HStack gap={4}>
								<Tooltip content="Save your changes" placement="above">
									<Button label="Save" />
								</Tooltip>
								<Tooltip content="Discard changes" placement="above">
									<Button label="Cancel" />
								</Tooltip>
								<Tooltip content="Delete permanently" placement="above">
									<Button label="Delete" variant="destructive" />
								</Tooltip>
							</HStack>
						</Center>
						<div class="row">
							<Tooltip content="Above" placement="above">
								<Button label="Above" />
							</Tooltip>
							<Tooltip content="Below" placement="below">
								<Button label="Below" />
							</Tooltip>
							<Tooltip content="Start" placement="start">
								<Button label="Start" />
							</Tooltip>
							<Tooltip content="End" placement="end">
								<Button label="End" />
							</Tooltip>
						</div>
						<Text type="body">
							Learn more about our <Tooltip
								content="Your data is encrypted and never shared"
								placement="above"
								children="privacy policy"
							/>
							and
							<Tooltip
								content="Standard 30-day agreement"
								placement="above"
								children="terms of service"
							/>.
						</Text>
						<div class="row">
							<Button
								{@attach hookTooltip.attachTrigger}
								aria-describedby={hookTooltip.describedBy}
								label="Using hook directly"
							/>
							<TooltipLayer tooltip={hookTooltip}>Tooltip via hook</TooltipLayer>
						</div>
						<p class="note">
							Element children are wrapped in <code>display: contents</code> and the trigger is the
							first child, so the button keeps its own markup. A text trigger goes through the
							<code>children</code> prop rather than component content — Svelte wraps content in a
							snippet whatever it holds, so a bare string is only recognisable as the prop — and
							gets the tab stop and the dashed underline <code>hasHoverIndication</code> describes.
						</p>
					</section>

					<section id="hovercard" data-section="hovercard">
						<h2 id="hovercard">
							HoverCard
							<a class="anchor" href="#hovercard" aria-label="Link to HoverCard">#</a>
						</h2>
						<div class="row">
							<HoverCard placement="above">
								{#snippet content()}
									<Stack direction="vertical" gap={2} style="width: 240px">
										<Stack direction="horizontal" gap={2} vAlign="center">
											<Avatar name="Jane Doe" size="lg" />
											<Stack direction="vertical" gap={0}>
												<Heading level={5}>Jane Doe</Heading>
												<Text type="supporting" color="secondary">Software Engineer</Text>
											</Stack>
										</Stack>
										<Text type="body" color="secondary"
											>Building great products with great people.</Text
										>
									</Stack>
								{/snippet}
								<Button label="@janedoe" variant="ghost" />
							</HoverCard>

							<HoverCard placement="below">
								{#snippet content()}
									<HStack gap={3} vAlign="start" style="max-width: 280px">
										<Avatar name="Jane Doe" size={48} style="flex-shrink: 0" />
										<VStack gap={1}>
											<Heading level={3}>@janedoe</Heading>
											<Text type="body" color="secondary">
												Crafting accessible, scalable design systems for modern teams.
											</Text>
											<HStack gap={1} vAlign="center">
												<Icon icon="calendar" size="xsm" color="secondary" />
												<Text type="supporting" color="secondary">March 2024</Text>
											</HStack>
										</VStack>
									</HStack>
								{/snippet}
								<Button label="@janedoe" variant="ghost" />
							</HoverCard>
						</div>

						<Text type="body">
							The component uses a <HoverCard placement="above" children="focus trap">
								{#snippet content()}
									<VStack gap={1} style="max-width: 200px">
										<Text type="label">Focus trap</Text>
										<Text type="body" color="secondary">
											A pattern that keeps keyboard focus inside a container, preventing it from
											moving to elements outside. Used in dialogs and modals to ensure
											accessibility.
										</Text>
									</VStack>
								{/snippet}
							</HoverCard>
							to keep keyboard navigation inside the
							<HoverCard placement="above" children="modal dialog">
								{#snippet content()}
									<VStack gap={1} style="max-width: 200px">
										<Text type="label">Modal dialog</Text>
										<Text type="body" color="secondary">
											An overlay that blocks interaction with the rest of the page until the user
											responds. Uses the native HTML dialog element for built-in accessibility and
											backdrop support.
										</Text>
									</VStack>
								{/snippet}
							</HoverCard>.
						</Text>

						<Center height={220}>
							<Button
								{@attach hookHoverCard.attachTrigger}
								aria-describedby={hookHoverCard.describedBy}
								label="Hover profile"
							/>
							<HoverCardLayer hoverCard={hookHoverCard} placement="below" alignment="center">
								<VStack gap={1}>
									<Text type="body" weight="bold">Alex Morgan</Text>
									<Text type="body" color="secondary">Staff designer · Product systems</Text>
									<Text type="body" color="secondary">
										Owns interaction patterns for overlays and navigation.
									</Text>
								</VStack>
							</HoverCardLayer>
						</Center>

						<p class="note">
							A hover card differs from a tooltip in that its content is interactive: the pointer
							and the keyboard can both move into it, and a hide scheduled by leaving the trigger is
							dropped while the pointer is over the card. Escape inside the card dismisses it and
							returns focus to the trigger without reopening it. The layer renders as a <code
								>&lt;span&gt;</code
							>, not a
							<code>&lt;div&gt;</code>, so it stays valid — and hydration-stable — inside a
							<code>&lt;p&gt;</code>. The hook block is
							<code>isDefaultOpen</code>, so it opens on mount and is still dismissible.
						</p>
					</section>

					<section id="popover" data-section="popover">
						<h2 id="popover">
							Popover
							<a class="anchor" href="#popover" aria-label="Link to Popover">#</a>
						</h2>
						<div class="row">
							<Popover placement="below" label="Settings" width={280}>
								{#snippet content()}
									<VStack gap={3}>
										<Heading level={4} tabindex={-1}>Settings</Heading>
										<Divider />
										<Switch
											label="Notifications"
											description="Receive push notifications"
											value={popoverSettings.notifications}
											onChange={(v) => (popoverSettings.notifications = v)}
										/>
										<Switch
											label="Dark mode"
											description="Use dark color theme"
											value={popoverSettings.darkMode}
											onChange={(v) => (popoverSettings.darkMode = v)}
										/>
										<Switch
											label="Sounds"
											description="Play sounds for actions"
											value={popoverSettings.sounds}
											onChange={(v) => (popoverSettings.sounds = v)}
										/>
									</VStack>
								{/snippet}
								<Button label="Settings" />
							</Popover>

							<Popover
								placement="below"
								label="Confirm deletion"
								width={300}
								isOpen={confirmOpen}
								onOpenChange={(v) => (confirmOpen = v)}
							>
								{#snippet content()}
									<VStack gap={3}>
										<Heading level={4} tabindex={-1}>Delete project?</Heading>
										<Text type="body">
											This will permanently delete the project and all its data. This action cannot
											be undone.
										</Text>
										<HStack gap={2} hAlign="end">
											<Button
												label="Delete"
												variant="destructive"
												onclick={() => (confirmOpen = false)}
											/>
											<Button
												label="Cancel"
												variant="ghost"
												onclick={() => (confirmOpen = false)}
											/>
										</HStack>
									</VStack>
								{/snippet}
								<Button label="Delete project" variant="destructive" />
							</Popover>

							<Popover placement="below" label="Disabled popover" isEnabled={false}>
								{#snippet content()}
									<Text type="body">This should not appear.</Text>
								{/snippet}
								<Button label="Disabled" />
							</Popover>
						</div>

						<div class="row">
							<Popover placement="above" label="Info" width={260}>
								{#snippet content()}
									<VStack gap={2}>
										<Heading level={4} tabindex={-1}>Keyboard shortcuts</Heading>
										<Divider />
										<HStack gap={3}>
											<Text type="body" weight="bold">⌘K</Text>
											<Text type="body">Command palette</Text>
										</HStack>
										<HStack gap={3}>
											<Text type="body" weight="bold">⌘/</Text>
											<Text type="body">Toggle sidebar</Text>
										</HStack>
										<HStack gap={3}>
											<Text type="body" weight="bold">⌘.</Text>
											<Text type="body">Quick actions</Text>
										</HStack>
									</VStack>
								{/snippet}
								<Button label="Shortcuts" />
							</Popover>

							<Popover placement="below" label="Link actions" width={220}>
								{#snippet content()}
									<VStack gap={2}>
										<Heading level={4} tabindex={-1}>Quick actions</Heading>
										<Divider />
										<Text type="body"
											>Link without href renders as a button, suitable for triggers.</Text
										>
									</VStack>
								{/snippet}
								<Link>More options</Link>
							</Popover>

							<Popover placement="below" label="Custom trigger" width={260}>
								{#snippet content()}
									<VStack gap={2}>
										<Heading level={4} tabindex={-1}>Custom trigger</Heading>
										<Divider />
										<Text type="body"
											>The render prop gives full control over the trigger element.</Text
										>
									</VStack>
								{/snippet}
								{#snippet trigger(props)}
									<button
										{@attach props.ref}
										onclick={props.onClick}
										aria-haspopup={props['aria-haspopup']}
										aria-expanded={props['aria-expanded']}
										aria-controls={props['aria-controls']}
										style="padding: 8px 16px; border: 1px dashed currentColor; border-radius: 4px; background: transparent; cursor: pointer;"
									>
										Custom trigger element
									</button>
								{/snippet}
							</Popover>
						</div>

						<div class="row">
							<Button
								label="Anchor button"
								{@attach (el: HTMLElement) => {
									popoverAnchor = el;
									return () => (popoverAnchor = null);
								}}
							/>
							<Popover
								anchorRef={popoverAnchor}
								label="Sibling popover"
								width={260}
								placement="below"
							>
								{#snippet content()}
									<VStack gap={2}>
										<Heading level={4} tabindex={-1}>Sibling mode</Heading>
										<Text type="body">
											This popover uses anchorRef to attach to the button as a sibling, without
											wrapping it.
										</Text>
									</VStack>
								{/snippet}
							</Popover>
						</div>

						<p class="note">
							A click-triggered dialog anchored to its trigger. The trigger must contain a
							<code>&lt;button&gt;</code> or <code>[role="button"]</code>; the popover finds it and
							wires the click/keydown handlers and the <code>aria-haspopup</code>/<code
								>aria-expanded</code
							>/<code>aria-controls</code>
							pattern. Focus is trapped while open, a hidden close button reveals on tab-out, and light
							dismiss (click-outside/Escape) is on by default. Upstream's single
							<code>children</code> prop splits into <code>children</code> (automatic) and
							<code>trigger</code> (render-prop), since Svelte cannot tell a content snippet from a render-function
							snippet.
						</p>
					</section>

					<section id="usekeyboardhint" data-section="usekeyboardhint">
						<h2 id="usekeyboardhint">
							useKeyboardHint
							<a class="anchor" href="#usekeyboardhint" aria-label="Link to useKeyboardHint">#</a>
						</h2>
						<HStack gap={6} vAlign="start">
							<Card padding={4}>
								<VStack gap={3}>
									<Text type="body" weight="bold">Formatting</Text>
									<Text type="supporting" color="secondary">
										Tab into the toolbar with your keyboard — the hint appears once.
									</Text>
									<HintToolbar
										label="Formatting"
										orientation="horizontal"
										items={['Bold', 'Italic', 'Underline']}
									/>
								</VStack>
							</Card>
							<Card padding={4}>
								<VStack gap={3}>
									<Text type="body" weight="bold">Navigation</Text>
									<Text type="supporting" color="secondary">
										Tab into the list — the vertical hint teaches ↑ ↓ navigation.
									</Text>
									<HintToolbar
										label="Sidebar navigation"
										orientation="vertical"
										items={['Overview', 'Reports', 'Settings']}
									/>
								</VStack>
							</Card>
						</HStack>
						<p class="note">
							The hint appears only on <code>:focus-visible</code> entry from outside the composite,
							so a mouse click never triggers it. It auto-dismisses on the first arrow press, on
							blur, or after
							<code>dismissAfterMs</code> (3000), and does not re-show for that instance. It
							re-anchors to each item as focus moves within the group — the one
							<code>useLayer</code> consumer whose anchor is not a fixed trigger.
						</p>
					</section>

					<section id="dropdownmenu" data-section="dropdownmenu">
						<h2 id="dropdownmenu">
							DropdownMenu
							<a class="anchor" href="#dropdownmenu" aria-label="Link to DropdownMenu">#</a>
						</h2>
						<HStack gap={4} wrap="wrap">
							<VStack gap={2}>
								<Text type="label">Data mode (sections + divider)</Text>
								<DropdownMenu
									button={{ label: 'Actions' }}
									items={[
										{
											type: 'section',
											title: 'Edit',
											items: [{ label: 'Rename' }, { label: 'Duplicate' }]
										},
										{ type: 'divider' },
										{ label: 'Archive' },
										{ label: 'Delete', isDisabled: true }
									]}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Compound mode</Text>
								<DropdownMenu button={{ label: 'Options', variant: 'secondary' }}>
									<DropdownMenuItem label="Profile" description="View and edit your profile" />
									<DropdownMenuItem label="Settings" />
									<DropdownMenuItem label="Sign out" />
								</DropdownMenu>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Custom width + controlled</Text>
								<DropdownMenu
									button={{ label: ddControlledOpen ? 'Open ▲' : 'Closed ▼', variant: 'primary' }}
									menuWidth={280}
									isMenuOpen={ddControlledOpen}
									onOpenChange={(open) => (ddControlledOpen = open)}
									items={[{ label: 'One' }, { label: 'Two' }, { label: 'Three' }]}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Placement above, no chevron</Text>
								<DropdownMenu
									button={{ label: 'Ghost', variant: 'ghost' }}
									placement="above"
									hasChevron={false}
									items={[{ label: 'Alpha' }, { label: 'Beta' }]}
								/>
							</VStack>
						</HStack>
						<p class="note">
							Built on <code>Popover</code> (<code>role="none"</code> so the inner
							<code>role="menu"</code>
							is the exposed semantics), APG menu-button keyboard model via
							<code>useListFocus</code>
							+
							<code>useTypeahead</code>. The selectable rows (<code>DropdownMenuCheckboxItem</code
							>/<code>DropdownMenuRadioGroup</code>/<code>DropdownMenuRadioItem</code>) are deferred
							— they are the slice the published upstream tarball does not yet compile; see Known
							debts.
						</p>
					</section>

					<section id="contextmenu" data-section="contextmenu">
						<h2 id="contextmenu">
							ContextMenu
							<a class="anchor" href="#contextmenu" aria-label="Link to ContextMenu">#</a>
						</h2>
						<ContextMenu
							items={[
								{ label: 'Cut', onClick: () => {} },
								{ label: 'Copy', onClick: () => {} },
								{ type: 'divider' },
								{ label: 'Paste', onClick: () => {} }
							]}
						>
							<div class="demo-box">Right-click this area</div>
						</ContextMenu>
						<p class="note">
							The cursor point is captured as an offset <em>inside the trigger</em> and materialised
							as a zero-size anchor element, so CSS anchor positioning places the menu under the
							cursor while keeping it relative to the trigger — it follows the content on scroll and
							auto-flips at the viewport edge. The layer is <code>popover="manual"</code>, not
							<code>auto</code>: native light-dismiss would read the mouseup from the opening
							right-click as a dismissal, so outside-click and Escape are handled on
							<code>document</code>
							instead. A touch long-press opens it too, since iOS never synthesises
							<code>contextmenu</code>.
						</p>
					</section>

					<section id="navheadingmenu" data-section="navheadingmenu">
						<h2 id="navheadingmenu">
							NavHeadingMenu
							<a class="anchor" href="#navheadingmenu" aria-label="Link to NavHeadingMenu">#</a>
						</h2>
						<Grid columns={2} gap={6}>
							<VStack gap={2}>
								<Text type="label">Default</Text>
								<NavHeadingMenu>
									<NavHeadingMenuItem label="Dashboard" href="#" />
									<NavHeadingMenuItem label="Analytics" href="#" />
									<NavHeadingMenuItem label="Settings" href="#" />
								</NavHeadingMenu>
							</VStack>

							<VStack gap={2}>
								<Text type="label">With icons</Text>
								<NavHeadingMenu>
									<NavHeadingMenuItem label="Profile" icon="info" href="#" />
									<NavHeadingMenuItem label="Documents" icon="copy" href="#" />
									<NavHeadingMenuItem label="Analytics" icon="viewColumns" href="#" />
									<NavHeadingMenuItem label="Security" icon="check" href="#" />
									<NavHeadingMenuItem label="Settings" icon="wrench" href="#" />
								</NavHeadingMenu>
							</VStack>

							<VStack gap={2}>
								<Text type="label">With descriptions</Text>
								<NavHeadingMenu size="lg">
									<NavHeadingMenuItem
										label="Profile"
										description="Manage your account settings"
										icon="info"
										href="#"
									/>
									<NavHeadingMenuItem
										label="Settings"
										description="Configure application preferences"
										icon="wrench"
										href="#"
									/>
									<NavHeadingMenuItem
										label="Sign out"
										description="End your current session"
										icon="close"
									/>
								</NavHeadingMenu>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Small size</Text>
								<NavHeadingMenu size="sm">
									<NavHeadingMenuItem label="Edit" href="#" />
									<NavHeadingMenuItem label="Duplicate" href="#" />
									<NavHeadingMenuItem label="Delete" />
								</NavHeadingMenu>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Disabled items</Text>
								<NavHeadingMenu>
									<NavHeadingMenuItem label="Dashboard" href="#" />
									<NavHeadingMenuItem label="Analytics" href="#" isDisabled />
									<NavHeadingMenuItem label="Settings" href="#" />
									<NavHeadingMenuItem label="Admin" isDisabled />
								</NavHeadingMenu>
							</VStack>
						</Grid>
						<p class="note">
							The <code>role="menu"</code> body a nav heading popover renders — it is passed as the
							<code>menu</code> prop of <code>SideNavHeading</code>/<code>TopNavHeading</code> (both
							unported), which is what supplies the close callback through
							<code>NavHeadingCloseContext</code>; shown standalone here, so selecting an item has
							nothing to dismiss. Arrow/Home/End navigation and first-character typeahead come from
							<code>useListFocus</code> + <code>useTypeahead</code>, and Enter/Space is forwarded to
							the focused row because an <code>onClick</code>-only item is a
							<code>&lt;div&gt;</code>
							with no native activation. <code>size</code> flows to the items through context. Upstream's
							stories use Heroicons; these substitute the registry's built-ins, as the rest of this page
							does until the icon registry lands.
						</p>
					</section>

					<section id="dialog" data-section="dialog">
						<h2 id="dialog">
							Dialog
							<a class="anchor" href="#dialog" aria-label="Link to Dialog">#</a>
						</h2>
						<VStack gap={4}>
							<VStack gap={2}>
								<Text type="label">Modal (storybook <code>Default</code>)</Text>
								<div>
									<Button
										label="Open dialog"
										variant="primary"
										onclick={() => (dialogOpen = true)}
									/>
								</div>
								<Dialog isOpen={dialogOpen} onOpenChange={(open) => (dialogOpen = open)}>
									<Layout>
										{#snippet header()}
											<DialogHeader
												title="Delete file?"
												subtitle="This action cannot be undone."
												onOpenChange={(open) => (dialogOpen = open)}
											/>
										{/snippet}
										{#snippet content()}
											<LayoutContent>
												<Text type="body"
													>Are you sure you want to delete this file? You can restore it from
													settings later.</Text
												>
											</LayoutContent>
										{/snippet}
										{#snippet footer()}
											<LayoutFooter hasDivider>
												<HStack gap={2} hAlign="end">
													<Button
														label="Cancel"
														variant="secondary"
														onclick={() => (dialogOpen = false)}
													/>
													<Button
														label="Delete"
														variant="primary"
														onclick={() => (dialogOpen = false)}
													/>
												</HStack>
											</LayoutFooter>
										{/snippet}
									</Layout>
								</Dialog>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Inline preview (<code>isInline</code>, the doc playground)</Text>
								<!-- Inline dialogs render without the <dialog>/backdrop/modal behaviour;
					     for docs and showcases only. -->
								<Dialog isInline isOpen onOpenChange={() => {}}>
									<VStack gap={2}>
										<Heading level={3}>Dialog Title</Heading>
										<Text type="body"
											>Are you sure you want to proceed? This action can be undone later from
											settings.</Text
										>
									</VStack>
								</Dialog>
							</VStack>
						</VStack>
						<p class="note">
							The native <code>&lt;dialog&gt;</code> drives modality through
							<code>showModal()</code>/<code>close()</code>
							— there is no <code>&lt;Layer&gt;</code> portal, the browser's top layer handles it.
							<code>purpose</code> gates dismissal (<code>info</code> allows Escape + backdrop
							click,
							<code>form</code> only Escape, <code>required</code> neither and adds
							<code>role="alertdialog"</code>). <code>useImperativeDialog</code> is ported: its
							<code>element</code> return is a render-returning hook, so it splits into a controller
							plus <code>&lt;ImperativeDialogLayer&gt;</code>, the same shape
							<code>useLightbox</code>/<code>&lt;LightboxLayer&gt;</code> already takes. None of
							upstream's 12 Dialog stories uses it, so none is shown here; its sibling
							<code>useImperativeAlertDialog</code> has a story, and it is in the AlertDialog section
							below.
						</p>
					</section>

					<section id="alertdialog" data-section="alertdialog">
						<h2 id="alertdialog">
							AlertDialog
							<a class="anchor" href="#alertdialog" aria-label="Link to AlertDialog">#</a>
						</h2>
						<!--
						Upstream's four stories, one per labelled column. The labels are the
						story names: `Delete` and `Imperative` both put "Delete item" on the
						button, which reads as a duplicate on a page that shows every story
						at once but is unambiguous in Storybook's one-story-per-frame view.
						The button labels stay upstream's; the story name disambiguates them,
						as the Dialog section above already does.
					-->
						<VStack gap={3}>
							<VStack gap={2}>
								<Text type="label">Delete</Text>
								<div class="row">
									<Button
										label="Delete item"
										variant="destructive"
										onclick={() => (deleteAlertOpen = true)}
									/>
									<AlertDialog
										isOpen={deleteAlertOpen}
										onOpenChange={(open) => (deleteAlertOpen = open)}
										title="Delete item?"
										description="This action cannot be undone. The item and all its data will be permanently removed."
										actionLabel="Delete"
										onAction={() => (deleteAlertOpen = false)}
									/>
								</div>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Async (<code>isActionLoading</code>)</Text>
								<div class="row">
									<Button
										label="Revoke access"
										variant="destructive"
										onclick={() => (revokeAlertOpen = true)}
									/>
									<AlertDialog
										isOpen={revokeAlertOpen}
										onOpenChange={(open) => (revokeAlertOpen = open)}
										title="Revoke access?"
										description="This user will immediately lose access to all shared resources."
										actionLabel="Revoke"
										isActionLoading={revokeAlertLoading}
										onAction={async () => {
											revokeAlertLoading = true;
											await new Promise((r) => setTimeout(r, 2000));
											revokeAlertLoading = false;
											revokeAlertOpen = false;
										}}
									/>
								</div>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Informational</Text>
								<div class="row">
									<Button
										label="Show notice"
										variant="secondary"
										onclick={() => (noticeAlertOpen = true)}
									/>
									<AlertDialog
										isOpen={noticeAlertOpen}
										onOpenChange={(open) => (noticeAlertOpen = open)}
										title="Session expired"
										description="Your session has expired. You will be redirected to the login page."
										actionLabel="Sign in"
										actionVariant="primary"
										onAction={() => (noticeAlertOpen = false)}
									/>
								</div>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Imperative (<code>useImperativeAlertDialog</code>)</Text>
								<div class="row">
									<Button
										label="Delete item"
										variant="destructive"
										onclick={() =>
											imperativeAlert.show({
												title: 'Delete item?',
												description: 'This action cannot be undone.',
												actionLabel: 'Delete',
												onAction: () => imperativeAlert.hide()
											})}
									/>
									<ImperativeAlertDialogLayer alert={imperativeAlert} />
								</div>
							</VStack>
						</VStack>
						<p class="note">
							A confirmation dialog for destructive or irreversible actions: <code
								>role="alertdialog"</code
							>
							over a <code>Dialog</code> with <code>purpose="form"</code>, so a backdrop click
							cannot dismiss it but Escape still cancels. The action button never auto-closes — the
							handler owns that, which is what makes an async action with
							<code>isActionLoading</code>
							possible (the <em>Revoke access</em> button holds its spinner for two seconds). All
							<strong>4</strong>
							of upstream's stories are here; the last of them,
							<em>Imperative</em>, drives its dialog through
							<code>useImperativeAlertDialog</code>, whose <code>element</code> return becomes
							<code>&lt;ImperativeAlertDialogLayer&gt;</code> here — a hook cannot return markup in Svelte.
						</p>
					</section>

					<section id="commandpalette" data-section="commandpalette">
						<h2 id="commandpalette">
							CommandPalette
							<a class="anchor" href="#commandpalette" aria-label="Link to CommandPalette">#</a>
						</h2>

						<CommandPaletteDemos />

						<p class="note">
							Ports <strong>all 8</strong> of upstream's stories. Each button opens a modal
							<code>Dialog</code> whose search is driven by a <code>searchSource</code> — the same
							interface <code>Typeahead</code> takes, so <code>createStaticSource</code> covers the
							static cases and <em>Open File Search</em> implements <code>SearchSource</code>
							directly to show the spinner and both empty states. Keyboard navigation is
							<code>useCombobox</code>, so arrows, Home/End and Enter behave as they do in
							<code>Selector</code>. Unusually for this page,
							<strong>no icon is substituted</strong>:
							<code>menu</code>, <code>wrench</code>, <code>info</code>, <code>search</code> and
							<code>check</code> are all registry built-ins.
						</p>
					</section>

					<section id="lightbox" data-section="lightbox">
						<h2 id="lightbox">
							Lightbox
							<a class="anchor" href="#lightbox" aria-label="Link to Lightbox">#</a>
						</h2>
						<VStack gap={4}>
							<VStack gap={2}>
								<Text type="label">Showcase (block <code>LightboxShowcase</code>)</Text>
								<div>
									<Button
										label="View image"
										variant="secondary"
										onclick={() => (lightboxShowcaseOpen = true)}
									/>
								</div>
								<Lightbox
									isOpen={lightboxShowcaseOpen}
									onOpenChange={(open) => (lightboxShowcaseOpen = open)}
									media={{
										src: GOLDEN_SUNSET,
										alt: 'Golden sunset',
										caption: 'A shoreline at golden hour.'
									}}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label"
									>Gallery via <code>useLightbox</code> (block <code>LightboxGallery</code>)</Text
								>
								<!-- Upstream renders `{lightbox.element}`; the Svelte counterpart is
					     <LightboxLayer>, the same split Layer/TooltipLayer already take. -->
								<Grid columns={2} gap={2} style="width: 136px">
									{#each LIGHTBOX_PHOTOS as photo, i (photo.src)}
										<Thumbnail
											src={photo.src}
											alt={photo.alt}
											label={photo.alt}
											onclick={() => lightboxGallery.open(i)}
										/>
									{/each}
								</Grid>
								<LightboxLayer lightbox={lightboxGallery} />
							</VStack>

							<VStack gap={2}>
								<Text type="label">Zoom (block <code>LightboxZoom</code>)</Text>
								<Thumbnail
									src={SNOWY_PEAKS}
									alt="Snowy peaks"
									label="Snowy peaks"
									onclick={() => (lightboxZoomOpen = true)}
								/>
								<Lightbox
									isOpen={lightboxZoomOpen}
									onOpenChange={(open) => (lightboxZoomOpen = open)}
									media={{
										src: SNOWY_PEAKS,
										alt: 'Snowy peaks',
										caption: 'Snowy peaks. Double-click to zoom in and drag to pan.'
									}}
									hasZoom
								/>
							</VStack>
						</VStack>
						<p>
							A fullscreen viewer on the native <code>&lt;dialog&gt;</code> with
							<code>showModal()</code> — not the Popover API and not <code>&lt;Layer&gt;</code>, so
							focus containment and the top layer are the browser's. Escape and a backdrop click
							both call
							<code>onOpenChange(false)</code>; <kbd>←</kbd>/<kbd>→</kbd> move through a gallery,
							and the nav buttons stay <em>mounted and disabled</em> at each end so reaching a
							boundary cannot drop focus to <code>&lt;body&gt;</code>. <code>hasZoom</code> enables
							a double-click 1×↔2× toggle with drag-to-pan. Gallery navigation is mirrored into a
							polite live region, but only while the viewer is already open — opening at an index is
							silent, since the dialog's
							<code>aria-label</code> already names the image.
						</p>
					</section>

					<section id="toast" data-section="toast">
						<h2 id="toast">
							Toast
							<a class="anchor" href="#toast" aria-label="Link to Toast">#</a>
						</h2>
						<VStack gap={4}>
							<VStack gap={2}>
								<Text type="label">Showcase (block <code>ToastShowcase</code>)</Text>
								<!-- Upstream's blocks render <Toast> inline for the static preview and put
					     a Button in `endContent` that fires the real thing through useToast().
					     `isAutoHide={false}` + `onDismiss={() => {}}` keep the preview parked. -->
								<Toast
									type="info"
									body="Document saved successfully"
									endContent={showcaseToastAction}
									isAutoHide={false}
									autoHideDuration={5000}
									isExiting={false}
									onDismiss={() => {}}
								/>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Types (block <code>ToastTypes</code>)</Text>
								<VStack gap={3}>
									<Toast
										type="info"
										body="Changes saved successfully."
										endContent={infoToastAction}
										isAutoHide={false}
										autoHideDuration={5000}
										isExiting={false}
										onDismiss={() => {}}
									/>
									<Toast
										type="error"
										body="Failed to save changes."
										endContent={errorToastAction}
										isAutoHide={false}
										autoHideDuration={5000}
										isExiting={false}
										onDismiss={() => {}}
									/>
								</VStack>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Action slot (block <code>ToastAction</code>)</Text>
								<VStack gap={3}>
									<Toast
										type="info"
										body="Item deleted"
										endContent={undoToastAction}
										isAutoHide={false}
										autoHideDuration={5000}
										isExiting={false}
										onDismiss={() => {}}
									/>
									<Toast
										type="info"
										body="Your report is ready."
										endContent={reportToastLink}
										isAutoHide={false}
										autoHideDuration={5000}
										isExiting={false}
										onDismiss={() => {}}
									/>
								</VStack>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Stacking (block <code>ToastStacking</code>)</Text>
								<VStack gap={3}>
									{#each TOAST_MESSAGES as msg (msg.body)}
										<Toast
											type={msg.type}
											body={msg.body}
											isAutoHide={false}
											autoHideDuration={5000}
											isExiting={false}
											onDismiss={() => {}}
										/>
									{/each}
									<Button
										label="Show toast"
										variant="secondary"
										size="sm"
										onclick={() => {
											const msg = TOAST_MESSAGES[toastStackingCount % TOAST_MESSAGES.length];
											toastStackingCount++;
											showToast(msg);
										}}
									/>
								</VStack>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Deduplication (block <code>ToastDeduplication</code>)</Text>
								<VStack gap={3}>
									<Toast
										type="info"
										body="You are offline"
										isAutoHide={false}
										autoHideDuration={5000}
										isExiting={false}
										onDismiss={() => {}}
									/>
									<HStack gap={3} vAlign="center">
										<Button
											label="Offline (ignore)"
											variant="secondary"
											size="sm"
											onclick={() =>
												showToast({
													body: 'You are offline',
													uniqueID: 'offline',
													collisionBehavior: 'ignore',
													isAutoHide: false
												})}
										/>
										<Button
											label="Progress (overwrite)"
											variant="secondary"
											size="sm"
											onclick={() =>
												showToast({
													body: `Uploading… ${Math.floor(Math.random() * 100)}%`,
													uniqueID: 'upload-progress',
													collisionBehavior: 'overwrite',
													isAutoHide: false
												})}
										/>
									</HStack>
								</VStack>
							</VStack>

							<VStack gap={2}>
								<Text type="label">Imperative dismiss (block <code>ToastDismiss</code>)</Text>
								<VStack gap={3}>
									<Toast
										type="info"
										body="Uploading file…"
										isAutoHide={false}
										autoHideDuration={5000}
										isExiting={false}
										onDismiss={() => {}}
									/>
									<HStack gap={3} vAlign="center">
										<Button
											label="Show toast"
											variant="secondary"
											size="sm"
											onclick={() => {
												dismissLastToast = showToast({
													body: 'Uploading file…',
													isAutoHide: false
												});
											}}
										/>
										<Button
											label="Dismiss via code"
											variant="ghost"
											size="sm"
											onclick={() => {
												dismissLastToast?.();
												dismissLastToast = null;
											}}
										/>
									</HStack>
								</VStack>
							</VStack>
						</VStack>
						<p>
							<code>ToastType</code> is <code>'info' | 'error'</code> only — there is no success or
							warning variant. <code>useToast()</code> returns an imperative
							<code>showToast(options)</code>
							whose return value dismisses that toast. With no <code>&lt;ToastViewport&gt;</code>
							ancestor it self-mounts a fallback viewport (and warns once), which is what these blocks
							rely on.
							<code>uniqueID</code> plus <code>collisionBehavior</code> dedupes:
							<code>'overwrite'</code> replaces the live toast in place, <code>'ignore'</code> drops the
							new one. Auto-hide pauses on hover, on focus within, and while the window is blurred.
						</p>
					</section>

					<section id="banner" data-section="banner">
						<h2 id="banner">
							Banner
							<a class="anchor" href="#banner" aria-label="Link to Banner">#</a>
						</h2>
						<div class="field-column">
							<Banner status="info" title="A new software update is available." />
							<Banner status="warning" title="Your trial expires in 3 days." />
							<Banner status="error" title="There was an error processing your request." />
							<Banner status="success" title="Your changes have been saved successfully." />
							<Banner
								status="info"
								title="New update available"
								description="A new version of the application is available. Update now to get the latest features and improvements."
							/>
							<Banner
								status="info"
								title="New update available"
								description="Version 2.0 is ready to install."
							>
								{#snippet endContent()}<Button
										label="Update now"
										variant="primary"
										size="sm"
									/>{/snippet}
							</Banner>
							<Banner
								status="warning"
								title="Your session will expire soon."
								description="Please save your work to avoid losing changes."
								isDismissable
							/>
							<Banner
								status="info"
								title="System maintenance scheduled"
								description="The system will be undergoing maintenance on Saturday from 2:00 AM to 6:00 AM UTC."
								container="section"
							/>
							<Banner
								status="error"
								title="Multiple errors found"
								description="The following issues need to be resolved:"
								isDismissable
							>
								<List listStyle="disc">
									<ListItem label="Email address is invalid" />
									<ListItem label="Password must be at least 8 characters" />
								</List>
							</Banner>
						</div>
						<p class="note">
							Two visual areas, each its own theme target: a coloured status header (<code
								>astryx-banner</code
							>) and — only when <code>children</code> are passed — a collapsible card-background
							region below it (<code>astryx-banner-content</code>), reached through a chevron toggle
							that
							<code>aria-controls</code>
							the region while it is mounted. Status picks both the icon and the live-region role:
							<code>alert</code>
							for warning and error,
							<code>status</code> for info and success. Dismissal is self-managed, so the last
							banner disappears with or without an <code>onDismiss</code>.
						</p>
					</section>

					<section id="overlay" data-section="overlay">
						<h2 id="overlay">
							Overlay
							<a class="anchor" href="#overlay" aria-label="Link to Overlay">#</a>
						</h2>
						<Grid columns={2} gap={6}>
							<VStack gap={2}>
								<Text type="label">showOn="hover", align="center"</Text>
								<Overlay showOn="hover" align="center" content={quickView}>
									<AspectRatio ratio={16 / 9}>
										<img src={MISTY_VALLEY} alt="Misty valley" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>

							<VStack gap={2}>
								<Text type="label">position="bottom", align="start"</Text>
								<Overlay position="bottom" align="start" content={caption}>
									<AspectRatio ratio={16 / 9}>
										<img src={GOLDEN_SUNSET} alt="Golden sunset" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>

							<VStack gap={2}>
								<Text type="label">scrim="light"</Text>
								<Overlay scrim="light" align="center" content={quickView}>
									<AspectRatio ratio={16 / 9}>
										<img src={SNOWY_PEAKS} alt="Snowy peaks" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>

							<VStack gap={2}>
								<Text type="label">scrim={false}, showOn="hover"</Text>
								<Overlay scrim={false} showOn="hover" align="center" content={favourite}>
									<AspectRatio ratio={16 / 9}>
										<img src={NIGHT_FOREST} alt="Night forest" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>

							<VStack gap={2}>
								<Text type="label">position="top", align="center"</Text>
								<Overlay position="top" align="center" content={caption}>
									<AspectRatio ratio={16 / 9}>
										<img src={SNOWY_PEAKS} alt="Snowy peaks" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>

							<VStack gap={2}>
								<Text type="label">showOn="hover-or-focus"</Text>
								<Overlay showOn="hover-or-focus" align="center" content={quickView}>
									<AspectRatio ratio={16 / 9}>
										<img src={GOLDEN_SUNSET} alt="Golden sunset" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>

							<VStack gap={2}>
								<Text type="label">isOpen (JS-controlled)</Text>
								<Button
									label={isUploading ? 'Cancel upload' : 'Simulate upload'}
									size="sm"
									onclick={() => (isUploading = !isUploading)}
								/>
								<Overlay isOpen={isUploading} scrim="light" align="center" content={uploading}>
									<AspectRatio ratio={16 / 9}>
										<img src={MISTY_VALLEY} alt="Upload" class="overlay-media" />
									</AspectRatio>
								</Overlay>
							</VStack>
						</Grid>
						<!--
				DisconnectedHover: `useOverlay` on a `Card`, so hovering anywhere on the
				card reveals an overlay that sits on the image alone. Upstream's hook
				returns `element`; ours returns `scrimProps` for an `<OverlayScrim>`,
				the same hook/render split `useTooltip` takes.
			-->
						<Card width={360} {...featuredCardProps} {...featuredOverlay.containerProps}>
							<div class="overlay-image-section">
								<AspectRatio ratio={16 / 9}>
									<img src={NIGHT_FOREST} alt="Article" class="overlay-media" />
								</AspectRatio>
								<OverlayScrim {...featuredOverlay.scrimProps}>
									<Heading level={4}>Featured Article</Heading>
								</OverlayScrim>
							</div>
							<VStack gap={1}>
								<Text type="supporting" color="secondary">Jan 15, 2026 · 5 min read</Text>
								<Text type="supporting" color="secondary">By Jane Author</Text>
							</VStack>
						</Card>
						<p class="note">
							<code>showOn</code> is a <code>when.ancestor</code> rule keyed on a marker the
							container carries, so on a device with a real pointer, hover and focus reveal with no
							listener at all. There is one exception, and it is not <code>isOpen</code>: where
							<code>(hover: none)</code> matches, a hover-mode overlay has no
							<code>:hover</code> for the CSS to key off, so <code>useOverlay</code> attaches
							<code>onclick</code>/<code>onmouseup</code> and drives a tap-toggle instead — the only
							state in the whole system. The scrim also flips the theme for whatever it holds, which
							is why the ghost button stays legible on the dark and the light scrim alike.
							<code>isOpen</code>
							overrides both <code>showOn</code> and that tap-toggle, and is the only path that
							marks the scrim
							<code>inert</code> while hidden.
						</p>
					</section>

					<section id="chat" data-section="chat">
						<h2 id="chat">
							Chat
							<a class="anchor" href="#chat" aria-label="Link to Chat">#</a>
						</h2>

						<ChatDemos />

						<p class="note">
							The last upstream component directory, and the largest — 25 modules behind sixteen
							published components and seven hooks. The demos are drawn from upstream's
							<code>Chat</code>, <code>ChatToolCalls</code>, <code>ChatTokenizedText</code> and
							<code>ChatComposer</code> stories rather than the full 74: the four cover every
							published prop this page can show statically, while the rest are variations on
							auto-scroll and dictation that need a live conversation or a microphone.
							<code>useChatDictation</code> is wired here all the same — the microphone button is
							rendered with <code>isHiddenWhenUnsupported={false}</code> so it appears whether or
							not the browser has <code>SpeechRecognition</code>. The composer's <code>@</code> and
							<code>/</code>
							triggers are the real thing: type either character to open the menu.
						</p>
					</section>
				</main>
			</div>
		</div>
	</InternationalizationProvider>
</Theme>

<style>
	.page {
		min-height: 100dvh;
		background: var(--color-background-body);
		color: var(--color-text-primary);
		font-family: var(--font-family-body);
		font-size: var(--text-body-size);
		line-height: var(--text-body-leading);
	}

	/* The bar stays put while the content scrolls, so the theme and colour-scheme
	   toggles are reachable from any section — they are the two controls a
	   reviewer reaches for most. */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-4);
		flex-wrap: wrap;
		padding: var(--spacing-4) var(--spacing-8);
		background: var(--color-background-body);
		border-block-end: var(--border-width) solid var(--color-border);
	}

	/* Sidebar + content. The grid collapses to a single column below 900px, where
	   the sidebar stops being sticky and becomes a plain index at the top. */
	.shell {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: var(--spacing-8);
		align-items: start;
		padding: var(--spacing-8);
	}

	.sidebar {
		position: sticky;
		top: calc(var(--spacing-8) + 2.5rem);
		max-height: calc(100dvh - var(--spacing-8) - 3.5rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		padding-inline-end: var(--spacing-2);
		scrollbar-width: thin;
	}

	.filter {
		position: sticky;
		top: 0;
		z-index: 1;
		background: var(--color-background-body);
		padding-block-end: var(--spacing-2);
	}

	.count {
		margin: var(--spacing-1) 0 0;
		color: var(--color-text-secondary);
		font-size: var(--text-caption-size);
	}

	.nav-group {
		margin: var(--spacing-3) 0 var(--spacing-1);
		color: var(--color-text-secondary);
		font-size: var(--text-caption-size);
		font-weight: var(--font-weight-semibold);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.sidebar ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.sidebar a {
		display: block;
		padding: var(--spacing-1) var(--spacing-2);
		border-radius: var(--radius-element);
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: var(--text-supporting-size);
	}

	.sidebar a:hover {
		background: var(--color-background-surface);
		color: var(--color-text-primary);
	}

	/* The scroll-spy state. A left rail rather than a fill, so the active row
	   still reads as a link and not as a selected button. */
	.sidebar a.active {
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
		box-shadow: inset 2px 0 0 var(--color-accent);
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-8);
		min-width: 0;
	}

	/* Anchored jumps land under the sticky top bar without this. */
	.content section {
		scroll-margin-top: calc(var(--spacing-8) + 3rem);
	}

	@media (max-width: 900px) {
		.shell {
			grid-template-columns: minmax(0, 1fr);
			padding: var(--spacing-4);
		}

		.sidebar {
			position: static;
			max-height: none;
		}

		.topbar {
			padding-inline: var(--spacing-4);
		}
	}

	h1 {
		margin: 0;
		font-family: var(--font-family-heading);
		font-size: var(--text-heading-1-size);
		font-weight: var(--text-heading-1-weight);
		line-height: var(--text-heading-1-leading);
	}

	h2 {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
		margin: 0 0 var(--spacing-3);
		font-family: var(--font-family-heading);
		font-size: var(--text-heading-4-size);
		font-weight: var(--text-heading-4-weight);
		color: var(--color-text-secondary);
		scroll-margin-top: calc(var(--spacing-8) + 3rem);
	}

	/* Permalink, revealed on hover or keyboard focus — always in the DOM so the
	   heading's own layout never shifts. */
	.anchor {
		color: var(--color-text-tertiary, var(--color-text-secondary));
		font-size: var(--text-supporting-size);
		text-decoration: none;
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease-standard);
	}

	h2:hover .anchor,
	.anchor:focus-visible {
		opacity: 1;
	}

	.sub,
	.note {
		margin: var(--spacing-1) 0 0;
		color: var(--color-text-secondary);
		font-size: var(--text-supporting-size);
	}

	.note {
		margin-top: var(--spacing-3);
		max-width: 60ch;
	}

	code {
		font-family: var(--font-family-code);
		font-size: var(--text-code-size);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-3);
	}

	.stack {
		display: flex;
		flex-direction: column;
		align-items: start;
		gap: var(--spacing-2);
	}

	/* Outline. Upstream's stories size the aside at 220–240px and lay the
	   document blocks out as a two-column grid with a sticky aside. */
	.outline-demo-column {
		width: 240px;
	}

	.outline-document {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 220px;
		gap: 32px;
		max-width: 960px;
	}

	.outline-document article {
		display: grid;
		gap: 24px;
	}

	/* `ScrollSpy` — the pane is the scroll root, and the header covers its top. */
	.outline-scroll-pane {
		overflow-y: auto;
		height: 360px;
		border: 1px solid rgba(128, 128, 128, 0.3);
		border-radius: 8px;
		position: relative;
	}

	.outline-sticky-header {
		position: sticky;
		top: 0;
		height: 48px;
		box-sizing: border-box;
		padding: 0 16px;
		display: flex;
		align-items: center;
		background: var(--color-surface);
		border-bottom: 1px solid rgba(128, 128, 128, 0.3);
		z-index: 1;
	}

	.outline-scroll-pane-body {
		padding: 0 16px 16px;
	}

	.outline-keyboard-demo {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 240px;
	}

	.outline-document aside {
		position: sticky;
		top: 24px;
		align-self: start;
	}

	/* Narrow enough that the sample text actually overflows. `stretch` matters:
	   under the stack's `align-items: start` a nowrap child takes its max-content
	   width, overflows the box, and then never registers as truncated. */
	.clamped {
		max-width: 32ch;
		align-items: stretch;
	}

	/* Just enough surface to see where a layout primitive's box actually is — and
	   the right-click target in the ContextMenu block, which upstream gives its
	   own bordered area too. `EmptyState` no longer uses this: it wraps in a real
	   `Card`, as upstream's `EmptyStateContainer` does.
	   :global because these land on components — Svelte's scoping class is added
	   to elements in this template, not to a `class` prop passed to a child. */
	:global(.demo-box),
	:global(.cell) {
		background: var(--color-background-surface);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-outer);
	}

	:global(.cell) {
		width: 100%;
	}

	/* TabList's `WithActions`/`DividerGap` stories push their buttons to the end
	   of the strip with an inline-styled div; upstream does the same. */
	.tab-actions {
		margin-inline-start: auto;
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
	}

	/* The two width-constrained frames the `FillLayout` and `Overflow` stories
	   need to show anything: fill only differs inside a bounded width, and the
	   overflow carousel only scrolls once the tabs exceed it. */
	.tab-fill-frame {
		width: 500px;
		max-width: 100%;
	}

	.tab-overflow-frame {
		max-width: 400px;
		border: var(--border-width) dashed var(--color-border);
	}

	.tab-overflow-narrow {
		max-width: 350px;
	}

	/* A dark surface for the `onMedia` spinner shade, which is defined against
	   media rather than against the page background. */
	.on-media {
		background-color: #1a1a2e;
		padding: var(--spacing-4);
		border-radius: var(--radius-element);
	}

	/* The image half of the disconnected-hover card: the overlay covers this
	   region while the hover target is the whole card around it. */
	.overlay-image-section {
		position: relative;
		border-radius: var(--radius-element);
		overflow: clip;
	}

	:global(.overlay-media) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* A minimal native input styled to match Astryx's aesthetics, as upstream's
	   own Field story does — the whole point of Field is that the control is not
	   one of ours, so this styling belongs to the demo page and not to the
	   library. Plain page CSS rather than StyleX: `.stylex.ts` cannot be imported
	   from a `.svelte` file, and nothing here needs to match upstream's classes. */
	.native-input {
		width: 100%;
		box-sizing: border-box;
		font-family: var(--font-family-body);
		font-size: 14px;
		padding-block: var(--spacing-2);
		padding-inline: var(--spacing-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-element);
		background-color: var(--color-background-surface);
		color: var(--color-text-primary);
		outline: none;
	}

	.native-input:focus {
		border-color: var(--color-accent);
	}

	/* Upstream's stories cap the field column so the label/description/status
	   stack is legible; `width` on Field itself is shown by its own test. */
	.field-column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
		max-width: 320px;
	}

	/* `DateTimeInput` puts a date field and a time field on one line; upstream's
	   stories size that column at 460px rather than the usual 300. */
	.field-column-wide {
		max-width: 460px;
	}

	/* Calendar has no label of its own, so each tile is captioned — the same
	   arrangement the Outline section uses. A month grid is far too wide for
	   `.field-column`, so the tiles wrap instead of stacking. */
	.calendar-gallery {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--spacing-6);
	}

	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-4);
	}

	.swatch {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	/* Upstream's two side-by-side Theme stories use an inline 1fr 1fr grid. */
	.theme-compare {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-4);
	}

	/* `Center`'s stories. Upstream authors these three in `stylex.create` — a blue
	   demo box, a dashed outline on the Center itself so its padding is visible,
	   and a child that fills the box. StyleX can't be reached from a `.svelte`
	   file, so they are plain classes over the same theme tokens. */
	.center-box {
		background-color: var(--color-background-blue);
		color: var(--color-text-blue);
		border: 1px solid var(--color-border-blue);
		padding-block: var(--spacing-4);
		padding-inline: var(--spacing-6);
		border-radius: var(--radius-element);
		font-weight: 500;
	}

	/* :global for the reason `.cell` above is: it lands on a component's `class`
	   prop, not on an element in this template. */
	:global(.center-padding-outline) {
		border: 1px dashed var(--color-border-gray);
		border-radius: var(--radius-element);
	}

	.center-fill {
		width: 100%;
		height: 100%;
	}

	/* `Carousel`'s stories frame the row so it overflows and the edge-fade,
	   buttons and loop wrap are all visible. Upstream sizes that frame at 400px
	   for its eight thumbnails; this port's stand-in set is four, so the frame is
	   narrower to reach the same overflow. */
	.carousel-frame {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
		max-width: 200px;
	}

	/* `ProgressBar`'s ThemedMarks story, which sets the three properties a theme
	   would set on the `progressbar-mark` target. `:global` because the mark is
	   ProgressBar's element, not this page's. */
	.themed-marks-demo :global(.astryx-progressbar-mark) {
		background-color: red;
		width: 3px;
		height: 14px;
	}

	.chip {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-inner);
		border: var(--border-width) solid var(--color-border);
		display: inline-block;
	}
</style>
