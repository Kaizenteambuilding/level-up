import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const BONUS: Record<string, Item> = {
  en_personal_info: { prompt: 'Choose the best answer: “What do you like doing after school?”', answer: 'I like playing basketball.', distractors: ['I am thirteen years old.','I live in Seville.','It is Wednesday.'], solution: 'The question asks about a leisure activity.' },
  en_be_pronouns: { prompt: 'Complete: “Anna and Tom ___ in my class.”', answer: 'are', distractors: ['is','am','be'], solution: 'A plural subject takes “are”.' },
  en_possessives_have: { prompt: 'Complete: “Mark has a sister. ___ name is Lucy.”', answer: 'Her', distractors: ['His','Their','Our'], solution: 'The sister is female, so the possessive adjective is “her”.' },
  en_classroom_language: { prompt: 'Which classroom instruction means “Escuchad con atención”?', answer: 'Listen carefully.', distractors: ['Stand up quickly.','Close your books.','Write your address.'], solution: '“Listen carefully” tells students to pay close attention to what they hear.' },
  en_present_simple: { prompt: 'Complete: “Our teacher ___ English and French.”', answer: 'speaks', distractors: ['speak','is speaking','spoke'], solution: 'A general fact with third-person singular uses present simple + -s.' },
  en_frequency: { prompt: 'Choose the best adverb: “I ___ forget my homework; perhaps once or twice a year.”', answer: 'rarely', distractors: ['always','usually','often'], solution: 'Something that happens only once or twice a year happens rarely.' },
  en_present_questions: { prompt: 'Choose the correct question.', answer: 'What does your brother eat for breakfast?', distractors: ['What do your brother eat for breakfast?','What your brother does eat for breakfast?','What is your brother eat for breakfast?'], solution: 'With “your brother”, use “does” followed by the base verb.' },
  en_routines_vocab: { prompt: 'What does “leave home” mean in a daily routine?', answer: 'salir de casa', distractors: ['volver a casa','limpiar la casa','comprar una casa'], solution: '“Leave home” means to go out from your home.' },
  en_present_continuous: { prompt: 'Complete: “Why ___ you laughing?”', answer: 'are', distractors: ['is','do','did'], solution: 'Present continuous questions with “you” use “are”.' },
  en_present_contrast: { prompt: 'Choose: “Dad normally ___ coffee, but right now he ___ tea.”', answer: 'drinks / is drinking', distractors: ['is drinking / drinks','drink / drinking','drank / drinks'], solution: 'The normal habit uses present simple; the current action uses present continuous.' },
  en_descriptions: { prompt: 'Choose the best description of a room.', answer: 'There is a lamp beside the bed.', distractors: ['There are a lamp beside the bed.','There is two lamps beside the bed.','There lamp is beside bed a.'], solution: 'A singular noun correctly follows “there is”.' },
  en_comparatives: { prompt: 'Complete: “January is usually ___ than July in Spain.”', answer: 'colder', distractors: ['coldest','more cold','cold'], solution: 'The comparative of the short adjective “cold” is “colder”.' },
  en_past_be: { prompt: 'Complete: “The shops ___ closed last Sunday.”', answer: 'were', distractors: ['was','are','is'], solution: 'A plural subject takes “were” in the past.' },
  en_past_regular: { prompt: 'Complete: “I ___ my grandparents last weekend.”', answer: 'called', distractors: ['call','calls','calling'], solution: 'The regular past form of “call” is “called”.' },
  en_past_irregular: { prompt: 'What is the past form of “take”?', answer: 'took', distractors: ['taked','taken','takes'], solution: '“Take” is irregular: take → took.' },
  en_past_sequence: { prompt: 'Choose the best connector: “We finished dinner. ___, we went for a walk.”', answer: 'After that', distractors: ['Before first','Always','Because of'], solution: '“After that” introduces the event that happened next.' },
  en_can: { prompt: 'Complete: “___ I borrow your pen, please?”', answer: 'Can', distractors: ['Do','Am','Must'], solution: '“Can I…?” can be used to ask permission.' },
  en_must: { prompt: 'Choose the best rule for a library.', answer: 'You must be quiet.', distractors: ['You must shout.','You can throw books.','You are quiet yesterday.'], solution: 'Being quiet is an appropriate obligation in a library.' },
  en_going_to: { prompt: 'Complete: “They ___ going to play tennis after lunch.”', answer: 'are', distractors: ['is','do','did'], solution: 'With “they”, the future plan structure is “are going to”.' },
  en_functional_language: { prompt: 'Choose the most polite way to ask for the bill in a restaurant.', answer: 'Could we have the bill, please?', distractors: ['Bill now.','You give bill.','We bill want.'], solution: '“Could we have… please?” is a polite request.' },
  en_reading_gist: { prompt: 'Read: “The youth centre has started a weekend photography club. Members learn to use cameras and share their pictures.” What is the text mainly about?', answer: 'A new photography club for young people', distractors: ['A camera shop closing','A school uniform rule','A professional football team'], solution: 'The whole text describes a new photography club and its activities.' },
  en_reading_detail: { prompt: 'Read: “The café serves breakfast until 11:30 and lunch from 12:00.” Until what time can you order breakfast?', answer: 'Until 11:30', distractors: ['Until 12:00','Until 10:30','Until 13:00'], solution: 'The breakfast finishing time is stated directly.' },
  en_text_organisation: { prompt: 'Choose the best connector: “I wanted to go cycling, ___ it started to rain.”', answer: 'but', distractors: ['so','because of','then because'], solution: '“But” introduces a contrast between the plan and the rain.' },
  en_mediation: { prompt: 'A sign says “Entrance on the left”. How would you explain it simply?', answer: 'Go in through the door on the left.', distractors: ['Leave through the right door.','The entrance is closed.','Wait outside on the right.'], solution: 'The message tells you where the entrance is located.' },
}

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

export function generateEnglishBonusQuestion(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const item = BONUS[skill.generator_key]
  if (!item) return null
  const options = rotate([item.answer, ...item.distractors], (seed + difficulty) % 4)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [`family:${skill.generator_key}`, 'subject:english', 'bonus_variant'],
  }
}

export function englishBonusGeneratorKeys() {
  return Object.keys(BONUS)
}
