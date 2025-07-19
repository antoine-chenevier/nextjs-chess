import { SecretKingBootGameState } from './src/secretKingBoot/types';
import { 
  generateLegalMovesForPiece, 
  isEnPassantMove, 
  makeSecretKingBootMove,
  calculateEnPassantTarget
} from './src/secretKingBoot/improvedCheckLogic';

/**
 * Test de la prise en passant simplifiée inspirée de index.ts
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
    board,
    passant: undefined
  };
}

console.log('=== Test de la nouvelle logique de prise en passant (inspirée de index.ts) ===');

const gameState = createTestGameState();

// Étape 1: Placer un pion noir en F7 (position de départ)
gameState.board[6][5] = 'BlackPawn'; // F7

console.log('\n1. État initial - Pion noir en F7');

// Étape 2: Simuler le mouvement du pion noir de F7 à F5 (bond de 2 cases)
console.log('2. Mouvement du pion noir de F7 à F5 (bond de 2 cases)');
const afterBlackMove = makeSecretKingBootMove(gameState, 5, 6, 5, 4); // F7 -> F5
console.log('   Champ passant après le mouvement:', afterBlackMove.passant);

// Étape 3: Placer un pion blanc en E5 pour qu'il puisse capturer en passant
afterBlackMove.board[4][4] = 'WhitePawn'; // E5
afterBlackMove.currentPlayer = 'white';

console.log('3. Pion blanc placé en E5');

// Afficher l'état du plateau
console.log('\nÉtat du plateau:');
for (let y = 7; y >= 0; y--) {
  let row = `${y + 1}: `;
  for (let x = 0; x < 8; x++) {
    const piece = afterBlackMove.board[y][x];
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

// Étape 4: Générer les mouvements légaux pour le pion blanc en E5
console.log('\n4. Mouvements légaux pour le pion blanc en E5:');
const whitePawnMoves = generateLegalMovesForPiece(afterBlackMove, 4, 4, 'WhitePawn', 'white');
const moveStrings = whitePawnMoves.map(m => String.fromCharCode(65 + m.x) + (m.y + 1));
console.log('   Mouvements:', moveStrings);

// Étape 5: Vérifier si la prise en passant sur F6 est détectée
const enPassantMove = whitePawnMoves.find(move => move.x === 5 && move.y === 5); // F6
console.log('   Prise en passant sur F6 détectée:', enPassantMove ? 'OUI' : 'NON');

if (enPassantMove) {
  // Étape 6: Effectuer la prise en passant
  console.log('\n5. Effectuer la prise en passant de E5 vers F6:');
  const afterEnPassant = makeSecretKingBootMove(afterBlackMove, 4, 4, 5, 5); // E5 -> F6
  
  console.log('   État du plateau après prise en passant:');
  for (let y = 7; y >= 0; y--) {
    let row = `${y + 1}: `;
    for (let x = 0; x < 8; x++) {
      const piece = afterEnPassant.board[y][x];
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
  
  // Vérifier que le pion noir en F5 a bien été capturé
  const capturedPawn = afterEnPassant.board[4][5]; // F5
  console.log('   Pion noir en F5 capturé:', capturedPawn === null ? 'OUI' : 'NON');
}

console.log('\n=== Test avec bond de 3 cases (Secret King Boot) ===');

const gameState2 = createTestGameState();

// Placer un pion noir en F7 et simuler un bond de 3 cases vers F4
gameState2.board[6][5] = 'BlackPawn'; // F7
console.log('1. Pion noir en F7 fait un bond de 3 cases vers F4');

const afterBigMove = makeSecretKingBootMove(gameState2, 5, 6, 5, 3); // F7 -> F4
console.log('   Champ passant après le bond de 3 cases:', afterBigMove.passant);

// Placer un pion blanc en E4 pour tester la prise en passant
afterBigMove.board[3][4] = 'WhitePawn'; // E4
afterBigMove.currentPlayer = 'white';

console.log('2. Pion blanc placé en E4');

const whitePawnMoves2 = generateLegalMovesForPiece(afterBigMove, 4, 3, 'WhitePawn', 'white');
const moveStrings2 = whitePawnMoves2.map(m => String.fromCharCode(65 + m.x) + (m.y + 1));
console.log('   Mouvements légaux pour le pion blanc en E4:', moveStrings2);

const enPassantMove2 = whitePawnMoves2.find(move => move.x === 5 && move.y === 4); // F5
console.log('   Prise en passant sur F5 détectée:', enPassantMove2 ? 'OUI' : 'NON');

console.log('\n=== Tests terminés ===');
