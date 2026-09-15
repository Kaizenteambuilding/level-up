const fs = require('node:fs')

const sessionFile = 'components/EnglishConversationSession.tsx'
let session = fs.readFileSync(sessionFile, 'utf8')

const importNeedle = "import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'\n"
if (!session.includes(importNeedle)) throw new Error('Conversation curriculum import not found')
session = session.replace(importNeedle, importNeedle + "import { generateEnglishConversationVariant } from '@/lib/englishConversationGenerated'\n")

const oldLoop = `for (let attempt = 0; attempt < 64; attempt += 1) { const nextQuestion = generateCurriculumQuestion(candidate, difficulty, seed); if (!recentTemplates.current.includes(template(nextQuestion.prompt))) { generated = nextQuestion; break } seed = (seed + 2654435761) >>> 0 }`
const newLoop = `for (let attempt = 0; attempt < 64; attempt += 1) { const courseQuestion = generateEnglishConversationVariant(candidate, difficulty, seed), curriculumQuestion = generateCurriculumQuestion(candidate, difficulty, seed); for (const nextQuestion of [courseQuestion, curriculumQuestion]) { if (nextQuestion && !recentTemplates.current.includes(template(nextQuestion.prompt))) { generated = nextQuestion; break } } if (generated) break; seed = (seed + 2654435761) >>> 0 }`
if (!session.includes(oldLoop)) throw new Error('Conversation generation loop not found')
session = session.replace(oldLoop, newLoop)

const oldFallback = `generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)`
const newFallback = `generated = generateEnglishConversationVariant(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed) ?? generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)`
if (!session.includes(oldFallback)) throw new Error('Conversation fallback not found')
session = session.replace(oldFallback, newFallback)
fs.writeFileSync(sessionFile, session)

const generatedFile = 'lib/englishConversationGenerated.ts'
let generated = fs.readFileSync(generatedFile, 'utf8')
const mediationNeedle = `  i => ({ prompt:'A message says, “Meet me outside the station at half past five.” Choose a clear restatement.', answer:'The meeting point is outside the station at 5:30.', distractors:['The train leaves at 5:30.','Meet inside the station at 5:00.','The station closes at 5:30.'], solution:'The paraphrase keeps both the place and the time.' }),\n]`
const mediationReplacement = `  i => ({ prompt:'A message says, “Meet me outside the station at half past five.” Choose a clear restatement.', answer:'The meeting point is outside the station at 5:30.', distractors:['The train leaves at 5:30.','Meet inside the station at 5:00.','The station closes at 5:30.'], solution:'The paraphrase keeps both the place and the time.' }),
  i => ({ prompt:'A library notice says, “Return books by Friday to avoid a charge.” Choose the clearest explanation.', answer:'Take the books back no later than Friday if you do not want to pay extra.', distractors:['You can keep the books forever for free.','The library only opens on Friday.','You must buy the books on Friday.'], solution:'The paraphrase keeps the deadline and the consequence.' }),
  i => ({ prompt:'A sports centre notice says, “Pool closes thirty minutes before the building.” Explain it simply.', answer:'You must finish swimming before the whole sports centre closes.', distractors:['The pool stays open longer than the building.','The building closes before the pool.','Swimming starts thirty minutes after closing.'], solution:'The key idea is that the pool stops being available earlier.' }),
  i => ({ prompt:'A friend texts, “I’ll be there in ten minutes.” Choose the best simple restatement.', answer:'Your friend expects to arrive about ten minutes from now.', distractors:['Your friend arrived ten minutes ago.','Your friend will stay for ten hours.','Your friend cannot come today.'], solution:'“In ten minutes” refers to a future arrival after that amount of time.' }),
  i => ({ prompt:'A school message says, “Bring a packed lunch; drinks are provided.” Explain the practical meaning.', answer:'Take your own food, but you do not need to bring a drink.', distractors:['Take only a drink and no food.','The school provides both food and drinks.','Do not bring anything to eat or drink.'], solution:'The learner needs to separate what must be brought from what is supplied.' }),
  i => ({ prompt:'A ticket says, “Valid after 9:30 only.” Choose the clearest explanation.', answer:'You cannot use this ticket before 9:30.', distractors:['The ticket stops working at 9:30.','The ticket is valid only for nine minutes.','You must arrive exactly at 9:30.'], solution:'“After 9:30 only” sets the earliest time when the ticket can be used.' }),
  i => ({ prompt:'A note says, “Please ring the bell if the door is locked.” Explain what to do.', answer:'If you cannot open the door, use the bell to ask for help.', distractors:['Lock the door after ringing the bell.','Do not use the bell when the door is locked.','Wait outside without doing anything.'], solution:'The paraphrase preserves the condition and the required action.' }),
]`
if (!generated.includes(mediationNeedle)) throw new Error('Mediation bank insertion point not found')
generated = generated.replace(mediationNeedle, mediationReplacement)
fs.writeFileSync(generatedFile, generated)
