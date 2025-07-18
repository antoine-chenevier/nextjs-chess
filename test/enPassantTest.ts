import { SecretKingBootGameState, GameAction } from '../src/secretKingBoot/types';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { getPossibleMoves } from '../src/secretKingBoot/gameAnalysis';
import { createInitialGameState } from '../src/secretKingBoot/gameLogic';

console.log('=== Test de la prise en passant ===');

// Créer un état de jeu initial
let gameState = createInitialGameState();

// Placer les rois
gameState = applyAction(gameState, {
  type: 'place_king',
  player: 'white',
  turn: 1,
  to: 'E1'
});

gameState = applyAction(gameState, {
  type: 'place_king',
  player: 'black',
  turn: 1,
  to: 'E8'
});

// Passer à la phase de jeu
gameState.gamePhase = 'playing';

// Placer un pion blanc sur E2
gameState.board[1][4] = 'WhitePawn'; // E2

// Placer un pion noir sur D4
gameState.board[3][3] = 'BlackPawn'; // D4

// Simuler que le joueur blanc a fait un bond de pion de E2 à E4
gameState.moveHistory.push({
  type: 'move_piece',
  player: 'white',
  turn: 2,
  from: 'E2',
  to: 'E4',
  piece: 'WhitePawn'
});

// Déplacer le pion blanc sur E4
gameState.board[1][4] = null; // Vider E2
gameState.board[3][4] = 'WhitePawn'; // E4

// Définir que c'est au tour des noirs
gameState.currentPlayer = 'black';

console.log('État de l\'échiquier après E2-E4:');
console.log('D4:', gameState.board[3][3]); // Devrait être BlackPawn
console.log('E4:', gameState.board[3][4]); // Devrait être WhitePawn

// Vérifier les actions disponibles pour le pion noir sur D4
const availableActions = getPossibleMoves(gameState, 'move_piece');
const enPassantMoves = availableActions.filter(action => action.isEnPassant);

console.log('\n=== Mouvements de prise en passant disponibles ===');
console.log('Nombre de mouvements en passant:', enPassantMoves.length);
enPassantMoves.forEach((move, index) => {
  console.log(`${index + 1}. ${move.from} -> ${move.to} (${move.piece})`);
});

// Test avec un autre scénario : bond de 3 cases
console.log('\n=== Test avec bond de 3 cases ===');

// Nouveau test avec un pion blanc qui fait un bond de 3 cases
gameState = createInitialGameState();

// Placer les rois
gameState = applyAction(gameState, {
  type: 'place_king',
  player: 'white',
  turn: 1,
  to: 'E1'
});

gameState = applyAction(gameState, {
  type: 'place_king',
  player: 'black',
  turn: 1,
  to: 'E8'
});

// Passer à la phase de jeu
gameState.gamePhase = 'playing';

// Placer un pion blanc sur B1 (position initiale)
gameState.board[0][1] = 'WhitePawn'; // B1

// Placer un pion noir sur A3
gameState.board[2][0] = 'BlackPawn'; // A3

// Simuler que le joueur blanc a fait un bond de pion de B1 à B3
gameState.moveHistory.push({
  type: 'move_piece',
  player: 'white',
  turn: 2,
  from: 'B1',
  to: 'B3',
  piece: 'WhitePawn'
});

// Déplacer le pion blanc sur B3
gameState.board[0][1] = null; // Vider B1
gameState.board[2][1] = 'WhitePawn'; // B3

// Définir que c'est au tour des noirs
gameState.currentPlayer = 'black';

console.log('État de l\'échiquier après B1-B3:');
console.log('A3:', gameState.board[2][0]); // Devrait être BlackPawn
console.log('B3:', gameState.board[2][1]); // Devrait être WhitePawn

// Vérifier les actions disponibles pour le pion noir sur A3
const availableActions2 = getPossibleMoves(gameState, 'move_piece');
const enPassantMoves2 = availableActions2.filter(action => action.isEnPassant);

console.log('\n=== Mouvements de prise en passant disponibles (bond de 3) ===');
console.log('Nombre de mouvements en passant:', enPassantMoves2.length);
enPassantMoves2.forEach((move, index) => {
  console.log(`${index + 1}. ${move.from} -> ${move.to} (${move.piece})`);
});

console.log('\n=== Test terminé ===');
