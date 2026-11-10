type SoundName = 'bg' | 'jump' | 'coin' | 'hit' | 'caught';

const FILES: Record<SoundName, string> = {
  bg: '/start.mp3',
  jump: '/jump.mp3',
  coin: '/first_touch.mp3',
  hit: '/second_touch.mp3',
  caught: '/pakda_gya.mp3',
};

const VOLUME: Record<SoundName, number> = {
  bg: 0.55,
  jump: 0.7,
  coin: 0.85,
  hit: 0.9,
  caught: 1,
};

let ctx: AudioContext | null = null;
let bgSource: AudioBufferSourceNode | null = null;
let loadPromise: Promise<void> | null = null;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
const rawPromises = new Map<SoundName, Promise<ArrayBuffer>>();

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

export function play(name: SoundName) {
  const ac = ctx;
  const buffer = buffers[name];
  if (!ac || !buffer) return;
  if (ac.state === 'suspended') void ac.resume();
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.value = VOLUME[name];
  source.connect(gain).connect(ac.destination);
  source.start();
}

export function startBg() {
  const ac = ctx;
  const buffer = buffers.bg;
  if (!ac || !buffer || bgSource) return;
  if (ac.state === 'suspended') void ac.resume();
  const gain = ac.createGain();
  gain.gain.value = VOLUME.bg;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain).connect(ac.destination);
  source.start();
  bgSource = source;
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
  return { state: ctx?.state ?? 'none', loaded: Object.keys(buffers), bg: bgSource !== null };
}
