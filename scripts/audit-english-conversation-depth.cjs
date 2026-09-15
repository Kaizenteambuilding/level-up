const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync('lib/englishConversationGenerated.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const moduleBox = { exports: {} }
vm.runInNewContext(compiled, { module: moduleBox, exports: moduleBox.exports, require, console }, { filename: 'englishConversationGenerated.js' })
const { generateEnglishConversationVariant, englishConversationVariantSkillIds } = moduleBox.exports

const expected = ['E01S01','E01S04','E02S03','E03S03','E05S01','E05S03','E05S04','E06S04']
const actualIds = [...englishConversationVariantSkillIds()].sort()
if (JSON.stringify(actualIds) !== JSON.stringify([...expected].sort())) throw new Error(`Unexpected conversation skill set: ${actualIds.join(', ')}`)

const stats = []
for (const skillId of expected) {
  const prompts = new Set()
  const normalized = new Set()
  for (let seed = 0; seed < 4096; seed += 1) {
    const item = generateEnglishConversationVariant({ id: skillId, name: skillId, generator_key: `test_${skillId}` }, 2, seed)
    if (!item) throw new Error(`${skillId} returned no item for seed ${seed}`)
    if (!Array.isArray(item.options) || item.options.length !== 4) throw new Error(`${skillId} seed ${seed} does not have four options`)
    if (new Set(item.options).size !== 4) throw new Error(`${skillId} seed ${seed} has duplicate options`)
    if (item.answerIndex < 0 || item.answerIndex > 3) throw new Error(`${skillId} seed ${seed} has invalid answer index`)
    if (!item.solution || item.solution.trim().length < 12) throw new Error(`${skillId} seed ${seed} has a weak solution`)
    prompts.add(item.prompt)
    normalized.add(item.prompt.toLowerCase().replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim())
  }
  if (prompts.size < 48) throw new Error(`${skillId} only exposes ${prompts.size} distinct prompts`)
  if (normalized.size < 40) throw new Error(`${skillId} collapses to only ${normalized.size} normalized prompt patterns`)
  stats.push(`${skillId}:${prompts.size}/${normalized.size}`)
}

const session = fs.readFileSync('components/EnglishConversationSession.tsx', 'utf8')
if (!session.includes("import { generateEnglishConversationVariant } from '@/lib/englishConversationGenerated'")) throw new Error('Conversation session is not wired to the course-depth generator')
if (!session.includes('const courseQuestion = generateEnglishConversationVariant(candidate, difficulty, seed)')) throw new Error('Conversation session does not prioritize course-depth questions')
if (!session.includes('generated = generateEnglishConversationVariant(fallbackSkill')) throw new Error('Conversation fallback does not retain course-depth content')
if (session.includes('No se encontró') && session.includes('sin repetir')) throw new Error('Conversation novelty must never be a hard blocker')

console.log(`English conversation depth OK (exact/normalized prompts): ${stats.join(', ')}`)
