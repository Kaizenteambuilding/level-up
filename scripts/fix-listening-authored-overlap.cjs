const fs = require('node:fs')
const file = 'lib/englishListeningGenerated.ts'
let source = fs.readFileSync(file, 'utf8')
source = source.replace(
  "`I would like the ${food}, please. Could I have bread instead of chips with it?`",
  "`At the ${place}, I would like the ${food}, please. Could I have bread instead of chips with it?`",
)
fs.writeFileSync(file, source)
fs.unlinkSync('scripts/fix-listening-authored-overlap.cjs')
