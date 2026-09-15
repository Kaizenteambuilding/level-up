const fs = require('node:fs')
const file = 'lib/englishListeningGenerated.ts'
let source = fs.readFileSync(file, 'utf8')
source = source.replace(
  "`The café kitchen closes at ${timeLabel(3+i%2,0)}, although drinks are served until ${timeLabel(4+i%2,30)}.`",
  "`At the ${place}, the café kitchen closes at ${timeLabel(3+i%2,0)}, although drinks are served until ${timeLabel(4+i%2,30)}.`",
)
fs.writeFileSync(file, source)
fs.unlinkSync('scripts/fix-listening-final-duplicate.cjs')
