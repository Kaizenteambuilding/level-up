-- Activate Biology & Geology as the fourth controlled v1.24 multi-subject rollout.
-- All staged v1.24 subjects become active after this migration.

update public.curriculum_units
set active = true
where subject_id = 'biology_geology'
  and id in ('B01','B02','B03','B04','B05','B06');

update public.skills
set active = true
where subject_id = 'biology_geology'
  and unit_id in ('B01','B02','B03','B04','B05','B06');
