insert into skills(id,name,subject_id) values
('fractions_apply','Problemas con fracciones','math'),
('equation_1step','Ecuaciones de un paso','math')
on conflict (id) do nothing;
