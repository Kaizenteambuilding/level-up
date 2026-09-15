const fs = require('node:fs')
const file = 'lib/englishListeningGenerated.ts'
let source = fs.readFileSync(file, 'utf8')
source = source.replace(
  "`The film begins at ${timeLabel(7 + i%2,30)}. We want to arrive twenty minutes early, and the ${byIndex(TRANSPORT,i)} journey takes fifteen minutes.`",
  "`${byIndex(NAMES,i)} is going to the cinema. The film begins at ${timeLabel(7 + i%2,30)}. We want to arrive twenty minutes early, and the ${byIndex(TRANSPORT,i)} journey takes fifteen minutes.`",
)
source = source.replace(
  "`Cyclists may use the path before ${timeLabel(8+i%2,0)}, but during the day it is for pedestrians only.`",
  "`On the path beside the ${byIndex(PLACES,i)}, cyclists may use it before ${timeLabel(8+i%2,0)}, but during the day it is for pedestrians only.`",
)
fs.writeFileSync(file, source)
fs.unlinkSync('scripts/fix-listening-duplicate-spoken.cjs')
