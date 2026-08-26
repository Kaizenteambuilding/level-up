-- Activate Spanish as the first controlled v1.24 multi-subject rollout.
-- Other staged subjects remain inactive.

update public.curriculum_units
set active = true
where subject_id = 'spanish'
  and id in ('L01','L02','L03','L04','L05','L06');

update public.skills
set active = true
where subject_id = 'spanish'
  and unit_id in ('L01','L02','L03','L04','L05','L06');
