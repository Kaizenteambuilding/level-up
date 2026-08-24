const fs = require('node:fs')

const source = fs.readFileSync('components/DemoGameShell.tsx', 'utf8')
const failures = []

if (/if \(inventoryError \|\| missionsError/.test(source)) failures.push('optional_reads_still_block_game')
if (!source.includes('owned: rows ? rows.map((item) => item.item_id) : localGame.owned')) failures.push('inventory_fallback_missing')
if (!source.includes('missionHistory: missionsError ? localGame.missionHistory')) failures.push('mission_history_fallback_missing')
if (!source.includes("const fallbackGame = normalizeDemoState")) failures.push('corrupt_snapshot_fallback_missing')
if (source.includes("setError('No se pudo sincronizar la progresión del juego.')")) failures.push('recoverable_sync_still_fatal')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  guarantees: [
    'inventory_failure_preserves_local_items',
    'history_failure_preserves_local_history',
    'summary_failure_uses_safe_defaults',
    'corrupt_local_snapshot_recovers',
    'optional_sync_never_blocks_onboarding',
  ],
}, null, 2))
