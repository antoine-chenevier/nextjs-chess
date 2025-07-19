import { SecretKingBootGameState } from './src/secretKingBoot/types';
import { 
  generateLegalMovesForPiece, 
  makeSecretKingBootMove,
  calculateEnPassantTarget,
  coordinatesToPosition
} from './src/secretKingBoot/improvedCheckLogic';

/**
 * Test de débogage de la prise en passant
 */

function createTestGameState(): SecretKingBootGameState {
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
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

console.log('=== Test de débogage de la prise en passant ===\n');

// Créer la situation classique : pion noir F7->F5, pion blanc E5
const gameState = createTestGameState();

// Étape 1: Pion noir en F7
gameState.board[6][5] = 'BlackPawn'; // F7
console.log('1. Pion noir placé en F7');

// Étape 2: Simuler le mouvement F7->F5
console.log('2. Mouvement du pion noir: F7 -> F5');
const afterF7F5 = makeSecretKingBootMove(gameState, 5, 6, 5, 4); // F7 -> F5

console.log('   Champ passant calculé:', afterF7F5.passant);
console.log('   Champ passant attendu: 5 (colonne F)');

// Verification du calcul de passant
const passantTarget = calculateEnPassantTarget(5, 6, 5, 4, 'BlackPawn', 'black');
console.log('   calculateEnPassantTarget retourne:', passantTarget);

// Étape 3: Pion blanc en E5 
afterF7F5.board[4][4] = 'WhitePawn'; // E5
afterF7F5.currentPlayer = 'white';

console.log('\n3. État du plateau après placement du pion blanc en E5:');
for (let y = 7; y >= 0; y--) {
  let row = `${y + 1}: `;
  for (let x = 0; x < 8; x++) {
    const piece = afterF7F5.board[y][x];
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

console.log('\n4. Analyse détaillée de la prise en passant:');
console.log('   Pion blanc en E5 (x=4, y=4)');
console.log('   Pion noir en F5 (x=5, y=4) - même rangée');
console.log('   Champ passant:', afterF7F5.passant, '(colonne F = 5)');
console.log('   Case F6 (x=5, y=5) devrait être accessible en prise en passant');

// Vérification manuelle des conditions
const whitePawnX = 4, whitePawnY = 4; // E5
const targetX = 5, targetY = 5; // F6
const enemyPawnX = 5, enemyPawnY = 4; // F5

console.log('\n5. Vérification manuelle des conditions:');
console.log('   afterF7F5.passant === targetX?', afterF7F5.passant, '===', targetX, '=', afterF7F5.passant === targetX);
console.log('   Pion adverse à la position passant:', afterF7F5.board[whitePawnY][afterF7F5.passant || -1]);
console.log('   Case cible F6 vide?', afterF7F5.board[targetY][targetX] === null);

// Étape 4: Générer les mouvements
console.log('\n6. Mouvements générés pour le pion blanc en E5:');
const moves = generateLegalMovesForPiece(afterF7F5, 4, 4, 'WhitePawn', 'white');
const moveStrings = moves.map(m => coordinatesToPosition(m.x, m.y));
console.log('   Mouvements:', moveStrings);

const enPassantMove = moves.find(m => m.x === 5 && m.y === 5);
console.log('   Prise en passant sur F6:', enPassantMove ? 'TROUVÉE' : 'PAS TROUVÉE');

console.log('\n=== Fin du test de débogage ===');
