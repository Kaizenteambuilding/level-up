-- Activate Geography & History as the third controlled v1.24 multi-subject rollout.
-- Biology & Geology remains inactive.

update public.curriculum_units
set active = true
where subject_id = 'geography_history'
  and id in ('G01','G02','G03','G04','G05','G06');

update public.skills
set active = true
where subject_id = 'geography_history'
  and unit_id in ('G01','G02','G03','G04','G05','G06');
