import type { GeneratedListeningItem } from './englishListeningGenerated'

const NAMES = ['Ava','Milo','Lily','Finn','Isla','Theo','Amir','Maya']
const PLACES = ['library','sports centre','museum','cinema','station','market','science centre','theatre']
const OBJECTS = ['notebook','charger','umbrella','camera','dictionary','helmet','map','headphones']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const ACTIVITIES = ['basketball','coding','swimming','drama','tennis','music','robotics','art']
const CITIES = ['Bath','York','Oxford','Leeds','Exeter','Cardiff','Brighton','Chester']

function pick<T>(values: T[], index: number, offset = 0) { return values[(index + offset) % values.length] }

function placeAnswer(correct: string, distractors: string[], shift: number) {
  const unique = distractors.filter((value, index, all) => value !== correct && all.indexOf(value) === index).slice(0, 3)
  if (unique.length !== 3) throw new Error(`Invalid listening depth distractors for ${correct}`)
  const answerIndex = ((shift % 4) + 4) % 4
  const result = [...unique]
  result.splice(answerIndex, 0, correct)
  return { options: result as [string,string,string,string], answerIndex }
}

function item(skillId: string, difficulty: number, spoken: string, question: string, correct: string, distractors: string[], solution: string, shift: number): GeneratedListeningItem {
  const { options, answerIndex } = placeAnswer(correct, distractors, shift)
  return { skillId, difficulty, spoken, question, options, answerIndex, solution }
}

function buildFor(skillId: string, i: number, family: number): GeneratedListeningItem {
  const name = pick(NAMES, i, family)
  const other = pick(NAMES, i, family + 3)
  const place = pick(PLACES, i, family)
  const otherPlace = pick(PLACES, i, family + 4)
  const object = pick(OBJECTS, i, family)
  const activity = pick(ACTIVITIES, i, family)
  const day = pick(DAYS, i, family)
  const city = pick(CITIES, i, family)

  if (skillId === 'E01S01') {
    if (family === 0) return item(skillId,2,`${name} has two brothers. The older one is fourteen and the younger one is nine. ${name} is twelve.`,`How many brothers does ${name} have?`,'Two',['One','Three','Four'],`The speaker mentions one older brother and one younger brother.`,i)
    return item(skillId,3,`${name} lives in ${city}, but spends every summer with grandparents in ${pick(CITIES,i,3)}. School and home are both in ${city}.`,`Which city is ${name}'s main home?`,city,[pick(CITIES,i,3),pick(CITIES,i,5),pick(CITIES,i,6)],`The speaker says both school and home are in ${city}.`,i+1)
  }

  if (skillId === 'E01S04') {
    if (family === 0) return item(skillId,2,`First write your name on the sheet. Next collect a ${object}. Only then open the workbook on page ${20+i}.`,`What should students do immediately before opening the workbook?`,`Collect a ${object}`,[`Write their name`,`Open page ${20+i}`,'Hand in the sheet'],`The equipment is collected immediately before the workbook is opened.`,i)
    return item(skillId,3,`Keep the worksheet on your desk, put the ${object} back in the box, and take your vocabulary list home.`,`Which item should be returned to the box?`,object,['The worksheet','The vocabulary list',pick(OBJECTS,i,4)],`The instruction explicitly says to put the ${object} back in the box.`,i+1)
  }

  if (skillId === 'E02S04') {
    if (family === 0) return item(skillId,2,`${name} practises ${activity} on ${day} and ${pick(DAYS,i,2)}, but never on Sunday because that is family day.`,`On which day does ${name} definitely not practise?`,'Sunday',['Monday','Wednesday','Friday'],`Sunday is explicitly excluded from the practice routine.`,i)
    return item(skillId,3,`${name} leaves home at seven forty-five. The bus takes twenty minutes and school begins at eight thirty.`,`How many minutes before school begins does ${name} arrive?`,'25 minutes',['10 minutes','20 minutes','45 minutes'],`7:45 plus 20 minutes is 8:05, which is 25 minutes before 8:30.`,i+1)
  }

  if (skillId === 'E03S03') {
    if (family === 0) return item(skillId,2,`The ${place} is behind the bank. The ${otherPlace} is between the bank and the park.`,`Which place is behind the bank?`,place,[otherPlace,'The park','The station'],`The first sentence places the ${place} behind the bank.`,i)
    return item(skillId,3,`${name} and ${other} both wear blue jackets. ${name} has a striped scarf, while ${other} carries a red backpack.`,`What distinguishes ${name} from ${other}?`,'A striped scarf',['A red backpack','A blue jacket','Dark shoes'],`The striped scarf belongs only to ${name}.`,i+1)
  }

  if (skillId === 'E04S04') {
    if (family === 0) return item(skillId,3,`${name} finished homework, then went to ${place}, and only after returning home called ${other}.`,`What happened immediately before ${name} called ${other}?`,'Returning home',[`Going to ${place}`,'Finishing homework','Eating breakfast'],`The call happened only after returning home.`,i)
    return item(skillId,4,`${name} wanted to cycle to ${place}, but the tyre was flat. A neighbour lent a pump, so the trip started twenty minutes late.`,`Why did the trip start late?`,'A flat tyre delayed the start',['The place opened late','The neighbour cancelled','It began to rain'],`The flat tyre caused the delay before the trip could begin.`,i+1)
  }

  if (skillId === 'E05S01') {
    if (family === 0) return item(skillId,2,`${name} can use the ${object} in class, but cannot take it home because another group needs it tomorrow.`,`What is ${name} allowed to do?`,`Use the ${object} in class`,[`Take the ${object} home`,`Keep the ${object} all week`,'Give it away'],`Use in class is allowed; taking it home is not.`,i)
    return item(skillId,3,`You can borrow my ${object} after lunch if I have finished using it. Before lunch I still need it.`,`When may the listener borrow the ${object}?`,'After lunch, if it is free',['Before breakfast','Immediately now','Next month only'],`Permission begins after lunch and depends on the item being free.`,i+1)
  }

  if (skillId === 'E05S02') {
    if (family === 0) return item(skillId,3,`At the ${place}, visitors must leave large bags in lockers, but small handbags may stay with them.`,`Which item must go in a locker?`,'A large bag',['A small handbag','A ticket','A phone'],`Only large bags are required to be stored.`,i)
    return item(skillId,4,`Cyclists must walk their bikes through the ${place} between ten and four. Outside those hours they may ride slowly.`,`What must cyclists do at midday?`,'Walk their bikes',['Ride quickly','Leave their bikes at home','Use a car instead'],`Midday falls between ten and four, when bikes must be walked.`,i+1)
  }

  if (skillId === 'E05S03') {
    if (family === 0) return item(skillId,3,`${name} is going to visit ${city} on ${day}. If the train strike continues, the visit will move to the following weekend.`,`What could make the visit change date?`,'The train strike',['The weather forecast','A school test','The price of lunch'],`The visit moves only if the train strike continues.`,i)
    return item(skillId,4,`${name} plans to practise ${activity} in the morning and meet ${other} at the ${place} after lunch. If practice overruns, the meeting will start half an hour later.`,`Which plan is conditional on practice finishing on time?`,`The meeting at the ${place}`,[`Morning ${activity}`,'Breakfast','Going to school'],`The afternoon meeting changes if practice overruns.`,i+1)
  }

  if (skillId === 'E05S04') {
    if (family === 0) return item(skillId,2,`At the café, ${name} asks for vegetable soup, but it has sold out. The server offers tomato pasta or a sandwich instead.`,`Why must ${name} choose a different dish?`,'The soup has sold out',['The café is closed','The soup is too expensive','Lunch has finished'],`The requested soup is unavailable because it has sold out.`,i)
    return item(skillId,3,`To reach the ${place}, go past the bank, turn left at the lights and take the second street on the right.`,`Where should the listener turn left?`,'At the traffic lights',['At the bank','At the second street','At the station'],`The directions say to turn left at the lights.`,i+1)
  }

  if (skillId === 'E06S02') {
    if (family === 0) return item(skillId,3,`The ${place} opens at nine. The first guided tour is at nine thirty, and ticket collection closes ten minutes before each tour.`,`By what time must tickets for the first tour be collected?`,'9:20',['9:00','9:30','9:40'],`Collection closes ten minutes before the 9:30 tour, at 9:20.`,i)
    return item(skillId,4,`A return ticket to ${city} costs twelve pounds. A single costs seven. ${name} needs to travel there and back on the same day.`,`Which ticket is cheaper for the complete journey?`,'The return ticket',['Two single tickets','They cost the same','No ticket is needed'],`Two singles cost fourteen pounds, more than the twelve-pound return ticket.`,i+1)
  }

  if (skillId === 'E06S04') {
    if (family === 0) return item(skillId,3,`The announcement says the ${place} entrance has moved to King Street today because the usual door is being repaired.`,`Where should visitors enter today?`,'King Street',['The usual door','The car park','The café'],`The temporary entrance is on King Street.`,i)
    return item(skillId,4,`${name} has a ticket for the two o'clock session, but arrives at two ten. Staff say the ticket can be moved to the three o'clock session without charge.`,`What solution do staff offer?`,'Move the ticket to three o’clock',['Pay for a new ticket','Enter the two o’clock session late','Come back next week'],`Staff offer a free transfer to the three o'clock session.`,i+1)
  }

  throw new Error(`Unsupported listening depth skill ${skillId}`)
}

const SKILLS = ['E01S01','E01S04','E02S04','E03S03','E04S04','E05S01','E05S02','E05S03','E05S04','E06S02','E06S04'] as const

export function buildEnglishListeningCourseDepthBank(): GeneratedListeningItem[] {
  const bank: GeneratedListeningItem[] = []
  for (const skillId of SKILLS) {
    for (let family = 0; family < 2; family += 1) {
      for (let i = 0; i < 8; i += 1) bank.push(buildFor(skillId, i, family))
    }
  }
  return bank
}
