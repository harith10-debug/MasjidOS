"use client";

/**
 * Khutbah live-captioning engine (admin phone side).
 *
 * Pipeline (research-aligned):
 *   mic → getUserMedia → AudioWorklet (16kHz PCM) → Deepgram streaming WS
 *       → interim partials: broadcast immediately (original language only)
 *       → finals: translate via /api/translate, then broadcast original+translation
 *
 * The imam/admin SETS the spoken language (Deepgram monolingual models don't
 * code-switch well between Malay narration and Arabic Quran). Quran verses are
 * NOT transcribed — the admin pins them from the verse picker instead.
 *
 * Resilience: a khutbah runs 20–40 min on mosque WiFi. The Deepgram token only
 * needs to be valid at WS *handshake* (the socket then stays open regardless of
 * TTL), but the network itself can drop — so on an unexpected close we fetch a
 * fresh token and reconnect with exponential backoff, reusing the live mic.
 *
 * Everything is sent over the SAME private channel as display_state, as
 * client-to-client Broadcast ('transcript' events) — ephemeral, no DB writes.
 */

// Deepgram language codes for the spoken-language selector.
const DG_LANG = { ms: "ms", en: "en", ar: "ar" };
// Model per spoken language. nova-3 is English-first and does NOT cover Malay,
// so ms/ar use nova-2 (broadest language coverage incl. Malay & Arabic). Using
// nova-3 for Malay was the cause of "mic on, but no captions ever appear".
const DG_MODEL = { en: "nova-3", ms: "nova-2", ar: "nova-2" };
const MAX_RETRIES = 6;
// If the socket is open this long with zero transcripts, surface a hint so a
// silent failure (wrong mic, muted input, unsupported audio) is visible.
const SILENCE_HINT_MS = 12000;

export class KhutbahEngine {
  constructor({ channel, spokenLang = "ms", targets = ["en"], deviceId = null, onState }) {
    this.channel = channel; // an already-subscribed supabase realtime channel
    this.spokenLang = spokenLang;
    this.targets = targets; // languages to translate finals into
    this.deviceId = deviceId; // pin a specific mic (the khatib's) if provided
    this.onState = onState || (() => {});
    this.ctx = null;
    this.ws = null;
    this.stream = null;
    this.node = null;
    this.running = false;
    this.keepAlive = null;
    this.retries = 0;
    this.reconnectTimer = null;
    this.silenceTimer = null;
    this.gotSpeech = false;
  }

  async start() {
    if (this.running) return;
    this.onState({ status: "starting" });

    // 1. Mic — classify failures so the UI can guide the imam. When a device is
    //    chosen (the khatib's mic), pin it EXACTLY so other room mics/noise are
    //    ignored.
    const audio = { channelCount: 1, echoCancellation: true, noiseSuppression: true };
    if (this.deviceId) audio.deviceId = { exact: this.deviceId };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio });
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "SecurityError") throw new Error("MIC_DENIED");
      if (e.name === "NotFoundError" || e.name === "OverconstrainedError") throw new Error("MIC_NOT_FOUND");
      if (e.name === "NotReadableError") throw new Error("MIC_IN_USE");
      throw new Error("MIC_ERROR");
    }

    // 2. AudioWorklet → 16kHz PCM (set up once; reused across reconnects).
    this.ctx = new AudioContext();
    await this.ctx.audioWorklet.addModule("/pcm-worklet.js");
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "pcm-processor");
    src.connect(this.node);
    this.node.port.onmessage = (e) => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(e.data);
    };

    this.running = true;
    await this._connect();
  }

  /** Open (or re-open) the Deepgram socket with a fresh ephemeral token. */
  async _connect() {
    if (!this.running) return;

    // Fresh token per (re)connection — only needs to be valid at handshake.
    let token, scheme;
    try {
      const tokRes = await fetch("/api/deepgram/token");
      if (!tokRes.ok) {
        const err = await tokRes.json().catch(() => ({}));
        if (err.error === "transcription-disabled") {
          this.running = false;
          this.onState({ status: "disabled" });
          return;
        }
        throw new Error("TOKEN_FAILED");
      }
      const tok = await tokRes.json();
      token = tok.token;
      // "bearer" for grant access tokens, "token" for raw API keys.
      scheme = tok.scheme || "token";
    } catch {
      return this._scheduleReconnect();
    }

    const lang = DG_LANG[this.spokenLang] || "ms";
    const model = DG_MODEL[this.spokenLang] || "nova-2";
    const params = new URLSearchParams({
      model,
      language: lang,
      encoding: "linear16",
      sample_rate: "16000",
      channels: "1",
      interim_results: "true",
      punctuate: "true",
      smart_format: "true",
      endpointing: "300",
    });

    this.ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`, [scheme, token]);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.retries = 0;
      this.gotSpeech = false;
      this.onState({ status: "live" });
      clearInterval(this.keepAlive);
      this.keepAlive = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "KeepAlive" }));
      }, 8000);
      // Connected fine but if no words arrive for a while, the problem is
      // upstream of Deepgram (wrong mic, muted, no speech) — tell the admin.
      clearTimeout(this.silenceTimer);
      this.silenceTimer = setTimeout(() => {
        if (this.running && !this.gotSpeech) this.onState({ status: "no-speech" });
      }, SILENCE_HINT_MS);
    };

    this.ws.onmessage = (e) => this._onDeepgram(e);
    this.ws.onerror = () => {
      clearInterval(this.keepAlive);
    };
    this.ws.onclose = (ev) => {
      clearInterval(this.keepAlive);
      clearTimeout(this.silenceTimer);
      // Deepgram closes 1008 for bad params (e.g. unsupported model+language).
      // Don't hammer-reconnect a config error — surface it instead.
      if (this.running && ev?.code === 1008) {
        this.running = false;
        this.onState({ status: "config-error", detail: ev.reason || "" });
        return;
      }
      // Unexpected close while we still want to be live → reconnect.
      if (this.running) this._scheduleReconnect();
    };
  }

  _scheduleReconnect() {
    if (!this.running) return;
    if (this.retries >= MAX_RETRIES) {
      this.onState({ status: "closed" });
      return;
    }
    const delay = Math.min(1000 * 2 ** this.retries, 15000);
    this.retries += 1;
    this.onState({ status: "reconnecting" });
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }

  async _onDeepgram(e) {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    const alt = msg?.channel?.alternatives?.[0];
    const text = alt?.transcript?.trim();
    if (!text) return;

    // First real words → clear the "no speech" watch and recover from the hint.
    if (!this.gotSpeech) {
      this.gotSpeech = true;
      clearTimeout(this.silenceTimer);
      this.onState({ status: "live" });
    }

    if (!msg.is_final) {
      // Interim → show original immediately (no translation yet).
      this._broadcast({ text: { [this.spokenLang]: text }, interim: true });
      return;
    }

    // Final → translate, then broadcast original + translations together.
    const payload = { [this.spokenLang]: text };
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from: this.spokenLang, to: this.targets }),
      });
      if (res.ok) {
        const { translations, degraded } = await res.json();
        Object.assign(payload, translations);
        // Surface a degraded-translation warning without stopping captions.
        if (degraded) this.onState({ status: "degraded-translate" });
      }
    } catch {
      /* keep original even if translation fails */
    }
    this._broadcast({ text: payload, interim: false });
  }

  _broadcast(body) {
    this.channel?.send({ type: "broadcast", event: "transcript", payload: body });
  }

  /** Pin a verified Quran verse (bypasses STT entirely). */
  showVerse(verse) {
    this._broadcast({ verse });
  }

  clear() {
    this._broadcast({ clear: true });
  }

  async stop() {
    this.running = false;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.silenceTimer);
    clearInterval(this.keepAlive);
    try {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "CloseStream" }));
    } catch {
      /* ignore */
    }
    this.ws?.close();
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    await this.ctx?.close().catch(() => {});
    this.ws = this.node = this.stream = this.ctx = null;
    this.onState({ status: "stopped" });
  }
}
