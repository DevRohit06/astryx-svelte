import { useTranslator } from '../../i18n/use-translator.svelte.js';

/**
 * Wraps the browser SpeechRecognition API, ported from Astryx's
 * `Chat/useSpeechRecognition.ts` — start/stop/toggle controls, transcript
 * state, and a real-time microphone volume level from an `AudioContext`
 * analyser.
 *
 * **The options arrive as a getter.** Upstream mirrors every callback into a
 * ref that it rewrites on each render, and reads `lang`/`continuous`/
 * `interimResults` through `useCallback` deps, so all of them are genuinely
 * live; a snapshot taken once at init would freeze a consumer's handlers.
 * `usePopover` settled this shape.
 *
 * Refs that only ever hold a value become plain `let`s — the recognition
 * instance, the analyser and the rAF handle are read and written imperatively
 * and nothing renders from them. Only the six pieces of state upstream holds
 * in `useState` are `$state` here.
 */

// =============================================================================
// Types
// =============================================================================

export interface UseSpeechRecognitionOptions {
	/** BCP-47 language tag. @default navigator.language */
	lang?: string;
	/** Whether recognition continues until explicitly stopped. @default true */
	continuous?: boolean;
	/** Whether interim results are reported. @default true */
	interimResults?: boolean;
	/** Shared AudioContext — uses an internal lazy singleton by default. */
	audioContext?: AudioContext;
	/** Transform transcript text before reporting. */
	transformTranscript?: (text: string) => string;
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
}

export interface UseSpeechRecognitionReturn {
	/** Whether the browser supports SpeechRecognition. */
	readonly isSupported: boolean;
	/** Whether recognition is currently active. */
	readonly isListening: boolean;
	/** Whether speech is currently being detected. */
	readonly isSpeaking: boolean;
	/** Real-time microphone volume level, 0 to 1. */
	readonly volume: number;
	/** Frequency band levels (low to high), each 0-1. */
	readonly bands: number[];
	/** Raw (uncalibrated) band levels for debugging. */
	readonly rawBands: number[];
	/** The current interim transcript text. */
	readonly interimTranscript: string;
	/** Start speech recognition. */
	start: () => void;
	/** Stop speech recognition gracefully. */
	stop: () => void;
	/** Abort speech recognition immediately. */
	abort: () => void;
	/** Toggle between start and stop. */
	toggle: () => void;
}

// =============================================================================
// SpeechRecognition type shim
// =============================================================================

type SpeechRecognitionInstance = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onstart: (() => void) | null;
	onend: (() => void) | null;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onspeechstart: (() => void) | null;
	onspeechend: (() => void) | null;
	onerror: ((event: { error: string; message?: string }) => void) | null;
	onnomatch: (() => void) | null;
};

type SpeechRecognitionEvent = {
	resultIndex: number;
	results: {
		length: number;
		[index: number]: {
			isFinal: boolean;
			length: number;
			[index: number]: { transcript: string };
		};
	};
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
	if (typeof window === 'undefined') {
		return null;
	}
	return (
		(window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
		(
			window as unknown as {
				webkitSpeechRecognition?: SpeechRecognitionConstructor;
			}
		).webkitSpeechRecognition ??
		null
	);
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
					let bandSum = 0;
					for (let i = start; i < end; i++) {
						bandSum += getCleanBin(i);
					}
					bands.push(bandSum / (end - start));
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
					let bandSum = 0;
					for (let i = start; i < end; i++) {
						bandSum += dataArray[i] / 255;
					}
					bands.push(bandSum / (end - start));
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
// AudioContext singleton
// =============================================================================

let _sharedAudioCtx: AudioContext | null = null;

/**
 * Exported by upstream's module but *not* by its `Chat/index.ts`, so it stays
 * off this port's barrel too.
 */
export function getDefaultAudioContext(): AudioContext {
	if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
		_sharedAudioCtx = new AudioContext();
	}
	if (_sharedAudioCtx.state === 'suspended') {
		void _sharedAudioCtx.resume();
	}
	return _sharedAudioCtx;
}

// =============================================================================
// Hook
// =============================================================================

export function useSpeechRecognition(
	options: () => UseSpeechRecognitionOptions = () => ({})
): UseSpeechRecognitionReturn {
	const t = useTranslator();

	function getAudioContext(): AudioContext {
		return options().audioContext ?? getDefaultAudioContext();
	}

	// `useMemo(..., [])`: computed once. On the server there is no `window`, so
	// this is `false` there and `true` in the browser — which is exactly what
	// React does, since it recomputes the memo on the client rather than
	// carrying the server's value across hydration.
	const isSupported = getSpeechRecognition() != null;

	let isListening = $state(false);
	let isSpeaking = $state(false);
	let volume = $state(0);
	// `$state.raw`: both arrays are replaced wholesale ~60 times a second and
	// never mutated in place, so a deep proxy would be pure overhead.
	let bands = $state.raw<number[]>([0, 0, 0, 0, 0]);
	let rawBands = $state.raw<number[]>([0, 0, 0, 0, 0]);
	let interimTranscript = $state('');

	let recognition: SpeechRecognitionInstance | null = null;
	let analyser: VolumeAnalyser | null = null;
	let raf = 0;

	$effect(() => {
		return () => {
			recognition?.abort();
			recognition = null;
			analyser?.cleanup();
			analyser = null;
			cancelAnimationFrame(raf);
		};
	});

	function startVolumePolling(): void {
		const poll = () => {
			if (analyser) {
				volume = analyser.getVolume();
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
		analyser?.cleanup();
		analyser = null;
	}

	function start(): void {
		const SR = getSpeechRecognition();
		if (!SR) {
			return;
		}
		recognition?.abort();

		const { lang, continuous = true, interimResults = true } = options();

		const instance = new SR();
		instance.lang = lang ?? navigator.language;
		instance.continuous = continuous;
		instance.interimResults = interimResults;

		instance.onstart = () => {
			isListening = true;
			options().onStart?.();
			void createVolumeAnalyser(getAudioContext).then((a) => {
				if (a) {
					analyser = a;
					startVolumePolling();
				}
			});
		};

		instance.onend = () => {
			isListening = false;
			isSpeaking = false;
			interimTranscript = '';
			stopVolumePolling();
			options().onEnd?.();
		};

		instance.onspeechstart = () => {
			isSpeaking = true;
		};
		instance.onspeechend = () => {
			isSpeaking = false;
		};

		instance.onresult = (event: SpeechRecognitionEvent) => {
			let interim = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				let transcript = result[0].transcript;
				const { transformTranscript, onResult, onTranscript } = options();
				if (transformTranscript) {
					transcript = transformTranscript(transcript);
				}
				if (result.isFinal) {
					onResult?.(transcript);
					onTranscript?.(transcript, true);
					interimTranscript = '';
				} else {
					interim += transcript;
				}
			}
			if (interim) {
				interimTranscript = interim;
				options().onTranscript?.(interim, false);
			}
		};

		instance.onerror = (event) => {
			options().onError?.({
				error: event.error,
				message: event.message
			});
		};

		instance.onnomatch = () => {
			options().onError?.({
				error: 'no-speech',
				message: t('@astryx.chat.speechRecognition.noSpeechDetected')
			});
		};

		recognition = instance;
		instance.start();
	}

	function stop(): void {
		recognition?.stop();
	}

	function abort(): void {
		recognition?.abort();
		stopVolumePolling();
	}

	function toggle(): void {
		if (isListening) {
			stop();
		} else {
			start();
		}
	}

	return {
		get isSupported() {
			return isSupported;
		},
		get isListening() {
			return isListening;
		},
		get isSpeaking() {
			return isSpeaking;
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
		get interimTranscript() {
			return interimTranscript;
		},
		start,
		stop,
		abort,
		toggle
	};
}
