const assert = require('node:assert/strict')
const fs = require('node:fs')

const recommendation = fs.readFileSync('lib/academicRecommendation.ts', 'utf8')
const component = fs.readFileSync('components/AcademicNextStep.tsx', 'utf8')
const world = fs.readFileSync('components/DemoWorld.tsx', 'utf8')

assert.ok(component.includes("from('player_skill_state')"), 'Academic guide must use persisted adaptive state')
assert.ok(component.includes(".order('priority', { ascending: false })"), 'Academic guide must prioritize the adaptive priority score')
assert.ok(component.includes(".order('mastery', { ascending: true })"), 'Equal priorities should prefer weaker mastery')
assert.ok(component.includes("from('skills')") && component.includes(".eq('active', true)"), 'Recommendation must resolve an active curriculum skill')
assert.ok(component.includes('fallback'), 'Game guide needs a resilient fallback when academic data is unavailable')
assert.ok(world.includes('<AcademicNextStep playerId={player.id} fallback={guide} />'), 'World must render the academic recommendation before the fallback guide')
assert.ok(recommendation.includes("'/zone/math/numbers'") && recommendation.includes("'/zone/math/algebra'") && recommendation.includes("'/zone/math/geometry-data'"), 'Math recommendation destinations are incomplete')
assert.ok(recommendation.includes("'/zone/language/reading'") && recommendation.includes("'/zone/language/words'") && recommendation.includes("'/zone/language/writing'"), 'Spanish recommendation destinations are incomplete')
assert.ok(recommendation.includes("'/zone/english'"), 'Ambiguous English skills should route to the English zone')
assert.ok(recommendation.includes("'/zone/science/investigation'") && recommendation.includes("'/zone/geography/history'"), 'Knowledge-area recommendation destinations are incomplete')

console.log('Academic next-step audit passed.')
