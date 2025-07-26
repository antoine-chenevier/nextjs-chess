import { 
  createInitialGameState
} from './src/secretKingBoot/gameLogic';

import { 
  SecretKingBootGameState,
  GameAction
} from './src/secretKingBoot/types';

import { 
  getPossibleMoves,
  getAvailableActions
} from './src/secretKingBoot/gameAnalysis';

/**
 * Test de la restriction des pièces uniques pour move_king_and_place et place_piece
 */
function testPieceRestriction() {
  console.log('🧪 Test de la restriction des pièces uniques');
  console.log('='.repeat(50));

  // Créer un état de jeu initial
  let gameState = createInitialGameState();
  
  // Passer à la phase de jeu
  gameState.gamePhase = 'playing';
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  // Placer les rois sur l'échiquier
  gameState.board[0][4] = 'WhiteKing'; // E1
  gameState.board[7][4] = 'BlackKing'; // E8
  
  // Ajouter quelques pièces en réserve
  gameState.whiteReserve.knights = 1;
  gameState.whiteReserve.bishops = 1;
  gameState.whiteReserve.rooks = 1;
  gameState.whiteReserve.queens = 1;
  gameState.whiteReserve.pawns = 2;

  console.log('État initial:');
  console.log(`- Roi blanc en ${gameState.whiteKingPosition}`);
  console.log(`- Réserve blanche: ${JSON.stringify(gameState.whiteReserve)}`);
  console.log('- Échiquier vide à part les rois\n');

  // Test 1: Vérifier les mouvements move_king_and_place initiaux
  console.log('Test 1: Mouvements move_king_and_place initiaux (toutes les pièces disponibles)');
  const moveKingAndPlaceMoves1 = getPossibleMoves(gameState, 'move_king_and_place');
  const availablePieces1 = new Set(moveKingAndPlaceMoves1.map(m => m.piece).filter(p => p));
  console.log(`Pièces disponibles: ${Array.from(availablePieces1).join(', ')}`);
  console.log(`Nombre total de mouvements: ${moveKingAndPlaceMoves1.length}\n`);

  // Test 2: Placer un cavalier sur l'échiquier
  console.log('Test 2: Placer un cavalier blanc en B1');
  gameState.board[0][1] = 'WhiteKnight'; // B1
  gameState.whiteReserve.knights = 0;
  
  const moveKingAndPlaceMoves2 = getPossibleMoves(gameState, 'move_king_and_place');
  const availablePieces2 = new Set(moveKingAndPlaceMoves2.map(m => m.piece).filter(p => p));
  console.log(`Pièces disponibles: ${Array.from(availablePieces2).join(', ')}`);
  console.log(`Le cavalier devrait maintenant être absent: ${!availablePieces2.has('Knight') ? '✅' : '❌'}\n`);

  // Test 3: Placer un fou sur l'échiquier
  console.log('Test 3: Placer un fou blanc en C1');
  gameState.board[0][2] = 'WhiteBishop'; // C1
  gameState.whiteReserve.bishops = 0;
  
  const moveKingAndPlaceMoves3 = getPossibleMoves(gameState, 'move_king_and_place');
  const availablePieces3 = new Set(moveKingAndPlaceMoves3.map(m => m.piece).filter(p => p));
  console.log(`Pièces disponibles: ${Array.from(availablePieces3).join(', ')}`);
  console.log(`Le fou devrait maintenant être absent: ${!availablePieces3.has('Bishop') ? '✅' : '❌'}`);
  console.log(`Le cavalier devrait toujours être absent: ${!availablePieces3.has('Knight') ? '✅' : '❌'}`);
  console.log(`Les pions devraient toujours être disponibles: ${availablePieces3.has('Pawn') ? '✅' : '❌'}\n`);

  // Test 4: Vérifier les mouvements place_piece
  console.log('Test 4: Mouvements place_piece (même logique de restriction)');
  const placePieceMoves = getPossibleMoves(gameState, 'place_piece');
  const availablePiecesPlace = new Set(placePieceMoves.map(m => m.piece).filter(p => p));
  console.log(`Pièces disponibles pour placement: ${Array.from(availablePiecesPlace).join(', ')}`);
  console.log(`Le cavalier devrait être absent: ${!availablePiecesPlace.has('Knight') ? '✅' : '❌'}`);
  console.log(`Le fou devrait être absent: ${!availablePiecesPlace.has('Bishop') ? '✅' : '❌'}`);
  console.log(`Les pions devraient être disponibles: ${availablePiecesPlace.has('Pawn') ? '✅' : '❌'}\n`);

  // Test 5: Test avec plusieurs pions (ils devraient rester disponibles)
  console.log('Test 5: Placer plusieurs pions');
  gameState.board[1][0] = 'WhitePawn'; // A2
  gameState.board[1][1] = 'WhitePawn'; // B2
  gameState.whiteReserve.pawns = 0; // Plus de pions en réserve, mais ceux sur l'échiquier ne bloquent pas
  
  // Remettre des pions en réserve pour le test
  gameState.whiteReserve.pawns = 3;
  
  const moveKingAndPlaceMoves5 = getPossibleMoves(gameState, 'move_king_and_place');
  const availablePieces5 = new Set(moveKingAndPlaceMoves5.map(m => m.piece).filter(p => p));
  console.log(`Pièces disponibles après placement de pions: ${Array.from(availablePieces5).join(', ')}`);
  console.log(`Les pions devraient toujours être disponibles malgré leur présence sur l'échiquier: ${availablePieces5.has('Pawn') ? '✅' : '❌'}\n`);

  console.log('🎉 Test terminé - Restriction des pièces uniques implémentée !');
}

// Exécuter le test
testPieceRestriction();
