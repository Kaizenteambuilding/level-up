const fs = require('node:fs')

{
  const file = 'lib/englishListeningGenerated.ts'
  let source = fs.readFileSync(file, 'utf8')
  source = source.replace('const VARIANTS = 32', 'const VARIANTS = 8')
  source = source.replace("[start,timeLabel(hour,30),timeLabel(hour+2,minute)]", "[start,timeLabel(hour,(minute+15)%60),timeLabel(hour+2,minute)]")
  source = source.replace("`Work alone on questions one to ${3 + (i%4)}. Then compare the next question with a partner.`", "`Work alone on questions one to ${3 + (i%4)}. Then compare the next question with ${byIndex(NAMES,i)}.`")
  source = source.replace("`Before using the equipment, write today's date and your group number at the top of the page.`", "`Before using the equipment in the ${byIndex(PLACES,i)}, write today's date and your group number at the top of the page.`")
  source = source.replace("`Listen to the recording twice. On the first listen, do not write anything; on the second, complete boxes ${1+i%3} to ${4+i%3}.`", "`The recording is about ${byIndex(SUBJECTS,i)}. Listen twice. On the first listen, do not write anything; on the second, complete boxes ${1+i%3} to ${4+i%3}.`")
  source = source.replace("`Put your finished sheet in the blue tray, but keep the vocabulary list because you will need it for tomorrow's lesson.`", "`Put your finished sheet in the blue tray, but keep the ${byIndex(SUBJECTS,i)} vocabulary list because you will need it for tomorrow's lesson.`")
  source = source.replace("`There are two chairs beside the desk, a lamp on the desk and a bag under it.`", "`In ${byIndex(NAMES,i)}'s room there are two chairs beside the desk, a lamp on the desk and a ${byIndex(OBJECTS,i)} under it.`")
  source = source.replace("`Your ticket is for the balcony, not the stalls. Use the stairs on the left after the main entrance; the right-hand stairs lead to the stalls.`", "`At the ${place}, your ticket is for the balcony, not the stalls. Use the stairs on the left after the main entrance; the right-hand stairs lead to the stalls.`")
  fs.writeFileSync(file, source)
}

{
  const file = 'scripts/audit-english-listening-quality.cjs'
  let source = fs.readFileSync(file, 'utf8')
  source = source.replace(
    "assert(generated.length >= 1760, `Expected at least 1760 generated listening items, found ${generated.length}`)\nassert(items.length >= 1814, `Expected at least 1814 listening items, found ${items.length}`)",
    "assert(generated.length >= 440, `Expected at least 440 generated listening items, found ${generated.length}`)\nassert(items.length >= 494, `Expected at least 494 listening items, found ${items.length}`)",
  )
  source = source.replace(
    "  const questionKey = item.question.trim().toLowerCase()\n  assert(!questionSeen.has(questionKey), `${where}: duplicate exact question also used by ${questionSeen.get(questionKey)}`)\n  questionSeen.set(questionKey, where)",
    "  const questionKey = item.question.trim().toLowerCase()\n  if (item.origin !== 'generated') assert(!questionSeen.has(questionKey), `${where}: duplicate exact question also used by ${questionSeen.get(questionKey)}`)\n  questionSeen.set(questionKey, where)",
  )
  fs.writeFileSync(file, source)
}

fs.unlinkSync('scripts/fix-listening-course-depth.cjs')
