import { 
  createInitialGameState,
  isValidAction
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

/**
 * Tests pour les nouvelles règles des pions dans "La botte secrète du roi"
 */

console.log('🧪 Tests des règles des pions - La botte secrète du roi');

// Créer un état initial
let gameState = createInitialGameState();

// Placer les rois pour commencer les tests
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

// Appliquer le placement des rois
if (isValidAction(gameState, placeWhiteKing).valid) {
  gameState = applyAction(gameState, placeWhiteKing);
  console.log('✅ Roi blanc placé en E1');
} else {
  console.log('❌ Échec du placement du roi blanc');
}

if (isValidAction(gameState, placeBlackKing).valid) {
  gameState = applyAction(gameState, placeBlackKing);
  console.log('✅ Roi noir placé en E8');
} else {
  console.log('❌ Échec du placement du roi noir');
}

console.log(`Joueur actuel après placement des rois: ${gameState.currentPlayer}`);

// Test 1: Placement d'un pion blanc en A1
console.log('\n📋 Test 1: Placement d\'un pion blanc en A1');
const placePawnA1: GameAction = {
  type: 'place_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  to: 'A1',
  piece: 'WhitePawn'
};

const validation1 = isValidAction(gameState, placePawnA1);
if (validation1.valid) {
  gameState = applyAction(gameState, placePawnA1);
  console.log('✅ Pion blanc placé en A1');
} else {
  console.log('❌ Échec:', validation1.reason);
}

console.log(`Joueur actuel: ${gameState.currentPlayer}`);

// Test 2: Passer au tour du blanc et faire bouger le pion de A1 vers A4
// On doit d'abord faire jouer le noir pour que ce soit à nouveau au tour du blanc
const placePawnH8: GameAction = {
  type: 'place_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  to: 'H8',
  piece: 'BlackPawn'
};

if (isValidAction(gameState, placePawnH8).valid) {
  gameState = applyAction(gameState, placePawnH8);
  console.log('✅ Pion noir placé en H8 (pour alternance)');
}

console.log(`Joueur actuel: ${gameState.currentPlayer}`);

// Maintenant test du mouvement du pion blanc A1 → A4
console.log('\n📋 Test 2: Mouvement A1 → A4 (saut de 3 cases)');
const movePawnA1A4: GameAction = {
  type: 'move_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  from: 'A1',
  to: 'A4'
};

const validation2 = isValidAction(gameState, movePawnA1A4);
if (validation2.valid) {
  gameState = applyAction(gameState, movePawnA1A4);
  console.log('✅ Pion déplacé de A1 vers A4');
} else {
  console.log('❌ Échec:', validation2.reason);
}

// Action noir pour alternance
const movePawnH8H5: GameAction = {
  type: 'move_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  from: 'H8',
  to: 'H5'
};

if (isValidAction(gameState, movePawnH8H5).valid) {
  gameState = applyAction(gameState, movePawnH8H5);
  console.log('✅ Pion noir déplacé de H8 vers H5 (saut de 3 cases pour noir)');
}

// Test 3: Tentative de mouvement au-delà de la ligne médiane (A4 → A6, doit échouer)
console.log('\n📋 Test 3: Tentative A4 → A6 (dépassement ligne médiane)');
const movePawnA4A6: GameAction = {
  type: 'move_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  from: 'A4',
  to: 'A6'
};

const validation3 = isValidAction(gameState, movePawnA4A6);
if (validation3.valid) {
  console.log('❌ Ce mouvement ne devrait pas être valide');
} else {
  console.log('✅ Mouvement rejeté:', validation3.reason);
}

// Test 4: Mouvement d'une case après la ligne médiane (A4 → A5)
console.log('\n📋 Test 4: Mouvement A4 → A5 (une case après ligne médiane)');
const movePawnA4A5: GameAction = {
  type: 'move_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  from: 'A4',
  to: 'A5'
};

const validation4 = isValidAction(gameState, movePawnA4A5);
if (validation4.valid) {
  gameState = applyAction(gameState, movePawnA4A5);
  console.log('✅ Pion déplacé de A4 vers A5');
} else {
  console.log('❌ Échec:', validation4.reason);
}

// Action noir pour alternance
const movePawnH5H4: GameAction = {
  type: 'move_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  from: 'H5',
  to: 'H4'
};

if (isValidAction(gameState, movePawnH5H4).valid) {
  gameState = applyAction(gameState, movePawnH5H4);
  console.log('✅ Pion noir déplacé de H5 vers H4 (une case après ligne médiane)');
}

// Test 5: Tentative de placement d'un pion blanc dans la zone noire (doit échouer)
console.log('\n📋 Test 5: Tentative de placement pion blanc en A6 (zone noire)');
const placePawnA6: GameAction = {
  type: 'place_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  to: 'A6',
  piece: 'WhitePawn'
};

const validation5 = isValidAction(gameState, placePawnA6);
if (validation5.valid) {
  console.log('❌ Ce placement ne devrait pas être valide');
} else {
  console.log('✅ Placement rejeté:', validation5.reason);
}

console.log('\n🎉 Tests terminés!');
console.log('\nÉtat final du jeu:');
console.log('Phase:', gameState.gamePhase);
console.log('Joueur actuel:', gameState.currentPlayer);
console.log('Tour:', gameState.turn);

// Afficher l'échiquier final
console.log('\n🏁 Échiquier final:');
for (let rank = 7; rank >= 0; rank--) {
  let line = `${rank + 1}: `;
  for (let file = 0; file < 8; file++) {
    const piece = gameState.board[rank][file];
    if (piece) {
      const shortName = piece.replace('White', 'W').replace('Black', 'B').replace('Pawn', 'P').replace('King', 'K');
      line += shortName.padEnd(4);
    } else {
      line += '..  ';
    }
  }
  console.log(line);
}
console.log('   A   B   C   D   E   F   G   H');
