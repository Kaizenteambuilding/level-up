# Multi-subject parent dashboard gap

## Finding

The active mission engine rotates across five subjects, but `app/parent/page.tsx` currently limits skill-state, curriculum-skill and curriculum-unit reads to `MATH_CURRICULUM_UNITS`.

As a result, once completed evidence exists for Spanish, English, Geography & History, or Biology & Geology, the parent dashboard will omit that evidence from mastery, reinforcement, strengths, recommendations, coverage and evaluated-skill counts.

## Production evidence checked on 2026-08-26

Active skills by subject:

- Mathematics: 91
- Spanish: 24
- English: 24
- Geography & History: 24
- Biology & Geology: 24

Completed production evidence still exists only for Mathematics at the time of this check, so the omission has not yet hidden completed non-math evidence in production. It is nevertheless a release gap because new multi-subject missions can now generate that evidence.

## Acceptance criteria

1. Parent insight queries include every active subject used by the mission engine.
2. Weekly recommendation, evaluated-skill count, reinforcement, emerging and strongest-skill sections use all-subject evidence.
3. Curriculum coverage includes all active units and makes the subject of each unit clear.
4. Mathematics pacing controls remain scoped to Mathematics until equivalent pacing controls exist for other subjects.
5. Existing math-only historical data remains valid and does not render false weaknesses for subjects with no completed evidence.
6. CI includes a regression audit that fails if the parent dashboard regresses to a math-only curriculum filter.
