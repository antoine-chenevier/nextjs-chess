// Test de diagnostic pour la conversion des coordonnées et la logique d'échec

import { 
  createInitialGameState, 
  updateGameStateWithChessLogic,
  isChessMoveLegal,
  convertToChessBoard
} from './src/secretKingBoot/gameLogic';

import {
  isInCheck as chessIsInCheck,
  getAllLegalMoves as chessGetAllLegalMoves,
  GameState as ChessGameState,
  getGameState as chessGetGameState
} from './src/logic/index';

function diagnosisTest() {
  console.log('=== Test de diagnostic ===\n');
  
  // Créer un état simple
  let gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'black'; // Au tour des noirs
  
  // Plateau simple avec roi noir en échec
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois et la tour
  gameState.board[0][4] = 'WhiteKing';  // E1
  gameState.board[7][4] = 'BlackKing';  // E8
  gameState.board[5][4] = 'WhiteRook';  // E6 (met le roi noir en échec)
  
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  console.log('État créé :');
  console.log('- Roi blanc en E1');
  console.log('- Roi noir en E8');
  console.log('- Tour blanche en E6');
  console.log('- Joueur actuel : noir\n');
  
  // Convertir vers le format d'échecs classique
  const chessBoard = convertToChessBoard(gameState);
  console.log('Conversion vers format échecs classique...');
  
  // Afficher quelques pièces converties
  chessBoard.pieces.forEach((piece, index) => {
    if (piece) {
      const x = index % 8;
      const y = Math.floor(index / 8);
      const pos = String.fromCharCode(65 + x) + (8 - y);
      console.log(`- ${piece.name} en ${pos} (groupe ${piece.group})`);
    }
  });
  
  console.log('\nVérification de l\'échec avec la logique d\'échecs classique :');
  
  // Vérifier si le roi noir (groupe 3) est en échec
  const blackInCheck = chessIsInCheck(chessBoard, 3);
  console.log('Roi noir en échec :', blackInCheck);
  
  // Vérifier l'état du jeu
  const chessGameState = chessGetGameState(chessBoard, 3);
  console.log('État du jeu pour les noirs :', chessGameState);
  
  // Obtenir tous les mouvements légaux pour les noirs
  const legalMoves = chessGetAllLegalMoves(chessBoard, 3);
  console.log('Nombre de mouvements légaux pour les noirs :', legalMoves.length);
  
  if (legalMoves.length > 0) {
    console.log('Quelques mouvements légaux :');
    legalMoves.slice(0, 5).forEach(move => {
      const fromPos = String.fromCharCode(65 + move.from.x) + (8 - move.from.y);
      const toPos = String.fromCharCode(65 + move.dest.x) + (8 - move.dest.y);
      console.log(`  ${fromPos} -> ${toPos}`);
    });
  }
  
  console.log('\nTest des mouvements avec isChessMoveLegal :');
  
  // Test 1: Mouvement qui reste en échec (E8 -> F8)
  console.log('Test 1: E8 -> F8 (reste en échec)');
  const badMove = isChessMoveLegal(gameState, 'E8', 'F8');
  console.log('Résultat :', badMove);
  
  // Test 2: Mouvement qui sort d'échec (E8 -> D8)  
  console.log('Test 2: E8 -> D8 (sort d\'échec)');
  const goodMove = isChessMoveLegal(gameState, 'E8', 'D8');
  console.log('Résultat :', goodMove);
  
  // Test 3: Mouvement qui sort d'échec (E8 -> E7)
  console.log('Test 3: E8 -> E7 (sort d\'échec)');
  const goodMove2 = isChessMoveLegal(gameState, 'E8', 'E7');
  console.log('Résultat :', goodMove2);
}

diagnosisTest();
