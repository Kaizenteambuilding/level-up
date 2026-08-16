const fs = require('node:fs')

const failures = []
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
const versionSource = fs.readFileSync('lib/version.ts', 'utf8')
const expectedVersion = packageJson.version

if (!/^1\.\d+\.\d+$/.test(expectedVersion)) failures.push('package_not_v1')
if (packageLock.version !== expectedVersion) failures.push('lockfile_root_version_mismatch')
if (packageLock.packages?.['']?.version !== expectedVersion) failures.push('lockfile_package_version_mismatch')
if (!versionSource.includes(`APP_VERSION = '${expectedVersion}'`)) failures.push('runtime_version_mismatch')

const requiredFiles = [
  'OPERATIONS.md',
  'app/api/health/route.ts',
  'database/tests/production_invariants.sql',
  'database/tests/rpc_integrity.sql',
  '.github/workflows/production-health.yml',
]
for (const path of requiredFiles) {
  if (!fs.existsSync(path)) failures.push(`missing:${path}`)
}

const sourceFiles = [
  ...fs.readdirSync('app', { recursive: true }),
  ...fs.readdirSync('components', { recursive: true }).map((path) => `../components/${path}`),
  ...fs.readdirSync('lib', { recursive: true }).map((path) => `../lib/${path}`),
]
  .filter((path) => /\.(ts|tsx|js|jsx)$/.test(path))
  .map((path) => path.startsWith('../') ? path.slice(3) : `app/${path}`)

for (const path of sourceFiles) {
  const content = fs.readFileSync(path, 'utf8')
  if (/service[_-]?role/i.test(content)) failures.push(`browser_source_mentions_service_role:${path}`)
}

console.log(JSON.stringify({
  version: expectedVersion,
  requiredOperationalFiles: requiredFiles.length,
  browserSourceFilesChecked: sourceFiles.length,
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
