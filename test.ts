import { 
  createInitialGameState,
  isChessMoveLegal
} from './src/secretKingBoot/gameLogic';
import { isKingInCheck } from './src/secretKingBoot/improvedCheckLogic';

/**
 * Test : Le roi ne peut pas se déplacer sur une case attaquée par un pion
 */
function testKingCannotMoveToAttackedSquare() {
  console.log('=== Test : Le roi ne peut pas se déplacer sur une case attaquée par un pion ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau vide
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer le roi blanc en E1 (position initiale)
  gameState.board[0][4] = 'WhiteKing';
  gameState.whiteKingPosition = 'E1';
  
  // Placer le roi noir en E8 (position initiale)
  gameState.board[7][4] = 'BlackKing';
  gameState.blackKingPosition = 'E8';
  
  // Placer un pion noir en D3 qui attaque E2
  gameState.board[2][3] = 'BlackPawn';  // D3
  
  console.log('Plateau configuré :');
  console.log('- Roi blanc en E1');
  console.log('- Roi noir en E8');
  console.log('- Pion noir en D3 (attaque E2 et C2)');
  
  // Test 1: Le roi blanc ne devrait PAS pouvoir aller en E2 (attaqué par le pion)
  console.log('\nTest 1: Tentative de déplacement E1 -> E2 (case attaquée par pion)');
  const moveToE2Legal = isChessMoveLegal(gameState, 'E1', 'E2');
  console.log(`Mouvement E1 -> E2 autorisé: ${moveToE2Legal} (devrait être false)`);
  
  // Test 2: Le roi blanc devrait pouvoir aller en F1 (case libre)
  console.log('\nTest 2: Tentative de déplacement E1 -> F1 (case libre)');
  const moveToF1Legal = isChessMoveLegal(gameState, 'E1', 'F1');
  console.log(`Mouvement E1 -> F1 autorisé: ${moveToF1Legal} (devrait être true)`);
  
  // Test 3: Ajouter un autre pion pour attaquer F2
  gameState.board[2][6] = 'BlackPawn';  // G3 attaque F2 et H2
  console.log('\nAjout d\'un pion noir en G3');
  
  console.log('\nTest 3: Tentative de déplacement E1 -> F2 (maintenant attaqué)');
  const moveToF2Legal = isChessMoveLegal(gameState, 'E1', 'F2');
  console.log(`Mouvement E1 -> F2 autorisé: ${moveToF2Legal} (devrait être false)`);
  
  // Résumé
  console.log('\n=== RÉSUMÉ ===');
  console.log(`❌ Test 1 ${!moveToE2Legal ? 'RÉUSSI' : 'ÉCHOUÉ'} - Le roi ne peut pas aller sur une case attaquée`);
  console.log(`✅ Test 2 ${moveToF1Legal ? 'RÉUSSI' : 'ÉCHOUÉ'} - Le roi peut aller sur une case libre`);
  console.log(`❌ Test 3 ${!moveToF2Legal ? 'RÉUSSI' : 'ÉCHOUÉ'} - Le roi ne peut pas aller sur une case attaquée par un autre pion`);
  
  const allTestsPassed = !moveToE2Legal && moveToF1Legal && !moveToF2Legal;
  console.log(`\n🎯 Tous les tests : ${allTestsPassed ? 'RÉUSSIS' : 'ÉCHOUÉS'}`);
  
  return allTestsPassed;
}

/**
 * Test : Vérifier la détection d'échec par les pions
 */
function testPawnCheckDetection() {
  console.log('\n=== Test : Détection d\'échec par les pions ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  
  // Créer un plateau vide
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer le roi blanc en E1
  gameState.board[0][4] = 'WhiteKing';
  gameState.whiteKingPosition = 'E1';
  
  // Placer le roi noir loin
  gameState.board[7][4] = 'BlackKing';
  gameState.blackKingPosition = 'E8';
  
  // Placer un pion noir en D2 qui met le roi blanc en échec
  gameState.board[1][3] = 'BlackPawn';  // D2 attaque E1
  
  console.log('Plateau configuré :');
  console.log('- Roi blanc en E1');
  console.log('- Pion noir en D2 (attaque E1)');
  
  const kingInCheck = isKingInCheck(gameState, 'white');
  console.log(`Roi blanc en échec: ${kingInCheck} (devrait être true)`);
  
  console.log(`✅ Test ${kingInCheck ? 'RÉUSSI' : 'ÉCHOUÉ'} - Détection d'échec par pion`);
  
  return kingInCheck;
}

// Exécuter les tests
console.log('🧪 Tests de validation des mouvements du roi\n');

const test1 = testKingCannotMoveToAttackedSquare();
const test2 = testPawnCheckDetection();

console.log('\n📊 RÉSULTATS FINAUX');
console.log(`Test mouvement roi sur case attaquée: ${test1 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
console.log(`Test détection échec par pion: ${test2 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);

if (!test1 || !test2) {
  console.log('\n🚨 PROBLÈME DÉTECTÉ : Le roi peut se déplacer sur des cases où il serait en échec !');
} else {
  console.log('\n✅ Tous les tests passent !');
}
