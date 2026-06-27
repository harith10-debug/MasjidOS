-- ════════════════════════════════════════════════════════════════════════
--  Harden EXECUTE grants on SECURITY DEFINER functions.
--  (Resolves the Supabase security-advisor warnings about definer functions
--   being callable via the public REST RPC endpoint.)
-- ════════════════════════════════════════════════════════════════════════

-- Trigger functions are invoked by the trigger as the definer regardless of
-- EXECUTE grants — they should never be callable via /rest/v1/rpc.
revoke execute on function public.tg_broadcast_display_state() from public, anon, authenticated;
revoke execute on function public.tg_broadcast_donation()       from public, anon, authenticated;

-- claim_device is for logged-in admins only; an anonymous caller has no profile
-- and would only ever hit the NO_MOSQUE guard. Remove its anon EXECUTE.
revoke execute on function public.claim_device(text, text) from public, anon;
grant  execute on function public.claim_device(text, text) to authenticated;
