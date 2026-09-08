export type EnglishListeningItem = {
  skillId: string
  difficulty: number
  spoken: string
  question: string
  options: [string, string, string, string]
  answerIndex: number
  solution: string
}

function rotate<T>(items: [T, T, T, T], shift: number): [T, T, T, T] {
  const n = ((shift % 4) + 4) % 4
  const rotated = items.slice(n).concat(items.slice(0, n)) as [T, T, T, T]
  return rotated
}

function itemWithAnswer(
  base: Omit<EnglishListeningItem, 'options' | 'answerIndex'>,
  answer: string,
  distractors: [string, string, string],
  shift: number
): EnglishListeningItem {
  const options = rotate([answer, ...distractors], shift)
  return { ...base, options, answerIndex: options.indexOf(answer) }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ROUTINE_TIMES = [
  ['7:15', '7:00', '7:30', '7:45'],
  ['7:30', '7:15', '7:45', '8:00'],
  ['7:45', '7:30', '8:00', '8:15'],
  ['8:00', '7:45', '8:15', '8:30'],
  ['8:15', '8:00', '8:30', '8:45'],
] as const

const routine: EnglishListeningItem[] = DAYS.flatMap((day, dayIndex) =>
  ROUTINE_TIMES.map((times, timeIndex) => {
    const [answer, before, after, later] = times
    const difficulty = timeIndex >= 3 ? 3 : 2
    return itemWithAnswer(
      {
        skillId: 'E02S04',
        difficulty,
        spoken: `On ${day}s I leave home at ${before}, catch the bus at ${answer}, and classes begin at ${after}.`,
        question: 'What time does the speaker catch the bus?',
        solution: `The speaker says the bus is caught at ${answer}; the other times refer to leaving home or starting classes.`,
      },
      answer,
      [before, after, later],
      dayIndex + timeIndex
    )
  })
)

const DESTINATIONS = ['Bristol', 'Oxford', 'Leeds', 'York', 'Bath']
const DEPARTURES = ['8:20', '8:40', '9:00', '9:20', '9:40']
const travel: EnglishListeningItem[] = DESTINATIONS.flatMap((destination, destinationIndex) =>
  DEPARTURES.map((departure, timeIndex) => {
    const nextDestination = DESTINATIONS[(destinationIndex + 1) % DESTINATIONS.length]
    const laterDestination = DESTINATIONS[(destinationIndex + 2) % DESTINATIONS.length]
    const platform = String(2 + ((destinationIndex + timeIndex) % 4))
    const otherPlatform = String(platform === '5' ? 2 : Number(platform) + 1)
    return itemWithAnswer(
      {
        skillId: 'E06S02',
        difficulty: timeIndex >= 2 ? 4 : 3,
        spoken: `The ${departure} train to ${destination} leaves from platform ${platform}. The train after it goes to ${nextDestination}, and the later service goes to ${laterDestination}.`,
        question: `Which detail is correct for the ${departure} service?`,
        solution: `The announcement links the ${departure} service with ${destination} and platform ${platform}.`,
      },
      `${destination}, platform ${platform}`,
      [`${nextDestination}, platform ${platform}`, `${destination}, platform ${otherPlatform}`, `${laterDestination}, platform ${otherPlatform}`],
      destinationIndex * 2 + timeIndex
    )
  })
)

const RULE_PLACES = ['library', 'science lab', 'sports hall', 'museum', 'computer room']
const RULE_ACTIONS = [
  ['keep your phone silent', 'use headphones', 'leave drinks outside', 'show your pass'],
  ['wear safety glasses', 'tie back long hair', 'leave bags by the door', 'wash your hands'],
  ['wear indoor trainers', 'bring a water bottle', 'leave coats in the changing room', 'wait for the coach'],
  ['keep your ticket', 'leave large bags at reception', 'stay behind the marked line', 'follow the guide'],
  ['save your work often', 'use your own login', 'leave food outside', 'log out before leaving'],
] as const

const rules: EnglishListeningItem[] = RULE_PLACES.flatMap((place, placeIndex) =>
  RULE_ACTIONS[placeIndex].map((action, actionIndex) => {
    const alternatives = RULE_ACTIONS[placeIndex].filter((value) => value !== action) as unknown as [string, string, string]
    return itemWithAnswer(
      {
        skillId: actionIndex % 2 === 0 ? 'E05S02' : 'E05S01',
        difficulty: actionIndex >= 2 ? 4 : 3,
        spoken: `Before entering the ${place}, remember to ${action}. The other instructions are explained once you are inside.`,
        question: `What must students do before entering the ${place}?`,
        solution: `The instruction given before entering is to ${action}.`,
      },
      action,
      alternatives,
      placeIndex + actionIndex
    )
  })
)

const GOALS = [
  ['buy a second-hand bike', 'cycling'],
  ['visit a cousin in Dublin', 'travel'],
  ['replace a broken tablet', 'technology'],
  ['join a summer football camp', 'sport'],
  ['buy a concert ticket', 'music'],
] as const
const SAVINGS = ['ten', 'fifteen', 'twenty', 'twenty-five', 'thirty']
const plans: EnglishListeningItem[] = GOALS.flatMap(([goal, category], goalIndex) =>
  SAVINGS.map((amount, amountIndex) => {
    const distractorGoals = [
      GOALS[(goalIndex + 1) % GOALS.length][0],
      GOALS[(goalIndex + 2) % GOALS.length][0],
      GOALS[(goalIndex + 3) % GOALS.length][0],
    ] as [string, string, string]
    return itemWithAnswer(
      {
        skillId: 'E05S03',
        difficulty: amountIndex >= 2 ? 4 : 3,
        spoken: `I am going to save ${amount} pounds each month because I want to ${goal}. I have already compared a few options for the ${category} plan.`,
        question: 'Why is the speaker saving money?',
        solution: `The reason is stated directly: the speaker wants to ${goal}.`,
      },
      goal,
      distractorGoals,
      goalIndex * 3 + amountIndex
    )
  })
)

/**
 * 100 deterministic, authored-template listening variants. Together with the
 * core bank this keeps the strict 120-prompt anti-repeat window from exhausting
 * after only a few sessions, while keeping distractors in the same semantic
 * category as the correct answer.
 */
export const ENGLISH_LISTENING_VARIANTS: EnglishListeningItem[] = [
  ...routine,
  ...travel,
  ...rules,
  ...plans,
]
