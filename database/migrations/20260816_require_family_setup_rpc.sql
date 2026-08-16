-- Family ownership must only be established by setup_parent_family(), which
-- creates the family and its parent profile atomically for auth.uid().
drop policy if exists "parent can create family"
  on public.families;

drop policy if exists "parent can insert own profile"
  on public.parent_profiles;

-- Changing family_id directly would allow an account to attach its profile
-- to another family. No current product flow requires direct profile updates.
drop policy if exists "parent can update own profile"
  on public.parent_profiles;
