-- Quizzey — seed data (starter topics + questions)
-- Run this AFTER 0001_init.sql, in the Supabase SQL editor.
-- Safe to re-run: topics upsert on slug; questions are only inserted if the
-- topic currently has none.

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
insert into public.topics (slug, name, description, category, color, icon, is_official)
values
  ('general-knowledge', 'General Knowledge', 'A bit of everything.', 'General', '#e11d48', '🧠', true),
  ('istanbul', 'Istanbul', 'General knowledge about the city of Istanbul.', 'Places', '#be123c', '🕌', true),
  ('world-geography', 'World Geography', 'Countries, capitals, rivers and more.', 'Geography', '#f43f5e', '🌍', true),
  ('football', 'Football', 'The beautiful game.', 'Sports', '#9f1239', '⚽', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Questions
-- Each block only inserts when the topic has no questions yet.
-- ---------------------------------------------------------------------------

-- General Knowledge
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index
from public.topics t
cross join (values
  ('How many continents are there on Earth?', array['5','6','7','8'], 2),
  ('What is the largest planet in our solar system?', array['Earth','Jupiter','Saturn','Mars'], 1),
  ('What gas do plants absorb from the atmosphere?', array['Oxygen','Carbon dioxide','Nitrogen','Hydrogen'], 1),
  ('How many sides does a hexagon have?', array['5','6','7','8'], 1),
  ('What is the chemical symbol for gold?', array['Gd','Au','Ag','Go'], 1),
  ('Who painted the Mona Lisa?', array['Vincent van Gogh','Pablo Picasso','Leonardo da Vinci','Michelangelo'], 2),
  ('What is the tallest mountain in the world?', array['K2','Kangchenjunga','Mount Everest','Makalu'], 2),
  ('How many colours are traditionally in a rainbow?', array['5','6','7','8'], 2),
  ('What is the hardest natural substance on Earth?', array['Gold','Iron','Diamond','Quartz'], 2),
  ('In which language is "ciao" a common greeting?', array['Spanish','Italian','Portuguese','Romanian'], 1)
) as q(text, answers, correct_index)
where t.slug = 'general-knowledge'
  and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Istanbul
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index
from public.topics t
cross join (values
  ('Istanbul straddles two continents — which two?', array['Europe & Africa','Europe & Asia','Asia & Africa','Europe & Australia'], 1),
  ('Which strait runs through Istanbul?', array['Strait of Gibraltar','Bosphorus','Strait of Hormuz','Strait of Malacca'], 1),
  ('What was Istanbul officially called before 1930?', array['Ankara','Constantinople','Athens','Baghdad'], 1),
  ('Which famous building was a church, then a mosque, then a museum?', array['Blue Mosque','Hagia Sophia','Topkapi Palace','Galata Tower'], 1),
  ('What is the currency of Turkey?', array['Euro','Turkish lira','Dinar','Dirham'], 1),
  ('The Grand Bazaar is one of the world''s oldest and largest covered...', array['markets','mosques','palaces','museums'], 0),
  ('Which sea lies to the south of Istanbul?', array['Black Sea','Sea of Marmara','Red Sea','Caspian Sea'], 1),
  ('Istanbul is the largest city of which country?', array['Greece','Turkey','Bulgaria','Georgia'], 1),
  ('The Bosphorus connects the Black Sea to which sea?', array['Mediterranean Sea','Sea of Marmara','Aegean Sea','Adriatic Sea'], 1),
  ('What traditional Turkish drink is served in tulip-shaped glasses?', array['Cola','Çay (tea)','Lemonade','Beer'], 1)
) as q(text, answers, correct_index)
where t.slug = 'istanbul'
  and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- World Geography
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index
from public.topics t
cross join (values
  ('What is the capital of France?', array['Lyon','Paris','Marseille','Nice'], 1),
  ('Which is generally considered the longest river in the world?', array['Amazon','Nile','Yangtze','Mississippi'], 1),
  ('On which continent is the Sahara Desert?', array['Asia','Africa','Australia','South America'], 1),
  ('What is the capital of Japan?', array['Osaka','Kyoto','Tokyo','Nagoya'], 2),
  ('Which is the largest ocean?', array['Atlantic','Indian','Arctic','Pacific'], 3),
  ('Mount Kilimanjaro is located in which country?', array['Kenya','Tanzania','Uganda','Ethiopia'], 1),
  ('What is the smallest country in the world?', array['Monaco','Vatican City','San Marino','Malta'], 1),
  ('Which country is shaped like a boot?', array['Spain','Italy','Greece','Portugal'], 1),
  ('The Great Barrier Reef is off the coast of which country?', array['Brazil','Australia','Mexico','Thailand'], 1),
  ('What is the capital of Turkey?', array['Istanbul','Ankara','Izmir','Bursa'], 1)
) as q(text, answers, correct_index)
where t.slug = 'world-geography'
  and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Football
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index
from public.topics t
cross join (values
  ('How many players are on the pitch per team?', array['9','10','11','12'], 2),
  ('Which country won the 2022 FIFA World Cup?', array['France','Argentina','Brazil','Germany'], 1),
  ('How often is the FIFA World Cup held?', array['Every 2 years','Every 3 years','Every 4 years','Every 5 years'], 2),
  ('What is scoring three goals in a match called?', array['Hat-trick','Triple','Treble','Trifecta'], 0),
  ('"The Red Devils" is a nickname for which club?', array['Liverpool','Manchester United','Arsenal','Chelsea'], 1),
  ('How long is a standard match, excluding stoppage time?', array['80 minutes','90 minutes','100 minutes','120 minutes'], 1),
  ('Lionel Messi spent most of his club career at which team?', array['Real Madrid','Barcelona','Juventus','Bayern Munich'], 1),
  ('Which card means a player is sent off?', array['Yellow','Red','Blue','Green'], 1),
  ('Which country has won the most World Cups?', array['Germany','Italy','Brazil','Argentina'], 2),
  ('What is the area where the goalkeeper may use their hands called?', array['Centre circle','Penalty area','Corner arc','Halfway line'], 1)
) as q(text, answers, correct_index)
where t.slug = 'football'
  and not exists (select 1 from public.questions x where x.topic_id = t.id);
