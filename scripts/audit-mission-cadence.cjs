const fs = require('fs')

const cadence = fs.readFileSync('lib/missionCadence.ts', 'utf8')
const world = fs.readFileSync('components/DemoWorld.tsx', 'utf8')
const briefing = fs.readFileSync('components/MissionBriefing.tsx', 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(cadence.includes("status: 'ready' | 'done-today' | 'returning'"), 'mission cadence must expose the three daily states')
assert(cadence.includes('game.missionHistory'), 'mission cadence must derive from persisted mission history')
assert(cadence.includes("status: 'done-today'"), 'mission cadence must recognize a mission completed today')
assert(cadence.includes("status: 'returning'"), 'mission cadence must recognize a later-day return')
assert(world.includes("import { missionCadence } from '@/lib/missionCadence'"), 'world must consume mission cadence')
assert(world.includes("cadence.status === 'done-today' ? '/math-city' : '/mission/briefing'"), 'world must not invite a second daily mission after completion')
assert(world.includes("cadence.status === 'done-today' && (defaultGuide.href === '/mission/briefing' || defaultGuide.href === '/mission')"), 'NOVA must replace mission-oriented guidance after the daily mission is complete')
assert(world.includes('player.level >= 2 && game.coins > 0'), 'shop guidance must require both shop access and spendable coins')
assert(world.includes("href: '/shop', action: 'USAR MIS MONEDAS'"), 'eligible players should be guided toward spending their earned coins after the daily mission')
assert(world.includes("href: '/achievements', action: 'VER MI PROGRESO'"), 'players without spendable rewards should receive a non-mission post-completion objective')
assert(briefing.includes("const doneToday = cadence.status === 'done-today' && !hasProgress && !onboarding"), 'briefing must preserve resumable/onboarding missions while enforcing daily cadence')
assert(briefing.includes('La próxima misión diaria se habilita en un nuevo día'), 'briefing must explain when the next daily mission becomes available')

console.log('Mission cadence audit passed.')
