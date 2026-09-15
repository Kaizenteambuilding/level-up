const fs = require('node:fs')

const fixes = [
  {
    file: 'components/GeographyMapsSession.tsx',
    before: "if (!generated) { setError('No se encontró un reto de cartografía nuevo sin repetir preguntas recientes. Vuelve a Geografía e Historia y prueba de nuevo más tarde.'); return }; recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, HISTORY);",
    after: "if (!generated) { const fallbackSkill = candidates[(index + recentTemplates.current.length) % candidates.length]; const fallbackSeed = (base + Math.imul(recentTemplates.current.length + index + 1, 0x27d4eb2d)) >>> 0; generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed) }; recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, HISTORY);",
  },
  {
    file: 'components/GeographyPhysicalSession.tsx',
    before: "if(!generated){setError('No se encontró un reto nuevo de geografía física sin repetir preguntas recientes. Vuelve al atlas y prueba de nuevo más tarde.');return}recentTemplates.current=[template(generated.prompt),...recentTemplates.current].slice(0,HISTORY);",
    after: "if(!generated){const fallbackSkill=candidates[(index+recentTemplates.current.length)%candidates.length],fallbackSeed=(base+Math.imul(recentTemplates.current.length+index+1,0x27d4eb2d))>>>0;generated=generateCurriculumQuestion(fallbackSkill,states[fallbackSkill.id]?.difficulty??1,fallbackSeed)}recentTemplates.current=[template(generated.prompt),...recentTemplates.current].slice(0,HISTORY);",
  },
  {
    file: 'components/HistoryAncientSession.tsx',
    before: "if(!generated){setError('No se encontró un reto histórico nuevo sin repetir preguntas recientes. Vuelve al atlas y prueba de nuevo más tarde.');return}recentTemplates.current=[template(generated.prompt),...recentTemplates.current].slice(0,HISTORY);",
    after: "if(!generated){const fallbackSkill=candidates[(index+recentTemplates.current.length)%candidates.length],fallbackSeed=(base+Math.imul(recentTemplates.current.length+index+1,0x27d4eb2d))>>>0;generated=generateCurriculumQuestion(fallbackSkill,states[fallbackSkill.id]?.difficulty??1,fallbackSeed)}recentTemplates.current=[template(generated.prompt),...recentTemplates.current].slice(0,HISTORY);",
  },
]

for (const { file, before, after } of fixes) {
  let source = fs.readFileSync(file, 'utf8')
  if (!source.includes(before)) throw new Error(`blocking fallback not found in ${file}`)
  source = source.replace(before, after)
  fs.writeFileSync(file, source)
}
