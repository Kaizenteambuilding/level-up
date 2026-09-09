export type AuthoredListeningItem = {
  skillId: string
  difficulty: number
  spoken: string
  question: string
  options: [string, string, string, string]
  answerIndex: number
  solution: string
}

// Hand-authored scenarios: each item changes context, listening task and question
// intent. These are deliberately not produced by a combinatorial template.
export const ENGLISH_LISTENING_AUTHORED: AuthoredListeningItem[] = [
  {
    skillId: 'E01S01', difficulty: 2,
    spoken: 'My cousin Leo is thirteen. I am one year younger than him, and my sister is two years younger than me.',
    question: 'How old is the speaker?',
    options: ['Ten', 'Eleven', 'Twelve', 'Thirteen'], answerIndex: 2,
    solution: 'Leo is thirteen and the speaker is one year younger, so the speaker is twelve.'
  },
  {
    skillId: 'E01S01', difficulty: 3,
    spoken: 'I was born in Manchester, but we moved to Liverpool when I was six. I still visit Manchester every summer.',
    question: 'Where does the speaker live now?',
    options: ['Manchester', 'Liverpool', 'Leeds', 'Bristol'], answerIndex: 1,
    solution: 'The speaker was born in Manchester but says the family moved to Liverpool.'
  },
  {
    skillId: 'E01S04', difficulty: 2,
    spoken: 'Do questions one to five on your own. Then compare number six with the person next to you.',
    question: 'Which task should students do with a partner?',
    options: ['Questions one to five', 'Question six', 'All six questions', 'Only question five'], answerIndex: 1,
    solution: 'Only number six is to be compared with the person next to them.'
  },
  {
    skillId: 'E01S04', difficulty: 3,
    spoken: 'Before you start the experiment, write the date at the top of the page. Do not collect the equipment yet.',
    question: 'What should students do first?',
    options: ['Collect the equipment', 'Write the date', 'Start the experiment', 'Read the results'], answerIndex: 1,
    solution: 'The teacher says to write the date before starting or collecting equipment.'
  },
  {
    skillId: 'E02S04', difficulty: 2,
    spoken: 'I usually walk home, but today it is raining, so my dad is picking me up after chess club.',
    question: 'How will the speaker get home today?',
    options: ['On foot', 'By bus', 'By car', 'By bicycle'], answerIndex: 2,
    solution: 'Because it is raining, the speaker says their dad is picking them up.'
  },
  {
    skillId: 'E02S04', difficulty: 3,
    spoken: 'The film starts at seven thirty. We want to be there twenty minutes early, and the bus journey takes fifteen minutes.',
    question: 'What is the latest time they should catch the bus?',
    options: ['6:45', '6:55', '7:05', '7:15'], answerIndex: 1,
    solution: 'They need to arrive at 7:10; fifteen minutes earlier is 6:55.'
  },
  {
    skillId: 'E03S03', difficulty: 2,
    spoken: 'When you enter my room, the wardrobe is on your left. The desk is opposite it, next to the window.',
    question: 'What is opposite the wardrobe?',
    options: ['The bed', 'The window', 'The desk', 'The door'], answerIndex: 2,
    solution: 'The speaker says the desk is opposite the wardrobe.'
  },
  {
    skillId: 'E03S03', difficulty: 3,
    spoken: 'Maya and Zoe both have dark hair. Maya wears glasses, while Zoe has a red scarf and no glasses.',
    question: 'Which detail identifies Maya?',
    options: ['A red scarf', 'Glasses', 'Light hair', 'No glasses'], answerIndex: 1,
    solution: 'Both have dark hair, but only Maya is described as wearing glasses.'
  },
  {
    skillId: 'E04S04', difficulty: 3,
    spoken: 'We planned to play football, but the pitch was flooded. Instead, we went to the sports centre and played badminton.',
    question: 'Why did the plan change?',
    options: ['The sports centre was closed', 'Nobody brought a football', 'The pitch was flooded', 'Badminton finished early'], answerIndex: 2,
    solution: 'The football plan changed because the pitch was flooded.'
  },
  {
    skillId: 'E04S04', difficulty: 4,
    spoken: 'At first I thought the test was on Thursday, so I planned to revise on Wednesday evening. Then my teacher reminded us it was actually Wednesday morning.',
    question: 'What problem does the speaker have?',
    options: ['The test was cancelled', 'The revision plan is too late', 'The teacher changed the subject', 'Thursday is a holiday'], answerIndex: 1,
    solution: 'The speaker planned to revise Wednesday evening, but the test is Wednesday morning.'
  },
  {
    skillId: 'E05S01', difficulty: 2,
    spoken: 'You can use my laptop until five, as long as you save your work before I leave.',
    question: 'Under what condition can the laptop be used?',
    options: ['It must stay at school', 'The work must be saved before five', 'It can only be used after five', 'The battery must be full'], answerIndex: 1,
    solution: 'Permission is conditional on saving the work before the owner leaves at five.'
  },
  {
    skillId: 'E05S01', difficulty: 3,
    spoken: 'Could you hold the door for me while I carry these bags inside?',
    question: 'What favour is being requested?',
    options: ['Carry the bags', 'Open the bags', 'Hold the door', 'Find the keys'], answerIndex: 2,
    solution: 'The speaker asks the listener to hold the door.'
  },
  {
    skillId: 'E05S02', difficulty: 3,
    spoken: 'Cyclists may use this path before eight in the morning, but from eight until six it is for pedestrians only.',
    question: 'When may cyclists use the path?',
    options: ['Before 8 a.m.', 'Between 8 a.m. and noon', 'Between noon and 6 p.m.', 'After 8 a.m. only'], answerIndex: 0,
    solution: 'Cyclists are allowed before eight; from eight to six the path is pedestrians only.'
  },
  {
    skillId: 'E05S02', difficulty: 4,
    spoken: 'Food is allowed in the picnic area, but drinks in glass bottles must stay outside the garden. Plastic bottles are fine.',
    question: 'Which item is not allowed in the garden?',
    options: ['A sandwich', 'A plastic water bottle', 'A glass juice bottle', 'A piece of fruit'], answerIndex: 2,
    solution: 'Only drinks in glass bottles are explicitly excluded from the garden.'
  },
  {
    skillId: 'E05S03', difficulty: 3,
    spoken: 'I was going to study at the library on Saturday, but it closes early that day. I will go on Friday after school instead.',
    question: 'What has the speaker decided to do?',
    options: ['Study at home on Saturday', 'Go to the library on Friday', 'Go to the library on Sunday', 'Study at school on Friday'], answerIndex: 1,
    solution: 'The new plan is to visit the library on Friday after school.'
  },
  {
    skillId: 'E05S03', difficulty: 4,
    spoken: 'If the weather stays dry, we will cycle to the lake. If it rains, we will take the train to the science museum instead.',
    question: 'What determines the weekend plan?',
    options: ['The ticket price', 'The weather', 'The number of bicycles', 'The museum opening time'], answerIndex: 1,
    solution: 'The speaker gives two plans depending on whether it rains.'
  },
  {
    skillId: 'E05S04', difficulty: 2,
    spoken: 'I would like the vegetable soup, please. Could I have bread instead of chips with it?',
    question: 'What change does the customer request?',
    options: ['Soup instead of bread', 'Bread instead of chips', 'Chips instead of soup', 'Vegetables instead of bread'], answerIndex: 1,
    solution: 'The customer wants bread in place of chips.'
  },
  {
    skillId: 'E05S04', difficulty: 3,
    spoken: 'The quickest route is through the park, but the gate is locked today. Go along King Street and turn right at the pharmacy.',
    question: 'Why should the listener avoid the park route?',
    options: ['It is longer', 'The gate is locked', 'The pharmacy is closed', 'King Street is blocked'], answerIndex: 1,
    solution: 'The usual park route cannot be used because its gate is locked.'
  },
  {
    skillId: 'E06S02', difficulty: 3,
    spoken: 'The 10:15 bus is delayed by twenty minutes. The 10:30 service is on time and reaches the town centre five minutes earlier.',
    question: 'Which service will reach the town centre first?',
    options: ['The delayed 10:15 bus', 'The 10:30 bus', 'They arrive together', 'There is not enough information'], answerIndex: 1,
    solution: 'The announcement explicitly says the 10:30 service reaches the centre five minutes earlier.'
  },
  {
    skillId: 'E06S02', difficulty: 4,
    spoken: 'The exhibition is free for children under twelve. Students aged twelve and over pay four pounds, and adults pay seven.',
    question: 'How much does a thirteen-year-old student pay?',
    options: ['Nothing', 'Four pounds', 'Seven pounds', 'Eleven pounds'], answerIndex: 1,
    solution: 'A thirteen-year-old is twelve or over and, as a student, pays four pounds.'
  },
  {
    skillId: 'E06S04', difficulty: 3,
    spoken: 'The café kitchen closes at three, although drinks are served until half past four.',
    question: 'What can a customer still order at four o clock?',
    options: ['A hot lunch', 'A sandwich from the kitchen', 'A drink', 'A cooked dessert'], answerIndex: 2,
    solution: 'Food service ends at three, but drinks continue until 4:30.'
  },
  {
    skillId: 'E06S04', difficulty: 4,
    spoken: 'Your ticket is for the balcony, not the stalls. Use the stairs on the left after the main entrance; the right-hand stairs lead to the stalls.',
    question: 'Which route should the ticket holder take?',
    options: ['Right-hand stairs to the stalls', 'Left-hand stairs to the balcony', 'Lift to the stalls', 'Main exit to the balcony'], answerIndex: 1,
    solution: 'The ticket is for the balcony, reached by the stairs on the left.'
  },
  {
    skillId: 'E04S04', difficulty: 4,
    spoken: 'Nina said the book began slowly, but after the second chapter she could not put it down. She finished it that evening.',
    question: 'How did Nina’s opinion of the book change?',
    options: ['She liked it less as she read', 'She became much more interested', 'She stopped reading after chapter two', 'She thought the ending was too slow'], answerIndex: 1,
    solution: 'She found the beginning slow but then became so interested that she finished the book that evening.'
  },
  {
    skillId: 'E03S03', difficulty: 4,
    spoken: 'The small blue suitcase is mine. The large blue one belongs to my dad, and the small black case is my sister’s.',
    question: 'Which suitcase belongs to the speaker?',
    options: ['The large blue suitcase', 'The small black suitcase', 'The small blue suitcase', 'The large black suitcase'], answerIndex: 2,
    solution: 'The speaker identifies the small blue suitcase as their own.'
  }
]
