import { createBot, BotDifficulty, getDifficultyDescription } from './src/secretKingBoot/bot';
import { createInitialGameState } from './src/secretKingBoot/gameLogic';

async function testBotSystem() {
  console.log('Testing enhanced chess bot system...\n');

  // Test all difficulty levels
  const difficulties = [
    BotDifficulty.EASY,
    BotDifficulty.MEDIUM,
    BotDifficulty.HARD,
    BotDifficulty.EXPERT,
    BotDifficulty.MASTER
  ];

  for (const difficulty of difficulties) {
    console.log(`Testing ${difficulty.toUpperCase()} difficulty:`);
    console.log(`Description: ${getDifficultyDescription(difficulty)}`);
    
    try {
      const bot = createBot(difficulty);
      const gameState = createInitialGameState();
      
      console.log(`Bot created successfully for ${difficulty}`);
      console.log(`Bot class: ${bot.constructor.name}`);
      
      // Test if bot can make a move (this should work once game is in playing phase)
      // For now, just verify bot creation works
      console.log(`✅ Bot ${difficulty} created and ready\n`);
      
    } catch (error) {
      console.error(`❌ Error testing ${difficulty}: ${error}\n`);
    }
  }

  console.log('Bot system test completed!');
}

testBotSystem().catch(console.error);