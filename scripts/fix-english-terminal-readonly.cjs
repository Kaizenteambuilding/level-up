const fs = require('node:fs')
const file = 'lib/englishTerminalCourseDepth.ts'
let source = fs.readFileSync(file, 'utf8')
const before = "function pick<T>(xs:T[],i:number,o=0){return xs[(i+o)%xs.length]}"
const after = "function pick<T>(xs:readonly T[],i:number,o=0){return xs[(i+o)%xs.length]}"
if (!source.includes(before)) throw new Error('pick signature not found')
source = source.replace(before, after)
fs.writeFileSync(file, source)
