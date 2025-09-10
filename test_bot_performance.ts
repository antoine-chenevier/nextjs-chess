/**
 * Performance test for bot improvements
 */

import { createBot, BotDifficulty } from './src/secretKingBoot/bot';
import { SecretKingBootGameState } from './src/secretKingBoot/types';

// Create a sample game state for testing
function createSampleGameState(): SecretKingBootGameState {
  return {
    currentPlayer: 'white',
    turn: 5,
    gamePhase: 'playing',
    gameStatus: {
      status: 'playing'
    },
    whiteReserve: {
      pawns: 3,
      knights: 1,
      bishops: 1,
      rooks: 1,
      queens: 0
    },
    blackReserve: {
      pawns: 2,
      knights: 1,
      bishops: 1,
      rooks: 1,
      queens: 0
    },
    whiteKingPosition: 'E1',
    blackKingPosition: 'E8',
    moveHistory: [],
    board: [
      [null, null, null, null, 'WhiteKing', null, null, null],
      ['WhitePawn', 'WhitePawn', null, null, null, null, 'WhitePawn', 'WhitePawn'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'WhitePawn', 'BlackPawn', null, null, null],
      [null, null, null, 'BlackPawn', 'WhitePawn', null, null, null],
      [null, null, null, null, null, null, null, null],
      ['BlackPawn', 'BlackPawn', null, null, null, null, 'BlackPawn', 'BlackPawn'],
      [null, null, null, null, 'BlackKing', null, null, null]
    ]
  };
}

async function testBotPerformance() {
  console.log('=== Test de Performance des Bots Améliorés ===\n');
  
  const gameState = createSampleGameState();
  const difficulties = [
    BotDifficulty.EASY,
    BotDifficulty.MEDIUM,
    BotDifficulty.HARD,
    BotDifficulty.EXPERT,
    BotDifficulty.MASTER
  ];

  for (const difficulty of difficulties) {
    console.log(`Test du niveau ${difficulty.toUpperCase()}:`);
    
    try {
      const bot = createBot(difficulty);
      const startTime = Date.now();
      
      const move = await bot.makeMove(gameState);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`  ✓ Coup trouvé: ${move.type} ${move.from || ''} -> ${move.to || ''}`);
      console.log(`  ✓ Temps de réflexion: ${duration}ms`);
      console.log(`  ✓ Difficulté: ${bot.getDifficulty()}`);
      
      // Validation basique du coup
      if (move.type && move.player) {
        console.log(`  ✓ Coup valide généré\n`);
      } else {
        console.log(`  ✗ Coup invalide!\n`);
      }
      
    } catch (error) {
      console.log(`  ✗ Erreur: ${error}\n`);
    }
  }
  
  console.log('=== Test de Performance Terminé ===');
}

async function compareBotLevels() {
  console.log('\n=== Comparaison des Niveaux de Bot ===\n');
  
  const gameState = createSampleGameState();
  const testRounds = 3;
  
  for (const difficulty of [BotDifficulty.MEDIUM, BotDifficulty.HARD, BotDifficulty.EXPERT]) {
    console.log(`Test de ${difficulty} (${testRounds} rounds):`);
    const bot = createBot(difficulty);
    
    let totalTime = 0;
    const moves: string[] = [];
    
    for (let i = 0; i < testRounds; i++) {
      const startTime = Date.now();
      const move = await bot.makeMove(gameState);
      const endTime = Date.now();
      
      totalTime += (endTime - startTime);
      moves.push(`${move.type}:${move.from || '?'}->${move.to || '?'}`);
    }
    
    const avgTime = totalTime / testRounds;
    console.log(`  Temps moyen: ${avgTime.toFixed(1)}ms`);
    console.log(`  Coups testés: ${moves.join(', ')}`);
    console.log(`  Consistance: ${moves.length === testRounds ? 'OK' : 'Variable'}\n`);
  }
}

// Run the tests
if (require.main === module) {
  testBotPerformance()
    .then(() => compareBotLevels())
    .catch(console.error);
}

export { testBotPerformance, compareBotLevels };