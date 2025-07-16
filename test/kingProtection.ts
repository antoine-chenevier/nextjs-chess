// Tests spécifiques pour la protection du roi

import { 
  createInitialGameState, 
  validateGameIntegrity,
  isChessMoveLegal,
  repairGameState
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction, SecretKingBootGameState } from '../src/secretKingBoot/types';

/**
 * Test : Vérification que le roi ne peut pas être capturé
 */
function testKingCaptureProtection() {
  console.log('=== Test : Protection contre la capture du roi ===');
  
  // Créer une situation où le roi pourrait être capturé
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'black'; // Tour noire va essayer de capturer
  
  // Créer un plateau vide
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer le roi blanc en E1
  gameState.board[0][4] = 'WhiteKing';
  gameState.whiteKingPosition = 'E1';
  
  // Placer le roi noir en E8  
  gameState.board[7][4] = 'BlackKing';
  gameState.blackKingPosition = 'E8';
  
  // Placer une tour noire qui pourrait "attaquer" le roi blanc
  gameState.board[1][4] = 'BlackRook';
  
  console.log('Situation créée: Roi blanc en E1, Tour noire en E2');
  
  // Tenter de faire un mouvement illégal qui exposerait le roi
  const illegalAction: GameAction = {
    type: 'move_piece',
    player: 'black',
    turn: 1,
    from: 'E2',
    to: 'E1', // Tentative de "capturer" le roi
    piece: 'BlackRook'
  };
  
  console.log('Test: Tentative de mouvement E2 -> E1 (capture du roi)');
  
  // Vérifier que isChessMoveLegal rejette cette action
  const isLegal = isChessMoveLegal(gameState, 'E2', 'E1');
  console.log(`Mouvement légal selon isChessMoveLegal: ${isLegal}`);
  
  if (isLegal) {
    console.error('❌ ÉCHEC: isChessMoveLegal permet la capture du roi');
    return false;
  }
  
  // Tenter d'appliquer l'action directement
  const newState = applyAction(gameState, illegalAction);
  
  // Vérifier que l'état n'a pas changé (action rejetée)
  const whiteKingStillThere = newState.board[0][4] === 'WhiteKing';
  console.log(`Roi blanc toujours en place: ${whiteKingStillThere}`);
  
  if (!whiteKingStillThere) {
    console.error('❌ ÉCHEC: applyAction a permis la capture du roi');
    return false;
  }
  
  console.log('✅ Protection du roi fonctionne correctement');
  return true;
}

/**
 * Test : Détection de roi manquant
 */
function testMissingKingDetection() {
  console.log('\n=== Test : Détection de roi manquant ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  
  // Supprimer délibérément le roi blanc
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  gameState.board[7][4] = 'BlackKing'; // Seulement le roi noir
  
  console.log('Situation créée: Roi blanc supprimé, seul le roi noir reste');
  
  const integrity = validateGameIntegrity(gameState);
  console.log(`Intégrité valide: ${integrity.valid}`);
  console.log('Erreurs détectées:', integrity.errors);
  
  if (integrity.valid) {
    console.error('❌ ÉCHEC: Roi manquant non détecté');
    return false;
  }
  
  if (!integrity.errors.some(error => error.includes('ROI BLANC MANQUANT'))) {
    console.error('❌ ÉCHEC: Message d\'erreur incorrect');
    return false;
  }
  
  console.log('✅ Détection de roi manquant fonctionne');
  return true;
}

/**
 * Test : Réparation d'état corrompu
 */
function testGameStateRepair() {
  console.log('\n=== Test : Réparation d\'état corrompu ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  // Corrompre l'état en supprimant les rois
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  console.log('État corrompu créé: Positions stockées mais rois absents');
  
  const repairedState = repairGameState(gameState);
  
  // Vérifier que les rois ont été remis en place
  const whiteKingRestored = repairedState.board[0][4] === 'WhiteKing';
  const blackKingRestored = repairedState.board[7][4] === 'BlackKing';
  
  console.log(`Roi blanc restauré: ${whiteKingRestored}`);
  console.log(`Roi noir restauré: ${blackKingRestored}`);
  
  if (!whiteKingRestored || !blackKingRestored) {
    console.error('❌ ÉCHEC: Réparation incomplète');
    return false;
  }
  
  // Vérifier l'intégrité de l'état réparé
  const integrity = validateGameIntegrity(repairedState);
  console.log(`Intégrité après réparation: ${integrity.valid}`);
  
  if (!integrity.valid) {
    console.error('❌ ÉCHEC: État toujours corrompu après réparation');
    return false;
  }
  
  console.log('✅ Réparation d\'état fonctionne');
  return true;
}

/**
 * Test : Vérification des mouvements en situation d'échec
 */
function testCheckMovementValidation() {
  console.log('\n=== Test : Validation des mouvements en échec ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau vide d'abord
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois
  gameState.board[0][4] = 'WhiteKing';   // Roi blanc en E1
  gameState.board[7][4] = 'BlackKing';   // Roi noir en E8
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  // Placer une tour noire en A1 qui met le roi blanc en échec
  gameState.board[0][0] = 'BlackRook';   // Tour noire en A1
  
  console.log('Situation créée: Roi blanc en E1 en échec par tour noire en A1');
  
  // Test 1: Mouvement du roi qui reste en échec (sur la même rangée)
  console.log('Test 1: Mouvement E1 -> F1 (reste en échec sur la rangée)');
  const isLegalBadMove = isChessMoveLegal(gameState, 'E1', 'F1');
  console.log(`Mouvement qui reste en échec rejeté: ${!isLegalBadMove}`);
  
  // Test 2: Mouvement du roi qui sort d'échec
  console.log('Test 2: Mouvement E1 -> E2 (sort d\'échec)');
  const isLegalGoodMove = isChessMoveLegal(gameState, 'E1', 'E2');
  console.log(`Mouvement qui sort d'échec accepté: ${isLegalGoodMove}`);
  
  if (isLegalBadMove) {
    console.error('❌ ÉCHEC: Mouvement qui laisse en échec accepté');
    return false;
  }
  
  if (!isLegalGoodMove) {
    console.error('❌ ÉCHEC: Mouvement qui sort d\'échec rejeté');
    return false;
  }
  
  console.log('✅ Validation des mouvements en échec fonctionne');
  return true;
}

/**
 * Exécuter tous les tests de protection du roi
 */
export function runKingProtectionTests() {
  console.log('👑 Début des tests de protection du roi\n');
  
  const results = [
    testKingCaptureProtection(),
    testMissingKingDetection(),
    testGameStateRepair(),
    testCheckMovementValidation()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Résultats des tests de protection : ${passed}/${total} réussis`);
  
  if (passed === total) {
    console.log('🎉 Tous les tests de protection du roi sont passés !');
    console.log('👑 Le roi est maintenant protégé contre toute capture illégale.');
  } else {
    console.log('⚠️  Certains tests de protection ont échoué');
    console.log('🔧 Vérifiez les fonctions de validation et de protection');
  }
  
  return passed === total;
}

// Exporter les fonctions individuelles
export {
  testKingCaptureProtection,
  testMissingKingDetection,
  testGameStateRepair,
  testCheckMovementValidation
};
