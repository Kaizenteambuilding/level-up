-- Keep learner-facing Geography and History skill labels in Spanish.
update public.skills
set name = case id
  when 'G01S01' then 'Puntos cardinales y coordenadas'
  when 'G01S02' then 'Escala y distancia'
  when 'G01S03' then 'Tipos de mapas'
  when 'G01S04' then 'Leyendas y símbolos cartográficos'
  when 'G02S01' then 'Principales formas del relieve'
  when 'G02S02' then 'Continentes y océanos'
  when 'G02S03' then 'Ríos y cuencas hidrográficas'
  when 'G02S04' then 'Relieve y poblamiento humano'
  when 'G03S01' then 'Tiempo atmosférico y clima'
  when 'G03S02' then 'Factores del clima'
  when 'G03S03' then 'Climogramas'
  when 'G03S04' then 'Clima e impacto humano'
  when 'G04S01' then 'Tiempo histórico y cronología'
  when 'G04S02' then 'Sociedades paleolíticas'
  when 'G04S03' then 'Revolución neolítica'
  when 'G04S04' then 'Fuentes de la Prehistoria'
  when 'G05S01' then 'Mesopotamia'
  when 'G05S02' then 'Antiguo Egipto'
  when 'G05S03' then 'Escritura, leyes y administración'
  when 'G05S04' then 'Comparación de las primeras civilizaciones'
  when 'G06S01' then 'Polis griega y democracia'
  when 'G06S02' then 'Cultura y legado de Grecia'
  when 'G06S03' then 'República e Imperio romanos'
  when 'G06S04' then 'Romanización y legado de Roma'
  else name
end
where id like 'G%';
