const assert = require('node:assert/strict')
const fs = require('node:fs')

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const workflow = fs.readFileSync('.github/workflows/quality.yml', 'utf8')

assert.equal(pkg.engines?.node, '22.x', 'package.json must pin Node.js to the supported 22.x major')
assert.match(workflow, /node-version:\s*22\b/, 'Quality CI must run on Node.js 22')

console.log('Runtime version audit passed (Node.js 22.x pinned in package.json and CI).')
