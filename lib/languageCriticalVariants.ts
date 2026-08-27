import type { GeneratedQuestion } from './firstEvaluationGenerators'
import { generateLanguageSubjectQuestion } from './languageSubjectGenerators'
import { generateExpandedEnglishQuestion } from './englishExpandedGenerators'
import { generateEnglishBonusQuestion } from './englishBonusVariants'

type SkillMeta = { id: string; name: string; generator_key: string }
type Variant = { prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const VARIANTS: Record<string, Variant> = {
  L01S01: { prompt:'Lee: «El transporte público reduce el número de coches, puede disminuir la contaminación y facilita los desplazamientos». ¿Cuál es la idea principal?', answer:'El transporte público aporta beneficios a la movilidad y al entorno', distractors:['Solo sirve para reducir coches','La contaminación siempre desaparece','Moverse por la ciudad es imposible'], solution:'La idea principal reúne los beneficios generales expresados en el texto.' },
  L02S01: { prompt:'En «Aquellos alumnos trabajan silenciosamente», ¿qué clase de palabra es «silenciosamente»?', answer:'Adverbio', distractors:['Adjetivo','Determinante','Sustantivo'], solution:'Modifica al verbo “trabajan” e indica modo.' },
  L03S02: { prompt:'En «La hoja del árbol cayó al suelo», ¿qué significa «hoja»?', answer:'Parte plana de una planta', distractors:['Página de un libro','Cuchilla de una herramienta','Documento administrativo'], solution:'El contexto “del árbol” determina el significado vegetal.' },
  L04S01: { prompt:'¿Cuál de estas palabras es esdrújula y debe llevar tilde?', answer:'pájaro', distractors:['pared','reloj','papel'], solution:'“pájaro” es esdrújula y todas las esdrújulas llevan tilde.' },
  L05S03: { prompt:'¿Qué fragmento es claramente expositivo?', answer:'«La fotosíntesis es el proceso por el que las plantas producen materia orgánica usando luz.»', distractors:['«Corrí hasta casa mientras anochecía.»','«¡Qué hermoso estaba el cielo!»','«Cierra la puerta ahora mismo.»'], solution:'Define y explica un concepto de forma objetiva.' },
  L06S01: { prompt:'Una obra formada principalmente por diálogos y acotaciones pertenece al género…', answer:'dramático o teatral', distractors:['lírico','periodístico','científico'], solution:'Diálogos y acotaciones son rasgos propios del texto teatral.' },
  E01S01: { prompt:'Choose the best answer: “Where are you from?”', answer:'I’m from Spain.', distractors:['I’m thirteen.','My name is Leo.','It’s half past six.'], solution:'The question asks about origin or country.' },
  E02S01: { prompt:'Choose the correct sentence about a daily routine.', answer:'She walks to school every day.', distractors:['She walking to school every day.','She walk to school every day.','She is walk to school every day.'], solution:'With “she” in the present simple, the verb takes -s.' },
  E03S01: { prompt:'Choose the correct sentence for an action happening now.', answer:'They are studying now.', distractors:['They study now every day.','They is studying now.','They studying now.'], solution:'Present continuous uses be + verb-ing.' },
  E04S02: { prompt:'Choose the correct past simple form.', answer:'Yesterday we played football.', distractors:['Yesterday we play football.','Yesterday we playing football.','Yesterday we plays football.'], solution:'Regular past simple adds -ed: play → played.' },
  E05S03: { prompt:'Complete: “Next summer, I ___ visit my cousins.”', answer:'am going to', distractors:['is going to','are going to','going'], solution:'With “I”, the correct form is “am going to”.' },
  E06S01: { prompt:'Read: “Maya has a small garden. She grows tomatoes and herbs there every spring.” What is the text mainly about?', answer:'Maya’s garden and what she grows', distractors:['A school timetable','A winter holiday','A football match'], solution:'The general meaning is about Maya’s garden and plants.' },
}

function rotate<T>(items:T[], shift:number){ return items.slice(shift).concat(items.slice(0,shift)) }

export function generateLanguageQuestionWithCriticalVariants(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion {
  const variant = VARIANTS[skill.id]
  const isEnglish = skill.id.startsWith('E')
  const useCriticalVariant = Boolean(variant) && (isEnglish ? seed % 7 === 0 : (seed & 1) === 1)
  if (!useCriticalVariant) {
    if (isEnglish) {
      if (seed % 11 === 0) {
        const bonus = generateEnglishBonusQuestion(skill,difficulty,seed)
        if (bonus) return bonus
      }
      return generateExpandedEnglishQuestion(skill,difficulty,seed)
    }
    const base = generateLanguageSubjectQuestion(skill,difficulty,seed)
    if (!base) throw new Error(`No language generator for ${skill.id}`)
    return base
  }
  const selected = variant as Variant
  const options=[selected.answer,...selected.distractors]
  const rotated=rotate(options,(seed+difficulty)%4)
  return { skillId:skill.id,label:skill.name,difficulty,seed,prompt:selected.prompt,options:rotated,answerIndex:rotated.indexOf(selected.answer),solution:selected.solution,tags:[skill.generator_key,isEnglish?'english':'spanish','critical_variant'] }
}

export function languageCriticalVariantSkillIds(){ return Object.keys(VARIANTS) }
