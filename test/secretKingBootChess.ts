import { 
  createInitialGameState,
  isValidAction,
  convertToChessBoard,
  updateGameStateWithChessLogic
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

console.log('=== Test Secret King Boot - Logique Échec et Mat ===');

// Test 1: Créer un état initial
console.log('\n1. Création d\'un état initial:');
let gameState = createInitialGameState();
console.log('État initial créé:', gameState.gamePhase, gameState.currentPlayer);

// Test 2: Placer les rois
console.log('\n2. Placement des rois:');

const placeWhiteKing: GameAction = {
  type: 'place_king',
  player: 'white',
  turn: 1,
  to: 'E1'
};

const placeBlackKing: GameAction = {
  type: 'place_king',
  player: 'black', 
  turn: 1,
  to: 'E8'
};

// Placer le roi blanc
const validation1 = isValidAction(gameState, placeWhiteKing);
console.log('Validation placement roi blanc:', validation1.valid);
if (validation1.valid) {
  gameState = applyAction(gameState, placeWhiteKing);
  console.log('Roi blanc placé, joueur actuel:', gameState.currentPlayer);
}

// Placer le roi noir
const validation2 = isValidAction(gameState, placeBlackKing);
console.log('Validation placement roi noir:', validation2.valid);
if (validation2.valid) {
  gameState = applyAction(gameState, placeBlackKing);
  console.log('Roi noir placé, phase:', gameState.gamePhase, 'joueur actuel:', gameState.currentPlayer);
}

// Test 3: Placer quelques pièces pour créer une situation d'échec
console.log('\n3. Placement de pièces pour créer un échec:');

// Placer une tour blanche pour mettre le roi noir en échec
const placeTower: GameAction = {
  type: 'place_piece',
  player: 'white',
  turn: 2,
  piece: 'Rook',
  to: 'E7' // Une case devant le roi noir
};

const validation3 = isValidAction(gameState, placeTower);
console.log('Validation placement tour blanche:', validation3.valid);
if (validation3.valid) {
  gameState = applyAction(gameState, placeTower);
  console.log('Tour blanche placée');
  console.log('État du jeu après placement:', gameState.gameStatus?.status);
  console.log('Joueur en échec:', gameState.gameStatus?.player);
}

// Test 4: Convertir vers le format d'échecs classique
console.log('\n4. Conversion vers format d\'échecs classique:');
const chessBoard = convertToChessBoard(gameState);
console.log('Plateau converti, nombre de pièces:', chessBoard.pieces.filter(p => p !== null).length);

// Test 5: Mettre à jour avec la logique d'échecs
console.log('\n5. Mise à jour avec logique d\'échecs:');
const updatedState = updateGameStateWithChessLogic(gameState);
console.log('État mis à jour:', updatedState.gameStatus?.status);
console.log('Joueur actuel:', updatedState.currentPlayer);

// Test 6: Afficher l'état de l'échiquier
console.log('\n6. État de l\'échiquier:');
for (let rank = 7; rank >= 0; rank--) {
  let row = `${rank + 1} `;
  for (let file = 0; file < 8; file++) {
    const piece = gameState.board[rank][file];
    if (piece) {
      const symbol = piece.includes('White') ? piece.charAt(5).toUpperCase() : piece.charAt(5).toLowerCase();
      row += symbol + ' ';
    } else {
      row += '. ';
    }
  }
  console.log(row);
}
console.log('  A B C D E F G H');

console.log('\n=== Test terminé ===');
