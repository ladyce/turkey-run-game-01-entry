// Gobble & Go! — synthesized sound effects (WebAudio, no audio files).
// One job: every gobble, alarm, thud and jingle, generated at runtime.

export function createSoundBank() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensureContext() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch (err) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
  }

  function noiseBurst(dur, vol) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol || 0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }

  const bank = {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    gobble() {
      // Two quick descending clucks: the turkey's happy gobble.
      tone(520, 0.09, 'square', 0.08, 340);
      setTimeout(() => tone(620, 0.1, 'square', 0.09, 380), 90);
      setTimeout(() => tone(700, 0.12, 'square', 0.08, 420), 190);
    },
    pickup() {
      tone(880, 0.08, 'triangle', 0.12, 1320);
    },
    feather() {
      tone(660, 0.1, 'triangle', 0.12, 990);
      setTimeout(() => tone(990, 0.14, 'triangle', 0.12, 1480), 100);
    },
    dash() {
      noiseBurst(0.16, 0.12);
    },
    spotted() {
      // Alarm sting: the farmer saw you!
      tone(220, 0.16, 'sawtooth', 0.14, 440);
      setTimeout(() => tone(330, 0.2, 'sawtooth', 0.14, 660), 140);
    },
    caught() {
      tone(180, 0.35, 'sawtooth', 0.16, 60);
      noiseBurst(0.25, 0.18);
    },
    stageClear() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.12), i * 110));
    },
    escaped() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.13), i * 130));
    },
    click() {
      tone(700, 0.05, 'square', 0.06);
    },
    startMusic() {
      if (musicTimer || muted) return;
      // A lazy banjo-ish pluck loop in C major pentatonic.
      const notes = [262, 294, 330, 392, 440, 392, 330, 294];
      musicTimer = setInterval(() => {
        if (muted) return;
        const f = notes[musicStep % notes.length];
        tone(f, 0.28, 'triangle', 0.045);
        musicStep++;
      }, 300);
    },
    stopMusic() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };
  return bank;
}
