-- Stage the v1.24 multi-subject curriculum structure without exposing unfinished content.
-- Skills stay code-only until their generators pass quality audits; these units are deliberately inactive.

insert into public.curriculum_units (id, subject_id, name, sort_order, active) values
  ('L01','spanish','Comunicación y comprensión',1,false),
  ('L02','spanish','Gramática y sintaxis',2,false),
  ('L03','spanish','Léxico y significado',3,false),
  ('L04','spanish','Ortografía y puntuación',4,false),
  ('L05','spanish','Tipos de texto y escritura',5,false),
  ('L06','spanish','Educación literaria',6,false),
  ('E01','english','Personal information and classroom English',1,false),
  ('E02','english','Daily routines',2,false),
  ('E03','english','People, places and actions',3,false),
  ('E04','english','Past events',4,false),
  ('E05','english','Plans, ability and rules',5,false),
  ('E06','english','Reading and writing strategies',6,false),
  ('G01','geography_history','Mapas y representación geográfica',1,false),
  ('G02','geography_history','La Tierra, el relieve y las aguas',2,false),
  ('G03','geography_history','Tiempo, clima y paisajes',3,false),
  ('G04','geography_history','Prehistoria',4,false),
  ('G05','geography_history','Primeras civilizaciones',5,false),
  ('G06','geography_history','Grecia y Roma',6,false),
  ('B01','biology_geology','La ciencia y la investigación',1,false),
  ('B02','biology_geology','La célula y los seres vivos',2,false),
  ('B03','biology_geology','Clasificación y biodiversidad',3,false),
  ('B04','biology_geology','Ecosistemas',4,false),
  ('B05','biology_geology','Geosfera y minerales',5,false),
  ('B06','biology_geology','Atmósfera, hidrosfera y sostenibilidad',6,false)
on conflict (id) do update set
  subject_id = excluded.subject_id,
  name = excluded.name,
  sort_order = excluded.sort_order,
  active = false;
