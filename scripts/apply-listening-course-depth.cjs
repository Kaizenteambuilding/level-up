const fs = require('node:fs')

{
  const file = 'components/EnglishListeningSession.tsx'
  let source = fs.readFileSync(file, 'utf8')
  if (!source.includes("@/lib/englishListeningGenerated")) {
    source = source.replace(
      "import { ENGLISH_LISTENING_AUTHORED } from '@/lib/englishListeningAuthored'",
      "import { ENGLISH_LISTENING_AUTHORED } from '@/lib/englishListeningAuthored'\nimport { buildEnglishListeningGeneratedBank } from '@/lib/englishListeningGenerated'",
    )
  }
  source = source.replace(
    'const BANK: ListeningItem[] = [...CORE_BANK, ...ENGLISH_LISTENING_AUTHORED]',
    'const BANK: ListeningItem[] = [...CORE_BANK, ...ENGLISH_LISTENING_AUTHORED, ...buildEnglishListeningGeneratedBank()]',
  )
  fs.writeFileSync(file, source)
}

{
  const file = 'scripts/audit-english-listening-quality.cjs'
  let source = fs.readFileSync(file, 'utf8')
  if (!source.includes("const ts = require('typescript')")) {
    source = source.replace("const assert = require('node:assert/strict')", "const assert = require('node:assert/strict')\nconst ts = require('typescript')")
  }
  if (!source.includes("generatedPath")) {
    source = source.replace(
      "const authoredPath = path.join(root, 'lib', 'englishListeningAuthored.ts')",
      "const authoredPath = path.join(root, 'lib', 'englishListeningAuthored.ts')\nconst generatedPath = path.join(root, 'lib', 'englishListeningGenerated.ts')",
    )
  }
  if (!source.includes('function loadGeneratedBank')) {
    source = source.replace(
      "const authored = fs.readFileSync(authoredPath, 'utf8')",
      `const authored = fs.readFileSync(authoredPath, 'utf8')\n\nfunction loadGeneratedBank() {\n  const generatedSource = fs.readFileSync(generatedPath, 'utf8')\n  const compiled = ts.transpileModule(generatedSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText\n  const mod = { exports: {} }\n  new Function('exports','module','require',compiled)(mod.exports, mod, require)\n  return mod.exports.buildEnglishListeningGeneratedBank()\n}`,
    )
  }
  source = source.replace(
    "const handAuthored = parseItems(authored, 'export const ENGLISH_LISTENING_AUTHORED', 'authored')\nconst items = [...core, ...handAuthored]",
    "const handAuthored = parseItems(authored, 'export const ENGLISH_LISTENING_AUTHORED', 'authored')\nconst generated = loadGeneratedBank().map((entry, index) => ({ ...entry, origin: 'generated', index }))\nconst items = [...core, ...handAuthored, ...generated]",
  )
  source = source.replace(
    "assert(items.length >= 54, `Expected at least 54 listening items, found ${items.length}`)",
    "assert(generated.length >= 1760, `Expected at least 1760 generated listening items, found ${generated.length}`)\nassert(items.length >= 1814, `Expected at least 1814 listening items, found ${items.length}`)",
  )
  source = source.replace(
    "console.log(`Listening quality audit: ${items.length} items (${core.length} core + ${handAuthored.length} authored)`)",
    "console.log(`Listening quality audit: ${items.length} items (${core.length} core + ${handAuthored.length} authored + ${generated.length} generated)`)",
  )
  fs.writeFileSync(file, source)
}

fs.unlinkSync('scripts/apply-listening-course-depth.cjs')
