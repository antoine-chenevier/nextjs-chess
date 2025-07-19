import { SecretKingBootGameState } from './src/secretKingBoot/types';
import { 
  generateLegalMovesForPiece, 
  makeSecretKingBootMove,
  coordinatesToPosition
} from './src/secretKingBoot/improvedCheckLogic';

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

console.log('=== Test de reproduction du cas problématique ===\n');

const gameState = createTestGameState();

// Cas 1: Pion blanc en E4 (pas E5) avec pion noir F7->F5
console.log('1. Cas problématique - Pion blanc en E4:');
gameState.board[6][5] = 'BlackPawn'; // F7
const afterMove1 = makeSecretKingBootMove(gameState, 5, 6, 5, 4); // F7 -> F5
afterMove1.board[3][4] = 'WhitePawn'; // E4 (pas E5!)
afterMove1.currentPlayer = 'white';

console.log('   Pion noir: F7 -> F5');
console.log('   Pion blanc: E4 (rang 4, pas 5)');
console.log('   Champ passant:', afterMove1.passant);

const movesE4 = generateLegalMovesForPiece(afterMove1, 4, 3, 'WhitePawn', 'white');
const moveStringsE4 = movesE4.map(m => coordinatesToPosition(m.x, m.y));
console.log('   Mouvements depuis E4:', moveStringsE4);

const enPassantE4 = movesE4.find(m => m.x === 5 && m.y === 5);
console.log('   Prise en passant E4->F6:', enPassantE4 ? 'OUI' : 'NON (normal - E4 ne peut pas aller en F6)');

console.log('\n2. Cas correct - Pion blanc en E5:');
const gameState2 = createTestGameState();
gameState2.board[6][5] = 'BlackPawn'; // F7
const afterMove2 = makeSecretKingBootMove(gameState2, 5, 6, 5, 4); // F7 -> F5
afterMove2.board[4][4] = 'WhitePawn'; // E5 (position correcte)
afterMove2.currentPlayer = 'white';

const movesE5 = generateLegalMovesForPiece(afterMove2, 4, 4, 'WhitePawn', 'white');
const moveStringsE5 = movesE5.map(m => coordinatesToPosition(m.x, m.y));
console.log('   Mouvements depuis E5:', moveStringsE5);

const enPassantE5 = movesE5.find(m => m.x === 5 && m.y === 5);
console.log('   Prise en passant E5->F6:', enPassantE5 ? 'OUI' : 'NON');

console.log('\n3. Explication:');
console.log('   Pour la prise en passant classique:');
console.log('   - Le pion adverse fait un bond de 2 cases (F7->F5)');
console.log('   - Notre pion doit être sur la MÊME RANGÉE (rang 5)');
console.log('   - Notre pion capture en diagonale sur la case traversée (F6)');
console.log('   - Donc si le pion noir va en F5, notre pion doit être en E5 (pas E4)');

console.log('\n=== Test de Secret King Boot (bond de 3 cases) ===');

const gameState3 = createTestGameState();
gameState3.board[6][5] = 'BlackPawn'; // F7
// Bond de 3 cases: F7 -> F4
const afterBigMove = makeSecretKingBootMove(gameState3, 5, 6, 5, 3); // F7 -> F4
afterBigMove.board[3][4] = 'WhitePawn'; // E4 (maintenant sur la même rangée que F4)
afterBigMove.currentPlayer = 'white';

console.log('4. Secret King Boot - Pion noir F7->F4 (bond de 3), pion blanc E4:');
console.log('   Champ passant:', afterBigMove.passant);

const movesE4Big = generateLegalMovesForPiece(afterBigMove, 4, 3, 'WhitePawn', 'white');
const moveStringsE4Big = movesE4Big.map(m => coordinatesToPosition(m.x, m.y));
console.log('   Mouvements depuis E4:', moveStringsE4Big);

const enPassantE4Big = movesE4Big.find(m => m.x === 5 && m.y === 4);
console.log('   Prise en passant E4->F5:', enPassantE4Big ? 'OUI' : 'NON');

console.log('\n=== Fin du test ===');
