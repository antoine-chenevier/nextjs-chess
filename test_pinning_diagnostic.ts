import { 
  createInitialGameState
} from './src/secretKingBoot/gameLogic';

import { 
  SecretKingBootGameState 
} from './src/secretKingBoot/types';

import {
  wouldMoveLeaveKingInCheck,
  isKingInCheck,
  findKingPosition,
  positionToCoordinates
} from './src/secretKingBoot/improvedCheckLogic';

/**
 * Test de diagnostic pour comprendre pourquoi la validation de clouage ne fonctionne pas
 */
function testPinningDiagnostic() {
  console.log('🔍 Diagnostic : Pourquoi le clouage ne fonctionne pas ?');
  console.log('==================================================\n');

  const gameState: SecretKingBootGameState = {
    ...createInitialGameState(),
    currentPlayer: 'white',
    gamePhase: 'playing'
  };

  // Vider l'échiquier complètement
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      gameState.board[i][j] = null;
    }
  }
  
  // Configuration simple : Roi blanc E1, Fou blanc E2, Dame noire E8
  gameState.board[0][4] = 'WhiteKing';   // E1 - roi blanc
  gameState.board[1][4] = 'WhiteBishop'; // E2 - fou blanc (devrait être cloué)
  gameState.board[7][4] = 'BlackKing';   // E8 - roi noir
  gameState.board[6][4] = 'BlackQueen';  // E7 - dame noire attaque la colonne E
  
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8'; // Garder E8 pour la cohérence du type
  
  console.log('Configuration de test :');
  console.log('- Roi blanc en E1');
  console.log('- Fou blanc en E2 (cloué par la dame noire)');
  console.log('- Dame noire en E7');
  console.log('- Roi noir en E8');
  console.log();

  // Diagnostics étape par étape
  console.log('=== DIAGNOSTICS ===');
  
  // 1. Position du roi blanc
  const kingPos = findKingPosition(gameState.board, 'white');
  console.log(`1. Roi blanc trouvé en : ${kingPos ? `(${kingPos.x}, ${kingPos.y})` : 'INTROUVABLE'}`);
  
  // 2. État initial - le roi est-il en échec ?
  const initialCheck = isKingInCheck(gameState, 'white');
  console.log(`2. Roi blanc en échec actuellement : ${initialCheck}`);
  
  // 3. Simuler le mouvement du fou E2 -> D3
  console.log('\n3. Simulation mouvement fou E2 -> D3 :');
  const from = positionToCoordinates('E2'); // (4, 1)
  const to = positionToCoordinates('D3');   // (3, 2)
  
  console.log(`   From: (${from.x}, ${from.y}) = E2`);
  console.log(`   To: (${to.x}, ${to.y}) = D3`);
  
  // 4. Tester la fonction wouldMoveLeaveKingInCheck
  const wouldLeaveInCheck = wouldMoveLeaveKingInCheck(gameState, from.x, from.y, to.x, to.y, 'white');
  console.log(`   wouldMoveLeaveKingInCheck: ${wouldLeaveInCheck}`);
  
  // 5. Simulation manuelle pour comprendre
  console.log('\n4. Simulation manuelle :');
  const tempBoard = gameState.board.map(row => [...row]);
  console.log(`   Avant: E2 = ${tempBoard[1][4]}, D3 = ${tempBoard[2][3]}`);
  
  // Effectuer le mouvement
  tempBoard[2][3] = tempBoard[1][4]; // Déplacer le fou
  tempBoard[1][4] = null;            // Vider l'ancienne position
  
  console.log(`   Après: E2 = ${tempBoard[1][4]}, D3 = ${tempBoard[2][3]}`);
  
  // Créer un état temporaire
  const tempState: SecretKingBootGameState = {
    ...gameState,
    board: tempBoard
  };
  
  // Vérifier si le roi serait en échec
  const wouldBeInCheck = isKingInCheck(tempState, 'white');
  console.log(`   Roi en échec après mouvement : ${wouldBeInCheck}`);
  
  // 6. Vérifier l'attaque directe de la dame sur le roi
  console.log('\n5. Vérification d\'attaque directe :');
  console.log(`   Dame noire en E7 : ${tempBoard[6][4]}`);
  console.log(`   Roi noir en E8 : ${tempBoard[7][4]}`);
  console.log(`   Roi blanc en E1 : ${tempBoard[0][4]}`);
  console.log(`   Cases entre E7 et E1 :`);
  for (let y = 5; y >= 1; y--) {
    const piece = tempBoard[y][4];
    console.log(`     E${y+1}: ${piece || 'vide'}`);
  }
  
  console.log(`\n=== RÉSULTAT ===`);
  console.log(`Le mouvement E2->D3 ${wouldLeaveInCheck ? 'DEVRAIT' : 'NE DEVRAIT PAS'} être bloqué`);
  console.log(`Attendu: DEVRAIT être bloqué (clouage)`);
  console.log(`Résultat: ${wouldLeaveInCheck === true ? '✅ CORRECT' : '❌ INCORRECT'}`);
  
  return wouldLeaveInCheck;
}

// Exécuter le diagnostic
testPinningDiagnostic();
