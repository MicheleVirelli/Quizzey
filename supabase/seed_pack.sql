-- Quizzey — extra starter topics (safe to re-run).
-- Run in the Supabase SQL editor. Adds 10 common topics with 10 questions each.

insert into public.topics (slug, name, description, category, color, icon, is_official) values
  ('world-flags', 'World Flags', 'Recognise flags of the world.', 'Geography', '#e11d48', '🚩', true),
  ('technology', 'Technology', 'Computers, gadgets and the web.', 'Tech', '#0ea5e9', '💻', true),
  ('politics', 'Politics', 'Governments and world affairs.', 'Society', '#4f46e5', '🏛️', true),
  ('history', 'History', 'People and events that shaped the world.', 'History', '#d97706', '📜', true),
  ('science', 'Science', 'Physics, chemistry and biology.', 'Science', '#059669', '🔬', true),
  ('music', 'Music', 'Artists, instruments and hits.', 'Entertainment', '#db2777', '🎵', true),
  ('movies', 'Movies', 'Films, directors and characters.', 'Entertainment', '#7c3aed', '🎬', true),
  ('sports', 'Sports', 'Games, rules and champions.', 'Sports', '#65a30d', '🏅', true),
  ('food-drink', 'Food & Drink', 'Cuisine from around the world.', 'Lifestyle', '#ea580c', '🍕', true),
  ('space', 'Space & Astronomy', 'Planets, stars and beyond.', 'Science', '#1e3a8a', '🚀', true)
on conflict (slug) do nothing;

-- World Flags
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('Which country''s flag has a red circle on a white background?', array['China','Japan','Bangladesh','South Korea'], 1),
  ('The maple leaf appears on the flag of which country?', array['United States','Canada','Lebanon','Norway'], 1),
  ('Which country''s flag is a red field with a white crescent and star?', array['Turkey','Tunisia','Pakistan','Algeria'], 0),
  ('The Union Jack appears in the corner of which country''s flag?', array['Ireland','Australia','France','Brazil'], 1),
  ('Which flag has three horizontal bands of black, red and gold?', array['Belgium','Germany','Spain','Italy'], 1),
  ('The Star of David appears on the flag of which country?', array['Israel','Greece','Turkey','India'], 0),
  ('Which country''s flag is green and white with a crescent and star?', array['Pakistan','Saudi Arabia','Brazil','Italy'], 0),
  ('A tricolour with an eagle on a cactus is the flag of which country?', array['Italy','Mexico','Hungary','Iran'], 1),
  ('Which country has a blue flag with a yellow Scandinavian cross?', array['Norway','Denmark','Sweden','Finland'], 2),
  ('Which country''s flag has 50 stars?', array['United States','Brazil','China','Australia'], 0)
) as q(text, answers, correct_index)
where t.slug = 'world-flags' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Technology
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('What does "CPU" stand for?', array['Central Processing Unit','Computer Personal Unit','Central Print Utility','Core Power Unit'], 0),
  ('Who co-founded Apple with Steve Jobs?', array['Bill Gates','Steve Wozniak','Elon Musk','Mark Zuckerberg'], 1),
  ('What does "HTTP" stand for?', array['HyperText Transfer Protocol','High Transfer Text Protocol','Hyperlink Text Transmission','Home Tool Transfer Protocol'], 0),
  ('Which company created the Android operating system?', array['Apple','Microsoft','Google','IBM'], 2),
  ('What does "AI" commonly stand for?', array['Automated Input','Artificial Intelligence','Advanced Internet','Applied Integration'], 1),
  ('How many bits are in a byte?', array['4','8','16','32'], 1),
  ('What is the name of Apple''s voice assistant?', array['Alexa','Cortana','Siri','Bixby'], 2),
  ('Which language is mainly used to style web pages?', array['HTML','CSS','Python','SQL'], 1),
  ('Who is the co-founder of Microsoft?', array['Steve Jobs','Bill Gates','Larry Page','Jeff Bezos'], 1),
  ('What does "USB" stand for?', array['Universal Serial Bus','United System Bus','Universal System Board','Unified Serial Bus'], 0)
) as q(text, answers, correct_index)
where t.slug = 'technology' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Politics
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('How many members are in the US Senate?', array['50','100','435','200'], 1),
  ('Who was the first President of the United States?', array['Abraham Lincoln','George Washington','Thomas Jefferson','John Adams'], 1),
  ('Where is the headquarters of the United Nations?', array['Geneva','New York City','Paris','London'], 1),
  ('How long is a single US presidential term?', array['2 years','4 years','5 years','6 years'], 1),
  ('Which document begins with "We the People"?', array['Declaration of Independence','US Constitution','Magna Carta','Bill of Rights'], 1),
  ('The European Union is mainly headquartered in which city?', array['Paris','Brussels','Berlin','Rome'], 1),
  ('Who leads the government in the UK parliamentary system?', array['President','Prime Minister','Chancellor','Monarch'], 1),
  ('How many permanent members does the UN Security Council have?', array['3','5','7','10'], 1),
  ('In which city is the White House located?', array['New York','Washington D.C.','Boston','Philadelphia'], 1),
  ('What is the lower house of the UK Parliament called?', array['Senate','House of Commons','Bundestag','Congress'], 1)
) as q(text, answers, correct_index)
where t.slug = 'politics' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- History
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('In which year did World War II end?', array['1918','1939','1945','1950'], 2),
  ('Who was the first person to walk on the Moon?', array['Buzz Aldrin','Yuri Gagarin','Neil Armstrong','Michael Collins'], 2),
  ('The Great Pyramids of Giza are located in which country?', array['Mexico','Egypt','Greece','Iraq'], 1),
  ('Who painted the ceiling of the Sistine Chapel?', array['Leonardo da Vinci','Raphael','Michelangelo','Donatello'], 2),
  ('Which empire built the Colosseum?', array['Greek','Roman','Ottoman','Persian'], 1),
  ('In which year did the French Revolution begin?', array['1689','1776','1789','1804'], 2),
  ('Who was the UK Prime Minister for most of World War II?', array['Neville Chamberlain','Winston Churchill','Clement Attlee','Tony Blair'], 1),
  ('Which wall fell in 1989?', array['Great Wall','Berlin Wall','Hadrian''s Wall','Wall Street'], 1),
  ('Who reached the Americas in 1492?', array['Vasco da Gama','Christopher Columbus','Ferdinand Magellan','Marco Polo'], 1),
  ('In which year did the Titanic sink?', array['1905','1912','1920','1898'], 1)
) as q(text, answers, correct_index)
where t.slug = 'history' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Science
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('What is the chemical formula for water?', array['O2','H2O','CO2','NaCl'], 1),
  ('How many planets are in our solar system?', array['7','8','9','10'], 1),
  ('Which gas do humans need to breathe to survive?', array['Carbon dioxide','Oxygen','Nitrogen','Helium'], 1),
  ('What is often called the powerhouse of the cell?', array['Nucleus','Mitochondria','Ribosome','Chloroplast'], 1),
  ('Which planet is known as the Red Planet?', array['Venus','Mars','Jupiter','Mercury'], 1),
  ('The speed of light is approximately...', array['300,000 km/s','30,000 km/s','3,000 km/s','3 million km/s'], 0),
  ('Which force keeps us on the ground?', array['Magnetism','Gravity','Friction','Inertia'], 1),
  ('What element does the symbol "H" represent?', array['Helium','Hydrogen','Mercury','Hafnium'], 1),
  ('How many bones are in the adult human body?', array['206','106','306','150'], 0),
  ('At what temperature does water boil at sea level (Celsius)?', array['50','90','100','120'], 2)
) as q(text, answers, correct_index)
where t.slug = 'science' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Music
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('How many strings does a standard guitar have?', array['4','5','6','7'], 2),
  ('Which band released the album "Abbey Road"?', array['The Rolling Stones','The Beatles','Queen','Pink Floyd'], 1),
  ('Who is known as the "King of Pop"?', array['Elvis Presley','Michael Jackson','Prince','Freddie Mercury'], 1),
  ('How many keys does a standard full-size piano have?', array['76','88','100','61'], 1),
  ('Which instrument typically has 88 keys?', array['Guitar','Piano','Violin','Flute'], 1),
  ('"Bohemian Rhapsody" was performed by which band?', array['Queen','ABBA','The Who','Journey'], 0),
  ('What does "DJ" stand for?', array['Disc Jockey','Dance Jam','Digital Jockey','Drum Jockey'], 0),
  ('Which of these is a woodwind instrument?', array['Trumpet','Clarinet','Violin','Drums'], 1),
  ('Who sang the hit "Shape of You"?', array['Justin Bieber','Ed Sheeran','Bruno Mars','Drake'], 1),
  ('How many letter notes are in a musical octave (A to G)?', array['5','6','7','8'], 2)
) as q(text, answers, correct_index)
where t.slug = 'music' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Movies
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('Who directed the 1997 movie "Titanic"?', array['Steven Spielberg','James Cameron','Christopher Nolan','Martin Scorsese'], 1),
  ('Which film series features Captain Jack Sparrow?', array['Pirates of the Caribbean','The Mummy','Indiana Jones','Treasure Island'], 0),
  ('In "Star Wars", who is Luke Skywalker''s father?', array['Obi-Wan Kenobi','Darth Vader','Yoda','Han Solo'], 1),
  ('Which studio created "Toy Story"?', array['DreamWorks','Pixar','Warner Bros','Universal'], 1),
  ('Who played Iron Man in the Marvel films?', array['Chris Evans','Robert Downey Jr.','Chris Hemsworth','Mark Ruffalo'], 1),
  ('What is the name of the villain in "The Lion King"?', array['Scar','Simba','Mufasa','Timon'], 0),
  ('What is the name of Marvel''s superhero team?', array['Justice League','The Avengers','The X-Men','The Guardians'], 1),
  ('Who directed "Inception" and "The Dark Knight"?', array['James Cameron','Christopher Nolan','Ridley Scott','Quentin Tarantino'], 1),
  ('In "Harry Potter", what is the name of Harry''s owl?', array['Errol','Hedwig','Crookshanks','Fawkes'], 1),
  ('Which animated movie features a snowman named Olaf?', array['Moana','Frozen','Tangled','Encanto'], 1)
) as q(text, answers, correct_index)
where t.slug = 'movies' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Sports
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('How many players from one team are on a basketball court?', array['5','6','7','11'], 0),
  ('In tennis, what is a score of zero called?', array['Nil','Love','Duck','Zero'], 1),
  ('How often are the Summer Olympic Games held?', array['Every 2 years','Every 3 years','Every 4 years','Every 5 years'], 2),
  ('In which sport would you perform a "slam dunk"?', array['Football','Basketball','Tennis','Golf'], 1),
  ('How many holes are in a standard round of golf?', array['9','18','20','24'], 1),
  ('Which country has won the most Olympic gold medals all-time?', array['Russia','United States','China','Germany'], 1),
  ('How many players are on a cricket team?', array['9','10','11','12'], 2),
  ('Which sport is played at Wimbledon?', array['Golf','Tennis','Cricket','Rugby'], 1),
  ('Approximately how long is a marathon?', array['21 km','42 km','50 km','100 km'], 1),
  ('How many minutes is a standard professional boxing round?', array['1','2','3','5'], 2)
) as q(text, answers, correct_index)
where t.slug = 'sports' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Food & Drink
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('Which country is famous for inventing pizza?', array['France','Italy','Greece','Spain'], 1),
  ('What is the main ingredient in guacamole?', array['Tomato','Avocado','Pepper','Onion'], 1),
  ('Sushi originates from which country?', array['China','Japan','Thailand','Korea'], 1),
  ('Which expensive spice comes from the crocus flower?', array['Turmeric','Saffron','Paprika','Cinnamon'], 1),
  ('Which fruit famously has its seeds on the outside?', array['Apple','Strawberry','Banana','Grape'], 1),
  ('What is the main ingredient of hummus?', array['Lentils','Chickpeas','Kidney beans','Peas'], 1),
  ('Champagne traditionally comes from which country?', array['Italy','France','Spain','Germany'], 1),
  ('Which pasta is shaped like short tubes?', array['Spaghetti','Penne','Lasagne','Ravioli'], 1),
  ('Which drink is made from fermented grapes?', array['Beer','Wine','Cider','Vodka'], 1),
  ('Tofu is made mainly from which ingredient?', array['Rice','Soybeans','Wheat','Corn'], 1)
) as q(text, answers, correct_index)
where t.slug = 'food-drink' and not exists (select 1 from public.questions x where x.topic_id = t.id);

-- Space & Astronomy
insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('What is the closest planet to the Sun?', array['Venus','Mercury','Earth','Mars'], 1),
  ('Which galaxy do we live in?', array['Andromeda','Milky Way','Whirlpool','Sombrero'], 1),
  ('What is the largest planet in the solar system?', array['Saturn','Jupiter','Neptune','Earth'], 1),
  ('What is the name of Earth''s only natural satellite?', array['Titan','The Moon','Europa','Phobos'], 1),
  ('Which planet is famous for its prominent rings?', array['Mars','Saturn','Venus','Mercury'], 1),
  ('What star lies at the centre of our solar system?', array['Polaris','The Sun','Sirius','Betelgeuse'], 1),
  ('Who was the first human in space?', array['Neil Armstrong','Yuri Gagarin','Buzz Aldrin','John Glenn'], 1),
  ('What force causes planets to orbit the Sun?', array['Magnetism','Gravity','Friction','Radiation'], 1),
  ('A "shooting star" is actually what?', array['A dying star','A meteor','A planet','A comet'], 1),
  ('About how long does sunlight take to reach Earth?', array['8 minutes','8 seconds','8 hours','1 minute'], 0)
) as q(text, answers, correct_index)
where t.slug = 'space' and not exists (select 1 from public.questions x where x.topic_id = t.id);
