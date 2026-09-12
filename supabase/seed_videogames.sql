-- Quizzey — Videogames topic (safe to re-run). 35 questions.
-- Run in the Supabase SQL editor.

insert into public.topics (slug, name, description, category, color, icon, is_official)
values ('videogames', 'Videogames', 'Consoles, characters and classics.', 'Entertainment', '#7c3aed', '🎮', true)
on conflict (slug) do nothing;

insert into public.questions (topic_id, text, answers, correct_index)
select t.id, q.text, q.answers, q.correct_index from public.topics t cross join (values
  ('Which company created the Mario franchise?', array['Sega','Nintendo','Sony','Microsoft'], 1),
  ('What is the name of Mario''s green dinosaur companion?', array['Yoshi','Bowser','Toad','Luigi'], 0),
  ('In Minecraft, which creature explodes when it gets near you?', array['Zombie','Creeper','Skeleton','Enderman'], 1),
  ('Which company makes the PlayStation console?', array['Microsoft','Sony','Nintendo','Sega'], 1),
  ('What is the best-selling video game of all time?', array['Tetris','Minecraft','Grand Theft Auto V','Wii Sports'], 1),
  ('In Pokémon, what type is Pikachu?', array['Fire','Water','Electric','Grass'], 2),
  ('Which battle-royale game is known for its building mechanics?', array['PUBG','Fortnite','Apex Legends','Warzone'], 1),
  ('Who is the main antagonist in most Super Mario games?', array['Wario','Bowser','Donkey Kong','Ganon'], 1),
  ('What is the name of the hero in The Legend of Zelda?', array['Zelda','Link','Ganon','Navi'], 1),
  ('Which company developed the game Halo?', array['Bungie','Valve','Rockstar','Ubisoft'], 0),
  ('In Among Us, what are the bad players called?', array['Crewmates','Impostors','Ghosts','Traitors'], 1),
  ('What does "FPS" mean as a game genre?', array['First-Person Shooter','Fast Play Score','Final Play Stage','Full Player System'], 0),
  ('Which plumber is Mario''s brother?', array['Wario','Luigi','Toad','Waluigi'], 1),
  ('What is the in-game currency of Fortnite?', array['Coins','V-Bucks','Gems','Robux'], 1),
  ('What is the in-game currency of Roblox?', array['V-Bucks','Robux','Gems','Coins'], 1),
  ('Which game is set in the fictional land of Hyrule?', array['Final Fantasy','The Legend of Zelda','Skyrim','Halo'], 1),
  ('In Sonic the Hedgehog, what does Sonic collect?', array['Coins','Rings','Stars','Gems'], 1),
  ('Which company owns the Xbox brand?', array['Sony','Microsoft','Nintendo','Sega'], 1),
  ('What kind of animal is Crash in Crash Bandicoot?', array['Fox','Bandicoot','Raccoon','Dog'], 1),
  ('Which racing series features karts and Nintendo characters?', array['Gran Turismo','Mario Kart','Forza','Need for Speed'], 1),
  ('Who is the protagonist of The Witcher series?', array['Geralt','Ciri','Vesemir','Dandelion'], 0),
  ('Which game popularised the phrase "the cake is a lie"?', array['Half-Life','Portal','BioShock','Doom'], 1),
  ('In which city is Grand Theft Auto V set?', array['Liberty City','Los Santos','Vice City','San Fierro'], 1),
  ('Which handheld console did Nintendo release in 1989?', array['Game Boy','PSP','Nintendo DS','Game Gear'], 0),
  ('What is the profession of the main character in Doom?', array['Scientist','Space Marine','Pilot','Detective'], 1),
  ('In League of Legends, how many players are on each team?', array['3','5','6','10'], 1),
  ('Which company created Pac-Man?', array['Namco','Atari','Nintendo','Sega'], 0),
  ('What is the name of Link''s horse in Zelda games?', array['Epona','Roach','Agro','Shadowmere'], 0),
  ('Which game features a character called Master Chief?', array['Halo','Gears of War','Call of Duty','Destiny'], 0),
  ('In Animal Crossing, which raccoon runs the town and loans?', array['Tom Nook','Isabelle','K.K. Slider','Blathers'], 0),
  ('Which is the best-selling home console of all time?', array['PlayStation 2','Nintendo Wii','Xbox 360','PlayStation 4'], 0),
  ('Which genre does Street Fighter belong to?', array['Racing','Fighting','Puzzle','Strategy'], 1),
  ('Which company developed Fortnite?', array['Epic Games','Valve','EA','Ubisoft'], 0),
  ('What colour is the character Kirby?', array['Red','Pink','Yellow','Blue'], 1),
  ('In Tetris, clearing how many lines at once is a "Tetris"?', array['2','3','4','5'], 2)
) as q(text, answers, correct_index)
where t.slug = 'videogames' and not exists (select 1 from public.questions x where x.topic_id = t.id);
