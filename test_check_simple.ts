import { 
  isChessMoveLegal, 
  createInitialGameState
} from './src/secretKingBoot/gameLogic';

import { SecretKingBootGameState } from './src/secretKingBoot/types';

/**
 * Test simple et pratique de la validation d'échec
 */
function testCheckValidationSimple() {
  console.log('🎯 Test Simple : Validation d\'échec');
  console.log('=====================================\n');

  const gameState: SecretKingBootGameState = {
    ...createInitialGameState(),
    currentPlayer: 'white',
    gamePhase: 'playing'
  };

  // Situation 1: Roi blanc en E1, Dame noire en A1 qui attaque la première rangée
  console.log('--- Situation 1: Dame noire attaque la première rangée ---');
  
  // Vider l'échiquier et placer seulement les pièces nécessaires
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      gameState.board[i][j] = null;
    }
  }
  
  gameState.board[0][4] = 'WhiteKing';   // E1 - roi blanc
  gameState.board[0][0] = 'BlackQueen';  // A1 - dame noire attaque la première rangée
  gameState.board[7][4] = 'BlackKing';   // E8 - roi noir
  
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  console.log('Configuration: Roi blanc E1, Dame noire A1, Roi noir E8');
  
  // Test 1: Le roi blanc ne devrait PAS pouvoir bouger sur F1 (attaqué par la dame)
  const kingToF1 = isChessMoveLegal(gameState, 'E1', 'F1');
  console.log(`Roi E1 -> F1 : ${!kingToF1 ? '✅' : '❌'} (devrait être rejeté - case attaquée)`);
  
  // Test 2: Le roi blanc ne devrait PAS pouvoir bouger sur D1 (attaqué par la dame)
  const kingToD1 = isChessMoveLegal(gameState, 'E1', 'D1');
  console.log(`Roi E1 -> D1 : ${!kingToD1 ? '✅' : '❌'} (devrait être rejeté - case attaquée)`);
  
  // Test 3: Le roi blanc devrait pouvoir monter en E2 (hors de portée)
  const kingToE2 = isChessMoveLegal(gameState, 'E1', 'E2');
  console.log(`Roi E1 -> E2 : ${kingToE2 ? '✅' : '❌'} (devrait être autorisé - case sûre)`);
  
  console.log('\n--- Situation 2: Pièce clouée ---');
  
  // Situation 2: Fou blanc en E2 entre le roi blanc E1 et la dame noire E8
  gameState.board[0][0] = null;          // Enlever la dame de A1
  gameState.board[1][4] = 'WhiteBishop'; // E2 - fou blanc
  gameState.board[7][4] = 'BlackQueen';  // E8 - dame noire attaque la colonne E
  gameState.board[6][4] = 'BlackKing';   // E7 - déplacer le roi noir
  
  console.log('Configuration: Roi blanc E1, Fou blanc E2, Dame noire E8, Roi noir E7');
  
  // Test 4: Le fou blanc ne devrait PAS pouvoir bouger (cloué)
  const bishopMove = isChessMoveLegal(gameState, 'E2', 'D3');
  console.log(`Fou E2 -> D3 : ${!bishopMove ? '✅' : '❌'} (devrait être rejeté - clouage)`);
  
  // Test 5: Le fou blanc ne peut pas non plus bouger ailleurs
  const bishopMove2 = isChessMoveLegal(gameState, 'E2', 'F3');
  console.log(`Fou E2 -> F3 : ${!bishopMove2 ? '✅' : '❌'} (devrait être rejeté - clouage)`);
  
  console.log('\n--- Situation 3: Mouvement qui expose le roi ---');
  
  // Situation 3: Tour blanche en C1 près du roi, tour noire en C8 pour créer un clouage
  gameState.board[1][4] = null;          // Enlever le fou
  gameState.board[0][2] = 'WhiteRook';   // C1 - tour blanche
  gameState.board[7][2] = 'BlackRook';   // C8 - tour noire
  gameState.board[7][4] = null;          // Enlever la dame noire
  gameState.board[7][4] = 'BlackKing';   // E8 - remettre le roi noir
  
  console.log('Configuration: Roi blanc E1, Tour blanche C1, Tour noire C8, Roi noir E8');
  
  // Test 6: La tour blanche ne devrait PAS pouvoir bouger (laisse le roi exposé)
  const rookMove = isChessMoveLegal(gameState, 'C1', 'C2');
  console.log(`Tour C1 -> C2 : ${!rookMove ? '✅' : '❌'} (devrait être rejeté - expose le roi)`);
  
  // Compter les résultats
  const tests = [!kingToF1, !kingToD1, kingToE2, !bishopMove, !bishopMove2, !rookMove];
  const passed = tests.filter(t => t).length;
  
  console.log('\n=== RÉSUMÉ ===');
  console.log(`Tests réussis: ${passed}/${tests.length}`);
  console.log(`Taux de réussite: ${Math.round(passed/tests.length * 100)}%`);
  
  if (passed === tests.length) {
    console.log('🎉 Parfait ! La validation d\'échec fonctionne correctement.');
  } else if (passed >= 4) {
    console.log('👍 Bon ! La plupart des validations fonctionnent.');
  } else {
    console.log('⚠️ Des améliorations sont nécessaires.');
  }
  
  return passed === tests.length;
}

// Exécuter le test
testCheckValidationSimple();
