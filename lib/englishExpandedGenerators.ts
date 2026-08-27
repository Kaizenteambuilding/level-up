import type { GeneratedQuestion } from './firstEvaluationGenerators'
import { generateLanguageSubjectQuestion } from './languageSubjectGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const EXTRA: Record<string, Item[]> = {
  en_personal_info: [
    { prompt: 'Choose the best answer: “Where do you live?”', answer: 'I live in Valencia.', distractors: ['I am thirteen.','My name is Paula.','It is sunny.'], solution: 'The question asks for a place of residence.' },
    { prompt: 'Choose the best answer: “What is your favourite subject?”', answer: 'My favourite subject is Science.', distractors: ['I am from Spain.','I have two brothers.','It is half past four.'], solution: 'The answer names a school subject.' },
    { prompt: 'Choose the best answer: “When is your birthday?”', answer: 'It is in May.', distractors: ['I am twelve.','I live near school.','My surname is López.'], solution: 'The question asks for a date or month.' },
    { prompt: 'Choose the best answer: “Have you got any brothers or sisters?”', answer: 'Yes, I have got one sister.', distractors: ['Yes, I am twelve.','Yes, I live in Madrid.','Yes, it is Tuesday.'], solution: 'The question asks about siblings.' },
  ],
  en_be_pronouns: [
    { prompt: 'Complete: “Laura ___ my cousin.”', answer: 'is', distractors: ['am','are','be'], solution: 'With third-person singular, the present form of be is “is”.' },
    { prompt: 'Complete: “My parents ___ at work.”', answer: 'are', distractors: ['is','am','be'], solution: 'A plural subject takes “are”.' },
    { prompt: 'Replace “Peter and I” with a subject pronoun.', answer: 'We', distractors: ['They','You','He'], solution: '“Peter and I” includes the speaker, so the pronoun is “we”.' },
    { prompt: 'Complete: “The book is new. ___ is on the desk.”', answer: 'It', distractors: ['He','She','They'], solution: 'A singular object is replaced by “it”.' },
  ],
  en_possessives_have: [
    { prompt: 'Complete: “I have a bike. ___ bike is red.”', answer: 'My', distractors: ['His','Her','Their'], solution: 'The possessive adjective for “I” is “my”.' },
    { prompt: 'Complete: “They have got a cat. ___ cat is black.”', answer: 'Their', distractors: ['Our','His','My'], solution: 'The possessive adjective for “they” is “their”.' },
    { prompt: 'Choose the correct sentence.', answer: 'He has got a new phone.', distractors: ['He have got a new phone.','He has got a new phones.','He got has a new phone.'], solution: 'With “he”, use “has got”.' },
    { prompt: 'Complete: “We ___ got a small garden.”', answer: 'have', distractors: ['has','is','are'], solution: 'With “we”, use “have got”.' },
  ],
  en_classroom_language: [
    { prompt: 'What does “Work in pairs” mean?', answer: 'Trabajad por parejas', distractors: ['Trabajad en silencio individualmente','Cerrad los libros','Salid de clase'], solution: 'It asks students to work with one partner.' },
    { prompt: 'Which expression asks for permission?', answer: 'Can I go to the toilet, please?', distractors: ['Open your notebook.','Listen carefully.','Write the date.'], solution: '“Can I…?” is used to ask permission.' },
    { prompt: 'What does “Underline the correct answer” mean?', answer: 'Subraya la respuesta correcta', distractors: ['Borra la respuesta correcta','Lee la respuesta en voz alta','Copia todo el texto'], solution: '“Underline” means draw a line under something.' },
    { prompt: 'Which phrase means “No lo entiendo”?', answer: 'I don’t understand.', distractors: ['I don’t remember.','I don’t agree.','I don’t have it.'], solution: '“I don’t understand” directly expresses lack of understanding.' },
  ],
  en_present_simple: [
    { prompt: 'Complete: “My sister ___ breakfast at seven.”', answer: 'has', distractors: ['have','having','is have'], solution: 'Third-person singular present simple uses “has”.' },
    { prompt: 'Choose the correct sentence about a habit.', answer: 'They go swimming every Tuesday.', distractors: ['They goes swimming every Tuesday.','They are go swimming every Tuesday.','They went swimming every Tuesday now.'], solution: 'A regular habit uses present simple.' },
    { prompt: 'Complete: “Daniel ___ his homework after dinner.”', answer: 'does', distractors: ['do','doing','is do'], solution: 'With Daniel/he, “do” becomes “does”.' },
    { prompt: 'Choose the correct form: “I ___ the bus to school every day.”', answer: 'take', distractors: ['takes','am taking','took'], solution: 'A daily routine uses present simple; with “I” use the base form.' },
  ],
  en_frequency: [
    { prompt: 'Choose the natural word order.', answer: 'She often reads before bed.', distractors: ['She reads often before bed.','Often she before bed reads.','She before often reads bed.'], solution: 'Frequency adverbs usually go before the main verb.' },
    { prompt: 'Which adverb means “siempre”?', answer: 'always', distractors: ['never','sometimes','hardly ever'], solution: '“Always” means every time.' },
    { prompt: 'Complete: “I ___ eat vegetables; maybe three times a week.”', answer: 'sometimes', distractors: ['never','always','hardly ever'], solution: 'Three times a week fits “sometimes”.' },
    { prompt: 'Choose the best option: “He is ___ late for school; it happens almost every day.”', answer: 'usually', distractors: ['never','hardly ever','rarely'], solution: 'An event happening almost every day is usual.' },
  ],
  en_present_questions: [
    { prompt: 'Complete: “___ your parents work in the city?”', answer: 'Do', distractors: ['Does','Are','Is'], solution: 'A present simple question with a plural subject uses “do”.' },
    { prompt: 'Choose the correct question.', answer: 'Where does Tom live?', distractors: ['Where do Tom live?','Where Tom does live?','Where is Tom live?'], solution: 'With Tom/he, use “does” plus the base verb.' },
    { prompt: 'Choose the correct short answer to “Does Mia like maths?”', answer: 'No, she doesn’t.', distractors: ['No, she don’t.','No, she isn’t.','No, she not.'], solution: 'A “does” question takes “doesn’t” in the negative short answer.' },
    { prompt: 'Complete: “What time ___ you get up?”', answer: 'do', distractors: ['does','are','is'], solution: 'With “you”, present simple questions use “do”.' },
  ],
  en_routines_vocab: [
    { prompt: 'What does “get dressed” mean?', answer: 'vestirse', distractors: ['despertarse','desayunar','acostarse'], solution: '“Get dressed” means put on clothes.' },
    { prompt: 'Which activity normally happens at night?', answer: 'go to bed', distractors: ['wake up','have breakfast','go to school'], solution: '“Go to bed” is normally part of the night routine.' },
    { prompt: 'What does “brush your teeth” mean?', answer: 'cepillarse los dientes', distractors: ['lavarse las manos','peinarse','ducharse'], solution: 'It refers to cleaning your teeth with a toothbrush.' },
    { prompt: 'Choose the best routine verb: “After school, I ___ my homework.”', answer: 'do', distractors: ['make','take','have'], solution: 'The fixed expression is “do homework”.' },
  ],
  en_present_continuous: [
    { prompt: 'Complete: “Look! The dog ___ in the garden.”', answer: 'is running', distractors: ['runs','run','ran'], solution: '“Look!” signals an action happening now.' },
    { prompt: 'Choose the correct sentence.', answer: 'We are waiting for the bus.', distractors: ['We waiting for the bus.','We is waiting for the bus.','We are wait for the bus.'], solution: 'Present continuous uses are + verb-ing with “we”.' },
    { prompt: 'Complete: “I ___ dinner at the moment.”', answer: 'am cooking', distractors: ['cook','cooks','cooked'], solution: '“At the moment” signals present continuous.' },
    { prompt: 'Choose the correct form: “Sara and Leo ___ a project now.”', answer: 'are making', distractors: ['is making','make','makes'], solution: 'A plural subject uses “are” + verb-ing.' },
  ],
  en_present_contrast: [
    { prompt: 'Choose: “I usually ___ trainers, but today I ___ boots.”', answer: 'wear / am wearing', distractors: ['am wearing / wear','wears / wearing','wore / wear'], solution: 'Habit takes present simple; today’s temporary action takes present continuous.' },
    { prompt: 'Which sentence describes something happening now?', answer: 'My brother is talking on the phone.', distractors: ['My brother talks on the phone every evening.','My brother talked yesterday.','My brother can talk loudly.'], solution: '“Is talking” describes an action in progress.' },
    { prompt: 'Complete: “They often ___ at home, but this week they ___ in a hotel.”', answer: 'stay / are staying', distractors: ['are staying / stay','stays / staying','stayed / stay'], solution: 'A usual situation contrasts with a temporary one.' },
    { prompt: 'Choose the sentence that expresses a routine.', answer: 'She catches the 8:10 bus every morning.', distractors: ['She is catching the bus right now.','She caught the bus yesterday.','She is going to catch a bus tomorrow.'], solution: '“Every morning” marks a routine.' },
  ],
  en_descriptions: [
    { prompt: 'Complete: “There ___ a desk next to the window.”', answer: 'is', distractors: ['are','am','be'], solution: 'A singular noun takes “there is”.' },
    { prompt: 'Which adjective best describes hair?', answer: 'curly', distractors: ['square','delicious','carefully'], solution: '“Curly” can describe the shape of hair.' },
    { prompt: 'Choose the correct description.', answer: 'He has got short brown hair.', distractors: ['He has short hair brown got.','He got has brown short hair.','He is have short brown hair.'], solution: 'The adjective order and “has got” structure are correct.' },
    { prompt: 'Complete: “There are three posters ___ the wall.”', answer: 'on', distractors: ['at','to','from'], solution: 'Things attached to a wall are “on the wall”.' },
  ],
  en_comparatives: [
    { prompt: 'Complete: “An elephant is ___ than a dog.”', answer: 'bigger', distractors: ['biggest','more big','big'], solution: 'Short adjective “big” forms the comparative “bigger”.' },
    { prompt: 'Complete: “Maths is ___ for me than History.”', answer: 'easier', distractors: ['easyer','more easy','easiest'], solution: '“Easy” changes y to i before -er: easier.' },
    { prompt: 'Choose the correct sentence.', answer: 'This exercise is more difficult than the first one.', distractors: ['This exercise is difficulter than the first one.','This exercise is most difficult than the first one.','This exercise more difficult the first one.'], solution: 'Long adjectives use “more + adjective + than”.' },
    { prompt: 'Complete: “My bedroom is ___ than my brother’s.”', answer: 'smaller', distractors: ['smallest','more small','small'], solution: 'The comparative of “small” is “smaller”.' },
  ],
  en_past_be: [
    { prompt: 'Complete: “I ___ very tired last night.”', answer: 'was', distractors: ['were','am','be'], solution: 'Past “be” with “I” is “was”.' },
    { prompt: 'Complete: “We ___ at the cinema on Saturday.”', answer: 'were', distractors: ['was','are','is'], solution: 'Past “be” with “we” is “were”.' },
    { prompt: 'Choose the correct negative.', answer: 'He wasn’t at school yesterday.', distractors: ['He weren’t at school yesterday.','He didn’t was at school yesterday.','He not was at school yesterday.'], solution: 'The negative of “was” is “wasn’t”.' },
    { prompt: 'Choose the correct question.', answer: 'Were they happy?', distractors: ['Was they happy?','Did they were happy?','Were they be happy?'], solution: 'With “they”, invert “were” and the subject.' },
  ],
  en_past_regular: [
    { prompt: 'Complete: “She ___ her room yesterday.”', answer: 'cleaned', distractors: ['clean','cleans','cleaning'], solution: 'Regular past simple adds -ed.' },
    { prompt: 'Complete: “They ___ basketball after school.”', answer: 'played', distractors: ['play','plays','playing'], solution: '“Played” is the regular past form of “play”.' },
    { prompt: 'Choose the correct question.', answer: 'Did you watch the film?', distractors: ['Did you watched the film?','Do you watched the film?','Were you watch the film?'], solution: 'After “did”, use the base verb.' },
    { prompt: 'Choose the correct negative.', answer: 'We didn’t visit the castle.', distractors: ['We didn’t visited the castle.','We not visit the castle.','We weren’t visit the castle.'], solution: 'After “didn’t”, use the base form “visit”.' },
  ],
  en_past_irregular: [
    { prompt: 'What is the past form of “see”?', answer: 'saw', distractors: ['seed','seen','sees'], solution: '“See” is irregular: see → saw.' },
    { prompt: 'Complete: “We ___ home at six.”', answer: 'came', distractors: ['comed','come','comes'], solution: 'The past form of “come” is “came”.' },
    { prompt: 'What is the past form of “buy”?', answer: 'bought', distractors: ['buyed','brought','buys'], solution: '“Buy” is irregular: buy → bought.' },
    { prompt: 'Complete: “He ___ his keys on the table.”', answer: 'put', distractors: ['putted','puts','putting'], solution: 'The past form of “put” is also “put”.' },
  ],
  en_past_sequence: [
    { prompt: 'Choose the best connector: “___, we packed our bags. Then we called a taxi.”', answer: 'First', distractors: ['Finally','Because','But'], solution: '“First” introduces the initial event in a sequence.' },
    { prompt: 'Choose the best ending: “We visited the old town, had lunch and, ___, returned to the hotel.”', answer: 'finally', distractors: ['first','because','usually'], solution: '“Finally” marks the last event.' },
    { prompt: 'Which connector normally introduces the next event in a story?', answer: 'After that', distractors: ['Never','Because of','Much'], solution: '“After that” moves a chronological sequence forward.' },
    { prompt: 'Choose the logical sequence.', answer: 'First we arrived → then we checked in → finally we went to our room', distractors: ['Finally we arrived → first we went to our room → then we checked in','Then we checked in → first we went home → finally we arrived','First we left the hotel → finally we arrived before leaving → then we checked in'], solution: 'Arrival logically comes before check-in and going to the room.' },
  ],
  en_can: [
    { prompt: 'Complete: “My little brother ___ ride a bike now.”', answer: 'can', distractors: ['cans','is can','does can'], solution: '“Can” is unchanged for all subjects.' },
    { prompt: 'Choose the correct negative.', answer: 'We can’t park here.', distractors: ['We don’t can park here.','We cans not park here.','We aren’t can park here.'], solution: 'The negative form is “can’t / cannot”.' },
    { prompt: 'Choose the correct question.', answer: 'Can you speak French?', distractors: ['Do you can speak French?','Can you speaks French?','Are you can speak French?'], solution: 'Modal questions place “can” before the subject and use the base verb.' },
    { prompt: 'Which sentence expresses possibility or permission?', answer: 'You can use my calculator.', distractors: ['You used my calculator yesterday.','You must use my calculator.','You are using my calculator now.'], solution: '“Can” can give permission.' },
  ],
  en_must: [
    { prompt: 'Complete: “Students ___ be on time for the exam.”', answer: 'must', distractors: ['mustn’t','are','can’t'], solution: '“Must” expresses a strong obligation.' },
    { prompt: 'Choose: “You ___ touch that wire. It is dangerous.”', answer: 'mustn’t', distractors: ['must','can','have'], solution: '“Mustn’t” expresses prohibition.' },
    { prompt: 'Which sentence is a rule?', answer: 'You must show your ticket.', distractors: ['You showed your ticket yesterday.','You can draw a ticket.','You are showing a ticket now.'], solution: '“Must” is commonly used for rules and obligations.' },
    { prompt: 'Complete: “We ___ forget our passports.”', answer: 'mustn’t', distractors: ['must','are','do'], solution: '“Mustn’t forget” means it is essential not to forget them.' },
  ],
  en_going_to: [
    { prompt: 'Complete: “She is going to ___ a cake.”', answer: 'make', distractors: ['made','making','makes'], solution: '“Be going to” is followed by the base verb.' },
    { prompt: 'Choose the correct sentence.', answer: 'They are going to travel by train.', distractors: ['They is going to travel by train.','They are going travel by train.','They going to travelled by train.'], solution: 'With “they”, use “are going to + base verb”.' },
    { prompt: 'Complete: “What ___ you going to do this weekend?”', answer: 'are', distractors: ['is','do','did'], solution: 'With “you”, the correct form is “are going to”.' },
    { prompt: 'Which sentence expresses an intention?', answer: 'I’m going to save money for a bike.', distractors: ['I saved money yesterday.','I save coins every Monday.','I am a bike.'], solution: '“Be going to” expresses a planned intention.' },
  ],
  en_functional_language: [
    { prompt: 'Choose the best response to “Would you like some water?”', answer: 'Yes, please.', distractors: ['I water every day.','No, I am water.','At five o’clock.'], solution: '“Yes, please” politely accepts an offer.' },
    { prompt: 'Which expression politely asks for directions?', answer: 'Excuse me, how can I get to the station?', distractors: ['Station now.','You station where?','Take station me.'], solution: 'The phrase politely introduces a request for directions.' },
    { prompt: 'Choose a suitable response to “I’m sorry.”', answer: 'That’s OK.', distractors: ['I am twelve.','At the library.','Because Monday.'], solution: '“That’s OK” is a common response to an apology.' },
    { prompt: 'Choose the best suggestion.', answer: 'Why don’t we go by bus?', distractors: ['We went by bus yesterday.','You must bus.','Bus is going us.'], solution: '“Why don’t we…?” is a standard suggestion form.' },
  ],
  en_reading_gist: [
    { prompt: 'Read: “The town is opening a new cycle path next month. It will connect the school, park and sports centre.” What is the text mainly about?', answer: 'A new cycle route in the town', distractors: ['A school exam','A broken bicycle','A football result'], solution: 'The text focuses on a new cycle path and the places it connects.' },
    { prompt: 'Read: “Every Wednesday, the science club meets after school to build simple robots and test experiments.” What is the main idea?', answer: 'Students do practical science activities in a weekly club', distractors: ['Students have no science lessons','The school closes every Wednesday','Robots teach all the classes'], solution: 'The central idea is the club’s regular practical science work.' },
    { prompt: 'Read: “Lena is training for a charity race. She runs three times a week and records her times.” What is the text mainly about?', answer: 'Lena’s preparation for a race', distractors: ['A new running shoe shop','A school timetable','A cancelled race'], solution: 'The details all describe her training.' },
    { prompt: 'Read: “Our class is collecting books for the local hospital. We want patients to have more stories to read.” What is the main idea?', answer: 'A class is donating books to help hospital patients', distractors: ['The hospital is closing its library','The class is selling hospital tickets','Patients are writing school exams'], solution: 'The text is about a book collection for hospital patients.' },
  ],
  en_reading_detail: [
    { prompt: 'Read: “The train leaves at 10:15 from platform 6.” Which platform should you go to?', answer: 'Platform 6', distractors: ['Platform 10','Platform 15','Platform 16'], solution: 'The platform number is stated directly.' },
    { prompt: 'Read: “Nora bought apples, bread and cheese, but she forgot the milk.” What did she forget?', answer: 'The milk', distractors: ['The apples','The bread','The cheese'], solution: 'The final clause states that she forgot the milk.' },
    { prompt: 'Read: “The match starts at 17:30, but players must arrive at 16:45.” When must the players arrive?', answer: 'At 16:45', distractors: ['At 17:30','At 16:30','At 17:45'], solution: 'The required arrival time is given explicitly.' },
    { prompt: 'Read: “Kai chose the blue jacket because it was cheaper than the black one.” Why did he choose the blue jacket?', answer: 'Because it cost less', distractors: ['Because it was bigger','Because the black one was free','Because he dislikes blue'], solution: '“Cheaper” means it cost less.' },
  ],
  en_text_organisation: [
    { prompt: 'Choose the best connector: “The bus was late, ___ we missed the first lesson.”', answer: 'so', distractors: ['but','or','although'], solution: 'The second event is a result of the first.' },
    { prompt: 'Choose the best connector: “I like basketball, ___ I prefer swimming.”', answer: 'but', distractors: ['so','because','then'], solution: '“But” introduces a contrast.' },
    { prompt: 'Which sentence is the best topic sentence for a paragraph about healthy breakfasts?', answer: 'A healthy breakfast can give you energy for the morning.', distractors: ['For example, I sometimes eat yoghurt.','Finally, put the bowl away.','However, yesterday was Tuesday.'], solution: 'A topic sentence introduces the general idea of the paragraph.' },
    { prompt: 'Choose the best ending connector: “We checked the map, packed some water and, ___, started the walk.”', answer: 'finally', distractors: ['because','never','although'], solution: '“Finally” introduces the last step in a sequence.' },
  ],
  en_mediation: [
    { prompt: 'Your friend asks what “Keep off the grass” means. Choose the best explanation.', answer: 'Do not walk on the grass.', distractors: ['Water the grass now.','Sit on the grass.','Cut the grass today.'], solution: 'The sign tells people not to step on the grass.' },
    { prompt: 'Choose the best simple paraphrase of “The shop is closed on Sundays.”', answer: 'You cannot shop there on Sunday.', distractors: ['The shop only opens on Sunday.','Everything is free on Sunday.','The shop closes every morning.'], solution: 'The paraphrase keeps the same practical meaning.' },
    { prompt: 'A notice says “Please queue here”. How would you explain it simply?', answer: 'Wait in line here.', distractors: ['Run away from here.','Pay for the queue.','Sit anywhere you want.'], solution: '“Queue” means wait in a line.' },
    { prompt: 'Choose the best explanation of “Tickets sold out”.', answer: 'There are no tickets left to buy.', distractors: ['Tickets are cheaper today.','Tickets are only for children.','You must sell your ticket.'], solution: '“Sold out” means all available tickets have been bought.' },
  ],
}

function mix(seed: number, text: string) {
  let x = seed >>> 0
  for (let i = 0; i < text.length; i += 1) x = Math.imul(x ^ text.charCodeAt(i), 16777619) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function fromItem(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const options = rotate([item.answer, ...item.distractors], mix(seed, `${skill.id}:extra-options`) % 4)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [`family:${skill.generator_key}`, 'subject:english', 'expanded_bank'],
  }
}

export function generateExpandedEnglishQuestion(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion {
  const extras = EXTRA[skill.generator_key]
  if (!extras?.length) {
    const base = generateLanguageSubjectQuestion(skill, difficulty, seed)
    if (!base) throw new Error(`No English generator for ${skill.id}`)
    return base
  }

  const selector = mix(seed + difficulty * 131, skill.generator_key) % 6
  if (selector < 2) {
    const base = generateLanguageSubjectQuestion(skill, difficulty, seed)
    if (!base) throw new Error(`No English generator for ${skill.id}`)
    return base
  }
  return fromItem(skill, difficulty, seed, extras[selector - 2])
}

export function expandedEnglishGeneratorKeys() {
  return Object.keys(EXTRA)
}
