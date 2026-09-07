const assert = require('node:assert/strict')
const fs = require('node:fs')

const demoSource = fs.readFileSync('lib/demoGame.ts', 'utf8')
const migration = fs.readFileSync('database/migrations/20260906212500_rebalance_shop_economy.sql', 'utf8')

const expected = {
  sparkles: { price: 350, level: 2 },
  headphones: { price: 600, level: 3 },
  'wizard-hat': { price: 850, level: 4 },
  fox: { price: 1100, level: 5 },
  fire: { price: 1600, level: 6 },
  robot: { price: 2400, level: 8 },
}

for (const [id, values] of Object.entries(expected)) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  assert.match(demoSource, new RegExp(`id: '${escaped}'[\\s\\S]*?price: ${values.price}[\\s\\S]*?minimumLevel: ${values.level}`), `${id} client economy mismatch`)
  assert.match(migration, new RegExp(`when '${escaped}' then ${values.price}`), `${id} migration price mismatch`)
  assert.match(migration, new RegExp(`when '${escaped}' then ${values.level}`), `${id} migration level mismatch`)
}

console.log('Shop economy consistency audit passed.')
