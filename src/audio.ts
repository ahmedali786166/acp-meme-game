// Plain HTML5 Audio, preloaded & reused.
const FILES = {
  start: '/start.mp3',
  jump: '/jump.mp3',
  first_touch: '/first_touch.mp3',
  second_touch: '/second_touch.mp3',
  pakda_gya: '/pakda_gya.mp3',
} as const;

export type SoundName = keyof typeof FILES;
const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

function get(name: SoundName) {
  if (!cache[name]) {
    const a = new Audio(FILES[name]);
    a.preload = 'auto';
    cache[name] = a;
  }
  return cache[name]!;
}

export function preloadAudio() {
  (Object.keys(FILES) as SoundName[]).forEach(get);
}

/** Call inside a user gesture (Start button) so mobile browsers allow later playback. */
export function unlockAudio() {
  (Object.keys(FILES) as SoundName[])
    .filter((n) => n !== 'start') // 'start' is played directly in the same click
    .forEach((n) => {
      const a = get(n);
      a.muted = true;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        })
        .catch(() => (a.muted = false));
    });
}

export function playSound(name: SoundName) {
  const a = get(name);
  a.currentTime = 0;
  a.play().catch(() => {});
}

export function stopSound(name: SoundName) {
  const a = get(name);
  a.pause();
  a.currentTime = 0;
}
