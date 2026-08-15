export { default as AlertDialog } from './components/alert-dialog/alert-dialog.svelte';
export { default as AppShell } from './components/app-shell/app-shell.svelte';
export {
	AppShellMobileContext,
	useAppShellMobile
} from './components/app-shell/app-shell-mobile-context.svelte.js';
export { default as AspectRatio } from './components/aspect-ratio/aspect-ratio.svelte';
export { default as Avatar } from './components/avatar/avatar.svelte';
export { default as AvatarStatusDot } from './components/avatar/avatar-status-dot.svelte';
export { default as AvatarGroup } from './components/avatar-group/avatar-group.svelte';
export { default as AvatarGroupOverflow } from './components/avatar-group/avatar-group-overflow.svelte';
export { default as Badge } from './components/badge/badge.svelte';
export { default as Banner } from './components/banner/banner.svelte';
export { default as Blockquote } from './components/blockquote/blockquote.svelte';
export { default as BreadcrumbItem } from './components/breadcrumbs/breadcrumb-item.svelte';
// The breadcrumb `menu` prop reuses the DropdownMenu item API, so the item
// components are re-exported under `Breadcrumb*` aliases for family coherence,
// exactly as upstream's `Breadcrumbs/index.ts` does.
export { default as BreadcrumbMenuCheckboxItem } from './components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
export { default as BreadcrumbMenuItem } from './components/dropdown-menu/dropdown-menu-item.svelte';
export { default as BreadcrumbMenuRadioGroup } from './components/dropdown-menu/dropdown-menu-radio-group.svelte';
export { default as BreadcrumbMenuRadioItem } from './components/dropdown-menu/dropdown-menu-radio-item.svelte';
export { default as BreadcrumbMenuSubMenu } from './components/dropdown-menu/dropdown-menu-sub-menu.svelte';
export { default as Breadcrumbs } from './components/breadcrumbs/breadcrumbs.svelte';
export { default as Button } from './components/button/button.svelte';
export { default as ButtonGroup } from './components/button-group/button-group.svelte';
export { default as Calendar } from './components/calendar/calendar.svelte';
// Upstream's `Calendar/index.ts` re-exports the three calendar hooks "for
// advanced usage" and three date helpers under their calendar-facing names. Note
// `useCalendarNavigation` is published but never used by the component itself,
// which inlines an almost-identical copy — ported anyway, because the export is
// the contract. `formatAccessibleDate` was the fourth helper through 0.2.0, where
// it was already `@deprecated`; 0.3.0 deletes it outright, so it is gone here too.
export { useCalendarDays } from './components/calendar/use-calendar-days.svelte.js';
export { useCalendarConstraints } from './components/calendar/use-calendar-constraints.svelte.js';
export { useCalendarNavigation } from './components/calendar/use-calendar-navigation.svelte.js';
export { isSameDay, isDateInRange, getWeekNumber } from './components/calendar/utils.js';
export { default as Card } from './components/card/card.svelte';
export { default as Carousel } from './components/carousel/carousel.svelte';
export { default as DateInput } from './components/date-input/date-input.svelte';
export { default as DateRangeInput } from './components/date-range-input/date-range-input.svelte';
export { default as DateTimeInput } from './components/date-time-input/date-time-input.svelte';
export { default as Center } from './components/center/center.svelte';
// Chat — mirrors upstream's `Chat/index.ts`. `ChatPastedTextToken`,
// `chatComposerSelection`'s helpers, `useTriggerMenu` and its layer are all
// module-private there, so none of them appear here either.
export { default as ChatComposer } from './components/chat/chat-composer.svelte';
export { default as ChatSendButton } from './components/chat/chat-send-button.svelte';
export { default as ChatComposerDrawer } from './components/chat/chat-composer-drawer.svelte';
export { default as ChatComposerInput } from './components/chat/chat-composer-input.svelte';
export { default as ChatComposerTokenElement } from './components/chat/chat-composer-token-element.svelte';
export { default as ChatTokenizedText } from './components/chat/chat-tokenized-text.svelte';
export { default as ChatMessageList } from './components/chat/chat-message-list.svelte';
export { default as ChatMessage } from './components/chat/chat-message.svelte';
export { default as ChatMessageBubble } from './components/chat/chat-message-bubble.svelte';
export { default as ChatMessageMetadata } from './components/chat/chat-message-metadata.svelte';
export { default as ChatSystemMessage } from './components/chat/chat-system-message.svelte';
export { default as ChatToolCalls } from './components/chat/chat-tool-calls.svelte';
export { default as ChatLayout } from './components/chat/chat-layout.svelte';
export { default as ChatLayoutScrollButton } from './components/chat/chat-layout-scroll-button.svelte';
export { default as ChatDictationButton } from './components/chat/chat-dictation-button.svelte';
export { useChatStreamScroll } from './components/chat/use-chat-stream-scroll.svelte.js';
export { useChatNewMessages } from './components/chat/use-chat-new-messages.svelte.js';
export { useChatPasteAsToken } from './components/chat/use-chat-paste-as-token.js';
export { useChatComposerTokens } from './components/chat/use-chat-composer-tokens.svelte.js';
export {
	useChatLayoutContext,
	useChatComposerContext
} from './components/chat/chat-context.svelte.js';
export type {
	ChatComposerContextValue,
	ChatComposerInputControl
} from './components/chat/chat-context.svelte.js';
export { useSpeechRecognition } from './components/chat/use-speech-recognition.svelte.js';
export { useChatDictation } from './components/chat/use-chat-dictation.svelte.js';
export { default as CheckIndicator } from './components/indicator/check-indicator.svelte';
export { default as CheckboxIndicator } from './components/indicator/checkbox-indicator.svelte';
export { default as CheckboxInput } from './components/checkbox-input/checkbox-input.svelte';
export { default as CheckboxList } from './components/checkbox-list/checkbox-list.svelte';
export { default as CheckboxListItem } from './components/checkbox-list/checkbox-list-item.svelte';
export { default as Citation } from './components/citation/citation.svelte';
export { default as ClickableCard } from './components/clickable-card/clickable-card.svelte';
export { default as Code } from './components/code/code.svelte';
export { default as CodeBlock } from './components/code-block/code-block.svelte';
// The tokenizer and highlight-range helpers are published by upstream's
// `CodeBlock/index.ts` alongside the component — they are the seam a consumer
// uses to bring its own tokenizer, or to paint ranges onto its own editor.
export {
	SYNC_TOKENIZE_THRESHOLD,
	flatTokensToLines,
	tokenize,
	tokenizeAsync,
	tokenizeStreaming
} from './components/code-block/tokenizer.js';
export {
	applyHighlightRangesBatch,
	applyHighlightRangesChunked,
	applyHighlightRangesFlat,
	cleanupRanges
} from './components/code-block/highlight-ranges.js';
export { TOKEN_TYPES, ensureHighlightStyles } from './components/code-block/highlight-styles.js';
export { default as Collapsible } from './components/collapsible/collapsible.svelte';
export { default as CollapsibleGroup } from './components/collapsible/collapsible-group.svelte';
export { default as CommandPalette } from './components/command-palette/command-palette.svelte';
export { default as CommandPaletteEmpty } from './components/command-palette/command-palette-empty.svelte';
export { default as CommandPaletteFooter } from './components/command-palette/command-palette-footer.svelte';
export { default as CommandPaletteGroup } from './components/command-palette/command-palette-group.svelte';
export { default as CommandPaletteInput } from './components/command-palette/command-palette-input.svelte';
export { default as CommandPaletteItem } from './components/command-palette/command-palette-item.svelte';
export { default as CommandPaletteList } from './components/command-palette/command-palette-list.svelte';
export { default as ComplexSelector } from './components/complex-selector/complex-selector.svelte';
export { default as ContextMenu } from './components/context-menu/context-menu.svelte';
// Upstream's `ContextMenu/index.ts` re-exports the DropdownMenu item components
// under the ContextMenu name — selectable items work inside a context menu too,
// so the API stays coherent. Same components, second name.
export { default as ContextMenuCheckboxItem } from './components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
export { default as ContextMenuItem } from './components/dropdown-menu/dropdown-menu-item.svelte';
export { default as ContextMenuRadioGroup } from './components/dropdown-menu/dropdown-menu-radio-group.svelte';
export { default as ContextMenuRadioItem } from './components/dropdown-menu/dropdown-menu-radio-item.svelte';
export { default as ContextMenuSubMenu } from './components/dropdown-menu/dropdown-menu-sub-menu.svelte';
export { default as Dialog } from './components/dialog/dialog.svelte';
export { default as DialogHeader } from './components/dialog/dialog-header.svelte';
export { default as Divider } from './components/divider/divider.svelte';
export { default as DropdownMenu } from './components/dropdown-menu/dropdown-menu.svelte';
export { default as DropdownMenuCheckboxItem } from './components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
export { default as DropdownMenuItem } from './components/dropdown-menu/dropdown-menu-item.svelte';
export { default as DropdownMenuRadioGroup } from './components/dropdown-menu/dropdown-menu-radio-group.svelte';
export { default as DropdownMenuRadioItem } from './components/dropdown-menu/dropdown-menu-radio-item.svelte';
export { default as DropdownMenuSubMenu } from './components/dropdown-menu/dropdown-menu-sub-menu.svelte';
export { default as EmptyState } from './components/empty-state/empty-state.svelte';
export { default as Field } from './components/field/field.svelte';
export { default as FieldLabel } from './components/field/field-label.svelte';
export { default as FieldStatus } from './components/field-status/field-status.svelte';
export { default as FileInput } from './components/file-input/file-input.svelte';
export { default as FormLayout } from './components/form-layout/form-layout.svelte';
export { default as Grid } from './components/grid/grid.svelte';
export { default as GridSpan } from './components/grid/grid-span.svelte';
export { default as HStack } from './components/stack/hstack.svelte';
export { default as Heading } from './components/heading/heading.svelte';
export { default as HoverCard } from './components/hover-card/hover-card.svelte';
export { default as HoverCardLayer } from './components/hover-card/hover-card-layer.svelte';
export { default as Icon } from './components/icon/icon.svelte';
export { default as IconButton } from './components/icon-button/icon-button.svelte';
// `ImperativeAlertDialogLayer`/`ImperativeDialogLayer` are the rendering halves
// of `useImperativeAlertDialog`/`useImperativeDialog`, replacing upstream's
// `element: ReactNode` returns. Upstream has no such symbols — same split as
// `Layer`/`TooltipLayer`/`KeyboardHintLayer`/`LightboxLayer`. See TODO.md →
// Known debts.
export { default as ImperativeAlertDialogLayer } from './components/alert-dialog/imperative-alert-dialog-layer.svelte';
export { default as ImperativeDialogLayer } from './components/dialog/imperative-dialog-layer.svelte';
export { default as InputClearButton } from './components/field/input-clear-button.svelte';
export { default as InputGroup } from './components/input-group/input-group.svelte';
export { default as InputGroupText } from './components/input-group/input-group-text.svelte';
export { default as Item } from './components/item/item.svelte';
export { default as Kbd } from './components/kbd/kbd.svelte';
export { default as Layer } from './components/layer/layer.svelte';
// `LayerContext`/`useLayerContext` are deliberately absent: upstream publishes
// them from `Layer/index.ts` only, and its root barrel carries just the provider
// — the `focusableSelector` rule for module-public-but-barrel-absent symbols.
export { default as LayerProvider } from './components/layer/layer-provider.svelte';
export { default as Layout } from './components/layout/layout.svelte';
export { default as LayoutContent } from './components/layout/layout-content.svelte';
export { default as LayoutFooter } from './components/layout/layout-footer.svelte';
export { default as LayoutHeader } from './components/layout/layout-header.svelte';
export { default as LayoutPanel } from './components/layout/layout-panel.svelte';
export { default as Lightbox } from './components/lightbox/lightbox.svelte';
// `LightboxLayer` is the rendering half of `useLightbox`, replacing upstream's
// `element: ReactNode` return. Upstream has no such symbol — same split as
// `Layer`/`TooltipLayer`/`KeyboardHintLayer`. See TODO.md → Known debts.
export { default as LightboxLayer } from './components/lightbox/lightbox-layer.svelte';
export { default as Link } from './components/link/link.svelte';
export { default as LinkProvider } from './components/link/link-provider.svelte';
export { default as List } from './components/list/list.svelte';
export { default as Markdown } from './components/markdown/markdown.svelte';
export { default as ListItem } from './components/list/list-item.svelte';
export { default as MediaTheme } from './theme/media-theme.svelte';
// `SyntaxTheme` is surfaced at the root for the same reason `MediaTheme` is —
// both are theme *components*, and upstream's root `export * from './theme'`
// reaches them. (Our root barrel is deliberately not a full mirror of `./theme`:
// `defineTheme`, `generateThemeCss` and friends stay on the `./theme` subpath.
// The components are the practical exception, applied consistently.) No
// `SyntaxThemeProps` — upstream keeps that interface module-private.
export { default as SyntaxTheme } from './theme/syntax/syntax-theme.svelte';
export { useSyntaxTheme } from './theme/syntax/use-syntax-theme.svelte.js';
export type { UseSyntaxThemeReturn } from './theme/syntax/use-syntax-theme.svelte.js';
export { default as MetadataList } from './components/metadata-list/metadata-list.svelte';
export { default as MetadataListItem } from './components/metadata-list/metadata-list-item.svelte';
export { default as MoreMenu } from './components/more-menu/more-menu.svelte';
export { default as MultiSelector } from './components/multi-selector/multi-selector.svelte';
export { default as NavHeadingMenu } from './components/nav-menu/nav-heading-menu.svelte';
export { default as NavHeadingMenuItem } from './components/nav-menu/nav-heading-menu-item.svelte';
// No `NavMenuItem`: through 0.2.0 upstream shipped `NavMenu/NavMenuItem.tsx` as
// `export const NavMenuItem = NavHeadingMenuItem`, a deprecated alias. 0.3.0
// deletes the module as a breaking change — `NavMenu/index.ts` no longer names
// it, and the CLI ships a `migrate-navmenuitem-to-navheadingmenuitem` codemod
// instead. Removed here for the same reason.
export { default as MobileNav } from './components/mobile-nav/mobile-nav.svelte';
export { default as MobileNavToggle } from './components/mobile-nav/mobile-nav-toggle.svelte';
export { default as NavIcon } from './components/nav-icon/nav-icon.svelte';
export { default as NumberInput } from './components/number-input/number-input.svelte';
export { default as Outline } from './components/outline/outline.svelte';
export { default as OverflowList } from './components/overflow-list/overflow-list.svelte';
export { default as Overlay } from './components/overlay/overlay.svelte';
export { default as OverlayScrim } from './components/overlay/overlay-scrim.svelte';
export {
	default as Pagination,
	generatePageRange
} from './components/pagination/pagination.svelte';
export { default as Popover } from './components/popover/popover.svelte';
export { default as PopoverLayer } from './components/popover/popover-layer.svelte';
export { default as ProgressBar } from './components/progress-bar/progress-bar.svelte';
export { default as RadioIndicator } from './components/indicator/radio-indicator.svelte';
export { default as RadioList } from './components/radio-list/radio-list.svelte';
export { default as RadioListItem } from './components/radio-list/radio-list-item.svelte';
export { default as ResizeHandle } from './components/resizable/resize-handle.svelte';
export { default as Section } from './components/section/section.svelte';
export { default as SegmentedControl } from './components/segmented-control/segmented-control.svelte';
export { default as SegmentedControlItem } from './components/segmented-control/segmented-control-item.svelte';
export { default as SelectableCard } from './components/selectable-card/selectable-card.svelte';
export { default as Selector } from './components/selector/selector.svelte';
export { default as SelectorOption } from './components/selector/selector-option.svelte';
export { default as SideNav } from './components/side-nav/side-nav.svelte';
export { default as SideNavCollapseButton } from './components/side-nav/side-nav-collapse-button.svelte';
export { default as SideNavHeading } from './components/side-nav/side-nav-heading.svelte';
export { default as SideNavItem } from './components/side-nav/side-nav-item.svelte';
export { default as SideNavSection } from './components/side-nav/side-nav-section.svelte';
export { useSideNavCollapse } from './components/side-nav/side-nav-collapse-context.svelte.js';
// The render-mode context object is public where the collapse one is not —
// upstream's `SideNav/index.ts` exports exactly this asymmetry, because an app
// assembling its own shell needs to drive the modes from outside.
export {
	SideNavRenderContext,
	useSideNavRenderMode
} from './components/side-nav/side-nav-render-context.svelte.js';
export { default as Skeleton } from './components/skeleton/skeleton.svelte';
export { default as Slider } from './components/slider/slider.svelte';
export { default as Spinner } from './components/spinner/spinner.svelte';
export { default as Stack } from './components/stack/stack.svelte';
export { default as StackItem } from './components/stack/stack-item.svelte';
export { default as StatusDot } from './components/status-dot/status-dot.svelte';
export { default as Switch } from './components/switch/switch.svelte';
export { default as Tab } from './components/tab-list/tab.svelte';
export { default as TabList } from './components/tab-list/tab-list.svelte';
export { default as TabMenu } from './components/tab-list/tab-menu.svelte';
// The Table core. Upstream's `Table/index.ts` publishes 18 hook/helper values
// out of eleven plugin directories alongside these; all of them landed in batch
// 13 and are exported further down this file. The plugin hooks are standalone
// and reach the table through the public `plugins` prop, which is what let the
// core ship a batch ahead of them. `BaseTable` is *not* published, matching
// upstream: its barrel exports `Table` and the sub-components, and `BaseTable`
// only surfaces as the `BaseTableProps` type `TableProps` extends.
export { default as Table } from './components/table/table.svelte';
export { default as TableBody } from './components/table/table-body.svelte';
export { default as TableCell } from './components/table/table-cell.svelte';
export { default as TableFooter } from './components/table/table-footer.svelte';
export { default as TableHeader } from './components/table/table-header.svelte';
export { default as TableHeaderCell } from './components/table/table-header-cell.svelte';
export { default as TableRow } from './components/table/table-row.svelte';
export { default as Text } from './components/text/text.svelte';
export { default as TextArea } from './components/text-area/text-area.svelte';
export { default as TextInput } from './components/text-input/text-input.svelte';
// The theme *component* surfaces at the root, as `MediaTheme`/`SyntaxTheme` do
// (see the note above them). No `ThemeProps` — upstream keeps that interface
// module-private too.
export { default as Theme } from './theme/theme.svelte';
export { ThemeContext } from './theme/theme-context.js';
export type { ThemeContextValue } from './theme/theme-context.js';
export type { ThemeMode } from './theme/types.js';
// `useTheme` joins `useSyntaxTheme` at the root: both are theme *hooks* a
// component calls, not theme-authoring API, and upstream's root reaches both.
// `resolveThemeTokens` and friends stay on the `./theme` subpath with
// `defineTheme`.
//
// No `UseThemeNameReturn`: upstream's `useThemeName()` returns `string | null`
// and so names no return type anywhere in the package. Ours wraps the value in a
// getter object for reactivity, which is a port artifact — the interface stays
// module-public and off both barrels rather than inventing published surface.
export { useTheme, useThemeName } from './theme/use-theme.svelte.js';
export type { UseThemeReturn } from './theme/use-theme.svelte.js';
export { default as Thumbnail } from './components/thumbnail/thumbnail.svelte';
export { default as TimeInput } from './components/time-input/time-input.svelte';
export { default as Timestamp } from './components/timestamp/timestamp.svelte';
// `Toast` is exported for inline rendering in previews and documentation, and
// `ToastViewport` for LayerProvider integration — upstream's stated reasons.
export { default as Toast } from './components/toast/toast.svelte';
export { default as ToastViewport } from './components/toast/toast-viewport.svelte';
export { default as ToggleButton } from './components/toggle-button/toggle-button.svelte';
export { default as ToggleButtonGroup } from './components/toggle-button/toggle-button-group.svelte';
export { default as Token } from './components/token/token.svelte';
export { default as Tokenizer } from './components/tokenizer/tokenizer.svelte';
export { default as Toolbar } from './components/toolbar/toolbar.svelte';
export { default as TreeList } from './components/tree-list/tree-list.svelte';
export { default as TopNav } from './components/top-nav/top-nav.svelte';
export { default as TopNavHeading } from './components/top-nav/top-nav-heading.svelte';
export { default as TopNavItem } from './components/top-nav/top-nav-item.svelte';
export { default as TopNavMenu } from './components/top-nav/top-nav-menu.svelte';
export { default as TopNavMegaMenu } from './components/top-nav/top-nav-mega-menu.svelte';
export { default as TopNavMegaMenuItem } from './components/top-nav/top-nav-mega-menu-item.svelte';
export { default as TopNavMegaMenuFeaturedCard } from './components/top-nav/top-nav-mega-menu-featured-card.svelte';
export {
	TopNavRenderContext,
	useTopNavRenderMode
} from './components/top-nav/top-nav-render-context.svelte.js';
export { default as Tooltip } from './components/tooltip/tooltip.svelte';
export { default as TooltipLayer } from './components/tooltip/tooltip-layer.svelte';
export { default as BaseTypeahead } from './components/typeahead/base-typeahead.svelte';
export { default as Typeahead } from './components/typeahead/typeahead.svelte';
export { default as TypeaheadItem } from './components/typeahead/typeahead-item.svelte';
export { createStaticSource } from './components/typeahead/create-static-source.js';
export { default as VStack } from './components/stack/vstack.svelte';
export { default as VisuallyHidden } from './components/visually-hidden/visually-hidden.svelte';

// Props types — one per component, as upstream exports from every `index.ts`,
// so a consumer can name the type of a component they are wrapping. Each is
// declared and exported from its component's `<script module>` block.
export type { AlertDialogProps } from './components/alert-dialog/alert-dialog.svelte';
export type {
	AppShellProps,
	AppShellBreakpoint,
	AppShellVariant,
	AppShellVariantMap,
	MobileNavConfig
} from './components/app-shell/app-shell.svelte';
export type { AppShellMobileContextValue } from './components/app-shell/app-shell-mobile-context.svelte.js';
export type { AspectRatioProps } from './components/aspect-ratio/aspect-ratio.svelte';
export type { AvatarProps } from './components/avatar/avatar.svelte';
export type { AvatarStatusDotProps } from './components/avatar/avatar-status-dot.svelte';
export type { AvatarGroupProps } from './components/avatar-group/avatar-group.svelte';
export type { AvatarGroupOverflowProps } from './components/avatar-group/avatar-group-overflow.svelte';
export type { BadgeProps } from './components/badge/badge.svelte';
export type { BannerProps } from './components/banner/banner.svelte';
export type {
	BannerContainer,
	BannerContainerMap,
	BannerStatus,
	BannerStatusMap
} from './components/banner/banner.stylex.js';
export type { BlockquoteProps } from './components/blockquote/blockquote.svelte';
export type { BreadcrumbsProps } from './components/breadcrumbs/breadcrumbs.svelte';
export type { BreadcrumbItemProps } from './components/breadcrumbs/breadcrumb-item.svelte';
// The `Breadcrumb*` menu aliases, as upstream's `Breadcrumbs/index.ts` publishes
// them. Same components and types as `DropdownMenu`'s, second name.
export type { DropdownMenuItemProps as BreadcrumbMenuItemProps } from './components/dropdown-menu/dropdown-menu-item.svelte';
export type { DropdownMenuCheckboxItemProps as BreadcrumbMenuCheckboxItemProps } from './components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
export type { DropdownMenuRadioGroupProps as BreadcrumbMenuRadioGroupProps } from './components/dropdown-menu/dropdown-menu-radio-group.svelte';
export type { DropdownMenuRadioItemProps as BreadcrumbMenuRadioItemProps } from './components/dropdown-menu/dropdown-menu-radio-item.svelte';
export type { DropdownMenuSubMenuProps as BreadcrumbMenuSubMenuProps } from './components/dropdown-menu/dropdown-menu-sub-menu.svelte';
export type {
	DropdownMenuOption as BreadcrumbMenuOption,
	DropdownMenuItemData as BreadcrumbMenuItemData,
	DropdownMenuDividerData as BreadcrumbMenuDividerData,
	DropdownMenuSection as BreadcrumbMenuSection
} from './components/dropdown-menu/dropdown-menu-types.js';
// The bare `BreadcrumbMenuDivider` is the component alias now — see the value
// export below.
export { default as BreadcrumbMenuDivider } from './components/dropdown-menu/dropdown-menu-divider.svelte';
// `BreadcrumbContext` itself stays module-private, as upstream's `index.ts` keeps it.
export type {
	BreadcrumbsVariant,
	BreadcrumbsVariantMap
} from './components/breadcrumbs/breadcrumbs-context.svelte.js';
export type { ButtonProps } from './components/button/button.svelte';
export type { ButtonGroupProps } from './components/button-group/button-group.svelte';
export type { CalendarProps, CalendarHandle } from './components/calendar/calendar.svelte';
// `DayOfWeekName` is published *here*, not from `utils/index.ts`, because
// upstream's `utils/index.ts` does not export it either — it reaches the package
// root through `Calendar/index.ts` alone. Named straight from `date-types.js`
// rather than forwarded through `calendar.svelte`: it is the same declaration
// and the same single root export, and a type re-export inside a `<script
// module>` trips `no-import-assign`. `ISODateString`/`DayOfWeek`/`DateRange` need
// no line here — they already reach the root through the `utils` barrel below,
// exactly as upstream's two paths do.
export type { DayOfWeekName } from './utils/date-types.js';
export type {
	CalendarDay,
	UseCalendarDaysOptions,
	UseCalendarDaysReturn
} from './components/calendar/use-calendar-days.svelte.js';
export type {
	UseCalendarConstraintsOptions,
	UseCalendarConstraintsReturn
} from './components/calendar/use-calendar-constraints.svelte.js';
export type {
	UseCalendarNavigationOptions,
	UseCalendarNavigationReturn
} from './components/calendar/use-calendar-navigation.svelte.js';
export type { CardProps } from './components/card/card.svelte';
export type {
	DateInputFormat,
	DateInputProps,
	DateInputStatus,
	DateInputStatusType
} from './components/date-input/date-input.svelte';
export type { DateInputSize } from './components/date-input/date-input.stylex.js';
// `DateRange` also reaches the root from `utils/index.ts`; upstream re-exports
// it from `DateRangeInput.tsx` as well, and both name the same declaration.
export type {
	DateRangeInputProps,
	DateRangeInputStatus,
	DateRangeInputStatusType,
	DateRangePreset
} from './components/date-range-input/date-range-input.svelte';
export type { DateRangeInputSize } from './components/date-range-input/date-range-input.stylex.js';
export type {
	DateTimeInputProps,
	DateTimeInputHourFormat,
	DateTimeInputStatus,
	DateTimeInputStatusType,
	DateTimeInputTimeIncrement,
	ISODateTimeString
} from './components/date-time-input/date-time-input.svelte';
export type { DateTimeInputSize } from './components/date-time-input/date-time-input.stylex.js';
// `CarouselHandle` describes the component *instance* here (upstream's
// `handleRef` target), the `CalendarHandle`/`TokenizerHandle` arrangement.
export type { CarouselHandle, CarouselProps } from './components/carousel/carousel.svelte';
export type { CarouselGap } from './components/carousel/carousel.stylex.js';
export type { ClickableCardProps } from './components/clickable-card/clickable-card.svelte';
export type { CenterProps } from './components/center/center.svelte';
export type {
	ChatComposerProps,
	ChatComposerStatus,
	ChatComposerDensity
} from './components/chat/chat-composer.svelte';
export type { ChatSendButtonProps } from './components/chat/chat-send-button.svelte';
export type { ChatComposerDrawerProps } from './components/chat/chat-composer-drawer.svelte';
export type {
	ChatComposerInputProps,
	ChatComposerInputHandle,
	ChatComposerToken,
	ChatComposerTrigger,
	ChatComposerTriggerItem
} from './components/chat/chat-composer-input.svelte';
export type { ChatTokenizedTextProps } from './components/chat/chat-tokenized-text.svelte';
export type { ChatMessageListProps } from './components/chat/chat-message-list.svelte';
export type { ChatMessageProps } from './components/chat/chat-message.svelte';
export type {
	ChatMessageBubbleProps,
	ChatMessageBubbleVariant
} from './components/chat/chat-message-bubble.svelte';
export type {
	ChatMessageMetadataProps,
	ChatMessageStatus
} from './components/chat/chat-message-metadata.svelte';
export type {
	ChatSystemMessageProps,
	ChatSystemMessageVariant
} from './components/chat/chat-system-message.svelte';
export type {
	ChatScrollToBottomOptions,
	UseChatStreamScrollOptions,
	UseChatStreamScrollReturn
} from './components/chat/use-chat-stream-scroll.svelte.js';
export type {
	UseChatNewMessagesOptions,
	UseChatNewMessagesReturn
} from './components/chat/use-chat-new-messages.svelte.js';
export type {
	UseChatPasteAsTokenOptions,
	UseChatPasteAsTokenReturn
} from './components/chat/use-chat-paste-as-token.js';
export type {
	UseChatComposerTokensOptions,
	UseChatComposerTokensReturn,
	TokenPortal
} from './components/chat/use-chat-composer-tokens.svelte.js';
export type { ChatMessageSender, ChatDensity } from './components/chat/chat-context.svelte.js';
export type {
	ChatToolCallsProps,
	ChatToolCallItem,
	ChatToolCallStatus
} from './components/chat/chat-tool-calls.svelte';
export type { ChatLayoutProps } from './components/chat/chat-layout.svelte';
export type { ChatLayoutScrollButtonProps } from './components/chat/chat-layout-scroll-button.svelte';
export type {
	UseSpeechRecognitionOptions,
	UseSpeechRecognitionReturn
} from './components/chat/use-speech-recognition.svelte.js';
export type {
	UseChatDictationOptions,
	UseChatDictationReturn
} from './components/chat/use-chat-dictation.svelte.js';
export type { ChatDictationButtonProps } from './components/chat/chat-dictation-button.svelte';
// `CheckboxListContext`/`CheckboxListContextValue` stay module-private, as
// upstream's `CheckboxList/index.ts` keeps them — unlike `RadioList`'s, which
// does publish its context.
export type { CheckIndicatorProps } from './components/indicator/check-indicator.svelte';
export type { CheckboxIndicatorProps } from './components/indicator/checkbox-indicator.svelte';
export type { CheckboxInputProps } from './components/checkbox-input/checkbox-input.svelte';
export type { CheckboxInputSize } from './components/checkbox-input/checkbox-input.stylex.js';
export type { CheckboxListProps } from './components/checkbox-list/checkbox-list.svelte';
export type { CheckboxListItemProps } from './components/checkbox-list/checkbox-list-item.svelte';
export type { CitationProps, CitationSource } from './components/citation/citation.svelte';
export type { CodeProps } from './components/code/code.svelte';
export type { CodeBlockProps } from './components/code-block/code-block.svelte';
export type { SyntaxToken, TokenLine } from './components/code-block/tokenizer.js';
export type { CollapsibleProps } from './components/collapsible/collapsible.svelte';
export type { CommandPaletteProps } from './components/command-palette/command-palette.svelte';
export type { CommandPaletteEmptyProps } from './components/command-palette/command-palette-empty.svelte';
export type { CommandPaletteFooterProps } from './components/command-palette/command-palette-footer.svelte';
export type { CommandPaletteGroupProps } from './components/command-palette/command-palette-group.svelte';
export type { CommandPaletteInputProps } from './components/command-palette/command-palette-input.svelte';
export type { CommandPaletteItemProps } from './components/command-palette/command-palette-item.svelte';
export type { CommandPaletteListProps } from './components/command-palette/command-palette-list.svelte';
// `useCommandPaletteContext` + `CommandPaletteContextValue` are published, as
// upstream's `CommandPalette/index.ts` publishes them — unlike `ToastContext`,
// which upstream keeps private. `setCommandPaletteContext` is not: it is the
// port's provider half, and the barrel's own convention is that a provider
// wrapper duplicating a context object stays internal.
export {
	useCommandPaletteContext,
	type CommandPaletteContextValue
} from './components/command-palette/command-palette-context.svelte.js';
// Upstream's `ComplexSelector/index.ts` publishes exactly these four types
// beside the component. `ComplexSelectorSize` comes from the style module (where
// the attrs function that indexes the size styles needs it), the same split
// `SelectorSize` and `MultiSelectorSize` take.
export type {
	ComplexSelectorProps,
	ComplexSelectorRenderState,
	ComplexSelectorStatus
} from './components/complex-selector/complex-selector.svelte';
export type { ComplexSelectorSize } from './components/complex-selector/complex-selector.stylex.js';
// The item types are upstream's aliases for `DropdownMenu`'s, re-exported under
// the ContextMenu name exactly as its own `index.ts` does.
export type { DropdownMenuItemProps as ContextMenuItemProps } from './components/dropdown-menu/dropdown-menu-item.svelte';
export type { DropdownMenuCheckboxItemProps as ContextMenuCheckboxItemProps } from './components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
export type { DropdownMenuRadioGroupProps as ContextMenuRadioGroupProps } from './components/dropdown-menu/dropdown-menu-radio-group.svelte';
export type { DropdownMenuRadioItemProps as ContextMenuRadioItemProps } from './components/dropdown-menu/dropdown-menu-radio-item.svelte';
export type { DropdownMenuSubMenuProps as ContextMenuSubMenuProps } from './components/dropdown-menu/dropdown-menu-sub-menu.svelte';
export type {
	ContextMenuProps,
	ContextMenuItemData,
	ContextMenuDividerData,
	ContextMenuSection,
	ContextMenuOption
} from './components/context-menu/context-menu.svelte';
// The bare `ContextMenuDivider` is the component alias now — see the value
// export below.
export { default as ContextMenuDivider } from './components/dropdown-menu/dropdown-menu-divider.svelte';
export type { CollapsibleGroupProps } from './components/collapsible/collapsible-group.svelte';
export type { CollapsibleGroupDensity } from './components/collapsible/collapsible-group-context.svelte.js';
export {
	useCollapsible,
	type CollapsibleConfig,
	type UseCollapsibleOptions,
	type UseCollapsibleReturn
} from './components/collapsible/use-collapsible.svelte.js';
export type {
	DialogProps,
	DialogVariant,
	DialogVariantMap,
	DialogPurpose
} from './components/dialog/dialog.svelte';
export type { DialogPosition } from './components/dialog/dialog.stylex.js';
export type { DialogHeaderProps } from './components/dialog/dialog-header.svelte';
export type { DividerProps } from './components/divider/divider.svelte';
export type {
	DropdownMenuProps,
	DropdownMenuButtonProps
} from './components/dropdown-menu/dropdown-menu.svelte';
export type { DropdownMenuItemProps } from './components/dropdown-menu/dropdown-menu-item.svelte';
export type { DropdownMenuCheckboxItemProps } from './components/dropdown-menu/dropdown-menu-checkbox-item.svelte';
export type { DropdownMenuRadioGroupProps } from './components/dropdown-menu/dropdown-menu-radio-group.svelte';
export type { DropdownMenuRadioItemProps } from './components/dropdown-menu/dropdown-menu-radio-item.svelte';
export type { DropdownMenuSubMenuProps } from './components/dropdown-menu/dropdown-menu-sub-menu.svelte';
export type {
	DropdownMenuOption,
	DropdownMenuItemData,
	DropdownMenuDividerData,
	DropdownMenuSection
} from './components/dropdown-menu/dropdown-menu-types.js';
// New at upstream 0.4.0 — the compound-mode peer of `{type: 'divider'}`, and
// what the data path renders too, so neither mode can drift from the other.
// Claiming the bare name is why the three data types took the `Data` suffix.
export { default as DropdownMenuDivider } from './components/dropdown-menu/dropdown-menu-divider.svelte';
export type { DropdownMenuDividerProps } from './components/dropdown-menu/dropdown-menu-divider.svelte';
export type { DropdownMenuContextValue } from './components/dropdown-menu/dropdown-menu-context.svelte.js';
export type { DropdownMenuSize } from './components/dropdown-menu/dropdown-menu-item.stylex.js';
export type { EmptyStateProps } from './components/empty-state/empty-state.svelte';
export type {
	FieldProps,
	FieldStatusInput,
	FieldStatusType
} from './components/field/field.svelte';
export type { FieldLabelProps } from './components/field/field-label.svelte';
export type { FieldStatusProps } from './components/field-status/field-status.svelte';
// No `FileInputMode`: upstream inlines the `'dropzone' | 'input'` union in
// `FileInputProps` and publishes no named type for it.
export type {
	FileInputProps,
	FileInputStatus,
	FileInputStatusType
} from './components/file-input/file-input.svelte';
export type { FormLayoutProps } from './components/form-layout/form-layout.svelte';
export type { GridProps } from './components/grid/grid.svelte';
export type { GridSpanProps } from './components/grid/grid-span.svelte';
export type { HStackProps } from './components/stack/hstack.svelte';
export type { HeadingProps } from './components/heading/heading.svelte';
export type { HoverCardProps } from './components/hover-card/hover-card.svelte';
export type { HoverCardLayerProps } from './components/hover-card/hover-card-layer.svelte';
export type { IconProps } from './components/icon/icon.svelte';
export type { IconButtonProps } from './components/icon-button/icon-button.svelte';
export type { ImperativeAlertDialogLayerProps } from './components/alert-dialog/imperative-alert-dialog-layer.svelte';
export type { ImperativeDialogLayerProps } from './components/dialog/imperative-dialog-layer.svelte';
// `InputClearButtonProps` is deliberately absent: upstream's `Field/index.ts`
// exports the component but keeps its props type module-local, so we do too.
export type { InputGroupProps } from './components/input-group/input-group.svelte';
export type { InputGroupSize } from './components/input-group/input-group.stylex.js';
export type { InputGroupTextProps } from './components/input-group/input-group-text.svelte';
export type { ItemProps } from './components/item/item.svelte';
export type { ItemAlign, ItemDensity } from './components/item/item.stylex.js';
export type { KbdProps } from './components/kbd/kbd.svelte';
// `ContextRenderProps` and `FixedRenderProps` are upstream's own names for the
// two `render` overloads; `LayerProps` is their union, which upstream has no
// name for because it has no component.
export type {
	ContextRenderProps,
	FixedRenderProps,
	LayerProps
} from './components/layer/layer.svelte';
export type { LayerProviderProps } from './components/layer/layer-provider.svelte';
export type { LayerToastConfig } from './components/layer/layer-context.js';
export type { LayoutHeight, LayoutProps } from './components/layout/layout.svelte';
export type { LayoutContentProps } from './components/layout/layout-content.svelte';
export type { LayoutFooterProps } from './components/layout/layout-footer.svelte';
export type { LayoutHeaderProps } from './components/layout/layout-header.svelte';
export type { LayoutPanelProps } from './components/layout/layout-panel.svelte';
export type {
	LightboxProps,
	LightboxMedia,
	LightboxMediaType
} from './components/lightbox/lightbox.svelte';
export type { LightboxLayerProps } from './components/lightbox/lightbox-layer.svelte';
export type { LinkProps } from './components/link/link.svelte';
export type { LinkProviderProps } from './components/link/link-provider.svelte';
// `LinkComponentType` is upstream's public polymorphic-link type; `LinkContext`
// and its value type stay module-private, as upstream keeps them.
export type { LinkComponentType } from './components/link/types.js';
export type {
	LinkifyPattern,
	LinkifySegment,
	UseLinkifyOptions
} from './components/link/use-linkify.js';
export type { ListProps } from './components/list/list.svelte';
// `ListStyle` is upstream's public alias for the internal `ListMarkerStyle`;
// `ListContext` itself stays module-private, as upstream keeps it.
export type {
	ListDensity,
	ListMarkerStyle as ListStyle
} from './components/list/list-context.svelte.js';
export type { ListItemProps } from './components/list/list-item.svelte';
// Markdown. Upstream's `Markdown/index.ts` publishes the component, its four
// types, and the four parser entry points; `trimStreamingArtifacts` is
// deliberately absent from it (it reaches consumers only through the
// `./Markdown/utils` subpath, which this port does not ship — see the
// per-component-subpath debt in TODO.md). `IncrementalState` is renamed
// `IncrementalParseState` on the barrel, as upstream renames it.
export type { MarkdownProps } from './components/markdown/markdown.svelte';
export type {
	MarkdownComponents,
	MarkdownInlinePlugin,
	MarkdownSource
} from './components/markdown/markdown-types.js';
export {
	parseMarkdown,
	parseMarkdownIncremental,
	createIncrementalState,
	parseInline
} from './components/markdown/parser.js';
export type {
	BlockNode,
	InlineNode,
	ListItemNode,
	TableCellNode,
	TableAlignment,
	IncrementalState as IncrementalParseState
} from './components/markdown/parser.js';
export type { MediaThemeProps } from './theme/media-theme.svelte';
export type { MetadataListProps } from './components/metadata-list/metadata-list.svelte';
export type { MetadataListItemProps } from './components/metadata-list/metadata-list-item.svelte';
export type { MoreMenuProps } from './components/more-menu/more-menu.svelte';
// Upstream's `MultiSelector/index.ts` publishes the component, its
// props/size/status-type types, the four option-shape aliases plus
// `MultiSelectorStatus`, and `useMultiCombobox`. As with `useCombobox`, the
// hook's option and return types stay module-private — upstream's `hooks.ts`
// declares both without `export`.
export type {
	MultiSelectorProps,
	MultiSelectorStatusType
} from './components/multi-selector/multi-selector.svelte';
export type { MultiSelectorSize } from './components/multi-selector/multi-selector.stylex.js';
export type {
	MultiSelectorOptionType,
	MultiSelectorOptionData,
	MultiSelectorDivider,
	MultiSelectorSection,
	MultiSelectorStatus
} from './components/multi-selector/types.js';
export type { NavHeadingMenuProps } from './components/nav-menu/nav-heading-menu.svelte';
export type { NavHeadingMenuItemProps } from './components/nav-menu/nav-heading-menu-item.svelte';
// No `NavMenuItemProps` either — it went with `NavMenuItem` in 0.3.0.

// Upstream's `NavMenu/index.ts` publishes both context objects, both readers and
// all three value types. `setNavHeadingCloseContext`/`setNavHeadingMenuContext`
// are the internal provider seams and stay module-private, as every other
// context's setter does.
export {
	NavHeadingCloseContext,
	NavHeadingMenuContext,
	useNavHeadingCloseContext,
	useNavHeadingMenuContext,
	type NavHeadingCloseContextValue,
	type NavHeadingMenuContextValue,
	type NavHeadingMenuSize
} from './components/nav-menu/nav-menu-context.svelte.js';
export type { MobileNavProps } from './components/mobile-nav/mobile-nav.svelte';
export type { MobileNavToggleProps } from './components/mobile-nav/mobile-nav-toggle.svelte';
export type { NavIconProps } from './components/nav-icon/nav-icon.svelte';
export type {
	NumberInputProps,
	NumberInputStatus,
	NumberInputStatusType
} from './components/number-input/number-input.svelte';
export type { NumberInputSize } from './components/number-input/number-input.stylex.js';
export type { OutlineProps } from './components/outline/outline.svelte';
export type { OutlineItem } from './components/outline/types.js';
// No `OutlineDensity`: upstream inlines the `'default' | 'compact'` union in
// `OutlineProps`, so a named alias would be an over-export — the class the
// `CarouselGap`/`DividerOrientation` entries in TODO.md already record.
export type {
	OverflowListProps,
	OverflowItem
} from './components/overflow-list/overflow-list.svelte';
// `OverlayScrim` is internal upstream, because `renderOverlay` is how a hook
// consumer reaches it. A Svelte hook cannot return markup, so the component is
// public here — the same move `TooltipLayer` made.
export type { OverlayProps } from './components/overlay/overlay.svelte';
export type { OverlayScrimProps } from './components/overlay/overlay-scrim.svelte';
export type {
	PaginationProps,
	PaginationVariant,
	PaginationVariantMap,
	PaginationSize
} from './components/pagination/pagination.svelte';
// `PopoverLayer` has no upstream counterpart name — `usePopover.render` is a
// function, not a component. A Svelte hook cannot return markup, so it is public
// here, the same move `HoverCardLayer`/`TooltipLayer` made.
export type { PopoverProps, PopoverTriggerRenderProps } from './components/popover/popover.svelte';
export type { PopoverLayerProps } from './components/popover/popover-layer.svelte';
export type {
	ProgressBarMark,
	ProgressBarProps
} from './components/progress-bar/progress-bar.svelte';
export type { RadioIndicatorProps } from './components/indicator/radio-indicator.svelte';
export type { RadioListProps } from './components/radio-list/radio-list.svelte';
export type { RadioListItemProps } from './components/radio-list/radio-list-item.svelte';
// Upstream publishes the `RadioListContext` object itself (like `SizeContext`),
// plus the value and size types. `setRadioListContext`/`useRadioList` are the
// internal provider/consumer seams and stay module-private.
export {
	RadioListContext,
	type RadioListContextValue,
	type RadioListSize
} from './components/radio-list/radio-list-context.svelte.js';
export type { ResizeHandleProps } from './components/resizable/resize-handle.svelte';
export type { SectionProps } from './components/section/section.svelte';
export type { SegmentedControlProps } from './components/segmented-control/segmented-control.svelte';
export type { SegmentedControlItemProps } from './components/segmented-control/segmented-control-item.svelte';
export type {
	SegmentedControlSize,
	SegmentedControlLayout
} from './components/segmented-control/segmented-control-context.svelte.js';
export type { SelectableCardProps } from './components/selectable-card/selectable-card.svelte';
// Upstream's `Selector/index.ts` publishes the component, its props/size/status
// types, `SelectorOption`, the four option-shape types, and both hooks.
// `SelectorOptionProps` is the one name it withholds — declared module-privately
// in `SelectorOption.tsx`, the same standing `SyntaxThemeProps` has — so it is
// exported from the component module but not re-exported here.
export type {
	SelectorProps,
	SelectorStatus,
	SelectorStatusType
} from './components/selector/selector.svelte';
export type { SelectorSize } from './components/selector/selector.stylex.js';
export type {
	SelectorOptionType,
	SelectorOptionData,
	SelectorDivider,
	SelectorSection
} from './components/selector/types.js';
export type { SideNavProps } from './components/side-nav/side-nav.svelte';
export type { SideNavCollapseButtonProps } from './components/side-nav/side-nav-collapse-button.svelte';
export type { SideNavHeadingProps } from './components/side-nav/side-nav-heading.svelte';
export type { SideNavItemProps } from './components/side-nav/side-nav-item.svelte';
export type { SideNavSectionProps } from './components/side-nav/side-nav-section.svelte';
export type {
	SideNavCollapseState,
	SideNavImperativeCollapseHandle
} from './components/side-nav/side-nav-collapse-context.svelte.js';
export type { SideNavRenderMode } from './components/side-nav/side-nav-render-context.svelte.js';
export type { SkeletonProps } from './components/skeleton/skeleton.svelte';
// Upstream's `Slider/index.ts` publishes all four prop types — the union plus
// its base and its two arms — and nothing else. `orientation`, `valueDisplay`
// and `marks` are written as inline unions on both sides rather than named
// aliases, so there is no extra type to publish or withhold.
export type {
	SliderProps,
	SliderBaseProps,
	SliderSingleProps,
	SliderRangeProps
} from './components/slider/slider.svelte';
export type { SpinnerProps } from './components/spinner/spinner.svelte';
// `StackAlignment` is the union `hAlign`/`vAlign` accept, and upstream publishes
// it from both `Stack/index.ts` and `Layout/index.ts`. `HStack`/`VStack` narrow
// to the two halves, so this is the only name for the widened form.
export type { StackAlignment, StackProps } from './components/stack/stack.svelte';
export type { StackItemProps } from './components/stack/stack-item.svelte';
export type { StatusDotProps } from './components/status-dot/status-dot.svelte';
export type {
	SwitchProps,
	SwitchLabelPosition,
	SwitchLabelSpacing
} from './components/switch/switch.svelte';
export type { TabProps } from './components/tab-list/tab.svelte';
export type { TabListProps } from './components/tab-list/tab-list.svelte';
export type { TabMenuProps, TabMenuOption } from './components/tab-list/tab-menu.svelte';
// Upstream's `TabList/index.ts` publishes `useTabListContext` plus the size and
// layout types. `TabListContext` itself has no Svelte value counterpart (only the
// reader is public, as `DropdownMenu`'s is). There is no orientation type to
// publish: 0.2.0 removed the `orientation` prop as a misleading no-op, and the
// type with it.
export {
	useTabListContext,
	type TabListLayout,
	type TabListSize
} from './components/tab-list/tab-list-context.svelte.js';
// Table. `TableContext` is published and `useTableContext` is not, which is
// upstream's split exactly: `Table/index.ts` exports the context object, and the
// reader — which upstream also has, in `useTableCellStyles.ts` — is deliberately
// module-public and barrel-absent. An earlier cut here had it backwards on the
// theory that a Svelte context surfaces through its reader; that theory is
// wrong, because a `Context` *is* the value counterpart and this barrel
// already publishes ten of them. `resolveContextActions` lives in
// `table-context-menu.svelte`'s module block, where upstream declares it in
// `tableContextMenu.tsx`.
export type {
	TableProps,
	TableDensity,
	TableDividers,
	TableTextOverflow
} from './components/table/table.svelte';
export type { TableRowProps } from './components/table/table-row.svelte';
export type { TableCellProps } from './components/table/table-cell.svelte';
export type { TableHeaderCellProps } from './components/table/table-header-cell.svelte';
export type { TableHeaderProps } from './components/table/table-header.svelte';
export type { TableBodyProps } from './components/table/table-body.svelte';
export type { TableFooterProps } from './components/table/table-footer.svelte';
export { TableContext, type TableContextValue } from './components/table/table-context.svelte.js';
export { resolveContextActions } from './components/table/table-context-menu.svelte';
export {
	useBaseTablePlugins,
	type BaseTablePlugins
} from './components/table/use-base-table-plugins.svelte.js';
export {
	proportional,
	pixel,
	generateColumns,
	resolveColumnWidths,
	DEFAULT_MIN_COLUMN_WIDTH
} from './components/table/column-utils.js';
// The Table plugin hooks (batch 13). Each reaches the table through the public
// `plugins` prop, so they are standalone — the seam upstream designed and the
// reason the core could land a batch ahead of them.
export {
	useTableSelection,
	type UseTableSelectionConfig
} from './components/table/plugins/selection/use-table-selection.js';
export {
	useTableSelectionState,
	type UseTableSelectionStateConfig,
	type UseTableSelectionStateResult
} from './components/table/plugins/selection/use-table-selection-state.svelte.js';
export {
	useTableRowIndex,
	type UseTableRowIndexConfig
} from './components/table/plugins/row-index/use-table-row-index.svelte.js';
export {
	useTableSortable,
	type UseTableSortableConfig,
	type TableSortDirection,
	type TableSortEntry,
	type TableSortState
} from './components/table/plugins/sortable/use-table-sortable.js';
export {
	useTableSortableState,
	type UseTableSortableStateConfig,
	type UseTableSortableStateResult,
	type TableSortComparator
} from './components/table/plugins/sortable/use-table-sortable-state.svelte.js';
export {
	useTablePagination,
	type UseTablePaginationConfig
} from './components/table/plugins/pagination/use-table-pagination.js';
export { paginateData } from './components/table/plugins/pagination/paginate-data.js';
export {
	useTableColumnSettings,
	type UseTableColumnSettingsConfig,
	type ColumnSettingsOption
} from './components/table/plugins/column-settings/use-table-column-settings.js';
export {
	useTableColumnSettingsState,
	type UseTableColumnSettingsStateConfig,
	type UseTableColumnSettingsStateReturn
} from './components/table/plugins/column-settings/use-table-column-settings-state.svelte.js';
export {
	useTableGroupedRows,
	type UseTableGroupedRowsConfig,
	type UseTableGroupedRowsResult
} from './components/table/plugins/grouped-rows/use-table-grouped-rows.svelte.js';
export {
	useTableStickyColumns,
	type UseTableStickyColumnsConfig
} from './components/table/plugins/sticky-columns/use-table-sticky-columns.js';
export {
	useTableRowExpansion,
	type UseTableRowExpansionConfig
} from './components/table/plugins/row-expansion/use-table-row-expansion.js';
// Upstream exports `useTableRowExpansionState` from `Table/index.ts` but *not*
// its config or result types — so the hook's own parameter type is unnameable by
// a consumer. Verified against both the clone and the published
// `dist/Table/index.d.ts`, and replicated: `selection`, `sortable` and
// `columnSettings` all publish their state hook's types, which is what makes
// this look like an upstream oversight rather than a decision. Recorded under
// Known debts rather than quietly fixed.
export { useTableRowExpansionState } from './components/table/plugins/row-expansion/use-table-row-expansion-state.svelte.js';
export {
	useTableColumnResize,
	type UseTableColumnResizeConfig
} from './components/table/plugins/column-resize/use-table-column-resize.js';
export {
	useTableTreeData,
	type TableTreeRowMeta,
	type UseTableTreeDataConfig
} from './components/table/plugins/tree/use-table-tree-data.js';
export {
	useTableTreeState,
	type UseTableTreeStateConfig,
	type UseTableTreeStateResult
} from './components/table/plugins/tree/use-table-tree-state.svelte.js';
// `TableRowStatusColor` is declared in the style module here (the dot's colour
// is a `stylex.create` function style, and StyleX may only be imported from a
// `.ts`) and re-exported through the hook, so this list matches upstream's
// `Table/index.ts` name for name: upstream publishes `useTableRowStatus`,
// `UseTableRowStatusConfig` and `TableRowStatus` only — `TableRowStatusColor` is
// module-public and unpublished on **both** sides, so it stays off this barrel.
export {
	useTableRowStatus,
	type UseTableRowStatusConfig,
	type TableRowStatus
} from './components/table/plugins/row-status/use-table-row-status.js';
export {
	useTableFiltering,
	toSearchFilters,
	type UseTableFilteringConfig,
	type TableFilterState,
	type TableFilterVariant,
	type TableFilterValue,
	// Relocated out of `table-types.ts` to the plugin that declares it upstream.
	// `TableColumn.filter` imports it back, exactly as upstream's `Table/types.ts`
	// does — type-only both ways, so the cycle is erased.
	type TableFilterFieldRef
} from './components/table/plugins/filtering/use-table-filtering.js';
// `UseTableFilterStateResult` is on upstream's `plugins/filtering/index.ts` but
// *not* on its `Table/index.ts`, so it never reaches upstream's package API.
// The asymmetry is preserved; it is the odd one out among the four state hooks.
export { useTableFilterState } from './components/table/plugins/filtering/use-table-filter-state.svelte.js';
// PowerSearch. The *types* landed a batch early — `UseTableFilteringConfig.searchConfig`
// is a required `PowerSearchConfig`, and a public prop whose type has no public
// name cannot be written down by a consumer, the same argument that published
// `TableFilterFieldRef`. Batch 14 landed the component and the remaining seven
// type names alongside it.
//
// Enumerated, not `export type *`, and that stays deliberate now that the file is
// complete: `PowerSearchAuxData` and `PowerSearchItem` are module-public upstream
// and absent from its barrel, so a wildcard would publish them the moment they
// landed with no diff to review — which is exactly what happened in batch 14, and
// exactly what this list caught. Listing the names is also what makes the barrel
// auditable against upstream's `PowerSearch/index.ts` line by line.
export { default as PowerSearch } from './components/power-search/power-search.svelte';
export type {
	PowerSearchProps,
	PowerSearchSize
} from './components/power-search/power-search.svelte';
export { default as PowerSearchToken } from './components/power-search/power-search-token.svelte';
export { default as PowerSearchFilterEditor } from './components/power-search/power-search-filter-editor.svelte';
export { resolveOperatorLabel } from './components/power-search/resolve-operator-label.js';
export {
	createPowerSearchConfig,
	usePowerSearchConfig
} from './components/power-search/use-power-search-config.svelte.js';
export type {
	FieldDefinition,
	InferData
} from './components/power-search/use-power-search-config.svelte.js';
export type {
	CustomOperatorValue,
	DateAbsoluteOperatorValue,
	DateRangeFilterPreset,
	DateRangeOperatorValue,
	DateRelativeOperatorValue,
	DateTimeRange,
	DateTimeRangePart,
	EmptyOperatorValue,
	EntityListOperatorValue,
	EnumItem,
	EnumListOperatorValue,
	EnumOperatorValue,
	FilterValue,
	FilterValueCustom,
	FilterValueDateAbsolute,
	FilterValueDateRange,
	FilterValueDateRelative,
	FilterValueEmpty,
	FilterValueEntityList,
	FilterValueEnum,
	FilterValueEnumList,
	FilterValueFloat,
	FilterValueInteger,
	FilterValueNested,
	FilterValueString,
	FilterValueStringList,
	FilterValueTime,
	FloatOperatorValue,
	IntegerOperatorValue,
	NestedOperatorValue,
	OperatorTokenizationConfig,
	OperatorValue,
	PartialFilter,
	PowerSearchChangeType,
	PowerSearchComponentOverride,
	PowerSearchComponents,
	PowerSearchConfig,
	PowerSearchEditorProps,
	PowerSearchEntity,
	PowerSearchField,
	PowerSearchFilter,
	PowerSearchHandle,
	PowerSearchOperator,
	PowerSearchOperatorBase,
	PowerSearchOperatorWithI18nKey,
	PowerSearchOperatorWithLabel,
	PowerSearchTokenProps,
	RelativeDateFilterPreset,
	StringListOperatorValue,
	StringOperatorValue,
	TimeOperatorValue
} from './components/power-search/types.js';
export type {
	TableColumn,
	TableColumnAlign,
	TableVerticalAlign,
	ColumnWidth,
	ProportionalWidth,
	PixelWidth,
	TablePlugin,
	TableContextAction,
	TableContextActions,
	TableRenderProps,
	HeaderRowRenderProps,
	HeaderCellRenderProps,
	BodyRowRenderProps,
	BodyCellRenderProps,
	ScrollWrapperRenderProps,
	BaseTableProps,
	TableSortableColumnConfig,
	// Published for the same reason `BaseTablePlugins` is, and the batch-close
	// surface sweep is what made the inconsistency visible: both are Svelte-only
	// names with no upstream counterpart, and both sit on a **published**
	// signature. `TablePlugin.transformTableContext` returns this, so a consumer
	// writing a plugin cannot otherwise write the return type down — the same
	// "a public prop whose type has no public name" argument that published
	// `TableFilterFieldRef`. Publishing one of the pair and withholding the other
	// was the one option that is not defensible.
	TableContextProvider
} from './components/table/table-types.js';
export type { TextProps } from './components/text/text.svelte';
export type {
	TextAreaProps,
	TextAreaStatus,
	TextAreaStatusType
} from './components/text-area/text-area.svelte';
export type { TextAreaSize } from './components/text-area/text-area.stylex.js';
export type {
	TextInputProps,
	TextInputType,
	TextInputStatus,
	TextInputStatusType
} from './components/text-input/text-input.svelte';
export type { TextInputSize } from './components/text-input/text-input.stylex.js';
export type { ThumbnailProps } from './components/thumbnail/thumbnail.svelte';
export type {
	TimeInputProps,
	TimeInputHourFormat,
	TimeInputStatus,
	TimeInputStatusType
} from './components/time-input/time-input.svelte';
export type { TimeInputSize } from './components/time-input/time-input.stylex.js';
export type { TimestampProps } from './components/timestamp/timestamp.svelte';
export type { ToastProps } from './components/toast/toast.svelte';
export type { ToastViewportProps } from './components/toast/toast-viewport.svelte';
// `ToastContext`/`ToastContextValue`/`ToastEntry` stay private, as upstream's
// `Toast/index.ts` leaves them.
export type {
	ToastType,
	ToastPosition,
	ToastCollisionBehavior,
	ToastDismissReason,
	ToastOptions,
	ToastDismissFn,
	ShowToastFn
} from './components/toast/types.js';
export type { ToggleButtonProps } from './components/toggle-button/toggle-button.svelte';
export type {
	ToggleButtonGroupProps,
	ToggleButtonGroupSingleProps,
	ToggleButtonGroupMultipleProps
} from './components/toggle-button/toggle-button-group.svelte';
export type { TokenProps } from './components/token/token.svelte';
// Upstream's `Tokenizer/index.ts` publishes the component and seven types.
// `TokenizerHandle` describes the component *instance* here (upstream's
// `handleRef` target), since Svelte's counterpart to `useImperativeHandle` is
// `bind:this` rather than a ref prop.
export type {
	TokenizerProps,
	TokenizerOverflowBehavior,
	TokenizerChange,
	TokenizerHandle,
	TokenizerStatus,
	TokenizerStatusType
} from './components/tokenizer/tokenizer.svelte';
export type { TokenizerSize } from './components/tokenizer/tokenizer.stylex.js';
export type { ToolbarProps, ToolbarSize } from './components/toolbar/toolbar.svelte';
export type { TokenColor, TokenColorMap, TokenSize } from './components/token/token.stylex.js';
// `TreeListItem`/`TreeListBranches` and their prop types are internal on both
// sides — upstream's `TreeList/index.ts` publishes only the component and these
// three types.
export type { TreeListProps } from './components/tree-list/tree-list.svelte';
export type {
	TreeListDensity,
	TreeListItemData,
	TreeListVariant,
	TreeListVariantMap
} from './components/tree-list/tree-list-types.js';
export type { TopNavProps } from './components/top-nav/top-nav.svelte';
export type { TopNavHeadingProps } from './components/top-nav/top-nav-heading.svelte';
export type { TopNavItemProps } from './components/top-nav/top-nav-item.svelte';
export type { TopNavMenuProps, TopNavMenuItemData } from './components/top-nav/top-nav-menu.svelte';
export type { TopNavMegaMenuProps } from './components/top-nav/top-nav-mega-menu.svelte';
export type { TopNavMegaMenuItemProps } from './components/top-nav/top-nav-mega-menu-item.svelte';
export type { TopNavMegaMenuFeaturedCardProps } from './components/top-nav/top-nav-mega-menu-featured-card.svelte';
export type { TopNavRenderMode } from './components/top-nav/top-nav-render-context.svelte.js';
export type { TooltipProps } from './components/tooltip/tooltip.svelte';
export type { TooltipLayerProps } from './components/tooltip/tooltip-layer.svelte';
// Upstream's `Typeahead/index.ts` publishes the shared item/source types, the
// static-source factory and its options, `BaseTypeahead` + its props, the styled
// `Typeahead` + its props/size/status types, and `TypeaheadItem` + its props.
export type { SearchableItem, SearchSource } from './components/typeahead/types.js';
export type { CreateStaticSourceOptions } from './components/typeahead/create-static-source.js';
export type { BaseTypeaheadProps } from './components/typeahead/base-typeahead.svelte';
export type {
	TypeaheadProps,
	TypeaheadStatus,
	TypeaheadStatusType
} from './components/typeahead/typeahead.svelte';
export type { TypeaheadSize } from './components/typeahead/typeahead.stylex.js';
export type { TypeaheadItemProps } from './components/typeahead/typeahead-item.svelte';
export type { VStackProps } from './components/stack/vstack.svelte';
export type { VisuallyHiddenProps } from './components/visually-hidden/visually-hidden.svelte';

export type {
	AspectRatioFit,
	AspectRatioShape
} from './components/aspect-ratio/aspect-ratio.stylex.js';
export { resolveSize, type AvatarSize } from './components/avatar/avatar.stylex.js';
export {
	useAvatarGroup,
	type AvatarGroupContextValue
} from './components/avatar/avatar-context.svelte.js';
export type {
	AvatarStatusDotVariant,
	AvatarStatusDotVariantMap
} from './components/avatar/avatar-status-dot.stylex.js';
export type { BadgeVariant, BadgeVariantMap } from './components/badge/badge.stylex.js';
export type {
	ButtonSize,
	ButtonVariant,
	ButtonVariantMap
} from './components/button/button.stylex.js';
export type { CardVariant } from './components/card/card.stylex.js';
export type { CenterAxis } from './components/center/center.stylex.js';
// No `CodeBlockSize`/`CodeBlockContainer` here: upstream inlines both unions in
// `CodeBlockProps` and publishes no named type for either, unlike `Code`'s
// `CodeColor`/`CodeSize`. The aliases exist inside `code-block.stylex.ts` for
// the attrs signatures and stay module-private, as upstream's do.
export type { CodeColor, CodeSize } from './components/code/code.stylex.js';
export type {
	FieldStatusVariant,
	FieldStatusVariantMap
} from './components/field-status/field-status.stylex.js';
export type { InputSize, InputStatus, InputStatusType } from './components/field/types.js';
// `SectionDivider` stays module-private: upstream types `dividers` inline with no
// named export, so publishing the name would be an invented surface.
export type { SectionVariant, SectionVariantMap } from './components/section/section.stylex.js';
export {
	inputStatusBorderStyles,
	inputStatusFocusStyles,
	inputStatusFocusWithinStyles,
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from './components/field/input-styles.stylex.js';
export {
	setFormLayoutContext,
	useFormLayout,
	type FormLayoutDirection
} from './components/form-layout/form-layout-context.svelte.js';
// Upstream's `InputGroup/index.ts` publishes `useInputGroup` and the value type,
// but not the context object or its provider — `setInputGroupContext` is an
// internal seam `InputGroup` imports directly, so it stays out of the barrel.
export {
	useInputGroup,
	type InputGroupContextValue
} from './components/input-group/input-group-context.svelte.js';
// Upstream's `Link/index.ts` publishes `useLinkComponent` and `useLinkify` (and
// the types above), but not the `LinkContext` object or its provider setter —
// `setLinkContext` is the internal seam `LinkProvider` uses.
// Upstream publishes `useDropdownMenuContext` and, from 0.2.0, the
// `DropdownMenuContext` object itself — "public so consumers can build custom
// menu items". Both are published here; the `Context` object is the value
// counterpart, as it is for `AppShellMobileContext` and `ThemeContext`.
export {
	DropdownMenuContext,
	useDropdownMenuContext
} from './components/dropdown-menu/dropdown-menu-context.svelte.js';
export {
	useLightbox,
	type UseLightboxOptions,
	type UseLightboxReturn,
	type LightboxTriggerProps
} from './components/lightbox/use-lightbox.svelte.js';
// Upstream's `Dialog/index.ts` and `AlertDialog/index.ts` publish each hook with
// its return type and nothing else — the options bags are `Omit`s declared
// without `export` on both sides, so they stay module-private here too.
export {
	useImperativeDialog,
	type ImperativeDialogReturn
} from './components/dialog/use-imperative-dialog.svelte.js';
export {
	useImperativeAlertDialog,
	type ImperativeAlertDialogReturn
} from './components/alert-dialog/use-imperative-alert-dialog.svelte.js';
// Upstream's `Selector/index.ts` publishes both hooks and *neither* option nor
// return type — `hooks.ts` declares all four without `export`. Ours match: the
// types stay module-private. Every other ported hook publishes its pair because
// upstream's barrel does; these two are the first where it does not, so the
// convention does not reach them.
export { useCombobox } from './components/selector/use-combobox.svelte.js';
export { useSelectedItemOffset } from './components/selector/use-selected-item-offset.svelte.js';
// Same standing: upstream's `MultiSelector/hooks.ts` declares its option and
// return types without `export`, and `MultiSelector/index.ts` publishes only the
// function.
export { useMultiCombobox } from './components/multi-selector/use-multi-combobox.svelte.js';
export { useLinkComponent } from './components/link/link-context.svelte.js';
export { useLinkify } from './components/link/use-linkify.js';
// Upstream's `Toast/index.ts` publishes `useToast` but neither `ToastContext`
// nor its value type, so only the hook is public here.
export { useToast } from './components/toast/use-toast.svelte.js';
export {
	setMetadataListContext,
	useMetadataList,
	type MetadataListContextValue,
	type MetadataListLabelConfig
} from './components/metadata-list/metadata-list-context.svelte.js';
export type { MetadataListColumns } from './components/metadata-list/metadata-list.stylex.js';
export type {
	DividerOrientation,
	DividerVariant,
	DividerVariantMap
} from './components/divider/divider.stylex.js';
export type { GridAlignment, GridColumns } from './components/grid/grid.stylex.js';
export type { HeadingLevel, HeadingType } from './components/heading/heading.stylex.js';
export type { IconColor, IconSize } from './components/icon/icon.stylex.js';
export {
	addAnchorName,
	readAnchorNames,
	removeAnchorName,
	writeAnchorNames
} from './components/layer/anchor-name.js';
export { layerAnimations } from './components/layer/layer-animations.stylex.js';
// The two `Layout` contexts upstream publishes from `Layout/index.ts`. The
// slots context is not among them there, and is not here either.
export {
	LayoutAreaContext,
	setLayoutAreaContext,
	useLayoutArea,
	type LayoutArea
} from './components/layout/layout-area-context.svelte.js';
export {
	LayoutDividerContext,
	setLayoutDividerContext,
	useLayoutDivider,
	type LayoutDividerContextValue
} from './components/layout/layout-divider-context.svelte.js';
export {
	getPositionTryFallbacks,
	useLayer,
	type ContextLayerOptions,
	type ContextLayerReturn,
	type FixedLayerOptions,
	type FixedLayerReturn,
	type LayerAlignment,
	type LayerPlacement
} from './components/layer/use-layer.svelte.js';
export {
	getExtendedIcon,
	getIcon,
	getIconRegistry,
	registerIcons,
	resetIcons,
	type ExtendedIconName,
	type IconName,
	type IconRegistry,
	type IconRegistrySource,
	type IconType
} from './components/icon/icon-registry.js';
// Upstream keeps `useIcon` in `Icon/` and publishes it from `Icon/index.ts`,
// not from its hooks barrel — so it is published here and absent from
// `hooks/index.ts` for the same reason. No `UseIconReturn`: upstream names no
// return type for the hook anywhere, so the interface stays module-public and
// off the barrel — the `focusableSelector` rule.
export { useIcon } from './components/icon/use-icon.svelte.js';

// The indicator layer, new at upstream 0.4.0. `useIndicator` is published here
// rather than from `hooks/index.ts` for the same reason `useIcon` is: upstream
// publishes it from `Indicator/index.ts`.
//
// `UseCoreIndicatorReturn` / `UseAnyIndicatorReturn` have **no upstream
// counterpart** — upstream's hook returns the component itself, because React
// re-runs the body when the theme changes. Here the value has to stay live
// across a `<Theme>` swap, so it comes back on an object with a `current`
// getter, and the two shapes of that object are named so a consumer can type a
// variable holding one. Same standing as the other `Use*Return` interfaces this
// port adds for the identical reason.
export { defaultIndicators, getIndicator } from './components/indicator/indicator-registry.js';
export { useIndicator } from './components/indicator/use-indicator.svelte.js';
export { indicatorScope } from './components/indicator/indicator.markers.stylex.js';
export type {
	CoreIndicatorName,
	IndicatorRegistrySource
} from './components/indicator/indicator-registry.js';
export type {
	UseAnyIndicatorReturn,
	UseCoreIndicatorReturn
} from './components/indicator/use-indicator.svelte.js';
export type {
	IndicatorComponent,
	IndicatorFamily,
	IndicatorFamilyMap,
	IndicatorMap,
	IndicatorName,
	IndicatorNameOfFamily,
	IndicatorPosition,
	IndicatorProps,
	IndicatorRegistry,
	IndicatorSize,
	IndicatorState
} from './components/indicator/types.js';
export type {
	ProgressBarFillVariant,
	ProgressBarVariant,
	ProgressBarVariantMap
} from './components/progress-bar/progress-bar.stylex.js';
export {
	useOutlineFromDOM,
	type OutlineFromDOMState
} from './components/outline/use-outline-from-dom.svelte.js';
// Landed with batch 11's markdown parser, which is what they were deferred on.
export { parseOutlineFromMarkdown } from './components/outline/parse-outline-from-markdown.js';
export {
	useOutlineFromMarkdown,
	type OutlineFromMarkdownState
} from './components/outline/use-outline-from-markdown.svelte.js';
export {
	useOverlay,
	type OverlayContainerProps,
	type UseOverlayOptions,
	type UseOverlayResult
} from './components/overlay/use-overlay.svelte.js';
export {
	usePopover,
	type UsePopoverOptions,
	type UsePopoverReturn
} from './components/popover/use-popover.svelte.js';
export type {
	OverlayAlign,
	OverlayPosition,
	OverlayScrimMode,
	OverlayShowOn
} from './components/overlay/overlay-scrim.stylex.js';
export {
	useResizable,
	type ResizableConfig,
	type ResizableProps,
	type ResizableRegion,
	type ResizableRegionConfig,
	type UseResizableMultiConfig,
	type UseResizableSingleConfig
} from './components/resizable/use-resizable.svelte.js';
export type { SkeletonRadius } from './components/skeleton/skeleton.stylex.js';
export type { SpinnerShade, SpinnerSize } from './components/spinner/spinner.stylex.js';
export type {
	StatusDotVariant,
	StatusDotVariantMap
} from './components/status-dot/status-dot.stylex.js';
export type {
	StackCrossAlignment,
	StackDirection,
	StackMainAlignment,
	StackWrap
} from './components/stack/stack.stylex.js';
export type {
	StackItemCrossAlignSelf,
	StackItemSize
} from './components/stack/stack-item.stylex.js';
// `TextColorMap` is the augmentation seam behind `TextColor`, new in 0.3.0 and
// on upstream's barrel twice over (`index.ts` re-exports it from `./Text`, and
// `theme/index.ts` republishes it beside `BuiltinTextColor`).
export type {
	BuiltinTextColor,
	BuiltinTextType,
	TextColor,
	TextColorMap,
	TextDisplay,
	TextJustify,
	TextSize,
	TextType,
	TextWeight,
	TextWrap,
	WordBreak
} from './components/text/text.stylex.js';
// The two prose-theming types travel with the Text unit, as upstream's
// `Text/index.ts` publishes them — not with `./theme`, whose barrel does not
// carry them either. Both are declared in `theme/types.ts` on both sides.
export type { ProseElement, TextXStyleAllowed } from './theme/types.js';
export type {
	AbsoluteTimestampFormat,
	TimestampFormat
} from './components/timestamp/timestamp-format.js';
// The tooltip-entry vocabulary travels with the Timestamp unit, as upstream's
// `Timestamp/index.ts` publishes it from `tooltipEntries.ts`. `TimestampTooltipLine`
// stays module-public and off the barrel, as upstream leaves it: it is the shape
// `formatTooltipLines` returns, and nothing in the props surface names it.
export type {
	TimestampTooltipEntry,
	TimestampTooltipFormat
} from './components/timestamp/tooltip-entries.js';
export {
	useHoverCard,
	type HoverCardFocusTrigger,
	type HoverCardOptions,
	type HoverCardReturn
} from './components/hover-card/use-hover-card.svelte.js';
export {
	useTooltip,
	type TooltipFocusTrigger,
	type TooltipOptions,
	type TooltipReturn
} from './components/tooltip/use-tooltip.svelte.js';

// Style utilities, so a component can take stack or container layout without
// being wrapped in one. These are upstream's four exactly — `stackAttrs` and
// `stackItemAttrs` are ours, built on `stack()`/`stackItem()` to fold in the
// padding and overflow `Stack.tsx` keeps to itself, and stay internal for the
// same reason every other component's `*Attrs` helper does.
export {
	container,
	type ContainerComponent,
	type ContainerOptions,
	type SpacingToken
} from './internal/container.stylex.js';
export { stack, type StackOptions } from './components/stack/stack.stylex.js';
export { stackItem, type StackItemOptions } from './components/stack/stack-item.stylex.js';
export { EDGE_COMP_ATTR, edgeCompSlot } from './internal/edge-compensation.stylex.js';

export {
	setButtonGroupContext,
	SizeContext,
	setSizeContext,
	useButtonGroup,
	useSize,
	type ButtonGroupContextValue,
	type ButtonGroupOrientation,
	type ElementSize
} from './internal/contexts.svelte.js';

export {
	InteractiveRoleContext,
	setInteractiveRoleContext,
	useInteractiveRoleContext
} from './interactive-role-context.svelte.js';

// Hooks — re-exported at the root as upstream's index does, and available on
// their own as `@astryx-svelte/core/hooks`.
export * from './hooks/index.js';

// Pure helpers — re-exported at the root as upstream's index does
// (`export * from './utils'`), and available on their own as
// `@astryx-svelte/core/utils`.
export * from './utils/index.js';

// i18n — re-exported at the root as upstream's index does (`export * from './i18n'`),
// and available on its own as `@astryx-svelte/core/i18n`.
export {
	InternationalizationContext,
	InternationalizationProvider,
	getLocaleDirection,
	useDirection,
	useTranslator,
	type InternationalizationProviderProps,
	type Catalog,
	type InternationalizationContextValue,
	type Locale,
	type MessageEntry,
	type MessagesByLocale,
	type Overrides,
	type Translator,
	type TranslatorFn
} from './i18n/index.js';

// The three upstream `utils/` modules that landed under `internal/` before
// `src/lib/utils/` existed. They are public in upstream's `utils/index.ts`, so
// they are re-exported here rather than left unreachable.
export {
	themeProps,
	themeDataAttributes,
	type ClassProps,
	type ClassValue,
	type ThemeDataAttributes,
	type ThemeProps
} from './internal/theme-props.js';
export { observeResize, unobserveResize } from './internal/shared-resize-observer.js';
export {
	NAMESPACE,
	classPrefix,
	cssVar,
	cssVarNamespace,
	dataAttr,
	dataAttrNamespace,
	stableClassName
} from './internal/naming.js';
export type { BaseProps } from './base-props.js';
// A Svelte-only name, like `LayerProps` and the other render-split types: it is
// what `xstyle` is typed as, and upstream's counterpart (`StyleXStyles`) is
// publicly importable from `@stylexjs/stylex`. Ten published types name it —
// `BaseProps`, `ButtonProps`, `LayerProps`, `PopoverLayerProps`,
// `BaseTypeaheadProps`, the `usePopover`/`useTooltip`/`useHoverCard` option and
// return types among them — so without it a consumer wrapping any of them cannot
// write `xstyle?: …` at all.
export type { StyleArg } from './internal/sx.js';
// `Elevation` is module-public and **barrel-absent upstream** — `utils/index.ts`
// publishes `SizeValue` from that file and nothing else — so it stays unpublished
// here too, the `focusableSelector` rule. `SizeValue` and `SpacingStep` are both
// upstream barrel names and stay.
export type { SizeValue, SpacingStep } from './internal/types.js';
