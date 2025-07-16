/**
 * Test des corrections pour le problème de tours multiples en échec
 * Usage: npx tsx test/checkFixTest.ts
 */

import { createInitialGameState, isValidAction } from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { getAvailableActions } from '../src/secretKingBoot/gameAnalysis';
import { GameAction } from '../src/secretKingBoot/types';

console.log('🔧 Test des corrections - Tours multiples en échec');
console.log('===================================================');

// Test 1: Créer une situation d'échec
function createCheckSituation() {
  const gameState = createInitialGameState();
  
  // Vider le plateau
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      gameState.board[i][j] = null;
    }
  }
  
  // Placer les rois
  gameState.board[0][4] = 'WhiteKing';  // E1
  gameState.board[7][4] = 'BlackKing';  // E8
  
  // Ajout d'une tour noire qui attaque le roi blanc
  gameState.board[6][4] = 'BlackRook';  // E7
  
  // Mettre à jour les positions
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Définir l'état d'échec
  gameState.gameStatus = {
    status: 'check',
    player: 'white'
  };
  
  return gameState;
}

console.log('\n📋 Test 1: Actions disponibles en échec');

const checkGameState = createCheckSituation();
const availableActions = getAvailableActions(checkGameState);

console.log(`Actions disponibles quand le roi blanc est en échec:`);
console.log(`- Nombre d'actions: ${availableActions.length}`);
console.log(`- Actions: ${availableActions.join(', ')}`);
console.log(`- Attendu: seulement 'move_piece'`);

const testResult1 = availableActions.length === 1 && availableActions[0] === 'move_piece';
console.log(`✅ Test 1 ${testResult1 ? 'RÉUSSI' : 'ÉCHOUÉ'}`);

console.log('\n📋 Test 2: Validation des actions interdites en échec');

// Test génération de pion en échec
const generatePawnAction: GameAction = {
  type: 'generate_pawn',
  player: 'white',
  turn: 1
};

const generateValidation = isValidAction(checkGameState, generatePawnAction);
console.log(`Génération de pion en échec:`);
console.log(`- Valide: ${generateValidation.valid}`);
console.log(`- Raison: ${generateValidation.reason}`);
console.log(`- Attendu: false`);

// Test échange de pièces en échec
const exchangeAction: GameAction = {
  type: 'exchange_pieces',
  player: 'white',
  turn: 1,
  exchangeFrom: 'pawn',
  exchangeTo: 'knight',
  cost: 2
};

const exchangeValidation = isValidAction(checkGameState, exchangeAction);
console.log(`\nÉchange de pièces en échec:`);
console.log(`- Valide: ${exchangeValidation.valid}`);
console.log(`- Raison: ${exchangeValidation.reason}`);
console.log(`- Attendu: false`);

const testResult2 = !generateValidation.valid && !exchangeValidation.valid;
console.log(`✅ Test 2 ${testResult2 ? 'RÉUSSI' : 'ÉCHOUÉ'}`);

console.log('\n📋 Test 3: Mouvement qui sort d\'échec');

// Tester un mouvement du roi qui sort d'échec
const validKingMove: GameAction = {
  type: 'move_piece',
  player: 'white',
  turn: 1,
  from: 'E1',
  to: 'D1',
  piece: 'WhiteKing'
};

const kingMoveValidation = isValidAction(checkGameState, validKingMove);
console.log(`Mouvement du roi D1 (sortie d'échec):`);
console.log(`- Valide: ${kingMoveValidation.valid}`);
console.log(`- Raison: ${kingMoveValidation.reason || 'Aucune'}`);

// Appliquer le mouvement et vérifier l'alternance
let testResult3 = false;
if (kingMoveValidation.valid) {
  const newState = applyAction(checkGameState, validKingMove);
  console.log(`\nAprès mouvement du roi:`);
  console.log(`- Joueur actuel: ${newState.currentPlayer} (attendu: black)`);
  console.log(`- Statut: ${newState.gameStatus?.status || 'normal'} (attendu: playing ou normal)`);
  
  testResult3 = newState.currentPlayer === 'black';
  console.log(`✅ Test 3 ${testResult3 ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
} else {
  console.log(`❌ Test 3 ÉCHOUÉ - Mouvement invalide`);
}

console.log('\n📋 Test 4: Mouvement qui ne sort pas d\'échec');

// Ajouter un pion blanc sur l'échiquier
checkGameState.board[1][0] = 'WhitePawn'; // A2

// Tester un mouvement de pion qui ne sort pas d'échec
const invalidPawnMove: GameAction = {
  type: 'move_piece',
  player: 'white',
  turn: 1,
  from: 'A2',
  to: 'A3',
  piece: 'WhitePawn'
};

const pawnMoveValidation = isValidAction(checkGameState, invalidPawnMove);
console.log(`Mouvement de pion A2-A3 (ne sort pas d'échec):`);
console.log(`- Valide: ${pawnMoveValidation.valid}`);
console.log(`- Raison: ${pawnMoveValidation.reason}`);
console.log(`- Attendu: false (ne sort pas d'échec)`);

const testResult4 = !pawnMoveValidation.valid;
console.log(`✅ Test 4 ${testResult4 ? 'RÉUSSI' : 'ÉCHOUÉ'}`);

console.log('\n📊 Résultats finaux:');
const totalTests = 4;
const passedTests = [testResult1, testResult2, testResult3, testResult4].filter(Boolean).length;

console.log(`Tests réussis: ${passedTests}/${totalTests}`);
console.log(`Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 Tous les tests sont passés !');
  console.log('✅ Le problème des tours multiples en échec est corrigé.');
  console.log('✅ Les actions interdites en échec sont bloquées.');
  console.log('✅ Seuls les mouvements qui sortent d\'échec sont autorisés.');
} else {
  console.log('\n⚠️  Certains tests ont échoué.');
  console.log('Vérifiez l\'implémentation des corrections.');
}

console.log('\n🔧 Tests de correction terminés!');
