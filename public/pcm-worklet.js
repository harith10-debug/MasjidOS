/**
 * pcm-worklet.js — AudioWorklet that converts the mic stream to raw 16 kHz,
 * 16-bit, mono PCM and posts ArrayBuffers to the main thread.
 *
 * Why a worklet + raw PCM (not MediaRecorder/WebM): research found Deepgram &
 * Azure silently drop WebM container streams. Raw little-endian PCM16 over a
 * binary WebSocket is the one reliable, low-latency path.
 *
 * The browser's AudioContext usually runs at 44.1/48 kHz, so we linearly
 * resample down to 16 kHz here before emitting.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._targetRate = 16000;
    this._buf = [];
    // ~50ms chunks at 16kHz keeps the latency/overhead sweet spot.
    this._chunk = 800;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channel = input[0];
    const ratio = sampleRate / this._targetRate; // sampleRate is a worklet global

    // Linear-resample to 16kHz.
    for (let i = 0; i < channel.length; i += ratio) {
      const idx = Math.floor(i);
      const frac = i - idx;
      const s0 = channel[idx] || 0;
      const s1 = channel[idx + 1] != null ? channel[idx + 1] : s0;
      const sample = s0 + (s1 - s0) * frac; // [-1, 1]
      this._buf.push(sample);
    }

    // Flush full chunks as Int16 PCM.
    while (this._buf.length >= this._chunk) {
      const slice = this._buf.splice(0, this._chunk);
      const pcm = new Int16Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        const s = Math.max(-1, Math.min(1, slice[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
