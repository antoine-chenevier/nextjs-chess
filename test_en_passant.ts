import { SecretKingBootGameState, GameAction } from './src/secretKingBoot/types';
import { 
  generateLegalMovesForPiece, 
  isEnPassantMove, 
  getCapturedPawnPosition,
  getGameState 
} from './src/secretKingBoot/improvedCheckLogic';

/**
 * Test des prises en passant classiques et pour bonds de 3 cases
 */

// Fonction utilitaire pour créer un état de jeu de base
function createTestGameState(): SecretKingBootGameState {
  // Échiquier vide avec seulement les rois
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois
  board[0][4] = 'WhiteKing'; // E1
  board[7][4] = 'BlackKing'; // E8
  
  return {
    currentPlayer: 'white',
    turn: 1,
    gamePhase: 'playing',
    whiteReserve: { pawns: 8, knights: 1, bishops: 1, rooks: 1, queens: 0 },
    blackReserve: { pawns: 8, knights: 1, bishops: 1, rooks: 1, queens: 0 },
    whiteKingPosition: 'E1',
    blackKingPosition: 'E8',
    moveHistory: [],
    board
  };
}

// Test 1: Prise en passant classique (bond de 2 cases)
console.log('=== Test 1: Prise en passant classique ===');

const gameState1 = createTestGameState();

// Placer un pion blanc en E4 (rang 4, indice 3)
gameState1.board[3][4] = 'WhitePawn'; // E4

// Simuler qu'un pion noir vient de bouger de F7 à F5 (bond de 2 cases)
gameState1.board[4][5] = 'BlackPawn'; // F5 (rang 5, indice 4)

console.log('Position du pion blanc: E4 (x=4, y=3)');
console.log('Position du pion noir après mouvement: F5 (x=5, y=4)');
console.log('Le pion noir a bougé de F7 (x=5, y=6) à F5 (x=5, y=4) - bond de 2 cases');

// Ajouter ce mouvement à l'historique
const blackPawnMove: GameAction = {
  type: 'move_piece',
  player: 'black',
  turn: 1,
  from: 'F7',
  to: 'F5',
  piece: 'BlackPawn'
};
gameState1.moveHistory.push(blackPawnMove);
gameState1.currentPlayer = 'white';

// Afficher l'état du plateau
console.log('\nÉtat du plateau:');
for (let y = 7; y >= 0; y--) {
  let row = `${y + 1}: `;
  for (let x = 0; x < 8; x++) {
    const piece = gameState1.board[y][x];
    if (piece) {
      const color = piece.includes('White') ? 'W' : 'B';
      const type = piece.includes('Pawn') ? 'P' : piece.includes('King') ? 'K' : '?';
      row += color + type + ' ';
    } else {
      row += '.. ';
    }
  }
  console.log(row);
}

// Générer les mouvements légaux pour le pion blanc en E4
const whitePawnMoves = generateLegalMovesForPiece(gameState1, 4, 3, 'WhitePawn', 'white');
console.log('\nMouvements légaux pour le pion blanc en E4:', whitePawnMoves.map(m => 
  String.fromCharCode(65 + m.x) + (m.y + 1)
));

// Vérifier si la prise en passant en F6 est détectée
const enPassantMove = whitePawnMoves.find(move => move.x === 5 && move.y === 5); // F6
console.log('Prise en passant classique sur F6 détectée:', enPassantMove ? 'OUI' : 'NON');

if (enPassantMove) {
  console.log('Position de prise en passant:', String.fromCharCode(65 + enPassantMove.x) + (enPassantMove.y + 1));
  
  // Vérifier la fonction isEnPassantMove
  const isEnPassant = isEnPassantMove(gameState1, 4, 3, 5, 5, 'WhitePawn', 'white');
  console.log('isEnPassantMove confirme:', isEnPassant);
  
  // Vérifier la position du pion capturé
  const capturedPos = getCapturedPawnPosition(gameState1, 4, 3, 5, 5, 'white');
  console.log('Position du pion capturé:', capturedPos);
}

console.log('\n=== Test 2: Prise en passant pour bond de 3 cases (Secret King Boot) ===');

const gameState2 = createTestGameState();

// Placer un pion blanc en E4
gameState2.board[3][4] = 'WhitePawn'; // E4

// Simuler qu'un pion noir vient de bouger de F7 à F4 (bond de 3 cases)
gameState2.board[3][5] = 'BlackPawn'; // F4

// Ajouter ce mouvement à l'historique
const blackPawn3Move: GameAction = {
  type: 'move_piece',
  player: 'black',
  turn: 1,
  from: 'F7',
  to: 'F4',
  piece: 'BlackPawn'
};
gameState2.moveHistory.push(blackPawn3Move);
gameState2.currentPlayer = 'white';

// Générer les mouvements légaux pour le pion blanc en E4
const whitePawnMoves2 = generateLegalMovesForPiece(gameState2, 4, 3, 'WhitePawn', 'white');
console.log('Mouvements légaux pour le pion blanc en E4:', whitePawnMoves2);

// Vérifier si les prises en passant sur les cases traversées sont détectées
const enPassantMove1 = whitePawnMoves2.find(move => move.x === 5 && move.y === 4); // F5 (première case traversée)
const enPassantMove2 = whitePawnMoves2.find(move => move.x === 5 && move.y === 5); // F6 (deuxième case traversée)

console.log('Prise en passant sur F5 (1ère case traversée):', enPassantMove1 ? 'OUI' : 'NON');
console.log('Prise en passant sur F6 (2ème case traversée):', enPassantMove2 ? 'OUI' : 'NON');

if (enPassantMove1) {
  const isEnPassant1 = isEnPassantMove(gameState2, 4, 3, 5, 4, 'WhitePawn', 'white');
  console.log('isEnPassantMove confirme pour F5:', isEnPassant1);
}

if (enPassantMove2) {
  const isEnPassant2 = isEnPassantMove(gameState2, 4, 3, 5, 5, 'WhitePawn', 'white');
  console.log('isEnPassantMove confirme pour F6:', isEnPassant2);
}

console.log('\n=== Test 3: Prise en passant depuis le rang de départ (Secret King Boot) ===');

const gameState3 = createTestGameState();

// Placer un pion blanc en E1 (rang de départ pour Secret King Boot)
gameState3.board[0][4] = null; // Retirer le roi
gameState3.board[0][3] = 'WhiteKing'; // Déplacer le roi en D1
gameState3.board[0][4] = 'WhitePawn'; // E1

// Simuler qu'un pion noir vient de bouger de F7 à F4 (bond de 3 cases) et arrive sur le 4ème rang
gameState3.board[3][5] = 'BlackPawn'; // F4

// Ajouter ce mouvement à l'historique
const blackPawn3Move3: GameAction = {
  type: 'move_piece',
  player: 'black',
  turn: 1,
  from: 'F7',
  to: 'F4',
  piece: 'BlackPawn'
};
gameState3.moveHistory.push(blackPawn3Move3);
gameState3.currentPlayer = 'white';

console.log('État du plateau:');
for (let y = 7; y >= 0; y--) {
  let row = `${y + 1}: `;
  for (let x = 0; x < 8; x++) {
    const piece = gameState3.board[y][x];
    if (piece) {
      row += piece.charAt(0).toLowerCase() + piece.includes('White') ? 'w' : 'b' + ' ';
    } else {
      row += '.. ';
    }
  }
  console.log(row);
}

// Générer les mouvements légaux pour le pion blanc en E1
const whitePawnMoves3 = generateLegalMovesForPiece(gameState3, 4, 0, 'WhitePawn', 'white');
console.log('Mouvements légaux pour le pion blanc en E1:', whitePawnMoves3);

console.log('\n=== Tests terminés ===');
