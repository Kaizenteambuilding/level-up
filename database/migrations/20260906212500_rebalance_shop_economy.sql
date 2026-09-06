update public.game_items
set price = case id
  when 'sparkles' then 350
  when 'headphones' then 600
  when 'wizard-hat' then 850
  when 'fox' then 1100
  when 'fire' then 1600
  when 'robot' then 2400
  else price
end,
minimum_level = case id
  when 'sparkles' then 2
  when 'headphones' then 3
  when 'wizard-hat' then 4
  when 'fox' then 5
  when 'fire' then 6
  when 'robot' then 8
  else minimum_level
end
where id in ('sparkles','headphones','wizard-hat','fox','fire','robot');
