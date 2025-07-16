// Tests pour le bot Secret King Boot

import { createBot, BotDifficulty } from '../src/secretKingBoot/bot';
import { createInitialGameState } from '../src/secretKingBoot/gameLogic';
import { evaluatePosition } from '../src/secretKingBoot/bot/evaluation';

/**
 * Test : Création et fonctionnement des bots
 */
async function testBotCreation() {
  console.log('=== Test : Création des bots ===');
  
  // Tester chaque niveau de difficulté
  for (const difficulty of [BotDifficulty.EASY, BotDifficulty.MEDIUM, BotDifficulty.HARD]) {
    console.log(`Création d'un bot ${difficulty}...`);
    
    const bot = createBot(difficulty);
    console.log(`✅ Bot ${difficulty} créé avec succès`);
    console.log(`   Difficulté: ${bot.getDifficulty()}`);
    
    // Tester si le bot peut faire un mouvement
    const gameState = createInitialGameState();
    gameState.gamePhase = 'setup'; // Phase de placement initial
    
    try {
      console.log(`   Test d'un mouvement pour le bot ${difficulty}...`);
      const startTime = Date.now();
      const action = await bot.makeMove(gameState);
      const endTime = Date.now();
      
      console.log(`   ✅ Mouvement généré: ${action.type}`);
      console.log(`   ⏱️  Temps de réflexion: ${endTime - startTime}ms`);
    } catch (error) {
      console.error(`   ❌ Erreur: ${error}`);
    }
  }
}

/**
 * Test : Évaluation des positions
 */
function testPositionEvaluation() {
  console.log('\n=== Test : Évaluation des positions ===');
  
  // Position initiale
  const initialState = createInitialGameState();
  const whiteScore = evaluatePosition(initialState, 'white');
  const blackScore = evaluatePosition(initialState, 'black');
  
  console.log(`Position initiale:`);
  console.log(`  Blanc: ${whiteScore}`);
  console.log(`  Noir: ${blackScore}`);
  console.log(`  Différence: ${Math.abs(whiteScore - blackScore)} (devrait être proche de 0)`);
  
  if (Math.abs(whiteScore - blackScore) < 100) {
    console.log('✅ Évaluation équilibrée en position initiale');
  } else {
    console.log('⚠️  Évaluation déséquilibrée en position initiale');
  }
}

/**
 * Test : Performance du bot
 */
async function testBotPerformance() {
  console.log('\n=== Test : Performance du bot ===');
  
  const bot = createBot(BotDifficulty.MEDIUM);
  const gameState = createInitialGameState();
  gameState.gamePhase = 'setup';
  
  const numTests = 5;
  const times: number[] = [];
  
  console.log(`Exécution de ${numTests} mouvements pour mesurer la performance...`);
  
  for (let i = 0; i < numTests; i++) {
    const startTime = Date.now();
    try {
      await bot.makeMove(gameState);
      const endTime = Date.now();
      times.push(endTime - startTime);
      console.log(`  Test ${i + 1}: ${endTime - startTime}ms`);
    } catch (error) {
      console.error(`  Test ${i + 1}: Erreur - ${error}`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    console.log(`📊 Statistiques de performance:`);
    console.log(`   Temps moyen: ${avgTime.toFixed(1)}ms`);
    console.log(`   Temps min: ${minTime}ms`);
    console.log(`   Temps max: ${maxTime}ms`);
    
    if (avgTime < 2000) {
      console.log('✅ Performance acceptable');
    } else {
      console.log('⚠️  Performance lente');
    }
  }
}

/**
 * Test : Cohérence des décisions du bot
 */
async function testBotConsistency() {
  console.log('\n=== Test : Cohérence des décisions ===');
  
  const easyBot = createBot(BotDifficulty.EASY);
  const hardBot = createBot(BotDifficulty.HARD);
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'setup';
  
  console.log('Comparaison des décisions entre bot facile et difficile...');
  
  try {
    const easyAction = await easyBot.makeMove(gameState);
    const hardAction = await hardBot.makeMove(gameState);
    
    console.log(`Bot facile: ${easyAction.type} ${easyAction.to || ''}`);
    console.log(`Bot difficile: ${hardAction.type} ${hardAction.to || ''}`);
    
    // Les actions peuvent être différentes, c'est normal
    console.log('✅ Les deux bots peuvent prendre des décisions');
    
  } catch (error) {
    console.error(`❌ Erreur lors du test de cohérence: ${error}`);
  }
}

/**
 * Exécuter tous les tests du bot
 */
export async function runBotTests() {
  console.log('🤖 Début des tests du bot Secret King Boot\n');
  
  await testBotCreation();
  testPositionEvaluation();
  await testBotPerformance();
  await testBotConsistency();
  
  console.log('\n🎯 Tests du bot terminés !');
}

// Exporter les fonctions individuelles
export {
  testBotCreation,
  testPositionEvaluation,
  testBotPerformance,
  testBotConsistency
};
