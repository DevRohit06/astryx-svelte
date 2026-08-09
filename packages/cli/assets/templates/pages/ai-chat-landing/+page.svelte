<!--
	Ported from upstream's `assets/templates/pages/ai-chat-landing/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons, which has no Svelte build, so every icon is a
	registry substitution: `MagnifyingGlassIcon` → `search` and `ClockIcon` →
	`clock` are true matches; the rest are stand-ins with no registry glyph —
	`Cog6ToothIcon` → `wrench`, `AtSymbolIcon` → `moreHorizontal`, `SparklesIcon`
	→ `info`, `PencilSquareIcon` → `copy`, `CodeBracketIcon` → `chevronsRight`,
	`LockClosedIcon` → `eyeSlash`, `LightBulbIcon` → `warning`. `SparklesIcon`
	and `LightBulbIcon` land on `info`/`warning` purely for shape; both read as
	status glyphs they are not. Retires with the icon registry (TODO.md).

	Upstream's three `CSSProperties` consts become `style` strings under the same
	names and key order, because Svelte's `style` prop is a string.

	`mentionTrigger`/`commandTrigger`/`composerTriggers` are module-scope consts
	upstream; here they move into the instance script, because `renderItem` is a
	`Snippet` and a snippet only exists inside the component. Snippet
	declarations compile to hoisted bindings, so the consts still read them.

	`ChatComposerInput`'s `handleRef` prop does not exist in this port — the
	component instance *is* the handle, so `bind:this` replaces the ref object.
	`shouldFocusComposerRef` holds no rendered value, so it is a plain `let`.
-->
<script lang="ts">
	import {
		ChatComposer,
		ChatComposerDrawer,
		ChatComposerInput,
		ChatDictationButton,
		ClickableCard,
		DropdownMenu,
		DropdownMenuItem,
		Grid,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		Text,
		ToggleButton,
		ToggleButtonGroup,
		Token,
		TypeaheadItem,
		VStack,
		createStaticSource,
		useChatDictation,
		type ChatComposerInputHandle,
		type ChatComposerTrigger,
		type SearchableItem
	} from '@astryx-svelte/core';

	// Fill the content area so the greeting and composer stay vertically centered.
	const pageStyle = 'min-height: 100%;';
	const composerInput = 'min-height: 84px;';
	const categories = 'padding-inline: var(--spacing-3);';

	// Suggestion cards shown once a category is selected.
	const CATEGORY_SUGGESTIONS: Record<
		string,
		Array<{ heading: string; body: string; prompt: string }>
	> = {
		writing: [
			{
				heading: 'Draft a professional email',
				body: 'Compose a clear, polished email for any audience',
				prompt: 'Help me draft a professional email'
			},
			{
				heading: 'Improve my writing',
				body: 'Enhance the clarity, tone, and flow of my text',
				prompt: 'Review and improve the following text:'
			},
			{
				heading: 'Create a project proposal',
				body: 'Write a proposal with goals, timeline, and deliverables',
				prompt: 'Help me write a project proposal for'
			},
			{
				heading: 'Summarize a document',
				body: 'Condense a long document into key takeaways',
				prompt: 'Summarize the following document into key points:'
			}
		],
		coding: [
			{
				heading: 'Debug my code',
				body: 'Find and fix issues in a code snippet',
				prompt: 'Help me debug the following code:'
			},
			{
				heading: 'Write a function',
				body: 'Generate a well-typed function with error handling',
				prompt: 'Write a function that'
			},
			{
				heading: 'Explain this code',
				body: 'Break down complex code into understandable pieces',
				prompt: 'Explain what the following code does:'
			},
			{
				heading: 'Review my pull request',
				body: 'Check for bugs, performance, and best practices',
				prompt: 'Review this code for bugs and improvements:'
			}
		],
		research: [
			{
				heading: 'Compare options',
				body: 'Analyze pros and cons of different approaches',
				prompt: 'Compare the pros and cons of'
			},
			{
				heading: 'Explain a concept',
				body: 'Break down a complex topic in simple terms',
				prompt: 'Explain the concept of'
			},
			{
				heading: 'Find best practices',
				body: 'Research standards and recommended approaches',
				prompt: 'What are the best practices for'
			},
			{
				heading: 'Summarize findings',
				body: 'Compile research into a structured overview',
				prompt: 'Summarize the key findings on'
			}
		],
		creative: [
			{
				heading: 'Brainstorm ideas',
				body: 'Generate creative concepts for a project',
				prompt: 'Brainstorm ideas for'
			},
			{
				heading: 'Write a story',
				body: 'Create an engaging narrative with characters',
				prompt: 'Write a short story about'
			},
			{
				heading: 'Design a concept',
				body: 'Explore product or visual design ideas',
				prompt: 'Help me design a concept for'
			},
			{
				heading: 'Create a tagline',
				body: 'Craft a memorable phrase for a brand or product',
				prompt: 'Create a catchy tagline for'
			}
		]
	};

	// Category filters, shared by the toggle group and the composer mode menu.
	const CATEGORIES = [
		{ key: 'writing', label: 'Writing', icon: 'copy' },
		{ key: 'coding', label: 'Coding', icon: 'chevronsRight' },
		{ key: 'research', label: 'Research', icon: 'search' },
		{ key: 'creative', label: 'Creative', icon: 'warning' }
	] as const;

	// Composer mode menu: categories plus special modes.
	const MODE_OPTIONS = [
		{ key: 'auto', label: 'Auto', icon: 'info' },
		...CATEGORIES,
		{ key: 'sensitive', label: 'Sensitive', icon: 'eyeSlash' },
		{ key: 'deep', label: 'Deep Mode', icon: 'clock' }
	] as const;

	// Modes that insert a composer token instead of switching the active category.
	const TOKEN_MODES: Record<string, string> = {
		sensitive: '/sensitive',
		deep: '/deep-mode'
	};

	// Composer trigger data: @ mentions and / commands.
	const MENTION_ITEMS: SearchableItem<{ role: string }>[] = [
		{ id: 'cindy', label: 'Cindy Zhang', auxiliaryData: { role: 'Design Systems' } },
		{ id: 'alex', label: 'Alex Johnson', auxiliaryData: { role: 'Frontend' } },
		{ id: 'sam', label: 'Sam Rivera', auxiliaryData: { role: 'Backend' } },
		{ id: 'jordan', label: 'Jordan Lee', auxiliaryData: { role: 'Product' } },
		{ id: 'taylor', label: 'Taylor Kim', auxiliaryData: { role: 'Design' } },
		{ id: 'morgan', label: 'Morgan Chen', auxiliaryData: { role: 'Infrastructure' } }
	];

	const COMMAND_ITEMS: SearchableItem<{ description: string }>[] = [
		{
			id: 'summarize',
			label: 'summarize',
			auxiliaryData: { description: 'Summarize the conversation' }
		},
		{
			id: 'translate',
			label: 'translate',
			auxiliaryData: { description: 'Translate text to another language' }
		},
		{
			id: 'search',
			label: 'search',
			auxiliaryData: { description: 'Search the web or documents' }
		},
		{
			id: 'code',
			label: 'code',
			auxiliaryData: { description: 'Generate or explain code' }
		},
		{
			id: 'help',
			label: 'help',
			auxiliaryData: { description: 'Show available commands' }
		}
	];

	const mentionTrigger: ChatComposerTrigger = {
		character: '@',
		searchSource: createStaticSource(MENTION_ITEMS),
		renderItem: mentionItem,
		onSelect: (item) => ({
			value: `@${item.id}`,
			label: item.label,
			variant: 'blue'
		})
	};

	const commandTrigger: ChatComposerTrigger = {
		character: '/',
		searchSource: createStaticSource(COMMAND_ITEMS),
		renderItem: commandItem,
		onSelect: (item) => ({
			value: `/${item.label}`,
			label: `/${item.label}`,
			variant: 'yellow'
		})
	};

	const composerTriggers = [mentionTrigger, commandTrigger];

	// Main component

	let mode = $state<string | null>('auto');
	let category = $state<string | null>(null);
	let attachments = $state<string[]>([
		'project_brief.pdf',
		'wireframes_v2.fig',
		'api_spec.yaml',
		'user_research.csv',
		'brand_guidelines.pdf'
	]);
	let isModeMenuOpen = $state(false);
	let composerInputRef = $state<ChatComposerInputHandle | null>(null);
	let shouldFocusComposer = false;
	const dictation = useChatDictation(() => ({ inputRef: () => composerInputRef }));

	const activeMode = $derived(MODE_OPTIONS.find((m) => m.key === mode) ?? MODE_OPTIONS[0]);
	const suggestions = $derived(category ? CATEGORY_SUGGESTIONS[category] : null);

	// The composer's imperative insert methods mutate the DOM without emitting a
	// change, so dispatch an input event to sync its value and clear the placeholder.
	const syncComposerValue = () => {
		document.activeElement?.dispatchEvent(new Event('input', { bubbles: true }));
	};

	const applySuggestion = (prompt: string) => {
		const input = composerInputRef;
		if (!input) {
			return;
		}
		input.focus();
		if (document.activeElement) {
			window.getSelection()?.selectAllChildren(document.activeElement);
		}
		input.insertText(prompt);
		syncComposerValue();
	};

	const insertMention = (item: (typeof MENTION_ITEMS)[number]) => {
		const input = composerInputRef;
		if (!input) {
			return;
		}
		input.focus();
		if (document.activeElement) {
			const sel = window.getSelection();
			sel?.selectAllChildren(document.activeElement);
			sel?.collapseToEnd();
		}
		input.insertToken({
			value: `@${item.id}`,
			label: item.label,
			variant: 'blue'
		});
		syncComposerValue();
	};

	const insertModeToken = (label: string) => {
		composerInputRef?.focus();
		composerInputRef?.insertToken({
			value: label,
			label,
			variant: 'orange'
		});
		syncComposerValue();
	};
</script>

{#snippet mentionItem(item: SearchableItem)}
	<TypeaheadItem {item} description={(item.auxiliaryData as { role: string })?.role} />
{/snippet}

{#snippet commandItem(item: SearchableItem)}
	<TypeaheadItem
		{item}
		description={(item.auxiliaryData as { description: string })?.description}
	/>
{/snippet}

{#snippet composerInputSlot()}
	<ChatComposerInput
		bind:this={composerInputRef}
		triggers={composerTriggers}
		style={composerInput}
		onFiles={(files) => (attachments = [...attachments, ...files.map((f) => f.name)])}
	/>
{/snippet}

{#snippet drawer()}
	<ChatComposerDrawer count={attachments.length}>
		{#each attachments as name (name)}
			<Token label={name} onRemove={() => (attachments = attachments.filter((n) => n !== name))} />
		{/each}
	</ChatComposerDrawer>
{/snippet}

{#snippet referenceIcon()}<Icon icon="moreHorizontal" size="sm" />{/snippet}

{#snippet headerActions()}
	<DropdownMenu
		button={{
			label: 'Reference',
			variant: 'ghost',
			size: 'sm',
			icon: referenceIcon,
			isIconOnly: true
		}}
		hasChevron={false}
		menuWidth={240}
	>
		{#each MENTION_ITEMS as item (item.id)}
			<DropdownMenuItem
				label={item.label}
				description={item.auxiliaryData?.role}
				onClick={() => insertMention(item)}
			/>
		{/each}
	</DropdownMenu>
{/snippet}

{#snippet activeModeIcon()}<Icon icon={activeMode.icon} size="sm" />{/snippet}
{#snippet activeModeLabel()}{activeMode.label}{/snippet}
{#snippet settingsIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet settingsLabel()}Settings{/snippet}

{#snippet footerActions()}
	<DropdownMenu
		button={{
			label: activeMode.label,
			variant: 'ghost',
			size: 'md',
			icon: activeModeIcon,
			children: activeModeLabel
		}}
		menuWidth={200}
		isMenuOpen={isModeMenuOpen}
		onOpenChange={(isOpen) => {
			isModeMenuOpen = isOpen;
			// Restore focus to the composer after inserting a mode token.
			if (!isOpen && shouldFocusComposer) {
				shouldFocusComposer = false;
				setTimeout(() => composerInputRef?.focus(), 50);
			}
		}}
		items={MODE_OPTIONS.flatMap((opt) => {
			const item = {
				label: opt.label,
				icon: opt.icon,
				onClick: () => {
					const tokenLabel = TOKEN_MODES[opt.key];
					if (tokenLabel) {
						insertModeToken(tokenLabel);
						shouldFocusComposer = true;
					} else {
						mode = opt.key;
					}
				}
			};
			return opt.key === 'sensitive' ? [{ type: 'divider' as const }, item] : [item];
		})}
	/>
	<DropdownMenu
		button={{
			label: 'Settings',
			variant: 'ghost',
			size: 'md',
			icon: settingsIcon,
			children: settingsLabel
		}}
		menuWidth={200}
		items={[
			{ label: 'Preferences', onClick: () => {} },
			{ label: 'Keyboard shortcuts', onClick: () => {} },
			{ label: 'About', onClick: () => {} }
		]}
	/>
{/snippet}

{#snippet sendActions()}
	<ChatDictationButton {dictation} />
{/snippet}

{#snippet content()}
	<LayoutContent>
		<VStack gap={8} vAlign="center" style={pageStyle}>
			<!-- Greeting -->
			<VStack gap={1}>
				<HStack gap={2} vAlign="center">
					<Icon icon="info" size="md" color="accent" />
					<Text type="large" as="h2">Hi, Andrew</Text>
				</HStack>
				<Text type="display-2" as="h1">Where should we start?</Text>
			</VStack>

			<!-- Composer -->
			<ChatComposer
				onSubmit={() => {}}
				placeholder="Ask anything"
				input={composerInputSlot}
				drawer={attachments.length > 0 ? drawer : undefined}
				{headerActions}
				{footerActions}
				{sendActions}
			/>

			<!-- Category filters + suggestion cards -->
			<VStack gap={6} style={categories}>
				<ToggleButtonGroup
					label="Category"
					value={category}
					onChange={(value) => (category = value)}
					size="lg"
				>
					{#each CATEGORIES as cat (cat.key)}
						{#snippet categoryIcon()}<Icon icon={cat.icon} size="sm" />{/snippet}
						<ToggleButton value={cat.key} label={cat.label} icon={categoryIcon} />
					{/each}
				</ToggleButtonGroup>

				{#if suggestions}
					<Grid columns={{ minWidth: 280 }} gap={3}>
						{#each suggestions as suggestion (suggestion.heading)}
							<ClickableCard
								label={suggestion.heading}
								variant="muted"
								padding={3}
								onclick={() => {
									applySuggestion(suggestion.prompt);
									mode = category;
								}}
							>
								<VStack gap={0.5}>
									<Heading level={4}>{suggestion.heading}</Heading>
									<Text type="body" color="secondary" size="xsm">
										{suggestion.body}
									</Text>
								</VStack>
							</ClickableCard>
						{/each}
					</Grid>
				{/if}
			</VStack>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout height="fill" contentWidth={720} padding={6} {content} />
