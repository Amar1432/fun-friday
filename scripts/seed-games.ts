import { PrismaClient, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding games and questions...');

  // 1. Delete existing games if any
  await prisma.game.deleteMany({});
  console.log('Cleared existing games.');

  // 2. Create Emoji Guess Game
  const game = await prisma.game.create({
    data: {
      name: 'Emoji Guess',
      description: 'Guess the movie from emojis!',
      questions: {
        create: [
          {
            prompt: '🎩⚡👦',
            answer: 'Harry Potter',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'A wizard boy with a scar' },
          },
          {
            prompt: '🦁👑',
            answer: 'The Lion King',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: "Simba's journey" },
          },
          {
            prompt: '🚢❄️💔',
            answer: 'Titanic',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: 'Jack and Rose on a ship' },
          },
          {
            prompt: '🕷️🕸️👦',
            answer: 'Spider-Man',
            difficulty: QuestionDifficulty.EASY,
            category: 'Movies',
            metadata: { hint: 'With great power comes great responsibility' },
          },
          {
            prompt: '🦇🏃‍♂️🏰',
            answer: 'Batman',
            difficulty: QuestionDifficulty.MEDIUM,
            category: 'Movies',
            metadata: { hint: "Gotham's dark knight" },
          },
        ],
      },
    },
  });

  console.log(`Seeding complete. Created Game ID: ${game.id}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
