// Test simple pour vérifier la protection du roi

import { 
  createInitialGameState, 
  validateGameIntegrity,
  isChessMoveLegal
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

/**
 * Test basique - vérifier que les rois sont protégés
 */
function testBasicKingProtection() {
  console.log('🔍 Test basique de protection du roi...');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  
  // Créer un plateau simple avec juste les deux rois
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  gameState.board[0][4] = 'WhiteKing';   // E1
  gameState.board[7][4] = 'BlackKing';   // E8
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  // Placer une tour noire qui pourrait essayer de capturer le roi blanc
  gameState.board[0][0] = 'BlackRook';   // A1
  gameState.currentPlayer = 'black';
  
  console.log('Plateau configuré:');
  console.log('- Roi blanc en E1');
  console.log('- Roi noir en E8');
  console.log('- Tour noire en A1');
  console.log('- Joueur actuel: noir');
  
  // Vérifier l'intégrité
  const integrity = validateGameIntegrity(gameState);
  console.log(`Intégrité du jeu: ${integrity.valid}`);
  if (!integrity.valid) {
    console.log('Erreurs d\'intégrité:', integrity.errors);
  }
  
  // Test 1: Tentative de capture directe du roi (A1 -> E1)
  console.log('\n--- Test 1: Capture directe du roi ---');
  const isLegal1 = isChessMoveLegal(gameState, 'A1', 'E1');
  console.log(`Tour A1 -> E1 (capture roi): ${isLegal1 ? 'AUTORISÉ ❌' : 'BLOQUÉ ✅'}`);
  
  // Test 2: Action complète avec applyAction
  console.log('\n--- Test 2: Application de l\'action ---');
  const action: GameAction = {
    type: 'move_piece',
    player: 'black',
    turn: 1,
    from: 'A1',
    to: 'E1',
    piece: 'BlackRook'
  };
  
  const beforeKing = gameState.board[0][4];
  const newState = applyAction(gameState, action);
  const afterKing = newState.board[0][4];
  
  console.log(`Roi avant action: ${beforeKing}`);
  console.log(`Roi après action: ${afterKing}`);
  console.log(`Roi préservé: ${beforeKing === afterKing && afterKing === 'WhiteKing' ? 'OUI ✅' : 'NON ❌'}`);
  
  // Test 3: Mouvement légal de la tour
  console.log('\n--- Test 3: Mouvement légal ---');
  const isLegal2 = isChessMoveLegal(gameState, 'A1', 'A2');
  console.log(`Tour A1 -> A2 (légal): ${isLegal2 ? 'AUTORISÉ ✅' : 'BLOQUÉ ❌'}`);
  
  return beforeKing === afterKing && afterKing === 'WhiteKing' && !isLegal1;
}

// Exécuter le test
console.log('🏁 Démarrage du test de protection du roi\n');

try {
  const success = testBasicKingProtection();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 TEST RÉUSSI: Le roi est protégé !');
  } else {
    console.log('💥 TEST ÉCHOUÉ: Le roi n\'est pas protégé !');
  }
  console.log('='.repeat(50));
  
} catch (error) {
  console.error('💥 ERREUR dans le test:', error);
}
