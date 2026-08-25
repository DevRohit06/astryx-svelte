import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import FileInput from '$lib/components/file-input/file-input.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';

/**
 * Astryx's `FileInput/FileInput.test.tsx`, ported case for case — **all 59 of
 * upstream's 59 at the 0.5.0 pin**, across its `describe` blocks. (This header
 * said "**all 58 of upstream's 58** … across 14 `describe` blocks"; upstream
 * declares 59 in 12 blocks at this pin, and all 59 are here.)
 *
 * The seven that used to be absent have landed: `trigger accessible name` (4),
 * `FileInput statusVariant forwarding` (2), and `announces a validation error
 * exactly once across live regions`. The only translation any of them needed is
 * `{exact: true}` on the four accessible-name lookups — Testing Library matches
 * a string `name` against the *whole* accessible name, where a Playwright
 * locator matches a substring, so `'Document'` would also match `'Document,
 * report.pdf'`. The flag restores upstream's semantics rather than changing the
 * assertion.
 *
 * (58 upstream cases plus the one added below is 59 `it`s in this file.)
 *
 * One case here has no upstream counterpart: `does not set aria-required by
 * default`. It pins the *absence* 0.2.0 introduced (the role does not support
 * the attribute), which upstream asserts only as a clause inside its own
 * required cases.
 *
 * Upstream's `beforeEach` (`:30-59`) shims `showPopover`/`hidePopover` and
 * overrides `HTMLElement.prototype.matches` for `:popover-open` and
 * `:focus-visible`, all because jsdom implements none of them; its `h =
 * {hidden: true}` exists for the same reason — a jsdom popover is in the DOM
 * but not "visible" to the accessibility tree. The browser project needs none
 * of it: Chromium has the real Popover API and resolves `:focus-visible` after
 * a real Tab, so the open state is read with `matches(':popover-open')`. `h`
 * survives as `getByRole('tooltip', {includeHidden: true})`, since a *closed*
 * popover really is `display:none` here. That is an environment difference, not
 * a dropped case — the same finding the `Tooltip`, `TextInput` and `TextArea`
 * ports already recorded.
 *
 * Counterpart, noted at the case:
 * - **`forwards ref to the native input` (`:130`)** — Svelte has no `ref` prop.
 *   `FileInput` spreads its rest props onto the `<input type="file">`, so the
 *   mechanism a consumer actually uses — an attachment through the rest props —
 *   is available, and it checks more than upstream's: it receives the element
 *   rather than only proving a callback ran. Same shape as `TextInput`'s.
 *
 * Mechanism notes that leave every assertion intact:
 * - `fireEvent.change(input, {target: {files}})` cannot set a `FileList` from a
 *   plain array in a real browser, so `setFiles` builds one through
 *   `DataTransfer` and dispatches a real `change`. Likewise `fireEvent.drop`
 *   becomes a real `DragEvent` carrying a real `DataTransfer`, and the
 *   drag-leave case passes `relatedTarget` through the event init rather than
 *   `Object.defineProperty` — jsdom drops it there, Chromium honours it.
 * - the two `keyboard interaction` spies get `.mockImplementation(() => {})`.
 *   `vi.spyOn` calls through by default, which in jsdom merely dispatches a
 *   click event but in Chromium opens the OS file picker and would hang the
 *   run. The assertion (`toHaveBeenCalled`) is upstream's, unchanged.
 * - the drag-over case awaits `tick()` after each dispatch. That is React's
 *   `act()` flush, and it is load-bearing: Svelte applies a `$state` write in a
 *   microtask, so a retrying matcher would pass on its first attempt — before
 *   the write landed — and the assertion that the highlight *survives* a
 *   dragleave onto a child would be vacuous. Mutation-checked by deleting the
 *   `currentTarget.contains(relatedTarget)` early return, which turns it red.
 * - upstream's DOM-wide `document.querySelector` is scoped to the render
 *   container, which is what RTL's freshly-cleaned `document` amounts to. The
 *   live region is the exception: it is a body-level singleton, so it is looked
 *   up on `document` exactly as upstream does.
 *
 * Restated, each noted at the case:
 * - `blocks opening the file picker while focusable-disabled` — Playwright
 *   refuses to click an element carrying `aria-disabled="true"`, which would
 *   assert its actionability heuristic instead of the component's guard.
 */

afterEach(() => {
	__resetLiveRegionsForTest();
});

/** Upstream's `politeRegion()` — a body-level singleton, so `document` is right. */
function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

/** Upstream's `fileInputEl()`, scoped to the render container. */
function fileInputIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[type="file"]');
	if (!(el instanceof HTMLInputElement)) {
		throw new Error('file input not found');
	}
	return el;
}

function createFile(name: string, size: number, type: string = 'text/plain'): File {
	const content = new Uint8Array(size);
	return new File([content], name, { type });
}

function transferWith(files: File[]): DataTransfer {
	const dt = new DataTransfer();
	for (const file of files) {
		dt.items.add(file);
	}
	return dt;
}

/** Upstream's `fireEvent.change(input, {target: {files}})`. */
function setFiles(input: HTMLInputElement, files: File[]): void {
	input.files = transferWith(files).files;
	input.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Upstream's `fireEvent.drop(el, {dataTransfer: {files}})`. */
function drop(el: HTMLElement, files: File[]): void {
	el.dispatchEvent(
		new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transferWith(files) })
	);
}

const noop = (): void => {};

describe('FileInput', () => {
	it('renders with label', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Resume', value: null, onChange: noop }
		});
		await expect.element(screen.getByText('Resume')).toBeInTheDocument();
	});

	it('renders default placeholder for single file', async () => {
		const screen = await render(FileInput, {
			props: { label: 'File', value: null, onChange: noop }
		});
		await expect.element(screen.getByText('Choose file')).toBeInTheDocument();
	});

	it('renders default placeholder for multiple files', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Files', value: null, onChange: noop, isMultiple: true }
		});
		await expect.element(screen.getByText('Choose files')).toBeInTheDocument();
	});

	it('renders custom placeholder', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Upload', value: null, onChange: noop, placeholder: 'Drop here' }
		});
		await expect.element(screen.getByText('Drop here')).toBeInTheDocument();
	});

	it('displays selected file name', async () => {
		const file = createFile('report.pdf', 1024, 'application/pdf');
		const screen = await render(FileInput, {
			props: { label: 'Document', value: file, onChange: noop }
		});
		await expect.element(screen.getByText('report.pdf')).toBeInTheDocument();
	});

	it('displays multiple file names', async () => {
		const files = [createFile('a.txt', 100), createFile('b.txt', 200)];
		const screen = await render(FileInput, {
			props: { label: 'Files', value: files, onChange: noop, isMultiple: true }
		});
		await expect.element(screen.getByText('a.txt, b.txt')).toBeInTheDocument();
	});

	// Counterpart to upstream's `forwards ref to the native input` (`:130`); see
	// the file header. Upstream asserts `expect.any(HTMLInputElement)`; this
	// receives the element itself, so the assertion is the stronger `toBe`.
	it('hands the native input to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(FileInput, {
			props: {
				label: 'Upload',
				value: null,
				onChange: noop,
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(fileInputIn(screen.container));
	});

	it('visually hides label when isLabelHidden is true', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Upload', isLabelHidden: true, value: null, onChange: noop }
		});
		await expect.element(screen.getByText('Upload')).toBeInTheDocument();
	});

	it('conveys required state through the accessible description', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Resume', isRequired: true, value: null, onChange: noop }
		});
		const trigger = screen.getByRole('button', { name: 'Resume', exact: true });
		// Required is conveyed via a visually hidden "Required" node referenced from
		// aria-describedby on the focusable trigger — not the hidden file input
		// (forms-6).
		await expect.element(trigger).toHaveAccessibleDescription(/Required/);
		// aria-required is not a supported property of role="button" in WAI-ARIA 1.2
		// (AT does not announce it), so it must never appear.
		await expect.element(trigger).not.toHaveAttribute('aria-required');
	});

	it('combines required with the description in the accessible description', async () => {
		const screen = await render(FileInput, {
			props: {
				label: 'Resume',
				description: 'PDF only',
				isRequired: true,
				value: null,
				onChange: noop
			}
		});
		const trigger = screen.getByRole('button', { name: 'Resume', exact: true });
		await expect.element(trigger).toHaveAccessibleDescription(/PDF only/);
		await expect.element(trigger).toHaveAccessibleDescription(/Required/);
	});

	it('does not mention required without isRequired', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Resume', value: null, onChange: noop }
		});
		const trigger = screen.getByRole('button', { name: 'Resume', exact: true });
		await expect.element(trigger).not.toHaveAccessibleDescription(/Required/);
		await expect.element(trigger).not.toHaveAttribute('aria-required');
	});

	it('places aria-describedby on the focusable button, not the hidden input (forms-6)', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Resume', description: 'PDF only', value: null, onChange: noop }
		});
		const button = screen.getByRole('button', { name: 'Resume', exact: true });
		await expect.element(button).toHaveAttribute('aria-describedby');
		// The hidden file input no longer carries the describedby/required/invalid.
		const input = fileInputIn(screen.container);
		expect(input).not.toHaveAttribute('aria-describedby');
		expect(input).toHaveAttribute('aria-hidden', 'true');
	});

	it('does not set aria-required by default', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Resume', value: null, onChange: noop }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Resume', exact: true }))
			.not.toHaveAttribute('aria-required');
	});

	it('sets disabled attribute when isDisabled is true', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Upload', isDisabled: true, value: null, onChange: noop }
		});
		const input = fileInputIn(screen.container);
		expect(input).toBeDisabled();
	});

	it('sets aria-invalid when status type is error', async () => {
		const screen = await render(FileInput, {
			props: {
				label: 'Upload',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Something went wrong' }
			}
		});
		await expect
			.element(screen.getByRole('button', { name: 'Upload', exact: true }))
			.toHaveAttribute('aria-invalid', 'true');
	});

	it('does not set aria-invalid for warning status', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Upload', value: null, onChange: noop, status: { type: 'warning' } }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Upload', exact: true }))
			.not.toHaveAttribute('aria-invalid');
	});

	it('renders status message when provided', async () => {
		const screen = await render(FileInput, {
			props: {
				label: 'Upload',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'File too large' }
			}
		});
		await expect.element(screen.getByText('File too large')).toBeInTheDocument();
	});

	it('renders description text', async () => {
		const screen = await render(FileInput, {
			props: { label: 'Upload', value: null, onChange: noop, description: 'Max 5MB' }
		});
		await expect.element(screen.getByText('Max 5MB')).toBeInTheDocument();
	});

	describe('file selection via native input', () => {
		it('calls onChange when a file is selected', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange }
			});
			const input = fileInputIn(screen.container);
			const file = createFile('test.txt', 100);
			setFiles(input, [file]);
			expect(handleChange).toHaveBeenCalledWith(file);
		});

		it('calls onChange with File[] when isMultiple', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange, isMultiple: true }
			});
			const input = fileInputIn(screen.container);
			const files = [createFile('a.txt', 100), createFile('b.txt', 200)];
			setFiles(input, files);
			expect(handleChange).toHaveBeenCalledWith(files);
		});

		it('sets accept attribute on native input', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, accept: '.pdf,.doc' }
			});
			const input = fileInputIn(screen.container);
			expect(input).toHaveAttribute('accept', '.pdf,.doc');
		});

		it('sets multiple attribute when isMultiple', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, isMultiple: true }
			});
			const input = fileInputIn(screen.container);
			expect(input).toHaveAttribute('multiple');
		});
	});

	describe('announcements', () => {
		it('announces a single file selection politely', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop }
			});
			setFiles(fileInputIn(screen.container), [createFile('report.pdf', 100)]);
			await expect.element(politeRegion()).toHaveTextContent('1 file selected: report.pdf');
		});

		it('announces a multi-file count politely', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, isMultiple: true }
			});
			const files = [createFile('a.txt', 100), createFile('b.txt', 200), createFile('c.txt', 300)];
			setFiles(fileInputIn(screen.container), files);
			await expect.element(politeRegion()).toHaveTextContent('3 files selected');
		});

		it('does not announce a selection when validation rejects all files', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, accept: '.pdf' }
			});
			setFiles(fileInputIn(screen.container), [createFile('note.txt', 100)]);
			// A rejected selection creates no polite region (only the error goes to
			// the existing role="status" region).
			expect(politeRegion()).toBeNull();
		});

		it('announces a validation error exactly once across live regions', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, accept: '.pdf' }
			});
			setFiles(fileInputIn(screen.container), [createFile('note.txt', 100)]);
			const errorText = '"note.txt" is not an accepted file type';
			// The error lands in the assertive announce region (via the FieldStatus
			// the derived error status mounts)…
			await vi.waitFor(() => {
				expect(document.querySelector('[data-astryx-live-region="assertive"]')).toHaveTextContent(
					errorText
				);
			});
			// …and in exactly one live region overall. FileInput's own role="status"
			// region used to duplicate the FieldStatus announcement, so the same
			// error was read twice (assertively, then politely).
			const liveRegions = Array.from(
				document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')
			);
			const regionsWithError = liveRegions.filter((el) =>
				(el.textContent ?? '').includes(errorText)
			);
			expect(regionsWithError).toHaveLength(1);
		});
	});

	describe('validation', () => {
		it('rejects files exceeding maxSize', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange, maxSize: 1024 }
			});
			const input = fileInputIn(screen.container);
			const largeFile = createFile('big.txt', 2048);
			setFiles(input, [largeFile]);
			expect(handleChange).toHaveBeenCalledWith(null);
		});

		it('accepts files within maxSize', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange, maxSize: 1024 }
			});
			const input = fileInputIn(screen.container);
			const file = createFile('small.txt', 512);
			setFiles(input, [file]);
			expect(handleChange).toHaveBeenCalledWith(file);
		});

		it('limits files to maxFiles', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: {
					label: 'Upload',
					value: null,
					onChange: handleChange,
					isMultiple: true,
					maxFiles: 2
				}
			});
			const input = fileInputIn(screen.container);
			const files = [createFile('a.txt', 100), createFile('b.txt', 100), createFile('c.txt', 100)];
			setFiles(input, files);
			expect(handleChange).toHaveBeenCalledWith([
				expect.objectContaining({ name: 'a.txt' }),
				expect.objectContaining({ name: 'b.txt' })
			]);
		});

		it('rejects files with non-matching accept types', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange, accept: '.pdf' }
			});
			const input = fileInputIn(screen.container);
			const file = createFile('image.png', 100, 'image/png');
			setFiles(input, [file]);
			expect(handleChange).toHaveBeenCalledWith(null);
		});

		it('accepts files matching wildcard accept types', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange, accept: 'image/*' }
			});
			const input = fileInputIn(screen.container);
			const file = createFile('photo.jpg', 100, 'image/jpeg');
			setFiles(input, [file]);
			expect(handleChange).toHaveBeenCalledWith(file);
		});
	});

	describe('clear button', () => {
		it('shows clear button when files are selected', async () => {
			const file = createFile('test.txt', 100);
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: file, onChange: noop }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Clear Upload', exact: true }))
				.toBeInTheDocument();
		});

		it('does not show clear button when no files selected', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop }
			});
			expect(screen.getByRole('button', { name: 'Clear Upload', exact: true }).query()).toBeNull();
		});

		it('does not show clear button when disabled', async () => {
			const file = createFile('test.txt', 100);
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: file, onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Upload', exact: true }).query()).toBeNull();
		});

		it('calls onChange with null when clear is clicked', async () => {
			const handleChange = vi.fn();
			const file = createFile('test.txt', 100);
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: file, onChange: handleChange }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear Upload', exact: true }));
			expect(handleChange).toHaveBeenCalledWith(null);
		});

		it('does not show clear button during loading', async () => {
			const file = createFile('test.txt', 100);
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: file, onChange: noop, isLoading: true }
			});
			expect(screen.getByRole('button', { name: 'Clear Upload', exact: true }).query()).toBeNull();
		});
	});

	describe('drag and drop', () => {
		it('calls onChange when files are dropped in dropzone mode', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange, mode: 'dropzone' }
			});
			const dropzone = screen
				.getByRole('button', { name: 'Upload', exact: true })
				.element() as HTMLElement;
			const file = createFile('dropped.txt', 100);
			drop(dropzone, [file]);
			expect(handleChange).toHaveBeenCalledWith(file);
		});

		it('does not handle drop in input mode', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: handleChange }
			});
			const dropzone = screen
				.getByRole('button', { name: 'Upload', exact: true })
				.element() as HTMLElement;
			const file = createFile('dropped.txt', 100);
			drop(dropzone, [file]);
			expect(handleChange).not.toHaveBeenCalled();
		});

		it('does not handle drop when disabled', async () => {
			const handleChange = vi.fn();
			const screen = await render(FileInput, {
				props: {
					label: 'Upload',
					value: null,
					onChange: handleChange,
					mode: 'dropzone',
					isDisabled: true
				}
			});
			const dropzone = screen
				.getByRole('button', { name: 'Upload', exact: true })
				.element() as HTMLElement;
			const file = createFile('dropped.txt', 100);
			drop(dropzone, [file]);
			expect(handleChange).not.toHaveBeenCalled();
		});
	});

	describe('keyboard interaction', () => {
		it('opens file picker on Enter key', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop }
			});
			const dropzone = screen
				.getByRole('button', { name: 'Upload', exact: true })
				.element() as HTMLElement;
			const input = fileInputIn(screen.container);
			// `mockImplementation` rather than `vi.spyOn`'s default call-through:
			// jsdom's `input.click()` only dispatches an event, but Chromium's opens
			// the OS file picker and would hang the run. The assertion is upstream's.
			const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
			dropzone.focus();
			await userEvent.keyboard('{Enter}');
			expect(clickSpy).toHaveBeenCalled();
			clickSpy.mockRestore();
		});

		it('opens file picker on Space key', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop }
			});
			const dropzone = screen
				.getByRole('button', { name: 'Upload', exact: true })
				.element() as HTMLElement;
			const input = fileInputIn(screen.container);
			const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
			dropzone.focus();
			await userEvent.keyboard(' ');
			expect(clickSpy).toHaveBeenCalled();
			clickSpy.mockRestore();
		});
	});

	describe('dropzone mode', () => {
		it('renders in dropzone mode', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, mode: 'dropzone' }
			});
			await expect.element(screen.getByText('Choose file')).toBeInTheDocument();
		});

		it('keeps the drag-over state while dragging over the dropzone children', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, mode: 'dropzone' }
			});
			const dropzone = screen
				.getByRole('button', { name: 'Upload', exact: true })
				.element() as HTMLElement;
			// `await tick()` after each dispatch is upstream's `act()` flush, and it
			// is load-bearing rather than tidy: Svelte applies a `$state` write in a
			// microtask, so a *retrying* matcher would pass on its first attempt —
			// before the write landed — and the middle assertion, the whole point of
			// the case, would be vacuous even against a component that flickered off.
			// Flushing first lets all three assertions be synchronous, as upstream's
			// are.
			dropzone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true }));
			await tick();
			expect(screen.getByText('Drop files here').query()).toBeInTheDocument();

			// Moving from the container onto one of its own children fires a
			// dragleave on the container with the child as relatedTarget — the
			// highlight must not flicker off while still inside the dropzone.
			// (Upstream sets `relatedTarget` after construction because jsdom's
			// DragEvent init drops it; Chromium honours the init dict.)
			const child = screen.getByText('Drop files here').element();
			dropzone.dispatchEvent(
				new DragEvent('dragleave', { bubbles: true, cancelable: true, relatedTarget: child })
			);
			await tick();
			expect(screen.getByText('Drop files here').query()).toBeInTheDocument();

			// Actually leaving the dropzone ends the drag-over state.
			dropzone.dispatchEvent(
				new DragEvent('dragleave', {
					bubbles: true,
					cancelable: true,
					relatedTarget: document.body
				})
			);
			await tick();
			expect(screen.getByText('Drop files here').query()).not.toBeInTheDocument();
			expect(screen.getByText('Choose file').query()).toBeInTheDocument();
		});

		it('displays file name in dropzone mode', async () => {
			const file = createFile('doc.pdf', 100, 'application/pdf');
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: file, onChange: noop, mode: 'dropzone' }
			});
			await expect.element(screen.getByText('doc.pdf')).toBeInTheDocument();
		});
	});

	describe('trigger accessible name', () => {
		it('includes the selected file name in the trigger name', async () => {
			const file = createFile('report.pdf', 1024, 'application/pdf');
			const screen = await render(FileInput, {
				props: { label: 'Document', value: file, onChange: noop }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Document, report.pdf', exact: true }))
				.toBeInTheDocument();
		});

		it('includes all selected file names when multiple files are selected', async () => {
			const files = [createFile('a.txt', 100), createFile('b.txt', 200)];
			const screen = await render(FileInput, {
				props: { label: 'Files', value: files, onChange: noop, isMultiple: true }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Files, a.txt, b.txt', exact: true }))
				.toBeInTheDocument();
		});

		it('uses exactly the label when no files are selected', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Document', value: null, onChange: noop }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Document', exact: true }))
				.toHaveAttribute('aria-label', 'Document');
		});

		it('includes the selected file name in dropzone mode', async () => {
			const file = createFile('doc.pdf', 100, 'application/pdf');
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: file, onChange: noop, mode: 'dropzone' }
			});
			await expect
				.element(screen.getByRole('button', { name: 'Upload, doc.pdf', exact: true }))
				.toBeInTheDocument();
		});
	});

	describe('data-testid', () => {
		it('passes data-testid to native input', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Upload', value: null, onChange: noop, 'data-testid': 'file-upload' }
			});
			const input = fileInputIn(screen.container);
			expect(input).toHaveAttribute('data-testid', 'file-upload');
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(FileInput, {
				props: {
					label: 'Resume',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			// The trigger button is visually hidden, so the disabled-reason tooltip
			// anchors its hover listeners to the visible container surface.
			const trigger = screen.container.querySelector('.astryx-file-input') as HTMLElement;
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip).toHaveTextContent('You need the Editor role');

			// Upstream's `fireEvent.mouseEnter`/`mouseLeave`, dispatched the same way:
			// a real pointer moved to the trigger's centre and then parked at the
			// viewport origin would assert where Playwright puts the mouse rather
			// than what the trigger listens for.
			trigger.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's `popover-open` attribute,
				// which its jsdom shim invents; Chromium has the real thing.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});

			trigger.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(FileInput, {
				props: {
					label: 'Resume',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			await userEvent.tab();
			await expect.element(screen.getByRole('button')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(FileInput, {
				props: {
					label: 'Resume',
					value: null,
					onChange: noop,
					disabledMessage: 'You need the Editor role'
				}
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Resume', value: null, onChange: noop, isDisabled: true }
			});
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('keeps the trigger focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(FileInput, {
				props: {
					label: 'Resume',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const trigger = screen.getByRole('button');
			await expect.element(trigger).toHaveAttribute('aria-disabled', 'true');
			await expect.element(trigger).toHaveAttribute('tabindex', '0');
		});

		it('links the reason tooltip from the trigger via aria-describedby', async () => {
			const screen = await render(FileInput, {
				props: {
					label: 'Resume',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const trigger = screen.getByRole('button').element();
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks opening the file picker while focusable-disabled', async () => {
			const screen = await render(FileInput, {
				props: {
					label: 'Resume',
					value: null,
					onChange: noop,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const trigger = screen.getByRole('button').element() as HTMLElement;
			const input = fileInputIn(screen.container);
			const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

			// Restated in how the click is delivered: Playwright's actionability
			// check reads `aria-disabled="true"` as "not enabled" and refuses to
			// click at all, which would assert its heuristic instead of the guard.
			// Upstream's click event is dispatched directly; the keyboard half is
			// real, since the control *is* focusable — that is the case's premise.
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			trigger.focus();
			await userEvent.keyboard('{Enter}');
			await userEvent.keyboard(' ');

			expect(clickSpy).not.toHaveBeenCalled();
			clickSpy.mockRestore();
		});

		it('keeps the trigger non-focusable when disabled without a reason', async () => {
			const screen = await render(FileInput, {
				props: { label: 'Resume', value: null, onChange: noop, isDisabled: true }
			});
			const trigger = screen.getByRole('button');
			await expect.element(trigger).toHaveAttribute('tabindex', '-1');
			await expect.element(trigger).not.toHaveAttribute('aria-disabled');
		});
	});
});

describe('FileInput statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(FileInput, {
			props: {
				label: 'Upload',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Something went wrong' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(FileInput, {
			props: {
				label: 'Upload',
				value: null,
				onChange: noop,
				status: { type: 'error', message: 'Something went wrong' },
				statusVariant: 'detached'
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});
});
