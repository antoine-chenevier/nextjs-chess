import { 
  isChessMoveLegal,
  createInitialGameState
} from './src/secretKingBoot/gameLogic';

import { 
  SecretKingBootGameState 
} from './src/secretKingBoot/types';

/**
 * Test pour tracer le flux de code dans isChessMoveLegal
 */
function testCodePath() {
  console.log('🔍 Test : Quel chemin de code est emprunté ?');
  console.log('===============================================\n');

  const gameState: SecretKingBootGameState = {
    ...createInitialGameState(),
    currentPlayer: 'white',
    gamePhase: 'playing'
  };

  // Vider l'échiquier
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      gameState.board[i][j] = null;
    }
  }
  
  // Configuration simple pour test de fou cloué
  gameState.board[0][4] = 'WhiteKing';   // E1
  gameState.board[1][4] = 'WhiteBishop'; // E2
  gameState.board[6][4] = 'BlackQueen';  // E7
  gameState.board[7][4] = 'BlackKing';   // E8
  
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  console.log('Test 1: Mouvement du fou (pièce normale)');
  console.log('==========================================');
  const bishopResult = isChessMoveLegal(gameState, 'E2', 'D3');
  console.log(`Résultat fou E2->D3: ${bishopResult}\n`);
  
  console.log('Test 2: Mouvement du roi');
  console.log('=========================');
  const kingResult = isChessMoveLegal(gameState, 'E1', 'F1');
  console.log(`Résultat roi E1->F1: ${kingResult}\n`);
  
  console.log('Test 3: Mouvement de pion');
  console.log('==========================');
  gameState.board[1][3] = 'WhitePawn';   // D2
  const pawnResult = isChessMoveLegal(gameState, 'D2', 'D3');
  console.log(`Résultat pion D2->D3: ${pawnResult}\n`);
  
  return { bishop: bishopResult, king: kingResult, pawn: pawnResult };
}

testCodePath();
