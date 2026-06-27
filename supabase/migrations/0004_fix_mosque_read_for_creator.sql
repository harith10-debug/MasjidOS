-- ════════════════════════════════════════════════════════════════════════
--  Fix: onboarding mosque creation failed with a 42501 RLS error.
--
--  app/onboarding/actions.js inserts a mosque and reads back its id with
--  .select("id").single() (PostgREST `Prefer: return=representation`). That
--  read-back is subject to the SELECT policy on the SAME statement. At creation
--  time the creator's profile.mosque_id is still null (it is linked AFTER the
--  insert), so the membership-based `resolve_mosque_id()` check made the brand-
--  new row invisible to its own creator — surfacing as:
--    "new row violates row-level security policy for table \"mosques\"".
--
--  Allow a user to read mosques they created so the INSERT ... RETURNING (and
--  any subsequent reads before the profile link) succeed.
-- ════════════════════════════════════════════════════════════════════════

drop policy if exists "read own mosque" on public.mosques;
create policy "read own mosque" on public.mosques
  for select to authenticated
  using (
    id = private.resolve_mosque_id()
    or created_by = (select auth.uid())
  );
