import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Scenario = { prompt: string; answer: string; distractors: [string,string,string]; solution: string }

type Builder = (i: number) => Scenario

const NAMES = ['Alex','Maya','Leo','Nora','Sam','Ivy','Ben','Lina','Owen','Ruby','Max','Ella']
const CITIES = ['Bristol','York','Leeds','Oxford','Bath','Exeter','Cardiff','Brighton','Norwich','Derby','Lincoln','Chester']
const HOBBIES = ['playing basketball','drawing','reading comics','swimming','playing chess','coding','playing the guitar','cycling','taking photos','dancing','cooking','skateboarding']
const SUBJECTS = ['science','maths','English','history','art','geography','music','computing']
const PLACES = ['library','sports centre','museum','cinema','station','market','swimming pool','science centre','theatre','bookshop','park','café']
const ACTIVITIES = ['play basketball','go swimming','study English','visit the library','practise the guitar','ride a bike','meet friends','do homework','play chess','watch a film','go running','draw']
const OBJECTS = ['calculator','dictionary','umbrella','headphones','charger','notebook','camera','ruler','tablet','water bottle','backpack','map']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function pick<T>(values:T[], i:number, offset=0) { return values[(i + offset) % values.length] }
function rotate<T>(items:T[], shift:number) { const n=((shift%items.length)+items.length)%items.length; return items.slice(n).concat(items.slice(0,n)) }
function q(skill:SkillMeta,difficulty:number,seed:number,scenario:Scenario):GeneratedQuestion {
  const options=rotate([scenario.answer,...scenario.distractors],(seed>>>0)+difficulty)
  return { skillId:skill.id,label:skill.name,difficulty,seed,prompt:scenario.prompt,options,answerIndex:options.indexOf(scenario.answer),solution:scenario.solution,tags:[skill.generator_key,'english','conversation_course_depth'] }
}

const PERSONAL: Builder[] = [
  i => { const name=pick(NAMES,i), city=pick(CITIES,i); return { prompt:`You meet ${name} for the first time. They ask, “Where are you from?” Choose the best reply.`, answer:`I’m from ${city}.`, distractors:[`I’m ${city}.`,`I from ${city}.`,`My from is ${city}.`], solution:'“I’m from + place” is the natural pattern for saying where you come from.' } },
  i => { const age=11+(i%5); return { prompt:'A new classmate asks, “How old are you?” Choose the natural answer.', answer:`I’m ${age}.`, distractors:[`I have ${age}.`,`I am years ${age}.`,`My age ${age}.`], solution:'In English, age is expressed with “be”: “I’m twelve”, not “I have twelve”.' } },
  i => { const hobby=pick(HOBBIES,i); return { prompt:'Someone asks, “What do you like doing after school?” Choose the best personal answer.', answer:`I like ${hobby}.`, distractors:[`I am like ${hobby}.`,`I liking ${hobby}.`,`I like do ${hobby}.`], solution:'“I like + -ing form” is a natural way to talk about hobbies.' } },
  i => { const subject=pick(SUBJECTS,i); return { prompt:'Your partner asks, “What’s your favourite subject?” Choose the best answer.', answer:`My favourite subject is ${subject}.`, distractors:[`I favourite ${subject}.`,`My subject favourite ${subject}.`,`I am favourite subject ${subject}.`], solution:'“My favourite subject is …” gives clear personal information.' } },
  i => { const name=pick(NAMES,i); return { prompt:`${name} asks, “Have you got any brothers or sisters?” Choose a correct short answer.`, answer:'Yes, I have.', distractors:['Yes, I do got.','Yes, I am.','Yes, I got have.'], solution:'With “have got”, a natural short answer is “Yes, I have.”' } },
  i => { const city=pick(CITIES,i,3); return { prompt:'A student says, “I live near the city centre. What about you?” Choose the best reply.', answer:`I live in ${city}.`, distractors:[`I am live in ${city}.`,`I living ${city}.`,`I live at ${city} city.`], solution:'Use present simple “I live in + place” for where you live.' } },
]

const CLASSROOM: Builder[] = [
  i => { const page=20+i; return { prompt:`The teacher says, “Open your books on page ${page}.” What should you do?`, answer:`Open the book on page ${page}.`, distractors:[`Close the book on page ${page}.`,'Put the book away.','Write the homework in your diary.'], solution:'The instruction “Open your books on page …” tells students exactly which page to open.' } },
  i => { const object=pick(OBJECTS,i); return { prompt:`A classmate asks, “Can I borrow your ${object}, please?” Choose the most helpful reply.`, answer:'Sure, here you are.', distractors:['Yes, I borrow you.','No, I am a pencil.','Please to borrowing.'], solution:'“Sure, here you are” is a natural response when giving someone an object.' } },
  i => ({ prompt:'The teacher says, “Work in pairs.” What does this mean?', answer:'Work with one other student.', distractors:['Work completely alone.','Leave the classroom.','Copy the answers from the board.'], solution:'A pair is a group of two, so students should work with one partner.' }),
  i => ({ prompt:'You did not hear the instruction. What is the best thing to say?', answer:'Sorry, could you repeat that, please?', distractors:['Repeat is you now.','I no listening.','Say again teacher now.'], solution:'“Could you repeat that, please?” is a polite classroom request for repetition.' }),
  i => ({ prompt:'The teacher says, “Underline the key words.” What should you do?', answer:'Draw a line under the important words.', distractors:['Erase the important words.','Circle every word on the page.','Read the text aloud immediately.'], solution:'To underline means to draw a line beneath selected words.' }),
  i => ({ prompt:'You have finished an exercise before everyone else. What is a polite question to ask?', answer:'What should I do next?', distractors:['What I next do?','I finish, give thing.','Next is what me?'], solution:'“What should I do next?” is a clear and polite classroom question.' }),
]

const QUESTIONS: Builder[] = [
  i => { const activity=pick(ACTIVITIES,i), day=pick(DAYS,i); return { prompt:`You want to ask a friend about a routine. Choose the correct question about ${activity} on ${day}.`, answer:`Do you ${activity} on ${day}?`, distractors:[`Are you ${activity} on ${day}?`,`Does you ${activity} on ${day}?`,`Do you ${activity}s on ${day}?`], solution:'Use “Do you + base verb …?” for present-simple questions with “you”.' } },
  i => { const activity=pick(ACTIVITIES,i,2); return { prompt:`Choose the correct question about a sister’s routine: “___ your sister ${activity} after school?”`, answer:'Does', distractors:['Do','Is','Has'], solution:'With third-person singular “your sister”, present-simple questions use “Does”.' } },
  i => ({ prompt:'A friend asks, “Do you walk to school?” Choose a correct positive short answer.', answer:'Yes, I do.', distractors:['Yes, I am.','Yes, I does.','Yes, I walk do.'], solution:'Present-simple questions with “do” take “Yes, I do” as the short answer.' }),
  i => ({ prompt:'A friend asks, “Does your brother play tennis?” Choose a correct negative short answer.', answer:"No, he doesn’t.", distractors:['No, he isn’t.','No, he don’t.','No, he not does.'], solution:'With “does”, the negative short answer is “No, he doesn’t.”' }),
  i => { const day=pick(DAYS,i,1); return { prompt:`You want to know when a club meets. Choose the correct question.`, answer:'When does the club meet?', distractors:['When the club does meet?','When do the club meets?','When is meet the club?'], solution:'Wh- questions use “When + does + subject + base verb”.' } },
  i => ({ prompt:'You want to know what your partner usually eats for breakfast. Choose the correct question.', answer:'What do you usually eat for breakfast?', distractors:['What you usually eats for breakfast?','What are you eat usually for breakfast?','What does you usually eat for breakfast?'], solution:'With “you”, use “do” and the base form “eat”.' }),
]

const DESCRIPTIONS: Builder[] = [
  i => { const place=pick(PLACES,i); return { prompt:`You are describing a ${place}. Choose the best sentence.`, answer:`There are several people in the ${place}.`, distractors:[`There is several people in the ${place}.`,`There are a person in the ${place}.`,`It have several people in the ${place}.`], solution:'Use “There are” with a plural noun such as “people”.' } },
  i => ({ prompt:'Choose the best way to describe a person with hair that is long and curly.', answer:'She has long, curly hair.', distractors:['She is hair long and curly.','She has hair curly longly.','She have long curl hair.'], solution:'“She has long, curly hair” is the natural structure for physical description.' }),
  i => { const place=pick(PLACES,i,3); return { prompt:`You want to say that a ${place} is opposite the bank. Choose the clearest sentence.`, answer:`The ${place} is opposite the bank.`, distractors:[`The ${place} opposite is bank.`,`There opposite bank the ${place}.`,`The bank is in the ${place} opposite.`], solution:'Use “X is opposite Y” to describe location.' } },
  i => ({ prompt:'You are describing your classroom. Choose the correct sentence.', answer:'There is a projector above the board.', distractors:['There are a projector above the board.','It is a projector there above board.','There have a projector above the board.'], solution:'Use “There is” for one singular object.' }),
  i => ({ prompt:'Choose the most natural description of a friendly person.', answer:'He is friendly and easy to talk to.', distractors:['He has friendly and talk easy.','He friendly is and easy talk.','He is friendship and easily talking.'], solution:'Adjectives such as “friendly” follow “be”; “easy to talk to” is a natural phrase.' }),
  i => ({ prompt:'You are comparing two places informally. Which description sounds natural?', answer:'The park is quiet, green and spacious.', distractors:['The park has quiet, green and spacious.','The park is quietly, greenery and space.','The park be quiet and greens.'], solution:'A series of adjectives after “is” gives a natural place description.' }),
]

const CAN: Builder[] = [
  i => { const activity=pick(ACTIVITIES,i); return { prompt:`A friend asks if you are able to ${activity}. Choose a correct reply.`, answer:`Yes, I can ${activity}.`, distractors:[`Yes, I can to ${activity}.`,`Yes, I am can ${activity}.`,`Yes, I can ${activity}s.`], solution:'After “can”, use the base form of the verb without “to”.' } },
  i => { const object=pick(OBJECTS,i); return { prompt:`You want permission to use a classmate’s ${object}. Choose the best question.`, answer:`Can I use your ${object}, please?`, distractors:[`Do I can use your ${object}?`,`Can I to use your ${object}?`,`Am I can your ${object}?`], solution:'“Can I …, please?” is a natural way to ask permission.' } },
  i => ({ prompt:'A notice says, “You can take photos, but you can’t use flash.” What is allowed?', answer:'Taking photos without flash.', distractors:['Using flash for every photo.','Taking no photos at all.','Only using flash outside.'], solution:'The notice permits photos but specifically forbids flash.' }),
  i => ({ prompt:'Your friend says, “I can’t carry all these books.” What is the most helpful reply?', answer:'I can help you.', distractors:['I can’t books.','Can you helping me.','I am carry yes.'], solution:'“I can help you” offers ability and assistance naturally.' }),
  i => ({ prompt:'Choose the sentence that expresses inability correctly.', answer:"She can’t swim very well.", distractors:['She doesn’t can swim very well.','She can’t to swim very well.','She not can swims very well.'], solution:'Negative ability is expressed with “can’t + base verb”.' }),
  i => ({ prompt:'At a visitor centre you want to know whether entry is possible now. Choose the best question.', answer:'Can we go in now?', distractors:['Do we can go in now?','Can we to go in now?','Are we can go now in?'], solution:'“Can we go in now?” is a natural question about possibility or permission.' }),
]

const GOING_TO: Builder[] = [
  i => { const activity=pick(ACTIVITIES,i), day=pick(DAYS,i); return { prompt:`You have a plan for ${day}. Choose the correct sentence.`, answer:`I’m going to ${activity} on ${day}.`, distractors:[`I going to ${activity} on ${day}.`,`I’m going ${activity} on ${day}.`,`I’m go to ${activity} on ${day}.`], solution:'Future intentions use “be going to + base verb”.' } },
  i => { const place=pick(PLACES,i); return { prompt:`Your family has decided to visit the ${place} this weekend. Choose the best sentence.`, answer:`We’re going to visit the ${place} this weekend.`, distractors:[`We going visit the ${place} this weekend.`,`We’re going visit the ${place} this weekend.`,`We’re go to visiting the ${place} this weekend.`], solution:'Use “We’re going to visit …” for a future plan.' } },
  i => ({ prompt:'Your friend asks, “What are you going to do after school?” Choose a natural answer.', answer:'I’m going to do my homework.', distractors:['I going do my homework.','I’m going doing my homework.','I’m to do my homework going.'], solution:'The structure is “I’m going to + base verb”.' }),
  i => ({ prompt:'Choose the correct negative plan.', answer:"We aren’t going to stay late.", distractors:['We don’t going to stay late.','We aren’t go to stay late.','We not going stay late.'], solution:'The negative is formed with “be + not + going to + base verb”.' }),
  i => ({ prompt:'You want to ask about a friend’s weekend plan. Choose the correct question.', answer:'What are you going to do this weekend?', distractors:['What do you going to do this weekend?','What are you go to do this weekend?','What you are going do this weekend?'], solution:'Questions with “going to” invert the verb “be”: “What are you going to do …?”' }),
  i => ({ prompt:'Your plans depend on the weather. Which sentence clearly expresses your intention?', answer:'If it is sunny, we’re going to cycle to the park.', distractors:['If sunny, we going cycle the park.','If it is sunny, we’re going cycling to park.','If sunny is, we are go to cycle.'], solution:'The future plan still uses “be going to + base verb”.' }),
]

const FUNCTIONAL: Builder[] = [
  i => { const object=pick(OBJECTS,i); return { prompt:`You need a ${object} for a moment. Choose the most polite request.`, answer:`Could I borrow your ${object}, please?`, distractors:[`Give me your ${object}.`,`I borrow ${object} now?`,`You must give ${object}.`], solution:'“Could I borrow …, please?” is a polite request.' } },
  i => ({ prompt:'A friend looks thirsty. Choose a natural offer.', answer:'Would you like some water?', distractors:['Do you like water now give?','You must drink water?','Are you wanting waters?'], solution:'“Would you like …?” is a common polite form for offers.' }),
  i => ({ prompt:'Your group is deciding what to do after school. Choose a natural suggestion.', answer:"Why don’t we go to the park?", distractors:['Why we don’t go park?','We must park go.','Do why go the park?'], solution:'“Why don’t we …?” is a natural way to make a suggestion.' }),
  i => ({ prompt:'Someone offers you a snack, but you do not want one. Choose a polite response.', answer:'No, thanks. I’m fine.', distractors:['No. Go away.','I not snack.','No, I am not want.'], solution:'“No, thanks” politely refuses an offer.' }),
  i => ({ prompt:'You accidentally step on someone’s foot. What should you say?', answer:'Sorry!', distractors:['You’re welcome!','Never mind me!','Congratulations!'], solution:'“Sorry” is the natural response after causing a small accident.' }),
  i => ({ prompt:'Someone says, “Thanks for your help.” Choose the most natural reply.', answer:"You’re welcome.", distractors:['I’m sorry.','Excuse me?','Good luck me.'], solution:'“You’re welcome” is a standard response to thanks.' }),
]

const MEDIATION: Builder[] = [
  i => ({ prompt:'Your Spanish-speaking friend asks what “The museum is closed on Mondays” means. Choose the clearest simple English restatement.', answer:'You cannot visit the museum on Monday.', distractors:['The museum only opens on Monday.','Monday is the busiest day at the museum.','The museum moves on Monday.'], solution:'A good mediation restates the practical meaning rather than translating word by word.' }),
  i => ({ prompt:'A sign says, “No food beyond this point.” Choose the clearest way to explain it to a friend.', answer:'You must leave food outside this area.', distractors:['You must buy food here.','You can eat anything after this point.','Food is free in this area.'], solution:'The paraphrase communicates the rule in simple accessible English.' }),
  i => ({ prompt:'An announcement says, “The 4:15 bus is delayed by twenty minutes.” Choose the best simple restatement.', answer:'The bus will arrive or leave about twenty minutes late.', distractors:['The bus is twenty minutes early.','The bus has been cancelled.','The journey takes only twenty minutes.'], solution:'“Delayed by twenty minutes” means the service is running about twenty minutes late.' }),
  i => ({ prompt:'A teacher says, “Hand in your work before you leave.” Explain the instruction simply.', answer:'Give the teacher your work before going out.', distractors:['Take your work home without showing it.','Start the work after leaving.','Leave the teacher before the work.'], solution:'Mediation keeps the original meaning while using simpler words.' }),
  i => ({ prompt:'A café notice says, “Cash only today.” Choose the clearest explanation.', answer:'You cannot pay by card today.', distractors:['Everything is free today.','Cards are cheaper today.','You must pay tomorrow.'], solution:'“Cash only” means card payment is not available.' }),
  i => ({ prompt:'A message says, “Meet me outside the station at half past five.” Choose a clear restatement.', answer:'The meeting point is outside the station at 5:30.', distractors:['The train leaves at 5:30.','Meet inside the station at 5:00.','The station closes at 5:30.'], solution:'The paraphrase keeps both the place and the time.' }),
  i => ({ prompt:'A library notice says, “Return books by Friday to avoid a charge.” Choose the clearest explanation.', answer:'Take the books back no later than Friday if you do not want to pay extra.', distractors:['You can keep the books forever for free.','The library only opens on Friday.','You must buy the books on Friday.'], solution:'The paraphrase keeps the deadline and the consequence.' }),
  i => ({ prompt:'A sports centre notice says, “Pool closes thirty minutes before the building.” Explain it simply.', answer:'You must finish swimming before the whole sports centre closes.', distractors:['The pool stays open longer than the building.','The building closes before the pool.','Swimming starts thirty minutes after closing.'], solution:'The key idea is that the pool stops being available earlier.' }),
  i => ({ prompt:'A friend texts, “I’ll be there in ten minutes.” Choose the best simple restatement.', answer:'Your friend expects to arrive about ten minutes from now.', distractors:['Your friend arrived ten minutes ago.','Your friend will stay for ten hours.','Your friend cannot come today.'], solution:'“In ten minutes” refers to a future arrival after that amount of time.' }),
  i => ({ prompt:'A school message says, “Bring a packed lunch; drinks are provided.” Explain the practical meaning.', answer:'Take your own food, but you do not need to bring a drink.', distractors:['Take only a drink and no food.','The school provides both food and drinks.','Do not bring anything to eat or drink.'], solution:'The learner needs to separate what must be brought from what is supplied.' }),
  i => ({ prompt:'A ticket says, “Valid after 9:30 only.” Choose the clearest explanation.', answer:'You cannot use this ticket before 9:30.', distractors:['The ticket stops working at 9:30.','The ticket is valid only for nine minutes.','You must arrive exactly at 9:30.'], solution:'“After 9:30 only” sets the earliest time when the ticket can be used.' }),
  i => ({ prompt:'A note says, “Please ring the bell if the door is locked.” Explain what to do.', answer:'If you cannot open the door, use the bell to ask for help.', distractors:['Lock the door after ringing the bell.','Do not use the bell when the door is locked.','Wait outside without doing anything.'], solution:'The paraphrase preserves the condition and the required action.' }),
]

const BUILDERS: Record<string, Builder[]> = {
  E01S01: PERSONAL,
  E01S04: CLASSROOM,
  E02S03: QUESTIONS,
  E03S03: DESCRIPTIONS,
  E05S01: CAN,
  E05S03: GOING_TO,
  E05S04: FUNCTIONAL,
  E06S04: MEDIATION,
}

const FRAMES = [
  (p:string) => p,
  (p:string) => `Conversation challenge: ${p}`,
  (p:string) => `Choose what you would really say: ${p}`,
  (p:string) => `Everyday English: ${p}`,
] as const

export function generateEnglishConversationVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  const builders=BUILDERS[skill.id]
  if(!builders?.length) return null
  const normalized=seed>>>0
  const builderIndex=normalized%builders.length
  const situationIndex=Math.floor(normalized/builders.length)%12
  const frameIndex=Math.floor(normalized/(builders.length*12))%FRAMES.length
  const scenario=builders[builderIndex](situationIndex)
  return q(skill,difficulty,seed,{...scenario,prompt:FRAMES[frameIndex](scenario.prompt)})
}

export function englishConversationVariantCount(skillId:string) {
  const builders=BUILDERS[skillId]?.length ?? 0
  return builders * 12 * FRAMES.length
}

export function englishConversationVariantSkillIds() { return Object.keys(BUILDERS) }
