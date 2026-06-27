"use client";

/**
 * Realtime + pairing helpers — the spine that makes "same site on TV + phone"
 * actually sync across devices.
 *
 * TWO-LANE design (per research):
 *   • LOW-frequency state (announcement, khutbah on/off, branding, events) lives
 *     in the `display_state` row. A DB trigger broadcasts changes onto the
 *     private channel `mosque:{id}`. TVs ALSO read the row once on mount, so a
 *     refreshed/just-paired screen is instantly correct (snapshot-on-mount).
 *   • HIGH-frequency khutbah text is sent as client-side Broadcast straight
 *     from the admin phone on the SAME channel — ephemeral, sub-second, no DB
 *     write per chunk. (Used in M6.)
 */

const PAIR_KEY = "masjidos-device"; // localStorage: { deviceId, mosqueId }

export function channelName(mosqueId) {
  return `mosque:${mosqueId}`;
}

/** Generate a friendly 6-char pairing code (no ambiguous chars). */
function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Persisted device identity on this TV (survives refresh). */
export function loadDeviceLink() {
  try {
    const raw = localStorage.getItem(PAIR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDeviceLink(link) {
  try {
    localStorage.setItem(PAIR_KEY, JSON.stringify(link));
  } catch {
    /* storage disabled — TV will need to re-pair on reload */
  }
}

export function clearDeviceLink() {
  try {
    localStorage.removeItem(PAIR_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * TV side: ensure this screen has an anonymous Supabase session and a pending
 * `devices` row with a pairing code. Returns { code, deviceId, mosqueId }.
 *
 *   • If already paired (devices.mosque_id set) → returns { mosqueId } and the
 *     caller proceeds straight to the live display.
 *   • If not paired → returns a fresh { code } to show on screen for the admin
 *     to claim.
 */
export async function ensureDevice(supabase) {
  // 1. Anonymous auth — gives the TV a real JWT (needed for private channels).
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(`anon-auth: ${error.message}`);
    user = data.user;
  }

  // 2. Do we already have a device row for this anon user?
  const { data: existing } = await supabase
    .from("devices")
    .select("id, mosque_id, pairing_code")
    .eq("device_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.mosque_id) {
    const link = { deviceId: existing.id, mosqueId: existing.mosque_id };
    saveDeviceLink(link);
    return { ...link, paired: true };
  }

  if (existing && !existing.mosque_id) {
    // Pending row already exists — reuse its code.
    return { deviceId: existing.id, code: existing.pairing_code, paired: false };
  }

  // 3. Create a fresh pending device with a new code.
  const code = makeCode();
  const { data: created, error } = await supabase
    .from("devices")
    .insert({ device_user_id: user.id, pairing_code: code, mosque_id: null })
    .select("id, pairing_code")
    .single();
  if (error) throw new Error(`device-create: ${error.message}`);

  return { deviceId: created.id, code: created.pairing_code, paired: false };
}

/**
 * TV side: subscribe to claim status. Calls onPaired(mosqueId) once an admin
 * claims this device. Polls the device row (claim happens server-side via RPC,
 * which doesn't broadcast to the still-unpaired TV).
 */
export function watchForClaim(supabase, deviceId, onPaired) {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const { data } = await supabase
      .from("devices")
      .select("mosque_id")
      .eq("id", deviceId)
      .maybeSingle();
    if (data?.mosque_id) {
      saveDeviceLink({ deviceId, mosqueId: data.mosque_id });
      onPaired(data.mosque_id);
      return;
    }
    setTimeout(tick, 2500);
  };
  tick();
  return () => {
    stopped = true;
  };
}

/**
 * Subscribe to a mosque's private channel. Calls handlers on broadcast events.
 * Returns an unsubscribe function. Caller is responsible for snapshot-on-mount
 * (reading display_state) separately.
 *
 *   handlers.onDisplayState(record)  — low-frequency state changed
 *   handlers.onDonation(record)      — a successful donation (ticker)
 *   handlers.onTranscript(payload)   — live khutbah text chunk (M6)
 */
export function subscribeMosque(supabase, mosqueId, handlers = {}) {
  const topic = channelName(mosqueId);
  const channel = supabase.channel(topic, { config: { private: true } });

  // DB-trigger broadcasts arrive as 'display_state' / 'donation' events whose
  // payload is { operation, record, old_record } (realtime.broadcast_changes).
  if (handlers.onDisplayState) {
    channel.on("broadcast", { event: "display_state" }, (msg) => {
      handlers.onDisplayState(msg.payload?.record ?? msg.payload);
    });
  }
  if (handlers.onDonation) {
    channel.on("broadcast", { event: "donation" }, (msg) => {
      handlers.onDonation(msg.payload?.record ?? msg.payload);
    });
  }
  // Client-to-client live khutbah text (sent by the admin phone in M6).
  if (handlers.onTranscript) {
    channel.on("broadcast", { event: "transcript" }, (msg) => {
      handlers.onTranscript(msg.payload);
    });
  }

  channel.subscribe((status) => {
    if (handlers.onStatus) handlers.onStatus(status);
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
