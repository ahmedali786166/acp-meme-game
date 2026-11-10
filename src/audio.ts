type SoundName = 'start' | 'jump' | 'firstTouch' | 'secondTouch' | 'caught';

const FILES: Record<SoundName, string> = {
  start: '/start.mp3',
  jump: '/jump.mp3',
  firstTouch: '/first_touch.mp3',
  secondTouch: '/second_touch.mp3',
  caught: '/pakda_gya.mp3',
};

const VOLUME: Record<SoundName, number> = {
  start: 0.6,
  jump: 0.7,
  firstTouch: 0.9,
  secondTouch: 0.9,
  caught: 1,
};

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let ctx: AudioContext | null = null;
let bgSource: AudioBufferSourceNode | null = null;
let loadPromise: Promise<void> | null = null;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
const rawPromises = new Map<SoundName, Promise<ArrayBuffer>>();
const voices = new Map<SoundName, Voice>();
let lastCoinAt = 0;

function audioContext() {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

function fetchBuffer(name: SoundName) {
  let promise = rawPromises.get(name);
  if (!promise) {
    promise = fetch(FILES[name]).then((res) => {
      if (!res.ok) throw new Error(`Audio ${name} failed: ${res.status}`);
      return res.arrayBuffer();
    });
    rawPromises.set(name, promise);
  }
  return promise;
}

async function decodeAll(ac: AudioContext) {
  const names = Object.keys(FILES) as SoundName[];
  await Promise.all(
    names.map(async (name) => {
      try {
        buffers[name] = await ac.decodeAudioData(await fetchBuffer(name));
      } catch {
        // a missing/corrupt clip must not block the rest of the audio
      }
    })
  );
}

let unlockAttached = false;

function attachUnlock(ac: AudioContext) {
  if (unlockAttached) return;
  unlockAttached = true;
  const resume = () => {
    if (ac.state === 'suspended') void ac.resume();
  };
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
  document.addEventListener('visibilitychange', resume);
}

/**
 * Browsers block audio until a user gesture. Call this directly from the
 * "TAP TO START" click: it creates/resumes the AudioContext synchronously,
 * then decodes every clip.
 */
export function initAudio() {
  const ac = audioContext();
  if (ac.state === 'suspended') void ac.resume();
  attachUnlock(ac);
  if (!loadPromise) loadPromise = decodeAll(ac);
  return loadPromise;
}

export function stop(name: SoundName) {
  const voice = voices.get(name);
  if (!voice) return;
  voices.delete(name);
  try {
    voice.source.stop();
  } catch {
    // already finished
  }
  voice.source.disconnect();
  voice.gain.disconnect();
}

export function play(name: SoundName) {
  const ac = ctx;
  const buffer = buffers[name];
  if (!ac || !buffer) return;
  if (ac.state === 'suspended') void ac.resume();
  stop(name); // retrigger cleanly instead of stacking voices
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.value = VOLUME[name];
  source.connect(gain).connect(ac.destination);
  source.onended = () => {
    if (voices.get(name)?.source === source) voices.delete(name);
  };
  source.start();
  voices.set(name, { source, gain });
}

/** Short two-note coin chime; no audio asset needed and it never stacks up. */
export function playCoin() {
  const ac = ctx;
  if (!ac) return;
  const now = ac.currentTime;
  if (now - lastCoinAt < 0.06) return;
  lastCoinAt = now;
  if (ac.state === 'suspended') void ac.resume();
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  gain.connect(ac.destination);
  for (const [freq, delay] of [
    [1318.5, 0], // E6
    [1975.5, 0.075], // B6
  ] as const) {
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + delay);
    osc.connect(gain);
    osc.start(now + delay);
    osc.stop(now + 0.34);
  }
}

export function startBg() {
  const ac = ctx;
  const buffer = buffers.start;
  if (!ac || !buffer || bgSource) return;
  if (ac.state === 'suspended') void ac.resume();
  const gain = ac.createGain();
  gain.gain.value = VOLUME.start;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.loop = false; // plays exactly once per run
  source.connect(gain).connect(ac.destination);
  source.start();
  bgSource = source;
  source.onended = () => {
    if (bgSource === source) bgSource = null;
  };
}

export function stopBg() {
  if (!bgSource) return;
  try {
    bgSource.stop();
  } catch {
    // already stopped
  }
  bgSource.disconnect();
  bgSource = null;
}

/** Warm the HTTP cache without creating an AudioContext before a gesture. */
export function preloadAudio() {
  (Object.keys(FILES) as SoundName[]).forEach((name) => {
    void fetchBuffer(name).catch(() => undefined);
  });
}

/** Dev-only diagnostics, used by the browser test harness. */
export function getAudioDebug() {
  return {
    state: ctx?.state ?? 'none',
    loaded: Object.keys(buffers),
    bg: bgSource !== null,
    voices: [...voices.keys()],
  };
}
