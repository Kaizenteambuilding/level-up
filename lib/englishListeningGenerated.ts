export type GeneratedListeningItem = {
  skillId: string
  difficulty: number
  spoken: string
  question: string
  options: [string, string, string, string]
  answerIndex: number
  solution: string
}

const NAMES = ['Alex','Maya','Leo','Nora','Sam','Ivy','Ben','Lina','Owen','Ruby','Max','Ella','Noah','Zoe','Hugo','Mia','Lucas','Sara','Daniel','Emma','Tom','Chloe','Adam','Lucy','Jack','Sofia','Ryan','Grace','Eric','Anna','Oscar','Eva']
const CITIES = ['Bristol','York','Leeds','Oxford','Bath','Exeter','Cardiff','Brighton','Norwich','Derby','Lincoln','Chester','Durham','Plymouth','Reading','Cambridge','Liverpool','Sheffield','Nottingham','Canterbury','Portsmouth','Manchester','Newcastle','Leicester','Coventry','Worcester','Carlisle','Lancaster','Winchester','Salisbury','Gloucester','Hereford']
const PLACES = ['library','sports centre','museum','cinema','station','market','swimming pool','science centre','theatre','bookshop','park','café','community hall','gallery','stadium','aquarium','castle','zoo','music school','ice rink','youth club','bus station','planetarium','art centre','botanical garden','tennis club','shopping centre','history museum','nature reserve','concert hall','harbour','visitor centre']
const OBJECTS = ['calculator','laptop','dictionary','umbrella','bike lock','headphones','charger','notebook','camera','ruler','tablet','water bottle','backpack','torch','map','pencil case','football','raincoat','skateboard','helmet','speaker','compass','paintbrush','tripod','gloves','scarf','binoculars','book','jacket','power bank','ticket holder','folder']
const FOODS = ['vegetable soup','tomato pasta','chicken sandwich','cheese toastie','fruit salad','baked potato','rice bowl','bean wrap','mushroom pizza','tuna salad','lentil soup','egg sandwich','pasta salad','vegetable curry','fish pie','noodle bowl','omelette','chicken wrap','tomato soup','cheese pasta','salad bowl','bean burger','vegetable pie','rice salad','pancakes','jacket potato','pasta bake','vegetable sandwich','chicken salad','pumpkin soup','falafel wrap','cheese salad']
const TRANSPORT = ['bus','train','tram','coach']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const SUBJECTS = ['science','maths','English','history','art','geography','music','computing']
const ACTIVITIES = ['basketball','chess','swimming','drama','tennis','coding','football','music','art','dance','robotics','badminton']

function timeLabel(hour: number, minute: number) {
  return `${hour}:${String(minute).padStart(2, '0')}`
}

function placeAnswer(correct: string, distractors: string[], shift: number) {
  const unique = distractors.filter((value, index, all) => value !== correct && all.indexOf(value) === index).slice(0, 3)
  if (unique.length !== 3) throw new Error(`Invalid listening distractors for ${correct}`)
  const options = unique as [string, string, string]
  const answerIndex = ((shift % 4) + 4) % 4
  const result = [...options] as string[]
  result.splice(answerIndex, 0, correct)
  return { options: result as [string,string,string,string], answerIndex }
}

function item(skillId: string, difficulty: number, spoken: string, question: string, correct: string, distractors: string[], solution: string, shift: number): GeneratedListeningItem {
  const { options, answerIndex } = placeAnswer(correct, distractors, shift)
  return { skillId, difficulty, spoken, question, options, answerIndex, solution }
}

function byIndex<T>(values: T[], i: number, offset = 0) { return values[(i + offset) % values.length] }

const VARIANTS = 32

function e01s01(family: number, i: number) {
  const name = byIndex(NAMES, i, family * 3), city = byIndex(CITIES, i, family * 5)
  const age = 11 + ((i + family) % 5), other = age + 1
  if (family === 0) return item('E01S01',1,`${name} is ${age} years old and lives in ${city}.`,`How old is ${name}?`,String(age),[String(age-1),String(age+1),String(age+2)],`${name} says that they are ${age} years old.`,i)
  if (family === 1) return item('E01S01',2,`${name} was born in ${byIndex(CITIES,i,7)} but now lives in ${city} with an older cousin.`,`Where does ${name} live now?`,city,[byIndex(CITIES,i,7),byIndex(CITIES,i,11),byIndex(CITIES,i,17)],`The current home is ${city}; the other city is the birthplace.`,i+1)
  if (family === 2) return item('E01S01',2,`${name}'s favourite subject is ${byIndex(SUBJECTS,i)} because the lessons are practical, although ${byIndex(SUBJECTS,i,3)} is easier.`,`Which subject is ${name}'s favourite?`,byIndex(SUBJECTS,i),[byIndex(SUBJECTS,i,3),byIndex(SUBJECTS,i,4),byIndex(SUBJECTS,i,5)],`The speaker explicitly names ${byIndex(SUBJECTS,i)} as the favourite subject.`,i+2)
  if (family === 3) return item('E01S01',3,`${name}'s cousin is ${other}. ${name} is one year younger, and their brother is two years younger than ${name}.`,`How old is ${name}?`,String(age),[String(other),String(age-2),String(age+2)],`${name} is one year younger than a ${other}-year-old cousin, so is ${age}.`,i+3)
  return item('E01S01',3,`${name} moved from ${byIndex(CITIES,i,2)} to ${city} three years ago and visits the old neighbourhood every summer.`,`Which city is ${name}'s current home?`,city,[byIndex(CITIES,i,2),byIndex(CITIES,i,8),byIndex(CITIES,i,14)],`The move was to ${city}, so that is the current home.`,i)
}

function e01s04(family: number, i: number) {
  const page = 18 + i, next = page + 2
  if (family === 0) return item('E01S04',1,`Open your books on page ${page}, read the first paragraph, and underline two key words.`,`Which page should students open?`,String(page),[String(page-2),String(next),String(page+10)],`The instruction gives page ${page}.`,i)
  if (family === 1) return item('E01S04',2,`Work alone on questions one to ${3 + (i%4)}. Then compare the next question with a partner.`,`Which part should students do with a partner?`,`The next question`,['Questions one to three','The whole worksheet','Only the title'],`Partner work starts after the individual questions.`,i+1)
  if (family === 2) return item('E01S04',2,`Before using the equipment, write today's date and your group number at the top of the page.`,`What should students do before using the equipment?`,`Write the date and group number`,['Collect the equipment','Start the experiment','Read the results'],`The date and group number must be written first.`,i+2)
  if (family === 3) return item('E01S04',3,`Listen to the recording twice. On the first listen, do not write anything; on the second, complete boxes ${1+i%3} to ${4+i%3}.`,`When should students write?`,`During the second listen`,['During the first listen','Before the recording','After leaving class'],`Writing is explicitly reserved for the second listen.`,i+3)
  return item('E01S04',3,`Put your finished sheet in the blue tray, but keep the vocabulary list because you will need it for tomorrow's lesson.`,`What should students keep?`,`The vocabulary list`,['The finished sheet','The blue tray','Tomorrow’s worksheet'],`The finished sheet is handed in; the vocabulary list is kept.`,i)
}

function e02s04(family: number, i: number) {
  const hour = 6 + (i % 3), minute = [0,15,30,45][i%4]
  const start = timeLabel(hour, minute), finish = timeLabel(hour + 1, minute)
  const activity = byIndex(ACTIVITIES,i)
  if (family === 0) return item('E02S04',1,`I get up at ${start} and have breakfast thirty minutes later before school.`,`When does the speaker have breakfast?`,timeLabel(hour + (minute>=30?1:0),(minute+30)%60),[start,finish,timeLabel(hour,(minute+15)%60)],`Breakfast is thirty minutes after ${start}.`,i)
  if (family === 1) return item('E02S04',2,`After school I do my homework before ${activity}, and I have dinner after ${activity}.`,`What happens first after school?`,`Homework`,[activity,'Dinner','Going to bed'],`Homework comes before the activity and dinner.`,i+1)
  if (family === 2) return item('E02S04',2,`${activity} practice starts at ${start} and finishes at ${finish} every ${byIndex(DAYS,i)}.`,`When does ${activity} practice finish?`,finish,[start,timeLabel(hour,30),timeLabel(hour+2,minute)],`The speaker says practice finishes at ${finish}.`,i+2)
  if (family === 3) return item('E02S04',3,`The film begins at ${timeLabel(7 + i%2,30)}. We want to arrive twenty minutes early, and the ${byIndex(TRANSPORT,i)} journey takes fifteen minutes.`,`How many minutes before the film should they leave?`,`35 minutes`,['15 minutes','20 minutes','50 minutes'],`They need 20 minutes of early arrival plus 15 minutes of travel.`,i+3)
  return item('E02S04',3,`I usually walk home, but on ${byIndex(DAYS,i)} I stay for ${activity}, so my dad collects me by car afterwards.`,`How does the speaker get home after ${activity}?`,`By car`,['On foot','By bicycle','By bus'],`The speaker says their dad collects them by car.`,i)
}

function e03s03(family: number, i: number) {
  const name = byIndex(NAMES,i), place = byIndex(PLACES,i), other = byIndex(PLACES,i,7)
  if (family === 0) return item('E03S03',1,`The ${place} is next to the bank and opposite the ${other}.`,`What is opposite the ${place}?`,other,['The bank',byIndex(PLACES,i,11),byIndex(PLACES,i,15)],`The description places the ${other} opposite the ${place}.`,i)
  if (family === 1) return item('E03S03',2,`${name} has long curly hair, wears a green jacket and carries a black backpack.`,`Which detail describes ${name}'s hair?`,`Long and curly`,['Short and curly','Long and straight','Short and straight'],`The hair is described as long and curly.`,i+1)
  if (family === 2) return item('E03S03',2,`There are two chairs beside the desk, a lamp on the desk and a bag under it.`,`Where is the lamp?`,`On the desk`,['Under the desk','Beside the desk','Behind the desk'],`The lamp is explicitly on the desk.`,i+2)
  if (family === 3) return item('E03S03',3,`${name} and ${byIndex(NAMES,i,5)} both have dark hair. ${name} wears glasses, while the other person wears a red scarf.`,`Which detail identifies ${name}?`,`Glasses`,['A red scarf','Light hair','A blue hat'],`Only ${name} is described as wearing glasses.`,i+3)
  return item('E03S03',4,`The small blue suitcase belongs to ${name}. The large blue one belongs to a parent, and the small black one belongs to a sibling.`,`Which suitcase belongs to ${name}?`,`The small blue suitcase`,['The large blue suitcase','The small black suitcase','The large black suitcase'],`The first sentence identifies the small blue suitcase as ${name}'s.`,i)
}

function e04s04(family: number, i: number) {
  const name = byIndex(NAMES,i), activity = byIndex(ACTIVITIES,i), place = byIndex(PLACES,i)
  if (family === 0) return item('E04S04',2,`First ${name} visited the ${place}, then had lunch, and finally went to the park.`,`What did ${name} do last?`,`Went to the park`,[`Visited the ${place}`,'Had lunch','Went home before lunch'],`“Finally” marks the last event: going to the park.`,i)
  if (family === 1) return item('E04S04',3,`${name} missed the bus, so walked to school and arrived ten minutes late.`,`Why did ${name} walk to school?`,`The bus was missed`,['The bus was free','The school was closed','The road was shorter'],`Walking happened because the bus was missed.`,i+1)
  if (family === 2) return item('E04S04',3,`We planned to play ${activity}, but the outdoor area was flooded, so we went to the sports centre instead.`,`Why did the plan change?`,`The outdoor area was flooded`,['The sports centre was closed','Nobody liked the activity','The weather became hotter'],`The flooded outdoor area forced the change.`,i+2)
  if (family === 3) return item('E04S04',4,`${name} thought the test was on Thursday and planned to revise Wednesday evening. Then the teacher reminded everyone that the test was actually Wednesday morning.`,`What is the problem with ${name}'s plan?`,`The revision would happen after the test`,['The test was cancelled','Thursday is a holiday','The teacher changed subjects'],`Wednesday evening is after a Wednesday morning test.`,i+3)
  return item('E04S04',4,`${name} said the book began slowly, but after chapter ${2+i%3} it became so interesting that it was finished that evening.`,`How did ${name}'s opinion change?`,`The book became much more interesting`,['The book became more confusing','The ending was skipped','The book became less interesting'],`The speaker moved from finding it slow to being unable to stop reading.`,i)
}

function e05s01(family: number, i: number) {
  const object = byIndex(OBJECTS,i), other = byIndex(OBJECTS,i,9)
  if (family === 0) return item('E05S01',1,`You can borrow my ${object}, but you cannot use my ${other}.`,`What can be borrowed?`,object,[other,byIndex(OBJECTS,i,13),byIndex(OBJECTS,i,17)],`Permission is given for the ${object}.`,i)
  if (family === 1) return item('E05S01',2,`Can you help me carry these boxes into the ${byIndex(PLACES,i)}, please?`,`What favour is being requested?`,`Help carrying the boxes`,['Help opening the boxes','Help counting the boxes','Help labelling the boxes'],`The request is specifically to carry the boxes.`,i+1)
  if (family === 2) return item('E05S01',2,`You may use the ${object} until ${timeLabel(4+i%3,30)}, as long as you return it before I leave.`,`What condition is attached to using the ${object}?`,`It must be returned before the owner leaves`,['It must be bought first','It can only be used tomorrow','It must stay switched off'],`The permission depends on returning it before the owner leaves.`,i+2)
  if (family === 3) return item('E05S01',3,`Could you hold the door while I carry the ${other} and the ${object} inside?`,`What should the listener do?`,`Hold the door`,[`Carry the ${other}`,`Repair the ${object}`,'Close the door'],`The direct request is to hold the door.`,i+3)
  return item('E05S01',3,`You can take the ${object} home tonight, provided you bring it back before the first lesson tomorrow.`,`When must the ${object} be returned?`,`Before the first lesson tomorrow`,['At lunchtime today','Next weekend','After school tomorrow'],`The condition says it must be back before the first lesson.`,i)
}

function e05s02(family: number, i: number) {
  const place = byIndex(PLACES,i), object = byIndex(OBJECTS,i)
  if (family === 0) return item('E05S02',2,`Visitors must show their tickets at the entrance to the ${place}.`,`What must visitors show?`,`Their tickets`,['Their homework','Their lunch','Their timetable'],`Tickets are required at the entrance.`,i)
  if (family === 1) return item('E05S02',2,`You must not feed the animals in this part of the ${place}.`,`What is prohibited?`,`Feeding the animals`,['Watching the animals','Walking slowly','Taking notes'],`“Must not” marks feeding the animals as prohibited.`,i+1)
  if (family === 2) return item('E05S02',3,`Cyclists may use the path before ${timeLabel(8+i%2,0)}, but during the day it is for pedestrians only.`,`When may cyclists use the path?`,`Before the stated morning time`,['Only at lunchtime','During the afternoon','Only after closing time'],`Cyclists are allowed only before the morning restriction begins.`,i+2)
  if (family === 3) return item('E05S02',4,`Food is allowed in the picnic area, but glass bottles must stay outside the ${place}. Plastic bottles and the ${object} are fine.`,`Which item is not allowed inside?`,`A glass bottle`,['A plastic bottle',object,'A sandwich'],`The rule excludes glass bottles only.`,i+3)
  return item('E05S02',4,`At the ${place}, bags may be carried downstairs, but they must be left in a locker before entering the exhibition room.`,`What must happen before entering the exhibition room?`,`Bags must be left in a locker`,['Bags must be opened','Tickets must be thrown away','Shoes must be removed'],`The rule requires bags to be stored in a locker.`,i)
}

function e05s03(family: number, i: number) {
  const city = byIndex(CITIES,i), place = byIndex(PLACES,i), activity = byIndex(ACTIVITIES,i)
  if (family === 0) return item('E05S03',2,`This weekend we are going to visit the ${place} in ${city}.`,`What is the weekend plan?`,`Visit the ${place} in ${city}`,[`Visit the ${byIndex(PLACES,i,8)} in ${city}`,`Visit the ${place} in ${byIndex(CITIES,i,6)}`,`Stay at home`],`The plan is explicitly to visit the ${place} in ${city}.`,i)
  if (family === 1) return item('E05S03',3,`I am going to save ${10 + (i%5)*5} pounds each month because I want to buy new equipment for ${activity}.`,`Why is the speaker saving money?`,`To buy equipment for ${activity}`,['To pay a bus fine','To buy lunch at school','To repair a classroom'],`The saving goal is equipment for ${activity}.`,i+1)
  if (family === 2) return item('E05S03',3,`I planned to study at the ${place} on Saturday, but it closes early then, so I will go on Friday after school instead.`,`What has the speaker decided to do?`,`Go on Friday after school`,['Go on Saturday evening','Go on Sunday morning','Stop studying'],`The revised plan is Friday after school.`,i+2)
  if (family === 3) return item('E05S03',4,`If the weather stays dry, we will cycle to the ${place}. If it rains, we will take the train to ${city} instead.`,`What determines the plan?`,`The weather`,['The ticket colour','The school timetable','The number of cousins'],`The two alternatives depend on whether it rains.`,i+3)
  return item('E05S03',4,`Next ${byIndex(DAYS,i)} ${byIndex(NAMES,i)} is going to practise ${activity} in the morning and visit the ${place} in the afternoon.`,`What is planned for the afternoon?`,`Visit the ${place}`,[`Practise ${activity}`,'Stay at home','Take a test'],`The afternoon plan is the visit to the ${place}.`,i)
}

function e05s04(family: number, i: number) {
  const food = byIndex(FOODS,i), place = byIndex(PLACES,i), city = byIndex(CITIES,i)
  if (family === 0) return item('E05S04',1,`Would you like some ${food}?`,`What is being offered?`,food,[byIndex(FOODS,i,4),byIndex(FOODS,i,9),byIndex(FOODS,i,14)],`The offer names ${food}.`,i)
  if (family === 1) return item('E05S04',2,`Excuse me, how can I get to the ${place}?`,`What information does the speaker need?`,`Directions to the ${place}`,[`The opening time of the ${place}`,`The price at the ${place}`,`The phone number of the ${place}`],`“How can I get to” asks for directions.`,i+1)
  if (family === 2) return item('E05S04',2,`Why don't we meet outside the ${place} at ${timeLabel(5+i%3,45)}?`,`Where is the meeting point?`,`Outside the ${place}`,[`Inside the ${place}`,`At the station in ${city}`,'At home'],`The proposed meeting point is outside the ${place}.`,i+2)
  if (family === 3) return item('E05S04',3,`I would like the ${food}, please. Could I have bread instead of chips with it?`,`What change does the customer request?`,`Bread instead of chips`,['Chips instead of bread','Soup instead of bread','No side dish'],`The customer asks to replace chips with bread.`,i+3)
  return item('E05S04',3,`The quickest route to the ${place} is through the park, but the gate is locked today. Go along King Street instead.`,`Why should the listener avoid the park route?`,`The gate is locked`,['The park is too expensive','King Street is closed','The route is underwater'],`The park route cannot be used because the gate is locked.`,i)
}

function e06s02(family: number, i: number) {
  const place = byIndex(PLACES,i), city = byIndex(CITIES,i), transport = byIndex(TRANSPORT,i)
  if (family === 0) return item('E06S02',2,`The ${place} opens at ${timeLabel(9+i%2,0)}, but the café does not open until one hour later.`,`When does the café open?`,timeLabel(10+i%2,0),[timeLabel(9+i%2,0),timeLabel(11+i%2,0),timeLabel(8+i%2,30)],`The café opens one hour after the ${place}.`,i)
  if (family === 1) return item('E06S02',3,`The red ${transport} goes directly to ${city}, while the blue one stops at the hospital first.`,`Which ${transport} goes directly to ${city}?`,`The red ${transport}`,[`The blue ${transport}`,'Both services','Neither service'],`The red service is described as direct.`,i+1)
  if (family === 2) return item('E06S02',3,`The trip to the ${place} costs ${15+i%8} pounds, including transport and lunch, but not the entrance ticket.`,`What is not included in the price?`,`The entrance ticket`,['Transport','Lunch','Transport and lunch'],`The entrance ticket is explicitly excluded.`,i+2)
  if (family === 3) return item('E06S02',4,`The ${timeLabel(10,i%4*15)} ${transport} is delayed by twenty minutes. The next service leaves fifteen minutes later but reaches ${city} five minutes earlier.`,`Which service reaches ${city} first?`,`The next service`,['The delayed service','They arrive together','Neither service runs'],`The announcement says the next service arrives five minutes earlier.`,i+3)
  return item('E06S02',4,`Entry to the ${place} is free for children under twelve. Students aged twelve and over pay four pounds, and adults pay seven.`,`How much does a thirteen-year-old student pay?`,`Four pounds`,['Nothing','Seven pounds','Eleven pounds'],`A thirteen-year-old student is twelve or over, so pays four pounds.`,i)
}

function e06s04(family: number, i: number) {
  const place = byIndex(PLACES,i), food = byIndex(FOODS,i)
  if (family === 0) return item('E06S04',2,`Please queue here for the ${place} and have your ticket ready.`,`What should visitors have ready?`,`Their ticket`,['Their lunch','Their homework','Their passport photo'],`The instruction says to have the ticket ready.`,i)
  if (family === 1) return item('E06S04',3,`Tickets for the ${place} are sold out tonight, but there are still seats available tomorrow.`,`What can someone still do?`,`Buy a ticket for tomorrow`,['Buy a ticket for tonight','Enter tonight without a ticket','Cancel tomorrow’s event'],`Tomorrow still has seats available.`,i+1)
  if (family === 2) return item('E06S04',3,`The café kitchen closes at ${timeLabel(3+i%2,0)}, although drinks are served until ${timeLabel(4+i%2,30)}.`,`What can a customer still order after the kitchen closes?`,`A drink`,[food,'A cooked meal','A hot sandwich'],`Food service has ended, but drinks continue later.`,i+2)
  if (family === 3) return item('E06S04',4,`Your ticket is for the balcony, not the stalls. Use the stairs on the left after the main entrance; the right-hand stairs lead to the stalls.`,`Which route should the ticket holder take?`,`The left-hand stairs to the balcony`,['The right-hand stairs to the stalls','The exit beside the café','The stairs to the basement'],`The balcony is reached by the stairs on the left.`,i+3)
  return item('E06S04',4,`The ${place} closes at six, but the final guided tour starts at five fifteen and lasts forty minutes.`,`Can someone joining the final tour finish before closing?`,`Yes, it finishes before six`,['No, it finishes after six','No, the tour starts at six','There is no final tour'],`A 5:15 start plus 40 minutes ends at 5:55, before six.`,i)
}

const BUILDERS = [e01s01,e01s04,e02s04,e03s03,e04s04,e05s01,e05s02,e05s03,e05s04,e06s02,e06s04]

export function buildEnglishListeningGeneratedBank(): GeneratedListeningItem[] {
  const bank: GeneratedListeningItem[] = []
  for (const builder of BUILDERS) {
    for (let family = 0; family < 5; family += 1) {
      for (let i = 0; i < VARIANTS; i += 1) bank.push(builder(family, i))
    }
  }
  return bank
}
