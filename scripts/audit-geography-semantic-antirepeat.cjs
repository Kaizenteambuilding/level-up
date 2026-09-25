const fs=require('node:fs')
const source=fs.readFileSync('components/GeographyPhysicalSession.tsx','utf8')
const bank=fs.readFileSync('lib/geographyLongTermVariants.ts','utf8')
const failures=[]
if(!source.includes("const PROMPT_FRAMES = ['analiza el mapa o la situacion:', 'aplica tus conocimientos de geografia:', 'reto geografico:']")) failures.push('semantic frame stripping missing')
if(!source.includes("normalize('NFD').replace(/[\\u0300-\\u036f]/g,''")) failures.push('accent normalization missing')
if(source.includes("fallbackSeed=(base+Math.imul(recentTemplates.current.length+index+1,0x27d4eb2d))")) failures.push('repeat-permitting fallback still present')
if(!source.includes("No quedan retos nuevos disponibles sin repetir contenido reciente.")) failures.push('fail-closed behavior missing')
const target='¿Por qué un día frío no contradice necesariamente un clima cálido?'
if(!bank.includes(target)) failures.push('reported regression fixture missing')
function canonical(value){let normalized=value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').trim();for(const frame of ['analiza el mapa o la situacion:','aplica tus conocimientos de geografia:','reto geografico:'])if(normalized.startsWith(frame))normalized=normalized.slice(frame.length).trim();return normalized}
const variants=[target,`Analiza el mapa o la situación: ${target}`,`Aplica tus conocimientos de geografía: ${target}`,`Reto geográfico: ${target}`]
if(new Set(variants.map(canonical)).size!==1) failures.push('reported prompt frames are not semantically deduplicated')
console.log(JSON.stringify({reportedPrompt:target,frameVariants:variants.length,canonicalKeys:new Set(variants.map(canonical)).size,failures},null,2))
if(failures.length)throw new Error('Geography semantic anti-repeat audit failed: '+failures.join(', '))
