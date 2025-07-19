import { 
  isChessMoveLegal, 
  createInitialGameState,
  isValidAction
} from './src/secretKingBoot/gameLogic';

import { 
  SecretKingBootGameState, 
  GameAction 
} from './src/secretKingBoot/types';

/**
 * Test de validation : aucune pièce ne peut être bougée si cela met le roi en échec
 */
function testCheckValidation() {
  console.log('🧪 Test : Validation empêchant de mettre son roi en échec');
  console.log('=========================================================\n');

  let testsPassés = 0;
  let totalTests = 0;

  // Créer un état de jeu avec une situation potentielle d'échec
  const gameState: SecretKingBootGameState = {
    ...createInitialGameState(),
    currentPlayer: 'white',
    gamePhase: 'playing'
  };

  // Configuration spéciale: Roi blanc en E1, Tour noire en E8 (colonne E), Fou blanc en E2 qui protège
  gameState.board[0][4] = 'WhiteKing';   // E1
  gameState.board[7][4] = 'BlackRook';   // E8 - attaque la colonne E
  gameState.board[1][4] = 'WhiteBishop'; // E2 - bloque l'attaque de la tour
  gameState.board[0][3] = null;          // D1 vide
  gameState.board[7][3] = 'BlackKing';   // D8 - roi noir

  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'D8';

  console.log('Situation de test :');
  console.log('- Roi blanc en E1');
  console.log('- Roi noir en D8');
  console.log('- Tour noire en E8 (attaque la colonne E)');
  console.log('- Fou blanc en E2 (protège le roi en bloquant l\'attaque)');
  console.log('- Si le fou bouge, le roi sera en échec\n');

  // Test 1: Le fou blanc ne devrait PAS pouvoir bouger car cela mettrait le roi en échec
  console.log('--- Test 1: Fou ne peut pas bouger (clouage) ---');
  totalTests++;
  const bishopMove = isChessMoveLegal(gameState, 'E2', 'D3');
  console.log(`Fou E2 -> D3 : ${!bishopMove ? '✅' : '❌'} (devrait être rejeté - clouage)`);
  if (!bishopMove) testsPassés++;

  // Test 2: Le fou blanc ne devrait pas pouvoir bouger sur une autre case non plus
  totalTests++;
  const bishopMove2 = isChessMoveLegal(gameState, 'E2', 'F3');
  console.log(`Fou E2 -> F3 : ${!bishopMove2 ? '✅' : '❌'} (devrait être rejeté - clouage)`);
  if (!bishopMove2) testsPassés++;

  // Test 3: Le roi blanc devrait pouvoir bouger pour sortir de la ligne d'attaque
  totalTests++;
  const kingMove = isChessMoveLegal(gameState, 'E1', 'F1');
  console.log(`Roi E1 -> F1 : ${kingMove ? '✅' : '❌'} (devrait être autorisé - sort de la ligne d\'attaque)`);
  if (kingMove) testsPassés++;

  // Test 4: Configuration avec un pion cloué
  console.log('\n--- Test 4: Pion cloué ---');
  gameState.board[1][4] = null;          // Enlever le fou
  gameState.board[1][3] = 'WhitePawn';   // D2 - pion blanc 
  gameState.board[7][4] = null;          // Enlever la tour
  gameState.board[7][3] = 'BlackRook';   // D8 - tour noire attaque diagonale (remplace le roi)
  gameState.board[6][3] = 'BlackKing';   // D7 - déplacer le roi noir
  gameState.blackKingPosition = 'D8';     // Garder la référence D8 pour simplifier
  
  totalTests++;
  const pawnMove = isChessMoveLegal(gameState, 'D2', 'D3');
  console.log(`Pion D2 -> D3 : ${!pawnMove ? '✅' : '❌'} (devrait être rejeté - clouage diagonal)`);
  if (!pawnMove) testsPassés++;

  // Test 5: Test avec action complète (pour valider la logique d'action)
  console.log('\n--- Test 5: Validation d\'action complète ---');
  const invalidAction: GameAction = {
    type: 'move_piece',
    player: 'white',
    turn: 1,
    from: 'D2',
    to: 'D3'
  };

  totalTests++;
  const actionResult = isValidAction(gameState, invalidAction);
  console.log(`Action D2 -> D3 : ${!actionResult.valid ? '✅' : '❌'} (devrait être rejetée)`);
  if (!actionResult.valid) {
    console.log(`   Raison: ${actionResult.reason}`);
    testsPassés++;
  }

  // Résumé
  console.log('\n=== RÉSUMÉ ===');
  console.log(`Tests réussis: ${testsPassés}/${totalTests}`);
  console.log(`Taux de réussite: ${Math.round(testsPassés/totalTests * 100)}%`);
  
  if (testsPassés === totalTests) {
    console.log('🎉 Tous les tests sont passés ! La validation d\'échec fonctionne correctement.');
  } else {
    console.log('❌ Certains tests ont échoué. La validation nécessite des ajustements.');
  }

  return testsPassés === totalTests;
}

// Exécuter le test
testCheckValidation();
