-- Activate English as the second controlled v1.24 multi-subject rollout.
-- Geography & History and Biology & Geology remain inactive.

update public.curriculum_units
set active = true
where subject_id = 'english'
  and id in ('E01','E02','E03','E04','E05','E06');

update public.skills
set active = true
where subject_id = 'english'
  and unit_id in ('E01','E02','E03','E04','E05','E06');
