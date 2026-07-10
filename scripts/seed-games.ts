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

  console.log(`Seeding complete.`);
  console.log(`  Game ID: ${game.id}`);
  console.log(`  Total questions: ${questionCount}`);
  console.log(`  Easy: ${easyCount}`);
  console.log(`  Medium: ${mediumCount}`);
  console.log(`  Hard: ${hardCount}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
