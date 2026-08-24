import type { SubjectId } from './subjects'

export type CurriculumUnitDefinition = {
  id: string
  subjectId: SubjectId
  name: string
  skills: readonly CurriculumSkillDefinition[]
}

export type CurriculumSkillDefinition = {
  id: string
  name: string
  goal: string
  generatorKey: string
  prerequisites?: readonly string[]
  commonErrors?: readonly string[]
  critical?: boolean
}

export const SUBJECT_CURRICULA: Record<Exclude<SubjectId, 'math'>, readonly CurriculumUnitDefinition[]> = {
  spanish: [
    { id: 'L01', subjectId: 'spanish', name: 'Comunicación y comprensión', skills: [
      { id: 'L01S01', name: 'Idea principal e información relevante', goal: 'Identificar tema, idea principal y datos relevantes en textos breves', generatorKey: 'es_main_idea', critical: true },
      { id: 'L01S02', name: 'Intención comunicativa', goal: 'Reconocer intención, emisor, receptor y situación comunicativa', generatorKey: 'es_communication_intent' },
      { id: 'L01S03', name: 'Inferencias y contexto', goal: 'Deducir información implícita a partir de pistas textuales', generatorKey: 'es_inference' },
      { id: 'L01S04', name: 'Coherencia y cohesión básica', goal: 'Reconocer relaciones lógicas y conectores en un texto', generatorKey: 'es_cohesion', commonErrors: ['elegir conectores por sonido y no por sentido'] },
    ]},
    { id: 'L02', subjectId: 'spanish', name: 'Gramática y sintaxis', skills: [
      { id: 'L02S01', name: 'Clases de palabras', goal: 'Distinguir sustantivos, adjetivos, determinantes, pronombres, verbos, adverbios y nexos', generatorKey: 'es_word_classes', critical: true },
      { id: 'L02S02', name: 'Sujeto y predicado', goal: 'Identificar sujeto, predicado y concordancia', generatorKey: 'es_subject_predicate', prerequisites: ['L02S01'] },
      { id: 'L02S03', name: 'Núcleos y grupos sintácticos básicos', goal: 'Reconocer núcleos nominales y verbales en estructuras sencillas', generatorKey: 'es_phrase_heads', prerequisites: ['L02S01'] },
      { id: 'L02S04', name: 'Concordancia gramatical', goal: 'Aplicar concordancia de género, número y persona', generatorKey: 'es_agreement', commonErrors: ['ignorar el núcleo al concordar'] },
    ]},
    { id: 'L03', subjectId: 'spanish', name: 'Léxico y significado', skills: [
      { id: 'L03S01', name: 'Sinonimia y antonimia', goal: 'Reconocer relaciones básicas de significado', generatorKey: 'es_syn_ant' },
      { id: 'L03S02', name: 'Polisemia y contexto', goal: 'Interpretar significados de palabras polisémicas según el contexto', generatorKey: 'es_polysemy', critical: true },
      { id: 'L03S03', name: 'Familias de palabras', goal: 'Reconocer lexemas, palabras derivadas y familias léxicas', generatorKey: 'es_word_families' },
      { id: 'L03S04', name: 'Formación de palabras', goal: 'Identificar prefijos, sufijos y procedimientos básicos de formación', generatorKey: 'es_word_formation', prerequisites: ['L03S03'] },
    ]},
    { id: 'L04', subjectId: 'spanish', name: 'Ortografía y puntuación', skills: [
      { id: 'L04S01', name: 'Acentuación', goal: 'Aplicar reglas de acentuación de agudas, llanas y esdrújulas', generatorKey: 'es_accentuation', critical: true },
      { id: 'L04S02', name: 'B/V, G/J y H', goal: 'Aplicar regularidades ortográficas frecuentes', generatorKey: 'es_spelling_letters' },
      { id: 'L04S03', name: 'Mayúsculas y signos de puntuación', goal: 'Usar mayúsculas, punto, coma, dos puntos e interrogación de forma adecuada', generatorKey: 'es_punctuation' },
      { id: 'L04S04', name: 'Corrección ortográfica en contexto', goal: 'Detectar y corregir errores ortográficos en frases y textos breves', generatorKey: 'es_spelling_edit', prerequisites: ['L04S01','L04S02','L04S03'] },
    ]},
    { id: 'L05', subjectId: 'spanish', name: 'Tipos de texto y escritura', skills: [
      { id: 'L05S01', name: 'Narración', goal: 'Reconocer estructura, narrador, personajes, espacio y tiempo', generatorKey: 'es_narrative' },
      { id: 'L05S02', name: 'Descripción', goal: 'Distinguir rasgos objetivos y subjetivos y organizar una descripción', generatorKey: 'es_description' },
      { id: 'L05S03', name: 'Exposición y explicación', goal: 'Identificar estructura expositiva y relaciones de causa, ejemplo y definición', generatorKey: 'es_exposition', critical: true },
      { id: 'L05S04', name: 'Planificación y revisión', goal: 'Ordenar ideas y revisar claridad, cohesión y corrección de un texto breve', generatorKey: 'es_writing_revision' },
    ]},
    { id: 'L06', subjectId: 'spanish', name: 'Educación literaria', skills: [
      { id: 'L06S01', name: 'Géneros literarios', goal: 'Distinguir narrativa, lírica y teatro por sus rasgos básicos', generatorKey: 'es_literary_genres', critical: true },
      { id: 'L06S02', name: 'Recursos literarios básicos', goal: 'Reconocer comparación, metáfora, personificación y repetición', generatorKey: 'es_literary_devices' },
      { id: 'L06S03', name: 'Voz, personajes y conflicto', goal: 'Interpretar elementos narrativos y dramáticos básicos', generatorKey: 'es_literary_elements' },
      { id: 'L06S04', name: 'Interpretación de fragmentos', goal: 'Relacionar forma, tema y efecto en fragmentos literarios breves', generatorKey: 'es_literary_reading', prerequisites: ['L06S01','L06S02'] },
    ]},
  ],
  english: [
    { id: 'E01', subjectId: 'english', name: 'Personal information and classroom English', skills: [
      { id: 'E01S01', name: 'Personal information', goal: 'Understand and produce basic personal information', generatorKey: 'en_personal_info', critical: true },
      { id: 'E01S02', name: 'Subject pronouns and be', goal: 'Use subject pronouns and present forms of be', generatorKey: 'en_be_pronouns' },
      { id: 'E01S03', name: 'Possessives and have got', goal: 'Use possessive adjectives and have got in familiar contexts', generatorKey: 'en_possessives_have' },
      { id: 'E01S04', name: 'Classroom instructions', goal: 'Understand common classroom instructions and requests', generatorKey: 'en_classroom_language' },
    ]},
    { id: 'E02', subjectId: 'english', name: 'Daily routines', skills: [
      { id: 'E02S01', name: 'Present simple', goal: 'Use present simple for routines and facts', generatorKey: 'en_present_simple', critical: true },
      { id: 'E02S02', name: 'Adverbs of frequency', goal: 'Place and interpret common adverbs of frequency', generatorKey: 'en_frequency', prerequisites: ['E02S01'] },
      { id: 'E02S03', name: 'Questions and short answers', goal: 'Form do/does questions and short answers', generatorKey: 'en_present_questions', prerequisites: ['E02S01'] },
      { id: 'E02S04', name: 'Time and routines vocabulary', goal: 'Understand times, routine verbs and sequence markers', generatorKey: 'en_routines_vocab' },
    ]},
    { id: 'E03', subjectId: 'english', name: 'People, places and actions', skills: [
      { id: 'E03S01', name: 'Present continuous', goal: 'Use present continuous for actions in progress', generatorKey: 'en_present_continuous', critical: true },
      { id: 'E03S02', name: 'Present simple vs continuous', goal: 'Choose between routines and actions in progress', generatorKey: 'en_present_contrast', prerequisites: ['E02S01','E03S01'] },
      { id: 'E03S03', name: 'Describing people and places', goal: 'Use common adjectives and there is/are', generatorKey: 'en_descriptions' },
      { id: 'E03S04', name: 'Comparatives', goal: 'Form and interpret basic comparative adjectives', generatorKey: 'en_comparatives' },
    ]},
    { id: 'E04', subjectId: 'english', name: 'Past events', skills: [
      { id: 'E04S01', name: 'Past of be', goal: 'Use was/were in affirmative, negative and questions', generatorKey: 'en_past_be' },
      { id: 'E04S02', name: 'Past simple regular verbs', goal: 'Form and understand regular past simple', generatorKey: 'en_past_regular', critical: true },
      { id: 'E04S03', name: 'Common irregular past forms', goal: 'Recognize and use frequent irregular past verbs', generatorKey: 'en_past_irregular' },
      { id: 'E04S04', name: 'Sequencing past events', goal: 'Order short narratives with time connectors', generatorKey: 'en_past_sequence', prerequisites: ['E04S02'] },
    ]},
    { id: 'E05', subjectId: 'english', name: 'Plans, ability and rules', skills: [
      { id: 'E05S01', name: 'Can and can’t', goal: 'Express ability, permission and possibility with can', generatorKey: 'en_can' },
      { id: 'E05S02', name: 'Must and mustn’t', goal: 'Express basic obligation and prohibition', generatorKey: 'en_must' },
      { id: 'E05S03', name: 'Going to', goal: 'Express future intentions and plans', generatorKey: 'en_going_to', critical: true },
      { id: 'E05S04', name: 'Functional language', goal: 'Choose appropriate expressions for requests, offers and suggestions', generatorKey: 'en_functional_language' },
    ]},
    { id: 'E06', subjectId: 'english', name: 'Reading and writing strategies', skills: [
      { id: 'E06S01', name: 'Reading for gist', goal: 'Identify the general meaning of short accessible texts', generatorKey: 'en_reading_gist', critical: true },
      { id: 'E06S02', name: 'Reading for detail', goal: 'Locate explicit information and infer simple meaning from context', generatorKey: 'en_reading_detail' },
      { id: 'E06S03', name: 'Text organisation', goal: 'Use basic connectors and paragraph order in short texts', generatorKey: 'en_text_organisation' },
      { id: 'E06S04', name: 'Mediation and paraphrase', goal: 'Restate simple information using accessible English', generatorKey: 'en_mediation' },
    ]},
  ],
  geography_history: [
    { id: 'G01', subjectId: 'geography_history', name: 'Maps and geographic representation', skills: [
      { id: 'G01S01', name: 'Cardinal directions and coordinates', goal: 'Locate places using orientation and geographic coordinates', generatorKey: 'gh_orientation', critical: true },
      { id: 'G01S02', name: 'Scale and distance', goal: 'Interpret simple map scales and estimate real distances', generatorKey: 'gh_scale' },
      { id: 'G01S03', name: 'Types of maps', goal: 'Distinguish physical, political and thematic maps', generatorKey: 'gh_map_types' },
      { id: 'G01S04', name: 'Reading legends and symbols', goal: 'Interpret legends, conventional symbols and simple thematic data', generatorKey: 'gh_map_legend' },
    ]},
    { id: 'G02', subjectId: 'geography_history', name: 'Earth, relief and water', skills: [
      { id: 'G02S01', name: 'Major relief forms', goal: 'Identify mountains, plains, plateaus, valleys and coastal forms', generatorKey: 'gh_relief', critical: true },
      { id: 'G02S02', name: 'Continents and oceans', goal: 'Locate major continents, oceans and geographic regions', generatorKey: 'gh_world_location' },
      { id: 'G02S03', name: 'Rivers and watersheds', goal: 'Understand basic river elements and drainage basins', generatorKey: 'gh_rivers' },
      { id: 'G02S04', name: 'Relief and human settlement', goal: 'Relate physical geography to settlement and activities', generatorKey: 'gh_relief_humans' },
    ]},
    { id: 'G03', subjectId: 'geography_history', name: 'Weather, climate and landscapes', skills: [
      { id: 'G03S01', name: 'Weather vs climate', goal: 'Distinguish weather from climate and identify basic atmospheric variables', generatorKey: 'gh_weather_climate', critical: true },
      { id: 'G03S02', name: 'Climate factors', goal: 'Relate latitude, altitude, distance from sea and relief to climate', generatorKey: 'gh_climate_factors' },
      { id: 'G03S03', name: 'Climate graphs', goal: 'Read simple temperature and precipitation graphs', generatorKey: 'gh_climate_graphs' },
      { id: 'G03S04', name: 'Climate and human impact', goal: 'Connect climate patterns, risks and human activities', generatorKey: 'gh_climate_impact' },
    ]},
    { id: 'G04', subjectId: 'geography_history', name: 'Prehistory', skills: [
      { id: 'G04S01', name: 'Historical time and chronology', goal: 'Order events and use basic chronological conventions', generatorKey: 'gh_chronology', critical: true },
      { id: 'G04S02', name: 'Palaeolithic societies', goal: 'Recognize hunter-gatherer lifeways and technological change', generatorKey: 'gh_palaeolithic' },
      { id: 'G04S03', name: 'Neolithic revolution', goal: 'Explain agriculture, sedentism and social change', generatorKey: 'gh_neolithic' },
      { id: 'G04S04', name: 'Prehistoric sources', goal: 'Interpret archaeological evidence and distinguish source types', generatorKey: 'gh_prehistory_sources' },
    ]},
    { id: 'G05', subjectId: 'geography_history', name: 'First civilisations', skills: [
      { id: 'G05S01', name: 'Mesopotamia', goal: 'Recognize key features of Mesopotamian urban civilisation', generatorKey: 'gh_mesopotamia' },
      { id: 'G05S02', name: 'Ancient Egypt', goal: 'Understand Nile society, political organisation and beliefs', generatorKey: 'gh_egypt', critical: true },
      { id: 'G05S03', name: 'Writing, law and administration', goal: 'Explain why writing and institutions transformed early states', generatorKey: 'gh_early_states' },
      { id: 'G05S04', name: 'Comparing early civilisations', goal: 'Compare environment, economy, society and power in early civilisations', generatorKey: 'gh_compare_civilisations' },
    ]},
    { id: 'G06', subjectId: 'geography_history', name: 'Greece and Rome', skills: [
      { id: 'G06S01', name: 'Greek polis and democracy', goal: 'Understand the polis and basic features of Athenian democracy', generatorKey: 'gh_greece_polis', critical: true },
      { id: 'G06S02', name: 'Greek culture and legacy', goal: 'Recognize major cultural contributions of Ancient Greece', generatorKey: 'gh_greece_culture' },
      { id: 'G06S03', name: 'Roman Republic and Empire', goal: 'Distinguish major stages and institutions of Roman history', generatorKey: 'gh_rome_stages' },
      { id: 'G06S04', name: 'Romanisation and legacy', goal: 'Identify Romanisation and enduring Roman influences', generatorKey: 'gh_romanisation' },
    ]},
  ],
  biology_geology: [
    { id: 'B01', subjectId: 'biology_geology', name: 'Scientific inquiry', skills: [
      { id: 'B01S01', name: 'Questions and hypotheses', goal: 'Distinguish testable questions and hypotheses', generatorKey: 'bg_hypotheses', critical: true },
      { id: 'B01S02', name: 'Variables and fair tests', goal: 'Identify variables and controls in simple investigations', generatorKey: 'bg_variables' },
      { id: 'B01S03', name: 'Data and evidence', goal: 'Interpret simple tables and graphs and draw evidence-based conclusions', generatorKey: 'bg_data_evidence' },
      { id: 'B01S04', name: 'Scientific information', goal: 'Distinguish scientific evidence from unsupported claims', generatorKey: 'bg_science_sources' },
    ]},
    { id: 'B02', subjectId: 'biology_geology', name: 'Earth and geosphere', skills: [
      { id: 'B02S01', name: 'Earth systems', goal: 'Identify geosphere, hydrosphere, atmosphere and biosphere', generatorKey: 'bg_earth_systems', critical: true },
      { id: 'B02S02', name: 'Minerals and rocks', goal: 'Distinguish minerals and main rock groups by basic properties', generatorKey: 'bg_rocks_minerals' },
      { id: 'B02S03', name: 'Rock cycle', goal: 'Relate igneous, sedimentary and metamorphic rocks through the rock cycle', generatorKey: 'bg_rock_cycle' },
      { id: 'B02S04', name: 'Geological processes and relief', goal: 'Connect erosion, transport, sedimentation and internal processes to relief', generatorKey: 'bg_geological_processes' },
    ]},
    { id: 'B03', subjectId: 'biology_geology', name: 'The cell', skills: [
      { id: 'B03S01', name: 'Cell theory', goal: 'Understand the cell as the basic unit of life', generatorKey: 'bg_cell_theory', critical: true },
      { id: 'B03S02', name: 'Cell structures', goal: 'Identify major cell structures and their basic functions', generatorKey: 'bg_cell_parts' },
      { id: 'B03S03', name: 'Plant and animal cells', goal: 'Compare basic plant and animal cell structures', generatorKey: 'bg_plant_animal_cells' },
      { id: 'B03S04', name: 'Levels of organisation', goal: 'Order cell, tissue, organ, system and organism', generatorKey: 'bg_levels_organisation' },
    ]},
    { id: 'B04', subjectId: 'biology_geology', name: 'Living things and classification', skills: [
      { id: 'B04S01', name: 'Characteristics of life', goal: 'Recognize common functions and characteristics of living things', generatorKey: 'bg_life_characteristics', critical: true },
      { id: 'B04S02', name: 'Classification criteria', goal: 'Classify organisms using observable traits and simple keys', generatorKey: 'bg_classification' },
      { id: 'B04S03', name: 'Major groups of organisms', goal: 'Recognize broad groups of microorganisms, plants and animals', generatorKey: 'bg_living_groups' },
      { id: 'B04S04', name: 'Biodiversity', goal: 'Explain biodiversity and why classification supports its study', generatorKey: 'bg_biodiversity' },
    ]},
    { id: 'B05', subjectId: 'biology_geology', name: 'Ecosystems', skills: [
      { id: 'B05S01', name: 'Biotic and abiotic factors', goal: 'Distinguish living and non-living ecosystem factors', generatorKey: 'bg_ecosystem_factors', critical: true },
      { id: 'B05S02', name: 'Food chains and webs', goal: 'Interpret producers, consumers and decomposers in food relationships', generatorKey: 'bg_food_webs' },
      { id: 'B05S03', name: 'Interactions and balance', goal: 'Identify basic ecological interactions and effects of change', generatorKey: 'bg_ecological_interactions' },
      { id: 'B05S04', name: 'Human impact on ecosystems', goal: 'Relate human activities to habitat loss, pollution and conservation', generatorKey: 'bg_ecosystem_impact' },
    ]},
    { id: 'B06', subjectId: 'biology_geology', name: 'Health and sustainability', skills: [
      { id: 'B06S01', name: 'Healthy habits', goal: 'Relate sleep, activity, hygiene and diet to health', generatorKey: 'bg_healthy_habits', critical: true },
      { id: 'B06S02', name: 'Nutrition basics', goal: 'Distinguish nutrients and interpret simple healthy-diet information', generatorKey: 'bg_nutrition' },
      { id: 'B06S03', name: 'Environmental health', goal: 'Connect environmental quality with human and ecosystem health', generatorKey: 'bg_environmental_health' },
      { id: 'B06S04', name: 'Sustainable choices', goal: 'Evaluate simple everyday choices using sustainability criteria', generatorKey: 'bg_sustainable_choices' },
    ]},
  ],
}

export function curriculumUnitIds(subjectId: Exclude<SubjectId, 'math'>) {
  return SUBJECT_CURRICULA[subjectId].map((unit) => unit.id)
}

export function curriculumSkillCount(subjectId: Exclude<SubjectId, 'math'>) {
  return SUBJECT_CURRICULA[subjectId].reduce((total, unit) => total + unit.skills.length, 0)
}
