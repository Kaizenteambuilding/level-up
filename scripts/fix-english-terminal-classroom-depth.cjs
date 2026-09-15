const fs = require('node:fs')
const file = 'lib/englishTerminalCourseDepth.ts'
let source = fs.readFileSync(file, 'utf8')
const before = "return{prompt:`You have finished task ${i+1}. What is a natural question?`,answer:'What should I do next?',distractors:['What next me do?','I do what next is?','Next should what I?'],solution:'“What should I do next?” is a clear classroom question.'}}"
const after = "return{prompt:`You have finished the ${pick(SUBJECTS,i)} task ${i+1}. What is a natural question?`,answer:'What should I do next?',distractors:['What next me do?','I do what next is?','Next should what I?'],solution:'“What should I do next?” is a clear classroom question.'}}"
if (!source.includes(before)) throw new Error('classroom terminal ending not found')
source = source.replace(before, after)
fs.writeFileSync(file, source)
