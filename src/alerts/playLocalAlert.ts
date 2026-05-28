const sirenDurationSeconds = 1.65;
const sirenPulseSeconds = 0.18;

export function playLocalAlert(volume: number) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  const normalizedVolume = Math.max(0, Math.min(volume, 100)) / 100;

  if (normalizedVolume === 0) {
    void audioContext.close().catch(() => undefined);
    return;
  }

  const startAt = audioContext.currentTime;
  const stopAt = startAt + sirenDurationSeconds;
  const compressor = audioContext.createDynamicsCompressor();
  const masterGain = audioContext.createGain();
  const harshnessFilter = audioContext.createBiquadFilter();
  const voices: Array<{
    type: OscillatorType;
    lowHz: number;
    highHz: number;
    gain: number;
    detune: number;
  }> = [
    { type: "sawtooth", lowHz: 620, highHz: 1780, gain: 0.46, detune: -8 },
    { type: "square", lowHz: 880, highHz: 2240, gain: 0.34, detune: 7 },
    { type: "triangle", lowHz: 470, highHz: 1320, gain: 0.28, detune: 0 },
  ];

  harshnessFilter.type = "peaking";
  harshnessFilter.frequency.setValueAtTime(1800, startAt);
  harshnessFilter.Q.setValueAtTime(1.4, startAt);
  harshnessFilter.gain.setValueAtTime(8, startAt);

  compressor.threshold.setValueAtTime(-24, startAt);
  compressor.knee.setValueAtTime(8, startAt);
  compressor.ratio.setValueAtTime(14, startAt);
  compressor.attack.setValueAtTime(0.004, startAt);
  compressor.release.setValueAtTime(0.18, startAt);

  masterGain.gain.setValueAtTime(0.001, startAt);
  masterGain.gain.linearRampToValueAtTime(Math.min(1, normalizedVolume * 1.15), startAt + 0.03);
  masterGain.gain.setValueAtTime(Math.min(1, normalizedVolume * 1.15), stopAt - 0.08);
  masterGain.gain.exponentialRampToValueAtTime(0.001, stopAt);

  harshnessFilter.connect(compressor);
  compressor.connect(masterGain);
  masterGain.connect(audioContext.destination);

  voices.forEach((voice) => {
    const oscillator = audioContext.createOscillator();
    const voiceGain = audioContext.createGain();

    oscillator.type = voice.type;
    oscillator.detune.setValueAtTime(voice.detune, startAt);
    voiceGain.gain.setValueAtTime(voice.gain, startAt);

    for (let pulseIndex = 0; ; pulseIndex += 1) {
      const pulseStart = startAt + pulseIndex * sirenPulseSeconds;
      const pulseEnd = Math.min(pulseStart + sirenPulseSeconds * 0.86, stopAt);

      if (pulseStart >= stopAt) {
        break;
      }

      oscillator.frequency.setValueAtTime(
        pulseIndex % 2 === 0 ? voice.lowHz : voice.highHz,
        pulseStart,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        pulseIndex % 2 === 0 ? voice.highHz : voice.lowHz,
        pulseEnd,
      );
    }

    oscillator.connect(voiceGain);
    voiceGain.connect(harshnessFilter);
    oscillator.start(startAt);
    oscillator.stop(stopAt);
  });

  void audioContext.resume().catch(() => undefined);
  window.setTimeout(
    () => void audioContext.close().catch(() => undefined),
    sirenDurationSeconds * 1000 + 250,
  );
}
