import type { ChatComposerInputHandle } from './chat-composer-input.svelte';
import { useSpeechRecognition } from './use-speech-recognition.svelte.js';

/**
 * Full dictation hook for `ChatComposer`, ported from Astryx's
 * `Chat/useChatDictation.ts` — the one hook a consumer calls for voice-to-text.
 *
 * Wraps `useSpeechRecognition` and adds its own `AudioContext` analysis (volume,
 * frequency bands, noise-floor calibration), audio feedback sounds, CAPS LOCK
 * (sustained volume uppercases the transcript), and interim ghost text inside
 * `ChatComposerInput`.
 *
 * **The analyser and audio-context singleton below are a verbatim second copy of
 * `use-speech-recognition`'s, because upstream's are.** The duplication is
 * observable rather than cosmetic: this module's `getDefaultAudioContext` closes
 * over its *own* `_sharedAudioCtx`, so a consumer who passes no `audioContext`
 * ends up with two of them — one per module — and both hooks open their own
 * microphone stream. Importing the other module's copy would quietly merge them,
 * which is a change, not a fix. `port/ledger/` records it — it is how this unit was
 * built, not an open debt.
 *
 * `inputRef` is a getter, the `RefObject` translation `useChatPasteAsToken`
 * already uses; the options object is a getter for the reason
 * `use-speech-recognition` documents.
 */

// =============================================================================
// Types
// =============================================================================

export interface UseChatDictationOptions {
	/** BCP-47 language tag. @default navigator.language */
	lang?: string;
	/** Whether recognition continues until explicitly stopped. @default true */
	continuous?: boolean;
	/** Whether interim results are reported. @default true */
	interimResults?: boolean;
	/** Transform transcript text before it's reported. Applied before CAPS LOCK. */
	transformTranscript?: (transcript: string) => string;
	/** Called on each transcript result (interim or final). */
	onTranscript?: (transcript: string, isFinal: boolean) => void;
	/** Called when a final result is produced. */
	onResult?: (transcript: string) => void;
	/** Called when a recognition error occurs. */
	onError?: (error: { error: string; message?: string }) => void;
	/** Called when recognition starts. */
	onStart?: () => void;
	/** Called when recognition ends. */
	onEnd?: () => void;
	/** Play subtle audio cues on start/stop. @default false */
	hasSounds?: boolean;
	/** Shared AudioContext — uses an internal lazy singleton by default. */
	audioContext?: AudioContext;
	/** The `ChatComposerInput` handle. When given, manages interim ghost text in the input. */
	inputRef?: () => ChatComposerInputHandle | null;
}

export interface UseChatDictationReturn {
	/** Whether the browser supports SpeechRecognition. */
	readonly isSupported: boolean;
	/** Whether recognition is currently active. */
	readonly isListening: boolean;
	/** Whether speech is currently being detected. */
	readonly isSpeaking: boolean;
	/** Real-time microphone volume level, 0 to 1. Updates ~60fps while listening. */
	readonly volume: number;
	/** Frequency band levels (low to high), each 0-1. Updates ~60fps while listening. */
	readonly bands: number[];
	/** Raw (uncalibrated) band levels for debugging. */
	readonly rawBands: number[];
	/** The current interim transcript text. */
	readonly interimTranscript: string;
	/** Start speech recognition. */
	start: () => void;
	/** Stop speech recognition gracefully (waits for final result). */
	stop: () => void;
	/** Abort speech recognition immediately. */
	abort: () => void;
	/** Toggle between start and stop. */
	toggle: () => void;
}

// =============================================================================
// Volume analyser
// =============================================================================

interface VolumeAnalyser {
	calibrate: () => void;
	getVolume: () => number;
	getBands: (count: number) => number[];
	getRawBands: (count: number) => number[];
	cleanup: () => void;
}

async function createVolumeAnalyser(getCtx: () => AudioContext): Promise<VolumeAnalyser | null> {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const audioContext = getCtx();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.5;
		source.connect(analyser);

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		const noiseFloor = new Float32Array(analyser.frequencyBinCount);
		let calibrationSamples = 0;
		const CALIBRATION_FRAMES = 60;

		function calibrate() {
			analyser.getByteFrequencyData(dataArray);
			calibrationSamples++;
			for (let i = 0; i < dataArray.length; i++) {
				const val = dataArray[i] / 255;
				if (val > noiseFloor[i]) {
					noiseFloor[i] = val;
				}
			}
		}

		function getCleanBin(i: number): number {
			const raw = dataArray[i] / 255;
			if (calibrationSamples < CALIBRATION_FRAMES) {
				return 0;
			}
			return Math.max(0, raw - noiseFloor[i] * 1.1);
		}

		return {
			calibrate,
			getVolume: () => {
				analyser.getByteFrequencyData(dataArray);
				if (calibrationSamples < CALIBRATION_FRAMES) {
					calibrate();
				}
				let sum = 0;
				for (let i = 0; i < dataArray.length; i++) {
					sum += getCleanBin(i);
				}
				return sum / dataArray.length;
			},
			getBands: (count: number) => {
				analyser.getByteFrequencyData(dataArray);
				if (calibrationSamples < CALIBRATION_FRAMES) {
					calibrate();
				}
				const bands: number[] = [];
				const binCount = dataArray.length;
				const voiceSplits = [3, 6, 11, 18, binCount];
				const splits = count <= voiceSplits.length ? voiceSplits.slice(0, count) : voiceSplits;
				let start = 1;
				for (let b = 0; b < splits.length; b++) {
					const end = splits[b];
					let sum = 0;
					for (let i = start; i < end; i++) {
						sum += getCleanBin(i);
					}
					bands.push(sum / (end - start));
					start = end;
				}
				return bands;
			},
			getRawBands: (count: number) => {
				analyser.getByteFrequencyData(dataArray);
				const bands: number[] = [];
				const binCount = dataArray.length;
				const voiceSplits = [3, 6, 11, 18, binCount];
				const splits = count <= voiceSplits.length ? voiceSplits.slice(0, count) : voiceSplits;
				let start = 1;
				for (let b = 0; b < splits.length; b++) {
					const end = splits[b];
					let sum = 0;
					for (let i = start; i < end; i++) {
						sum += dataArray[i] / 255;
					}
					bands.push(sum / (end - start));
					start = end;
				}
				return bands;
			},
			cleanup: () => {
				source.disconnect();
				for (const track of stream.getTracks()) {
					track.stop();
				}
			}
		};
	} catch {
		return null;
	}
}

// =============================================================================
// Audio feedback
// =============================================================================

let _sharedAudioCtx: AudioContext | null = null;

function getDefaultAudioContext(): AudioContext {
	if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
		_sharedAudioCtx = new AudioContext();
	}
	if (_sharedAudioCtx.state === 'suspended') {
		void _sharedAudioCtx.resume();
	}
	return _sharedAudioCtx;
}

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

function playPlop(freq: number, delay: number, getCtx: () => AudioContext, volume: number = 0.25) {
	try {
		const ctx = getCtx();
		const now = ctx.currentTime;
		const dur = freq < 200 ? 0.18 : 0.06;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq * 1.3, now + delay);
		osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.01);
		osc.frequency.exponentialRampToValueAtTime(freq * 0.93, now + delay + dur);
		gain.gain.setValueAtTime(0.001, now);
		gain.gain.setValueAtTime(volume, now + delay);
		gain.gain.exponentialRampToValueAtTime(volume * 0.2, now + delay + dur * 0.12);
		gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now + delay);
		osc.stop(now + delay + dur);
	} catch {
		// Audio playback is best-effort
	}
}

function playStartSound(getCtx: () => AudioContext) {
	if (isIOS) {
		return;
	}
	playPlop(392, 0, getCtx);
	playPlop(523, 0.07, getCtx);
}

function playStopSound(getCtx: () => AudioContext) {
	if (isIOS) {
		return;
	}
	playPlop(523, 0, getCtx);
	playPlop(392, 0.07, getCtx);
}

// =============================================================================
// Hook
// =============================================================================

export function useChatDictation(
	options: () => UseChatDictationOptions = () => ({})
): UseChatDictationReturn {
	function getAudioContext(): AudioContext {
		return options().audioContext ?? getDefaultAudioContext();
	}

	let volume = $state(0);
	let bands = $state.raw<number[]>([0, 0, 0, 0, 0]);
	let rawBands = $state.raw<number[]>([0, 0, 0, 0, 0]);

	let volumeHistory: number[] = [];
	let analyser: VolumeAnalyser | null = null;
	let raf = 0;
	let interimSpan: HTMLSpanElement | null = null;

	function startVolumePolling(): void {
		const poll = () => {
			if (analyser) {
				const vol = analyser.getVolume();
				volume = vol;
				volumeHistory.push(vol);
				if (volumeHistory.length > 30) {
					volumeHistory.shift();
				}
				bands = analyser.getBands(5);
				rawBands = analyser.getRawBands(5);
			}
			raf = requestAnimationFrame(poll);
		};
		raf = requestAnimationFrame(poll);
	}

	function stopVolumePolling(): void {
		cancelAnimationFrame(raf);
		volume = 0;
		bands = [0, 0, 0, 0, 0];
		rawBands = [0, 0, 0, 0, 0];
		volumeHistory = [];
		analyser?.cleanup();
		analyser = null;
	}

	function getEditable(): HTMLDivElement | null {
		const active = document.activeElement;
		if (active?.getAttribute('contenteditable') === 'true') {
			return active as HTMLDivElement;
		}
		return document.querySelector<HTMLDivElement>(
			'.astryx-chat-composer-input [contenteditable="true"], [role="textbox"][contenteditable="true"]'
		);
	}

	function insertInterimSpan(): void {
		const editable = getEditable();
		if (!editable) {
			return;
		}
		const span = document.createElement('span');
		span.setAttribute('data-astryx-dictation-interim', '');
		span.contentEditable = 'false';
		span.style.color = 'var(--color-text-disabled, #999)';
		span.style.fontStyle = 'italic';
		span.style.opacity = '0.7';
		span.style.pointerEvents = 'none';
		editable.appendChild(span);
		interimSpan = span;
		editable.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Upstream re-reads `interimSpanRef.current` right after `insertInterimSpan`
	 * to see whether one was created. Doing that inline here would fight TypeScript's
	 * flow analysis, which has already narrowed the closure variable to `null` on
	 * that branch; a separate function body reads it fresh.
	 */
	function setInterimText(text: string): void {
		if (interimSpan) {
			interimSpan.textContent = text;
		}
	}

	function removeInterimSpan(): void {
		if (interimSpan?.isConnected) {
			try {
				interimSpan.remove();
			} catch {
				/* Already removed */
			}
		}
		interimSpan = null;
	}

	function transformTranscript(text: string): string {
		let t = text;
		const userTransform = options().transformTranscript;
		if (userTransform) {
			t = userTransform(t);
		}
		const avgVolume =
			volumeHistory.length > 0
				? volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length
				: 0;
		if (avgVolume >= 0.15 && volumeHistory.length >= 10) {
			t = t.toUpperCase();
		}
		return t;
	}

	$effect(() => {
		return () => {
			analyser?.cleanup();
			analyser = null;
			cancelAnimationFrame(raf);
		};
	});

	const speech = useSpeechRecognition(() => ({
		lang: options().lang,
		continuous: options().continuous,
		interimResults: options().interimResults,
		transformTranscript,
		onTranscript: (transcript, isFinal) => {
			const inputRef = options().inputRef;
			if (inputRef) {
				if (isFinal) {
					removeInterimSpan();
					const handle = inputRef();
					if (handle) {
						handle.focus();
						handle.insertText(transcript + ' ');
					}
					options().onResult?.(transcript);
					insertInterimSpan();
				} else if (interimSpan) {
					interimSpan.textContent = transcript;
				} else {
					insertInterimSpan();
					setInterimText(transcript);
				}
			}
			options().onTranscript?.(transcript, isFinal);
		},
		onResult: options().inputRef ? undefined : options().onResult,
		onError: options().onError,
		onStart: () => {
			if (options().hasSounds) {
				playStartSound(getAudioContext);
			}
			void createVolumeAnalyser(getAudioContext).then((a) => {
				if (a) {
					analyser = a;
					startVolumePolling();
				}
			});
			if (options().inputRef) {
				insertInterimSpan();
			}
			options().onStart?.();
		},
		onEnd: () => {
			stopVolumePolling();
			if (options().hasSounds) {
				playStopSound(getAudioContext);
			}
			if (options().inputRef) {
				removeInterimSpan();
				const editable = getEditable();
				if (editable) {
					editable.dispatchEvent(new Event('input', { bubbles: true }));
				}
			}
			options().onEnd?.();
		}
	}));

	function abort(): void {
		speech.abort();
		stopVolumePolling();
	}

	return {
		get isSupported() {
			return speech.isSupported;
		},
		get isListening() {
			return speech.isListening;
		},
		get isSpeaking() {
			return speech.isSpeaking;
		},
		get interimTranscript() {
			return speech.interimTranscript;
		},
		get volume() {
			return volume;
		},
		get bands() {
			return bands;
		},
		get rawBands() {
			return rawBands;
		},
		start: speech.start,
		stop: speech.stop,
		abort,
		toggle: speech.toggle
	};
}
