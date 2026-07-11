import { PrismaClient, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding games and questions...');

  // 1. Delete existing games if any
  await prisma.game.deleteMany({});
  console.log('Cleared existing games.');

  // 2. Create Emoji Guess Game with comprehensive question bank
  const game = await prisma.game.create({
    data: {
      id: '1cd83808-737f-4c29-ab51-adff5c6a1ef5',
      name: 'Emoji Guess',
      description: 'Guess the movie, show, or phrase from a set of emojis!',
      questions: {
        create: [
          // ─── EASY QUESTIONS ─────────────────────────────────────────────
          // Classic Movies - Easy
          {
            prompt: '🦁👑',
            answer: 'The Lion King',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: {
              hint: "Simba's journey to becoming king",
              acceptedAnswers: ['Lion King'],
            },
          },
          {
            prompt: '🕷️🕸️👦',
            answer: 'Spider-Man',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'With great power comes great responsibility' },
          },
          {
            prompt: '⚡🧙‍♂️⚡',
            answer: 'Harry Potter',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'The boy who lived' },
          },
          {
            prompt: '🧊❄️⛄',
            answer: 'Frozen',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Let it go!' },
          },
          {
            prompt: '🐠🔍🔎',
            answer: 'Finding Nemo',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Just keep swimming' },
          },
          {
            prompt: '🦸‍♂️🛡️⭐',
            answer: 'Captain America',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'First avenger' },
          },
          {
            prompt: '🐢🍕👊',
            answer: 'Teenage Mutant Ninja Turtles',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: {
              hint: 'Heroes in a half shell',
              acceptedAnswers: ['TMNT', 'Ninja Turtles'],
            },
          },
          {
            prompt: '🏰👩‍🦰🐉',
            answer: 'Shrek',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Ogres are like onions' },
          },
          {
            prompt: '🧸🚀🌟',
            answer: 'Toy Story',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'To infinity and beyond!' },
          },
          {
            prompt: '🎪🦁🎪',
            answer: 'The Greatest Showman',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: {
              hint: 'This is the greatest show',
              acceptedAnswers: ['Greatest Showman'],
            },
          },
          // TV Shows - Easy
          {
            prompt: '📺👨‍🔬🧪',
            answer: 'Breaking Bad',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: { hint: 'Say my name' },
          },
          {
            prompt: '☕👗💕',
            answer: 'Sex and the City',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: { hint: 'Four friends in New York' },
          },
          {
            prompt: '🧟‍♂️🏃‍♂️⛪',
            answer: 'The Walking Dead',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: {
              hint: 'Survivors in a zombie apocalypse',
              acceptedAnswers: ['Walking Dead'],
            },
          },

          // ─── MEDIUM QUESTIONS ──────────────────────────────────────────
          // Classic Movies - Medium
          {
            prompt: '🚢❄️💔',
            answer: 'Titanic',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Jack and Rose on a ship' },
          },
          {
            prompt: '🦇🏃‍♂️🏰',
            answer: 'Batman',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: "Gotham's dark knight" },
          },
          {
            prompt: '🚀👽👦',
            answer: 'E.T.',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Phone home' },
          },
          {
            prompt: '💍🧙‍♂️🐉',
            answer: 'The Lord of the Rings',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'One ring to rule them all',
              acceptedAnswers: ['Lord of the Rings', 'LOTR'],
            },
          },
          {
            prompt: '🏰👸🍎',
            answer: 'Snow White',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Fairest of them all' },
          },
          {
            prompt: '🎵🎭🌹',
            answer: 'The Phantom of the Opera',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'Music of the night',
              acceptedAnswers: ['Phantom of the Opera'],
            },
          },
          {
            prompt: '🎬🎭😱',
            answer: 'The Silence of the Lambs',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'A FBI agent interviews a cannibal',
              acceptedAnswers: ['Silence of the Lambs'],
            },
          },
          {
            prompt: '🎄👻👴',
            answer: 'A Christmas Carol',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'Scrooge learns the meaning of Christmas',
              acceptedAnswers: ['Christmas Carol'],
            },
          },
          {
            prompt: '🦖🏟️🔬',
            answer: 'Jurassic Park',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Life finds a way' },
          },
          {
            prompt: '🎭🔪😱',
            answer: 'Scream',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: "What's your favorite scary movie?" },
          },
          // TV Shows - Medium
          {
            prompt: '🏰⚔️🐉',
            answer: 'Game of Thrones',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: {
              hint: 'Winter is coming',
              acceptedAnswers: ['GoT'],
            },
          },
          {
            prompt: '👨‍🔬🧪💊',
            answer: 'Breaking Bad',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: { hint: 'Chemistry teacher turns to crime' },
          },
          {
            prompt: '🏥❤️🩺',
            answer: "Grey's Anatomy",
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: { hint: 'Seattle Grace Hospital drama' },
          },
          {
            prompt: '👨‍🚀🚀🌎',
            answer: 'The Expanse',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: {
              hint: 'Solar system politics and warfare',
              acceptedAnswers: ['Expanse'],
            },
          },
          {
            prompt: '🕵️‍♂️🔍🧩',
            answer: 'Sherlock',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: { hint: 'The game is on' },
          },

          // ─── HARD QUESTIONS ────────────────────────────────────────────
          // Movies - Hard
          {
            prompt: '🕰️👨‍🔬⚡',
            answer: 'Back to the Future',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: '1.21 gigawatts!' },
          },
          {
            prompt: '🎭🔪💀',
            answer: 'The Shawshank Redemption',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Hope is a good thing',
              acceptedAnswers: ['Shawshank Redemption'],
            },
          },
          {
            prompt: '🃏🃏🃏',
            answer: 'The Dark Knight',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Why so serious?',
              acceptedAnswers: ['Dark Knight'],
            },
          },
          {
            prompt: '👨‍🚀🌙🌌',
            answer: '2001: A Space Odyssey',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Open the pod bay doors, HAL',
              acceptedAnswers: ['2001 A Space Odyssey'],
            },
          },
          {
            prompt: '🗡️👑🏰',
            answer: 'Braveheart',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: "They may take our lives, but they'll never take our freedom!" },
          },
          {
            prompt: '🎭💀👻',
            answer: 'Hamlet',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: 'To be or not to be' },
          },
          {
            prompt: '🎪🤡🎈',
            answer: 'It',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: 'We all float down here' },
          },
          {
            prompt: '🕵️‍♂️🔫🌆',
            answer: 'L.A. Confidential',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Crime and corruption in 1950s Hollywood',
              acceptedAnswers: ['LA Confidential'],
            },
          },
          {
            prompt: '🎭🔪🩸',
            answer: 'Sweeney Todd',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: 'The demon barber of Fleet Street' },
          },
          {
            prompt: '👨‍🚀🌌🪐',
            answer: 'Interstellar',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'We used to look up at the sky and wonder at our place in the stars',
            },
          },
          // TV Shows - Hard
          {
            prompt: '🏰👑👸',
            answer: 'The Princess Bride',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'As you wish',
              acceptedAnswers: ['Princess Bride'],
            },
          },
          {
            prompt: '👨‍🚀🚀☄️',
            answer: 'The Mandalorian',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'This is the way',
              acceptedAnswers: ['Mandalorian'],
            },
          },
          {
            prompt: '🏰👑⚔️',
            answer: 'The Crown',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'Royal family drama',
              acceptedAnswers: ['Crown'],
            },
          },
          {
            prompt: '👨‍⚕️💊🏥',
            answer: 'House M.D.',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'Everybody lies',
              acceptedAnswers: ['House', 'House MD'],
            },
          },
          {
            prompt: '🕵️‍♂️🕵️‍♀️🕵️‍♂️',
            answer: 'True Detective',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'Time is a flat circle',
              acceptedAnswers: ['True Detective'],
            },
          },
        ],
      },
    },
  });

  // 3. Create Bad Movie Description Game with comprehensive question bank
  const badMovieGame = await prisma.game.create({
    data: {
      id: '2f8b9a1c-4d5e-6f70-81a2-b3c4d5e6f708',
      name: 'Bad Movie Description',
      description: 'Figure out the movie from a hilariously terrible description.',
      questions: {
        create: [
          // ─── EASY QUESTIONS ─────────────────────────────────────────────
          // Movies - Easy
          {
            prompt:
              'A shy teenager puts on a red and blue suit with spider powers and climbs buildings.',
            answer: 'Spider-Man',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: {
              hint: 'Superhero with a spider bite',
              acceptedAnswers: ['Spiderman'],
            },
          },
          {
            prompt:
              'A princess with ice powers accidentally freezes her kingdom and sings a song about letting go.',
            answer: 'Frozen',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Disney animated musical' },
          },
          {
            prompt:
              'A boy discovers he is a wizard, goes to a school for magic, and has a scar shaped like lightning.',
            answer: 'Harry Potter',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'The boy who lived' },
          },
          {
            prompt: 'A lion cub loses his father, runs away, and returns to take back his pride.',
            answer: 'The Lion King',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: {
              hint: 'Disney animated classic',
              acceptedAnswers: ['Lion King'],
            },
          },
          {
            prompt:
              'A cowboy doll feels replaced when a space ranger action figure joins the toy box.',
            answer: 'Toy Story',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'To infinity and beyond!' },
          },
          {
            prompt:
              'A green ogre goes on a quest to get his swamp back and befriends a chatty donkey.',
            answer: 'Shrek',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Ogres are like onions' },
          },
          {
            prompt:
              'A villain with a pointy nose tries to steal the moon but softens after adopting three girls.',
            answer: 'Despicable Me',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Minions boss' },
          },
          {
            prompt:
              'Tiny yellow banana-shaped creatures speak gibberish and serve the biggest villain they can find.',
            answer: 'Minions',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Banana-shaped sidekicks' },
          },
          {
            prompt: 'Rich people clone dinosaurs for a zoo and then everything eats the visitors.',
            answer: 'Jurassic Park',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'Life finds a way' },
          },
          // TV Shows - Easy
          {
            prompt:
              'A sick chemistry teacher starts making illegal drugs with a former student in a desert.',
            answer: 'Breaking Bad',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: { hint: 'Say my name' },
          },
          {
            prompt: 'Six pals in New York drink coffee and break up a lot in a purple apartment.',
            answer: 'Friends',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: { hint: 'Could this BE any more iconic?' },
          },
          {
            prompt:
              'A yellow sponge lives in a pineapple and works at a burger place under the sea.',
            answer: 'SpongeBob SquarePants',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: {
              hint: 'Absorbent and yellow',
              acceptedAnswers: ['SpongeBob'],
            },
          },
          {
            prompt:
              'A yellow family with a bald dad who works at a power plant causes chaos in Springfield.',
            answer: 'The Simpsons',
            difficulty: QuestionDifficulty.EASY,
            category: 'TV Shows',
            metadata: { hint: 'Doh!', acceptedAnswers: ['Simpsons'] },
          },

          // ─── MEDIUM QUESTIONS ──────────────────────────────────────────
          // Movies - Medium
          {
            prompt:
              'A huge boat hits an iceberg and a poor artist falls for a rich girl who will not move over to the floating door.',
            answer: 'Titanic',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: '1997 disaster romance' },
          },
          {
            prompt: 'A billionaire dresses as a bat to punch criminals in a rainy city.',
            answer: 'Batman',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: "Gotham's dark knight",
              acceptedAnswers: ['The Batman'],
            },
          },
          {
            prompt:
              'A wrinkly alien gets left behind and a kid hides him while he tries to phone his spaceship.',
            answer: 'E.T.',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Phone home', acceptedAnswers: ['ET'] },
          },
          {
            prompt:
              'A short creature carries a ring to a volcano to destroy it while nine walkers chase him.',
            answer: 'The Lord of the Rings',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'One ring to rule them all',
              acceptedAnswers: ['Lord of the Rings', 'LOTR'],
            },
          },
          {
            prompt:
              'A princess eats a poisoned apple and is woken by a prince after sleeping near tiny workers.',
            answer: 'Snow White',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Fairest of them all' },
          },
          {
            prompt:
              'A masked musician lives under a Paris theater and teaches a singer while wearing a half mask.',
            answer: 'The Phantom of the Opera',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'Music of the night',
              acceptedAnswers: ['Phantom of the Opera'],
            },
          },
          {
            prompt:
              'A young agent asks a polite cannibal for help catching another killer who skins his victims.',
            answer: 'The Silence of the Lambs',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'A FBI agent interviews a cannibal',
              acceptedAnswers: ['Silence of the Lambs'],
            },
          },
          {
            prompt:
              'A mean old man is visited by three ghosts on Christmas Eve and learns to share.',
            answer: 'A Christmas Carol',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: {
              hint: 'Scrooge learns the meaning of Christmas',
              acceptedAnswers: ['Christmas Carol'],
            },
          },
          {
            prompt:
              'A hacker chooses between a red and blue pill and learns the world is a simulation run by machines.',
            answer: 'The Matrix',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Wake up, Neo', acceptedAnswers: ['Matrix'] },
          },
          // TV Shows - Medium
          {
            prompt:
              'Noble families fight over a pointy chair while zombies march beyond a wall of ice.',
            answer: 'Game of Thrones',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: {
              hint: 'Winter is coming',
              acceptedAnswers: ['GoT'],
            },
          },
          {
            prompt: 'Doctors in Seattle fall in love and cry a lot in the hospital halls.',
            answer: "Grey's Anatomy",
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: {
              hint: 'Seattle Grace Hospital drama',
              acceptedAnswers: ['Greys Anatomy'],
            },
          },
          {
            prompt:
              'Humans fight across the solar system while a creepy blue stuff turns people into monsters.',
            answer: 'The Expanse',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: {
              hint: 'Solar system politics and warfare',
              acceptedAnswers: ['Expanse'],
            },
          },
          {
            prompt:
              'A clever detective with a coat solves crimes in London and says the game is on.',
            answer: 'Sherlock',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: { hint: 'Elementary, my dear' },
          },
          {
            prompt:
              'Workers at a paper company do almost nothing while a camera follows their awkward boss.',
            answer: 'The Office',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: {
              hint: 'That is what she said',
              acceptedAnswers: ['The Office US', 'Office'],
            },
          },
          {
            prompt:
              'Kids in a small town fight a monster from another dimension with the help of a girl with a buzzcut.',
            answer: 'Stranger Things',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'TV Shows',
            metadata: { hint: 'Friends don’t lie' },
          },

          // ─── HARD QUESTIONS ────────────────────────────────────────────
          // Movies - Hard
          {
            prompt:
              'A teenager rides a souped-up car into the past and must make his parents fall in love at a school dance.',
            answer: 'Back to the Future',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: '1.21 gigawatts!' },
          },
          {
            prompt:
              'A wrongly jailed man spends years tunneling out with a tiny rock hammer and escapes through sewage.',
            answer: 'The Shawshank Redemption',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Hope is a good thing',
              acceptedAnswers: ['Shawshank Redemption'],
            },
          },
          {
            prompt: 'A man in a bat suit faces a clown who just wants to watch the world burn.',
            answer: 'The Dark Knight',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Why so serious?',
              acceptedAnswers: ['Dark Knight'],
            },
          },
          {
            prompt:
              'A talking computer turns evil on a spaceship heading to Jupiter past a big glowing slab.',
            answer: '2001: A Space Odyssey',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Open the pod bay doors, HAL',
              acceptedAnswers: ['2001 A Space Odyssey'],
            },
          },
          {
            prompt:
              'A Scottish warrior paints his face blue and yells about freedom before getting executed.',
            answer: 'Braveheart',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: "They may take our lives, but they'll never take our freedom!",
            },
          },
          {
            prompt:
              'A prince talks to his dead dad’s ghost and cannot decide whether to avenge him.',
            answer: 'Hamlet',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: 'To be or not to be' },
          },
          {
            prompt:
              'A scary clown pulls kids into the drains and they all share a terrible secret.',
            answer: 'It',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: 'We all float down here' },
          },
          {
            prompt:
              'Cops in old Hollywood take bribes, wear shades, and uncover a big corruption mess.',
            answer: 'L.A. Confidential',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'Crime and corruption in 1950s Hollywood',
              acceptedAnswers: ['LA Confidential'],
            },
          },
          {
            prompt: 'A barber slits throats and his neighbor bakes the victims into pies.',
            answer: 'Sweeney Todd',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: { hint: 'The demon barber of Fleet Street' },
          },
          {
            prompt:
              'Astronauts travel through a wormhole to find a new home while time moves weirdly near a black hole.',
            answer: 'Interstellar',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'We used to look up at the sky and wonder at our place in the stars',
            },
          },
          // TV Shows - Hard
          {
            prompt:
              'A farm boy becomes a pirate, fights a giant and a swordsman, and says "as you wish" a lot.',
            answer: 'The Princess Bride',
            difficulty: QuestionDifficulty.HARD,
            category: 'Movies',
            metadata: {
              hint: 'As you wish',
              acceptedAnswers: ['Princess Bride'],
            },
          },
          {
            prompt:
              'A bounty hunter in space keeps a tiny green creature in a pod and repeats "this is the way".',
            answer: 'The Mandalorian',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'This is the way',
              acceptedAnswers: ['Mandalorian'],
            },
          },
          {
            prompt:
              'A long show about a queen, her family drama, and lots of fancy hats in Britain.',
            answer: 'The Crown',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'Royal family drama',
              acceptedAnswers: ['Crown'],
            },
          },
          {
            prompt:
              'A rude doctor in a limp solves rare cases while addicted to painkillers and lies.',
            answer: 'House M.D.',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'Everybody lies',
              acceptedAnswers: ['House', 'House MD'],
            },
          },
          {
            prompt:
              'Two detectives investigate a weird murder and one keeps saying time is a flat circle.',
            answer: 'True Detective',
            difficulty: QuestionDifficulty.HARD,
            category: 'TV Shows',
            metadata: {
              hint: 'Time is a flat circle',
              acceptedAnswers: ['True Detective'],
            },
          },
        ],
      },
    },
  });

  // Count questions per difficulty
  const questionCount = await prisma.question.count({
    where: { gameId: game.id },
  });

  const easyCount = await prisma.question.count({
    where: { gameId: game.id, difficulty: QuestionDifficulty.EASY },
  });

  const mediumCount = await prisma.question.count({
    where: { gameId: game.id, difficulty: QuestionDifficulty.MEDIUM },
  });

  const hardCount = await prisma.question.count({
    where: { gameId: game.id, difficulty: QuestionDifficulty.HARD },
  });

  const badMovieQuestionCount = await prisma.question.count({
    where: { gameId: badMovieGame.id },
  });

  const badMovieEasyCount = await prisma.question.count({
    where: { gameId: badMovieGame.id, difficulty: QuestionDifficulty.EASY },
  });

  const badMovieMediumCount = await prisma.question.count({
    where: { gameId: badMovieGame.id, difficulty: QuestionDifficulty.MEDIUM },
  });

  const badMovieHardCount = await prisma.question.count({
    where: { gameId: badMovieGame.id, difficulty: QuestionDifficulty.HARD },
  });

  console.log(`Seeding complete.`);
  console.log(`  Emoji Guess Game ID: ${game.id}`);
  console.log(`    Total questions: ${questionCount}`);
  console.log(`    Easy: ${easyCount}`);
  console.log(`    Medium: ${mediumCount}`);
  console.log(`    Hard: ${hardCount}`);
  console.log(`  Bad Movie Description Game ID: ${badMovieGame.id}`);
  console.log(`    Total questions: ${badMovieQuestionCount}`);
  console.log(`    Easy: ${badMovieEasyCount}`);
  console.log(`    Medium: ${badMovieMediumCount}`);
  console.log(`    Hard: ${badMovieHardCount}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
