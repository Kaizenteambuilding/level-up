const fs = require('node:fs')

const [rawHealth, expectedSha] = process.argv.slice(2)
if (!rawHealth || !expectedSha) {
  throw new Error('Usage: node scripts/verify-production-health.cjs <health-json> <expected-sha>')
}

const health = JSON.parse(rawHealth)
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const expectedVersion = packageJson.version
const expectedDeployment = expectedSha.slice(0, 7)

const validVersion = typeof health.version === 'string' && /^\d+\.\d+\.\d+$/.test(health.version)
const validDeployment = typeof health.deployment === 'string' && /^[0-9a-f]{7,40}$/i.test(health.deployment)

if (health.status !== 'ok' || health.service !== 'level-up' || !validVersion || !validDeployment) {
  throw new Error(`Unexpected health response: ${rawHealth}`)
}

if (health.version !== expectedVersion) {
  throw new Error(`Production version drift: expected ${expectedVersion}, received ${health.version}`)
}

if (health.deployment !== expectedDeployment) {
  throw new Error(`Production deployment drift: expected ${expectedDeployment}, received ${health.deployment}`)
}

console.log(`LEVEL UP ${health.version} is healthy and production matches ${expectedDeployment}`)
